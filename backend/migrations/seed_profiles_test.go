package migrations

import (
	"encoding/json"
	"regexp"
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
