#!/usr/bin/env python3
"""Compare table row counts between SQLite and MySQL databases."""

import argparse
import asyncio
from pathlib import Path
from typing import Dict

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
    parser.add_argument("mysql_url", help="Async SQLAlchemy URL for the MySQL database")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.sqlite_path.exists():
        raise SystemExit(f"SQLite database not found: {args.sqlite_path}")
    asyncio.run(verify(args.sqlite_path.resolve(), args.mysql_url))


if __name__ == "__main__":
    main()
