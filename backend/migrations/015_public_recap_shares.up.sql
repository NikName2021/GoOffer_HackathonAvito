CREATE TABLE public_recap_shares (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    recap_year INTEGER NOT NULL CHECK (recap_year >= 2000 AND recap_year <= 2100),
    token_hash BYTEA NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
    format TEXT NOT NULL CHECK (format IN ('responsive', 'mobile_story')),
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    FOREIGN KEY (user_id, recap_year)
        REFERENCES recaps (user_id, year)
        ON DELETE CASCADE,
    CHECK (expires_at > created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX public_recap_shares_owner_idx
    ON public_recap_shares (account_id, user_id, recap_year, created_at DESC);

CREATE INDEX public_recap_shares_expiry_idx
    ON public_recap_shares (expires_at)
    WHERE revoked_at IS NULL;
