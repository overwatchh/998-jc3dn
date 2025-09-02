echo "DROP DATABASE IF EXISTS qr_attendance_app;" | mariadb -u root
mariadb -u root <src/lib/server/db_schema/db_create.sql
mariadb -u root <src/lib/server/db_schema/db_load.sql
