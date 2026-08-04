-- 001_init.down.sql — откат первой миграции (удаление таблиц).

DROP TABLE IF EXISTS recaps;
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
