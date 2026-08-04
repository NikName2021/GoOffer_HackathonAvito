-- 001_init.up.sql
-- Создание основных таблиц проекта Avito Recap.
-- Миграция «up» применяет изменения, «down» откатывает их.

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    avatar        TEXT NOT NULL DEFAULT '',
    registered_at TIMESTAMPTZ NOT NULL,
    profile_type  VARCHAR(50) NOT NULL DEFAULT 'buyer'
);

CREATE TABLE IF NOT EXISTS categories (
    id   UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS actions (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL CHECK (type IN ('view', 'message', 'favorite', 'purchase', 'sale')),
    category_id UUID NOT NULL REFERENCES categories(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_user_created_at ON actions(user_id, created_at);

CREATE TABLE IF NOT EXISTS recaps (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year            INT NOT NULL,
    total_views     INT NOT NULL DEFAULT 0,
    total_messages  INT NOT NULL DEFAULT 0,
    total_favorites INT NOT NULL DEFAULT 0,
    total_purchases INT NOT NULL DEFAULT 0,
    total_sales     INT NOT NULL DEFAULT 0,
    top_categories  JSONB NOT NULL DEFAULT '[]'::jsonb,
    achievements    JSONB NOT NULL DEFAULT '[]'::jsonb,
    activity_days   INT NOT NULL DEFAULT 0,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_recaps_user_year ON recaps(user_id, year);
