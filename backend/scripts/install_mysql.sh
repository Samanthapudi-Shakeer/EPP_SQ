#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "[install_mysql] Please run as root or with sudo." >&2
  exit 1
fi

DB_NAME=${DB_NAME:-app_db}
DB_USER=${DB_USER:-app_user}
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 24 | tr -d '=\n' | cut -c1-32)}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-}

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y mysql-server
systemctl enable mysql
systemctl start mysql

if [[ -n "${MYSQL_ROOT_PASSWORD}" ]]; then
  mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}'; FLUSH PRIVILEGES;"
  MYSQL_AUTH="-uroot -p${MYSQL_ROOT_PASSWORD}"
else
  MYSQL_AUTH="-uroot"
fi

mysql ${MYSQL_AUTH} <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "MySQL ready. Connection details:" >&2
echo "  host: localhost" >&2
echo "  port: 3306" >&2
echo "  database: ${DB_NAME}" >&2
echo "  user: ${DB_USER}" >&2
echo "  password: ${DB_PASSWORD}" >&2
