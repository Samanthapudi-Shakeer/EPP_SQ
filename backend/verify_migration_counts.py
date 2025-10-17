#!/usr/bin/env python3
"""Compare table row counts between SQLite and MySQL databases."""

import argparse
import asyncio
from pathlib import Path
from typing import Dict, Optional

from sqlalchemy import MetaData, create_engine, func, select, text
from sqlalchemy.ext.asyncio import create_async_engine


def load_sqlite_counts(sqlite_path: Path) -> Dict[str, int]:
    engine = create_engine(f"sqlite+pysqlite:///{sqlite_path}")
    metadata = MetaData()
    metadata.reflect(bind=engine)
    counts: Dict[str, int] = {}
    with engine.connect() as conn:
        for table in metadata.sorted_tables:
            total = conn.execute(select(func.count()).select_from(table)).scalar_one()
            counts[table.name] = total
    engine.dispose()
    return counts


async def load_mysql_counts(mysql_url: str, table_names: list[str]) -> Dict[str, int]:
    engine = create_async_engine(mysql_url, future=True)
    counts: Dict[str, int] = {}
    async with engine.connect() as conn:
        for name in table_names:
            safe_name = name.replace("`", "``")
            result = await conn.execute(text(f"SELECT COUNT(*) FROM `{safe_name}`"))
            counts[name] = result.scalar_one()
    await engine.dispose()
    return counts


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


async def verify(sqlite_path: Path, mysql_url: str) -> None:
    sqlite_counts = load_sqlite_counts(sqlite_path)
    mysql_counts = await load_mysql_counts(mysql_url, list(sqlite_counts.keys()))

    mismatches = [
        name
        for name, sqlite_total in sqlite_counts.items()
        if mysql_counts.get(name) != sqlite_total
    ]

    print("Table counts:")
    for name in sqlite_counts:
        print(
            f"- {name}: sqlite={sqlite_counts[name]} mysql={mysql_counts.get(name, 'missing')}"
        )

    if mismatches:
        raise SystemExit("Counts do not match for: " + ", ".join(mismatches))


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
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.sqlite_path.exists():
        raise SystemExit(f"SQLite database not found: {args.sqlite_path}")
    mysql_url = resolve_mysql_url(args.mysql_url, args.mysql_env)
    asyncio.run(verify(args.sqlite_path.resolve(), mysql_url))


if __name__ == "__main__":
    main()
