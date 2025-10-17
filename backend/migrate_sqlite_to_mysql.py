#!/usr/bin/env python3
"""Migrate all data from a SQLite database into a MySQL database."""

import argparse
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import MetaData, create_engine, delete, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

DEFAULT_BATCH_SIZE = 1000


def load_sqlite_metadata(sqlite_path: Path) -> tuple[Engine, MetaData]:
    engine = create_engine(f"sqlite+pysqlite:///{sqlite_path}")
    metadata = MetaData()
    metadata.reflect(bind=engine)
    return engine, metadata


async def ensure_mysql_schema(async_engine: AsyncEngine, metadata: MetaData) -> None:
    async with async_engine.begin() as conn:
        await conn.run_sync(metadata.create_all)


async def migrate_table(
    table_name: str,
    sqlite_engine: Engine,
    metadata: MetaData,
    session: AsyncSession,
    batch_size: int,
) -> None:
    table = metadata.tables[table_name]
    pk_columns = list(table.primary_key.columns)
    stmt = select(table)
    if pk_columns:
        stmt = stmt.order_by(*pk_columns)

    with sqlite_engine.connect() as conn:
        result = conn.execute(stmt)
        while True:
            batch = result.fetchmany(batch_size)
            if not batch:
                break
            payload: List[Dict[str, Any]] = [dict(row._mapping) for row in batch]
            await session.execute(table.insert(), payload)
            await session.commit()


async def truncate_tables(metadata: MetaData, session: AsyncSession) -> None:
    for table in reversed(metadata.sorted_tables):
        await session.execute(delete(table))
    await session.commit()


async def migrate(
    sqlite_path: Path, mysql_url: str, batch_size: int, truncate: bool
) -> None:
    sqlite_engine, metadata = load_sqlite_metadata(sqlite_path)
    async_engine = create_async_engine(mysql_url, future=True)

    await ensure_mysql_schema(async_engine, metadata)

    Session = async_sessionmaker(async_engine, expire_on_commit=False)

    async with Session() as session:
        await session.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        await session.commit()

        if truncate:
            await truncate_tables(metadata, session)

        for table in metadata.sorted_tables:
            await migrate_table(
                table.name, sqlite_engine, metadata, session, batch_size
            )

        await session.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        await session.commit()

    await async_engine.dispose()
    sqlite_engine.dispose()


def parse_env_file(path: Path) -> Dict[str, str]:
    data: Dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        data[key] = value
    return data


def resolve_mysql_url(mysql_url: Optional[str], mysql_env: Optional[Path]) -> str:
    candidate_env = mysql_env
    if candidate_env is None:
        default_env = Path("mysql_credentials.env")
        if default_env.exists():
            candidate_env = default_env

    if candidate_env is not None:
        if not candidate_env.exists():
            raise SystemExit(f"MySQL env file not found: {candidate_env}")
        data = parse_env_file(candidate_env)
        url = data.get("DATABASE_URL")
        if not url:
            raise SystemExit(
                f"DATABASE_URL not defined in env file: {candidate_env}"
            )
        return url

    if not mysql_url:
        raise SystemExit(
            "Provide a MySQL URL or supply --mysql-env with DATABASE_URL"
        )

    return mysql_url


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sqlite_path", type=Path, help="Path to the SQLite .db file")
    parser.add_argument(
        "mysql_url",
        nargs="?",
        help="Async SQLAlchemy URL for the MySQL database",
    )
    parser.add_argument(
        "--mysql-env",
        type=Path,
        help="Path to env file containing DATABASE_URL (defaults to mysql_credentials.env if present)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f"Number of rows to insert per batch (default: {DEFAULT_BATCH_SIZE})",
    )
    parser.add_argument(
        "--skip-truncate",
        action="store_true",
        help="Do not clear destination tables before inserting data",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.sqlite_path.exists():
        raise SystemExit(f"SQLite database not found: {args.sqlite_path}")
    mysql_url = resolve_mysql_url(args.mysql_url, args.mysql_env)
    asyncio.run(
        migrate(
            args.sqlite_path.resolve(),
            mysql_url,
            args.batch_size,
            truncate=not args.skip_truncate,
        )
    )


if __name__ == "__main__":
    main()
