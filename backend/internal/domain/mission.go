package domain

import (
	"time"

	"github.com/google/uuid"
)

type MissionCode string

const (
	MissionSellThreeItems   MissionCode = "sell_three_items"
	MissionBuyFromFavorites MissionCode = "buy_from_favorites"
	MissionTryDelivery      MissionCode = "try_avito_delivery"
)

type MissionStatus string

const (
	MissionActive    MissionStatus = "active"
	MissionCompleted MissionStatus = "completed"
)

type MissionOption struct {
	Code        MissionCode  `json:"code"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Target      int          `json:"target"`
	Icon        string       `json:"icon"`
	Theme       string       `json:"theme"`
	CTA         RecapCardCTA `json:"cta"`
}

// RecapMission is the persisted progress for one profile and recap year.
type RecapMission struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	RecapYear   int
	Code        MissionCode
	Progress    int
	Target      int
	Status      MissionStatus
	SelectedAt  time.Time
	UpdatedAt   time.Time
	CompletedAt *time.Time
}

type MissionState struct {
	Code            MissionCode   `json:"code"`
	Title           string        `json:"title"`
	Description     string        `json:"description"`
	Progress        int           `json:"progress"`
	Target          int           `json:"target"`
	ProgressPercent int           `json:"progress_percent"`
	Status          MissionStatus `json:"status"`
	Icon            string        `json:"icon"`
	Theme           string        `json:"theme"`
	CTA             RecapCardCTA  `json:"cta"`
	SelectedAt      time.Time     `json:"selected_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	CompletedAt     *time.Time    `json:"completed_at,omitempty"`
}

type MissionOverview struct {
	Options  []MissionOption `json:"options"`
	Selected *MissionState   `json:"selected"`
}
