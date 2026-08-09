CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE actions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('view', 'message', 'favorite', 'purchase', 'sale')),
    category_id UUID NOT NULL REFERENCES categories(id),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX actions_user_created_at_idx ON actions (user_id, created_at);
