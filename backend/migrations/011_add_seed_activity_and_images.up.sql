-- Каждый демонстрационный профиль получает не менее 50 item-level событий.
-- Дополнительные просмотры равномерно распределены между первым и последним
-- реальными просмотрами объявления. Метка .013 секунды позволяет безопасно
-- отличить их при откате миграции.

WITH profile_images (id, avatar) AS (
    VALUES
        ('11111111-1111-4111-8111-111111111111'::uuid, 'https://randomuser.me/api/portraits/women/44.jpg'),
        ('22222222-2222-4222-8222-222222222222'::uuid, 'https://randomuser.me/api/portraits/men/32.jpg'),
        ('33333333-3333-4333-8333-333333333333'::uuid, 'https://randomuser.me/api/portraits/women/68.jpg'),
        ('44444444-4444-4444-8444-444444444444'::uuid, 'https://randomuser.me/api/portraits/men/75.jpg'),
        ('55555555-5555-4555-8555-555555555555'::uuid, 'https://randomuser.me/api/portraits/women/26.jpg'),
        ('66666666-6666-4666-8666-666666666666'::uuid, 'https://randomuser.me/api/portraits/men/46.jpg')
), enriched_profiles AS (
SELECT
    profile.id,
    profile_images.avatar,
    enriched.viewed_ads,
    enriched.own_ads
FROM users AS profile
JOIN profile_images ON profile.id = profile_images.id
CROSS JOIN LATERAL (
    SELECT
        COALESCE((
            SELECT jsonb_agg(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(viewed_ad, '{imageUrl}', to_jsonb(
                            CASE
                                WHEN viewed_ad->>'subcategory' IN ('Смартфоны', 'Умные часы') THEN 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' IN ('Ноутбуки', 'Планшеты') THEN 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' IN ('Аудио', 'Периферия') THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' IN ('Фототехника', 'Квадрокоптеры') THEN 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' IN ('Электронные книги', 'Книги') THEN 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' IN ('Игровые приставки', 'Игры') THEN 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' = 'Музыкальные инструменты' THEN 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' IN ('Велосипеды', 'Детский транспорт') THEN 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'subcategory' IN ('Спорт', 'Туризм') THEN 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'category' = 'Для дома и дачи' THEN 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'category' = 'Товары для детей' THEN 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'category' = 'Транспорт' THEN 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
                                WHEN viewed_ad->>'category' = 'Одежда, обувь, аксессуары' THEN 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'
                                ELSE 'https://images.unsplash.com/photo-1586880244386-8b3e34c8382c?auto=format&fit=crop&w=1200&q=80'
                            END
                        ), true),
                        '{viewCount}',
                        to_jsonb(GREATEST(watch_stats.watch_count, 9)),
                        true
                    ),
                    '{viewedAt}',
                    events.enriched_events,
                    true
                )
                ORDER BY viewed_ordinality
            )
            FROM jsonb_array_elements(profile.viewed_ads) WITH ORDINALITY AS viewed(viewed_ad, viewed_ordinality)
            CROSS JOIN LATERAL (
                SELECT
                    COUNT(*)::int AS watch_count,
                    MIN((event->>'time')::timestamptz) AS first_watch,
                    MAX((event->>'time')::timestamptz) AS last_watch
                FROM jsonb_array_elements(viewed_ad->'viewedAt') AS source_events(event)
                WHERE event->>'type' = 'watch'
            ) AS watch_stats
            CROSS JOIN LATERAL (
                SELECT jsonb_agg(event ORDER BY event_time, event_priority) AS enriched_events
                FROM (
                    SELECT
                        source_event AS event,
                        (source_event->>'time')::timestamptz AS event_time,
                        CASE source_event->>'type' WHEN 'watch' THEN 1 WHEN 'like' THEN 2 ELSE 3 END AS event_priority
                    FROM jsonb_array_elements(viewed_ad->'viewedAt') AS existing_events(source_event)

                    UNION ALL

                    SELECT
                        jsonb_build_object('type', 'watch', 'time', generated_at) AS event,
                        generated_at AS event_time,
                        1 AS event_priority
                    FROM generate_series(1, GREATEST(0, 9 - watch_stats.watch_count)) AS generated(position)
                    CROSS JOIN LATERAL (
                        SELECT date_trunc(
                            'second',
                            watch_stats.first_watch
                                + (watch_stats.last_watch - watch_stats.first_watch)
                                  * (generated.position::double precision / (10 - watch_stats.watch_count))
                        ) + interval '13 milliseconds' AS generated_at
                    ) AS generated_time
                ) AS all_events
            ) AS events
        ), '[]'::jsonb) AS viewed_ads,
        COALESCE((
            SELECT jsonb_agg(
                jsonb_set(own_ad, '{imageUrl}', to_jsonb(
                    CASE
                        WHEN own_ad->>'subcategory' IN ('Смартфоны', 'Умные часы') THEN 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Ноутбуки', 'Планшеты', 'Мониторы') THEN 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Аудио', 'Периферия') THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Фототехника', 'Квадрокоптеры') THEN 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Электронные книги', 'Книги') THEN 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Игровые приставки', 'Игры') THEN 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' = 'Музыкальные инструменты' THEN 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Велосипеды', 'Детский транспорт') THEN 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Спорт', 'Туризм') THEN 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'category' = 'Для дома и дачи' THEN 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'category' = 'Товары для детей' THEN 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'category' = 'Транспорт' THEN 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'category' = 'Одежда, обувь, аксессуары' THEN 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'
                        WHEN own_ad->>'subcategory' IN ('Инструменты', 'Ремонт') THEN 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80'
                        ELSE 'https://images.unsplash.com/photo-1586880244386-8b3e34c8382c?auto=format&fit=crop&w=1200&q=80'
                    END
                ), true)
                ORDER BY own_ordinality
            )
            FROM jsonb_array_elements(profile.own_ads) WITH ORDINALITY AS owned(own_ad, own_ordinality)
        ), '[]'::jsonb) AS own_ads
) AS enriched
)
UPDATE users AS profile
SET avatar = enriched_profiles.avatar,
    viewed_ads = enriched_profiles.viewed_ads,
    own_ads = enriched_profiles.own_ads,
    updated_at = NOW()
FROM enriched_profiles
WHERE profile.id = enriched_profiles.id;
