package migrations

import (
	"encoding/json"
	"regexp"
	"strings"
	"testing"
)

func TestEnrichedSeedMigrationContainsValidJSON(t *testing.T) {
	pattern := regexp.MustCompile(`(?s)\$json\$(.*?)\$json\$`)
	contents, err := migrationFiles.ReadFile("010_enrich_seed_profiles.up.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}
	blocks := pattern.FindAllSubmatch(contents, -1)
	if len(blocks) != 12 {
		t.Fatalf("JSON blocks = %d, want 12", len(blocks))
	}
	for index, block := range blocks {
		if !json.Valid(block[1]) {
			t.Fatalf("JSON block %d is invalid", index+1)
		}
	}
}

func TestPreviousYearSeedMigrationContainsValidHistory(t *testing.T) {
	pattern := regexp.MustCompile(`(?s)\$json\$(.*?)\$json\$`)
	contents, err := migrationFiles.ReadFile("017_seed_previous_year_activity.up.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}
	blocks := pattern.FindAllSubmatch(contents, -1)
	if len(blocks) != 12 {
		t.Fatalf("JSON blocks = %d, want 12", len(blocks))
	}
	for index, block := range blocks {
		if !json.Valid(block[1]) {
			t.Fatalf("JSON block %d is invalid", index+1)
		}
		var records []struct {
			AdID string `json:"adId"`
		}
		if err := json.Unmarshal(block[1], &records); err != nil {
			t.Fatalf("decode JSON block %d: %v", index+1, err)
		}
		wantRecords := 3
		if index%2 == 1 {
			wantRecords = 2
		}
		if len(records) != wantRecords {
			t.Fatalf("JSON block %d records = %d, want %d", index+1, len(records), wantRecords)
		}
		for _, record := range records {
			if !strings.HasPrefix(record.AdID, "history-2025-") {
				t.Errorf("JSON block %d contains unexpected adId %q", index+1, record.AdID)
			}
		}
		if strings.Contains(string(block[1]), `"2026-`) {
			t.Errorf("JSON block %d contains activity outside 2025", index+1)
		}
	}
}
