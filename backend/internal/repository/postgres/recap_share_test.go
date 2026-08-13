package postgres

import (
	"encoding/json"
	"testing"
)

func TestDecodePublicRecapSnapshotNormalizesLegacyAchievements(t *testing.T) {
	snapshot, err := decodePublicRecapSnapshot(
		[]byte(`{"format":"responsive","year":2025,"cards":[]}`),
	)
	if err != nil {
		t.Fatalf("decode legacy public recap snapshot: %v", err)
	}
	if snapshot.Achievements == nil || len(snapshot.Achievements) != 0 {
		t.Fatalf("legacy achievements = %#v, want non-nil empty array", snapshot.Achievements)
	}

	encoded, err := json.Marshal(snapshot)
	if err != nil {
		t.Fatalf("marshal normalized snapshot: %v", err)
	}
	var payload map[string]any
	if err := json.Unmarshal(encoded, &payload); err != nil {
		t.Fatalf("decode normalized snapshot JSON: %v", err)
	}
	achievements, ok := payload["achievements"].([]any)
	if !ok || len(achievements) != 0 {
		t.Fatalf("normalized achievements JSON = %#v, want []", payload["achievements"])
	}
}
