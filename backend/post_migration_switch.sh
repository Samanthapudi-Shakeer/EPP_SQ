#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ENV_FILE="${ENV_FILE:-${SCRIPT_DIR}/.env}"
DB_HOST=""
DB_PORT=""
DB_USER=""
DB_PASSWORD=""
DB_NAME=""
MYSQL_ENV=""

usage() {
  cat <<USAGE
Usage: ${0##*/} --user <user> --password <password> --database <name> [--host <host>] [--port <port>] [--env <path>] [--mysql-env <path>]
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user)
      DB_USER="$2"
      shift 2
      ;;
    --password)
      DB_PASSWORD="$2"
      shift 2
      ;;
    --database)
      DB_NAME="$2"
      shift 2
      ;;
    --host)
      DB_HOST="$2"
      shift 2
      ;;
    --port)
      DB_PORT="$2"
      shift 2
      ;;
    --env)
      ENV_FILE="$2"
      shift 2
      ;;
    --mysql-env)
      MYSQL_ENV="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -n "${MYSQL_ENV}" ]]; then
  if [[ ! -f "${MYSQL_ENV}" ]]; then
    echo "MySQL env file not found: ${MYSQL_ENV}" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "${MYSQL_ENV}"
  set +a
  DB_USER=${DB_USER:-${MYSQL_USER:-${MYSQL_USERNAME:-}}}
  DB_PASSWORD=${DB_PASSWORD:-${MYSQL_PASSWORD:-${MYSQL_PASS:-}}}
  DB_NAME=${DB_NAME:-${MYSQL_DATABASE:-${MYSQL_DB:-}}}
  DEFAULT_HOST=${MYSQL_HOST:-${MYSQL_SERVER:-localhost}}
  DEFAULT_PORT=${MYSQL_PORT:-3306}
  DB_HOST=${DB_HOST:-${DEFAULT_HOST}}
  DB_PORT=${DB_PORT:-${DEFAULT_PORT}}
  if [[ -z "${DB_USER}" || -z "${DB_PASSWORD}" || -z "${DB_NAME}" ]]; then
    echo "Credentials file did not include MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE." >&2
    exit 1
  fi
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

if [[ -z "${DB_USER}" || -z "${DB_PASSWORD}" || -z "${DB_NAME}" ]]; then
  echo "Missing required database credentials." >&2
  usage >&2
  exit 1
fi

MYSQL_URL="mysql+aiomysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

tmp_env=$(mktemp)
if [[ -f "${ENV_FILE}" ]]; then
  grep -v '^DATABASE_URL=' "${ENV_FILE}" >"${tmp_env}" || true
fi
echo "DATABASE_URL=\"${MYSQL_URL}\"" >>"${tmp_env}"
install -m 600 "${tmp_env}" "${ENV_FILE}"
rm -f "${tmp_env}"

echo "Updated ${ENV_FILE} with MySQL DATABASE_URL" >&2

START_SCRIPT="${SCRIPT_DIR}/start.sh"
cat <<'START' >"${START_SCRIPT}"
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
START
chmod +x "${START_SCRIPT}"

echo "start.sh updated to enforce MySQL usage." >&2
