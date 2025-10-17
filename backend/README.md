# SQLite to MySQL Migration Toolkit

This backend directory contains automation scripts for migrating the existing `app.db` SQLite database into a MySQL deployment and for switching the application configuration to the new database.

## Prerequisites

* A Debian/Ubuntu-based Linux system with sudo access (required for the MySQL installation script).
* Python 3.10+ with `pip`.
* The `app.db` SQLite file present in this directory (already included).

## 1. Install and Configure MySQL

Run the provisioning script to install MySQL, start the service, and create a dedicated database/user. The script also writes a `mysql_credentials.env` file in this directory that captures the generated credentials and the ready-to-use SQLAlchemy `DATABASE_URL`.

```bash
cd backend
chmod +x scripts/install_mysql.sh
sudo ./scripts/install_mysql.sh
```

The script outputs the generated credentials and stores them in `mysql_credentials.env` inside this directory. Keep this file safe—it is read by the migration, verification, and switch scripts in later steps.

## 2. Configure Python Dependencies

Install the required Python packages (includes SQLAlchemy, aiomysql, and other helpers):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Run the Migration

Use the Python migration utility to copy schema and data from SQLite to MySQL. The script consumes the credentials file produced in step 1.

```bash
cd backend
source .venv/bin/activate
python migrate_sqlite_to_mysql.py app.db --mysql-env mysql_credentials.env
```

The script introspects the SQLite schema, recreates tables in MySQL, and preserves primary/foreign keys while batching inserts for efficiency.

## 4. Verify Row Counts

After the migration completes, validate that every table has the same number of rows in both databases:

```bash
cd backend
source .venv/bin/activate
python verify_migration_counts.py app.db --mysql-env mysql_credentials.env
```

The verification script prints a per-table comparison and exits with a non-zero status if discrepancies are detected.

## 5. Update Application Configuration

Once the data is verified, switch the application to use the new MySQL database:

1. Run the post-migration switch script to disable SQLite usage, create/update `.env`, and ensure the start script uses MySQL credentials from `mysql_credentials.env`:
   ```bash
   chmod +x post_migration_switch.sh start.sh
   ./post_migration_switch.sh --mysql-env mysql_credentials.env
   ```
   The script writes `.env` with the `DATABASE_URL` from the credentials file and regenerates `start.sh` so it refuses to start when SQLite is configured.

## 6. Start the Application

Use the updated start script to launch the backend with the MySQL connection (it automatically loads `.env`):

```bash
cd backend
chmod +x start.sh
./start.sh
```

This script exports the MySQL `DATABASE_URL` and prevents falling back to SQLite.

## 7. Troubleshooting

* If the MySQL service is already running, the installation script will skip service startup steps.
* To rerun the migration, drop the target database in MySQL (or use a new database name) and re-execute steps 3 and 4.
* Check `/var/log/mysql/error.log` for MySQL server issues.

