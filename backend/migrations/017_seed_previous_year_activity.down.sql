-- Удаляем только историю, добавленную 017_seed_previous_year_activity.

WITH reverted_profiles AS (
    SELECT
        profile.id,
        COALESCE((
            SELECT jsonb_agg(viewed_ad ORDER BY viewed_ordinality)
            FROM jsonb_array_elements(profile.viewed_ads)
                WITH ORDINALITY AS viewed(viewed_ad, viewed_ordinality)
            WHERE COALESCE(viewed_ad->>'adId', '') NOT LIKE 'history-2025-%'
        ), '[]'::jsonb) AS viewed_ads,
        COALESCE((
            SELECT jsonb_agg(own_ad ORDER BY own_ordinality)
            FROM jsonb_array_elements(profile.own_ads)
                WITH ORDINALITY AS owned(own_ad, own_ordinality)
            WHERE COALESCE(own_ad->>'adId', '') NOT LIKE 'history-2025-%'
        ), '[]'::jsonb) AS own_ads
    FROM users AS profile
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
