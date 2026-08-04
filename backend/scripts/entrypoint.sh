#!/bin/sh
set -eu

# При RUN_MIGRATIONS=true (по умолчанию) сначала накатываем SQL-миграции,
# затем запускаем HTTP-сервер. Так docker compose up поднимает готовый backend.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
	DB_HOST="${DB_HOST:-postgres}"
	DB_PORT="${DB_PORT:-5432}"
	DB_USER="${DB_USER:?DB_USER is required for migrations}"
	DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required for migrations}"
	DB_NAME="${DB_NAME:?DB_NAME is required for migrations}"

	DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"

	echo "running database migrations..."
	i=0
	until migrate -path /migrations -database "${DATABASE_URL}" up; do
		i=$((i + 1))
		if [ "$i" -gt 30 ]; then
			echo "migration failed after 30 attempts" >&2
			exit 1
		fi
		echo "postgres not ready, retry ${i}/30..."
		sleep 1
	done
	echo "migrations applied"
fi

exec /server
