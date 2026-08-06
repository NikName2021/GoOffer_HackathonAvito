CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- demo: login=demo password=demo123
INSERT INTO accounts (id, login, password_hash) VALUES
    ('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
     'demo',
     '$2a$10$yEKCNuYg5jQSEqKski6Y7uno7jFGvDjsVW120./0/dRyyVy4aV0Xq')
ON CONFLICT (login) DO NOTHING;