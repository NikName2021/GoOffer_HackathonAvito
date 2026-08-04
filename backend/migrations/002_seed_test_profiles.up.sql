-- 002_seed_test_profiles.up.sql
-- Тестовые профили и их действия за 2025 год.
-- Каждый профиль заточен под разные ачивки (см. achievements.go).

-- Категории
INSERT INTO categories (id, name) VALUES
    ('b0000001-0000-4000-8000-000000000001', 'Электроника'),
    ('b0000002-0000-4000-8000-000000000002', 'Авто'),
    ('b0000003-0000-4000-8000-000000000003', 'Для дома'),
    ('b0000004-0000-4000-8000-000000000004', 'Спорт'),
    ('b0000005-0000-4000-8000-000000000005', 'Хобби и отдых')
ON CONFLICT (id) DO NOTHING;

-- Пользователи (4 профиля, как на фронтенде)
INSERT INTO users (id, name, avatar, registered_at, profile_type) VALUES
    (
        'a0000001-0000-4000-8000-000000000001',
        'Анна Смирнова',
        'https://randomuser.me/api/portraits/women/44.jpg',
        '2018-04-14T00:00:00Z',
        'buyer'
    ),
    (
        'a0000002-0000-4000-8000-000000000002',
        'Михаил Орлов',
        'https://randomuser.me/api/portraits/men/32.jpg',
        '2021-09-03T00:00:00Z',
        'seller'
    ),
    (
        'a0000003-0000-4000-8000-000000000003',
        'Елена Коваль',
        'https://randomuser.me/api/portraits/women/68.jpg',
        '2016-11-28T00:00:00Z',
        'both'
    ),
    (
        'a0000004-0000-4000-8000-000000000004',
        'Даниил Волков',
        'https://randomuser.me/api/portraits/men/75.jpg',
        '2023-02-19T00:00:00Z',
        'buyer'
    )
ON CONFLICT (id) DO NOTHING;

-- Анна: 12 покупок (shopaholic) + 120 активных дней (enthusiast)
INSERT INTO actions (id, user_id, type, category_id, created_at)
SELECT
    gen_random_uuid(),
    'a0000001-0000-4000-8000-000000000001',
    'purchase',
    'b0000001-0000-4000-8000-000000000001',
    TIMESTAMPTZ '2025-01-01' + (n || ' days')::interval
FROM generate_series(1, 12) AS n;

INSERT INTO actions (id, user_id, type, category_id, created_at)
SELECT
    gen_random_uuid(),
    'a0000001-0000-4000-8000-000000000001',
    'view',
    'b0000003-0000-4000-8000-000000000003',
    TIMESTAMPTZ '2025-01-01' + (n || ' days')::interval
FROM generate_series(1, 120) AS n;

-- Михаил: 6 продаж (seller_master) + 55 сообщений (social_butterfly)
INSERT INTO actions (id, user_id, type, category_id, created_at)
SELECT
    gen_random_uuid(),
    'a0000002-0000-4000-8000-000000000002',
    'sale',
    'b0000005-0000-4000-8000-000000000005',
    TIMESTAMPTZ '2025-02-01' + (n || ' days')::interval
FROM generate_series(1, 6) AS n;

INSERT INTO actions (id, user_id, type, category_id, created_at)
SELECT
    gen_random_uuid(),
    'a0000002-0000-4000-8000-000000000002',
    'message',
    'b0000005-0000-4000-8000-000000000005',
    TIMESTAMPTZ '2025-01-01' + (n || ' days')::interval
FROM generate_series(1, 55) AS n;

-- Елена: 550 просмотров (curious) + 310 активных дней (veteran)
INSERT INTO actions (id, user_id, type, category_id, created_at)
SELECT
    gen_random_uuid(),
    'a0000003-0000-4000-8000-000000000003',
    'view',
    'b0000003-0000-4000-8000-000000000003',
    TIMESTAMPTZ '2025-01-01' + ((n - 1) || ' days')::interval
FROM generate_series(1, 550) AS n;

-- Дополнительные дни активности для Елены (favorite на других днях)
INSERT INTO actions (id, user_id, type, category_id, created_at)
SELECT
    gen_random_uuid(),
    'a0000003-0000-4000-8000-000000000003',
    'favorite',
    'b0000001-0000-4000-8000-000000000001',
    TIMESTAMPTZ '2025-07-01' + (n || ' days')::interval
FROM generate_series(1, 50) AS n;

-- Даниил: 1050 просмотров (explorer)
INSERT INTO actions (id, user_id, type, category_id, created_at)
SELECT
    gen_random_uuid(),
    'a0000004-0000-4000-8000-000000000004',
    'view',
    'b0000002-0000-4000-8000-000000000002',
    TIMESTAMPTZ '2025-01-01' + ((n % 200) || ' days')::interval
FROM generate_series(1, 1050) AS n;
