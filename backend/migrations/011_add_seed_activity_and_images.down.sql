-- Удаляем добавленные миграцией просмотры и изображения, не затрагивая
-- исходные item-level события из 010_enrich_seed_profiles.

WITH reverted_profiles AS (
SELECT
    profile.id,
    reverted.viewed_ads,
    reverted.own_ads
FROM users AS profile
CROSS JOIN LATERAL (
    SELECT
        COALESCE((
            SELECT jsonb_agg(
                jsonb_set(
                    jsonb_set(
                        viewed_ad - 'imageUrl',
                        '{viewedAt}',
                        events.original_events,
                        true
                    ),
                    '{viewCount}',
                    to_jsonb(events.original_watch_count),
                    true
                )
                ORDER BY viewed_ordinality
            )
            FROM jsonb_array_elements(profile.viewed_ads) WITH ORDINALITY AS viewed(viewed_ad, viewed_ordinality)
            CROSS JOIN LATERAL (
                SELECT
                    jsonb_agg(event ORDER BY (event->>'time')::timestamptz) AS original_events,
                    COUNT(*) FILTER (WHERE event->>'type' = 'watch')::int AS original_watch_count
                FROM jsonb_array_elements(viewed_ad->'viewedAt') AS source_events(event)
                WHERE NOT (
                    event->>'type' = 'watch'
                    AND EXTRACT(MILLISECOND FROM (event->>'time')::timestamptz)::numeric % 1000 = 13
                )
            ) AS events
        ), '[]'::jsonb) AS viewed_ads,
        COALESCE((
            SELECT jsonb_agg(own_ad - 'imageUrl' ORDER BY own_ordinality)
            FROM jsonb_array_elements(profile.own_ads) WITH ORDINALITY AS owned(own_ad, own_ordinality)
        ), '[]'::jsonb) AS own_ads
) AS reverted
WHERE profile.id IN (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666'
)
)
UPDATE users AS profile
SET viewed_ads = reverted_profiles.viewed_ads,
    own_ads = reverted_profiles.own_ads,
    updated_at = NOW()
FROM reverted_profiles
WHERE profile.id = reverted_profiles.id;
