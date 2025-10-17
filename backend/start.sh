#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Please configure a MySQL connection." >&2
  exit 1
fi

if [[ "${DATABASE_URL}" == sqlite* ]]; then
  echo "SQLite connections are disabled. Update DATABASE_URL to use MySQL." >&2
  exit 1
fi

exec uvicorn server:app --host "0.0.0.0" --port "8000"
