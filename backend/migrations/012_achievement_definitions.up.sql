CREATE TABLE achievement_definitions (
    slug TEXT PRIMARY KEY CHECK (CHAR_LENGTH(slug) BETWEEN 1 AND 100 AND slug ~ '^[a-z0-9_]+$'),
    title TEXT NOT NULL CHECK (CHAR_LENGTH(title) BETWEEN 1 AND 160),
    description TEXT NOT NULL DEFAULT '' CHECK (CHAR_LENGTH(description) <= 500),
    icon TEXT NOT NULL CHECK (CHAR_LENGTH(icon) BETWEEN 1 AND 50),
    category TEXT NOT NULL CHECK (CHAR_LENGTH(category) BETWEEN 1 AND 50),
    metric TEXT NOT NULL CHECK (metric IN (
        'total_views',
        'favorites',
        'purchases',
        'sales',
        'listing_views',
        'contacts',
        'reviews',
        'activity_days',
        'categories',
        'deals'
    )),
    condition_operator TEXT NOT NULL CHECK (condition_operator IN ('always', 'gt', 'gte', 'lt', 'lte', 'eq')),
    condition_value DOUBLE PRECISION CHECK (condition_value >= 0),
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (condition_operator = 'always' AND condition_value IS NULL)
        OR
        (condition_operator <> 'always' AND condition_value IS NOT NULL)
    )
);

INSERT INTO achievement_definitions (
    slug, title, description, icon, category, metric,
    condition_operator, condition_value, sort_order
) VALUES
    ('curious', 'Любопытный', 'Просмотрел не менее 500 объявлений за год', '👀', 'views', 'total_views', 'gte', 500, 10),
    ('explorer', 'Исследователь', 'Просмотрел не менее 1000 объявлений за год', '🔍', 'views', 'total_views', 'gte', 1000, 20),
    ('seller_master', 'Мастер продаж', 'Продал не менее 5 товаров за год', '🏆', 'sales', 'sales', 'gte', 5, 30),
    ('shopaholic', 'Шопоголик', 'Купил не менее 10 товаров за год', '🛍️', 'sales', 'purchases', 'gte', 10, 40),
    ('veteran', 'Ветеран', 'Был активен не менее 300 дней в году', '⭐', 'activity', 'activity_days', 'gte', 300, 50),
    ('enthusiast', 'Энтузиаст', 'Был активен не менее 100 дней в году', '🔥', 'activity', 'activity_days', 'gte', 100, 60);

CREATE INDEX achievement_definitions_active_order_idx
    ON achievement_definitions (sort_order, slug)
    WHERE is_active = TRUE;
