package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config — все настройки приложения, загруженные из переменных окружения.
type Config struct {
	Port     string
	Database DatabaseConfig
	Redis    RedisConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

type RedisConfig struct {
	URL string
}

// DSN возвращает строку подключения к PostgreSQL для pgx.
func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		d.User, d.Password, d.Host, d.Port, d.Name,
	)
}

// Load читает .env (если есть) и переменные окружения.
func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port: getEnv("PORT", "8000"),
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5446"),
			User:     getEnv("DB_USER", "result_year"),
			Password: getEnv("DB_PASSWORD", "result_year_dev_password"),
			Name:     getEnv("DB_NAME", "result_year"),
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", "redis://localhost:6379"),
		},
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
