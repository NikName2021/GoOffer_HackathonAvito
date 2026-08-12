ALTER TABLE recaps
    ADD COLUMN comparison JSONB,
    ADD COLUMN forecast JSONB;

UPDATE recaps
SET comparison = jsonb_build_object(
        'status', 'unavailable',
        'message', 'Сравнение появится после повторной генерации итогов.',
        'previous_year', year - 1,
        'current_year', year,
        'spending', jsonb_build_object(
            'previous', 0,
            'current', 0,
            'absolute_change', 0,
            'percent_change', 0
        ),
        'sales_revenue', jsonb_build_object(
            'previous', 0,
            'current', 0,
            'absolute_change', 0,
            'percent_change', 0
        ),
        'categories', '[]'::jsonb,
        'new_interests', '[]'::jsonb
    ),
    forecast = jsonb_build_object(
        'year', year + 1,
        'method', 'unavailable',
        'spending', jsonb_build_object('expected', 0, 'min', 0, 'max', 0),
        'sales_revenue', jsonb_build_object('expected', 0, 'min', 0, 'max', 0),
        'likely_categories', '[]'::jsonb
    );

ALTER TABLE recaps
    ALTER COLUMN comparison SET NOT NULL,
    ALTER COLUMN forecast SET NOT NULL;
