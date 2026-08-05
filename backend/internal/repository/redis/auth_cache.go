package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const SessionTTL = 7 * 24 * time.Hour

type AuthCache struct {
	client *redis.Client
}

func NewAuthCache(client *redis.Client) *AuthCache {
	return &AuthCache{client: client}
}

type SessionData struct {
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

func (c *AuthCache) SaveSession(ctx context.Context, token string, data *SessionData, ttl time.Duration) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %w", err)
	}
	if err := c.client.Set(ctx, "session:"+token, jsonData, ttl).Err(); err != nil {
		return fmt.Errorf("failed to save session: %w", err)
	}
	return nil
}

func (c *AuthCache) GetSession(ctx context.Context, token string) (*SessionData, error) {
	val, err := c.client.Get(ctx, "session:"+token).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}
	var data SessionData
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session data: %w", err)
	}
	return &data, nil
}

func (c *AuthCache) DeleteSession(ctx context.Context, token string) error {
	if err := c.client.Del(ctx, "session:"+token).Err(); err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	return nil
}
