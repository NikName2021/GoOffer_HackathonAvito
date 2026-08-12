package config

import (
	"strings"
	"testing"
	"time"
)

func TestLoadPublicShareConfiguration(t *testing.T) {
	setRequiredDatabaseEnvironment(t)
	t.Setenv("PUBLIC_BASE_URL", "https://recap.example/")
	t.Setenv("RECAP_SHARE_TTL", "48h")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if cfg.PublicBaseURL != "https://recap.example" {
		t.Fatalf("public base URL = %q", cfg.PublicBaseURL)
	}
	if cfg.RecapShareTTL != 48*time.Hour {
		t.Fatalf("recap share TTL = %s", cfg.RecapShareTTL)
	}
}

func TestLoadRejectsInvalidPublicBaseURL(t *testing.T) {
	setRequiredDatabaseEnvironment(t)
	t.Setenv("PUBLIC_BASE_URL", "https://recap.example/private")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "PUBLIC_BASE_URL") {
		t.Fatalf("error = %v, want PUBLIC_BASE_URL validation error", err)
	}
}

func setRequiredDatabaseEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("DB_USER", "result_year")
	t.Setenv("DB_PASSWORD", "secret")
	t.Setenv("DB_NAME", "result_year")
}
