CREATE TABLE recap_missions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    recap_year INTEGER NOT NULL CHECK (recap_year >= 2000 AND recap_year <= 2100),
    code TEXT NOT NULL CHECK (code IN (
        'sell_three_items',
        'buy_from_favorites',
        'try_avito_delivery'
    )),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
    target INTEGER NOT NULL CHECK (target > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    selected_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, recap_year),
    FOREIGN KEY (user_id, recap_year)
        REFERENCES recaps (user_id, year)
        ON DELETE CASCADE,
    CHECK (progress <= target),
    CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);

CREATE INDEX recap_missions_status_idx
    ON recap_missions (status, updated_at);
