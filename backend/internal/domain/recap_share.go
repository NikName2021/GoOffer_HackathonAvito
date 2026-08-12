package domain

import (
	"time"

	"github.com/google/uuid"
)

type RecapShareFormat string

const (
	RecapShareResponsive  RecapShareFormat = "responsive"
	RecapShareMobileStory RecapShareFormat = "mobile_story"
)

type PublicRecapCardPresentation struct {
	Layout string `json:"layout"`
	Theme  string `json:"theme"`
	Icon   string `json:"icon"`
}

// PublicRecapCard is a strict allowlist. It intentionally has no source ID,
// image, CTA, navigation parameters, diagnostics or visualization payload.
type PublicRecapCard struct {
	Kind         string                      `json:"kind"`
	Eyebrow      string                      `json:"eyebrow"`
	Title        string                      `json:"title"`
	Description  string                      `json:"description"`
	Value        string                      `json:"value"`
	Presentation PublicRecapCardPresentation `json:"presentation"`
}

// PublicRecapSnapshot is immutable after publication and contains no profile,
// account, recap or listing identifiers.
type PublicRecapSnapshot struct {
	Format RecapShareFormat  `json:"format"`
	Year   int               `json:"year"`
	Cards  []PublicRecapCard `json:"cards"`
}

type RecapShare struct {
	ID        uuid.UUID
	AccountID uuid.UUID
	UserID    uuid.UUID
	RecapYear int
	TokenHash []byte
	Format    RecapShareFormat
	Snapshot  PublicRecapSnapshot
	CreatedAt time.Time
	ExpiresAt time.Time
	RevokedAt *time.Time
}

type RecapShareCreated struct {
	ID        uuid.UUID        `json:"id"`
	PublicURL string           `json:"public_url"`
	Format    RecapShareFormat `json:"format"`
	CreatedAt time.Time        `json:"created_at"`
	ExpiresAt time.Time        `json:"expires_at"`
}

type PublicRecapShare struct {
	Format    RecapShareFormat  `json:"format"`
	Year      int               `json:"year"`
	Cards     []PublicRecapCard `json:"cards"`
	CreatedAt time.Time         `json:"created_at"`
	ExpiresAt time.Time         `json:"expires_at"`
}
