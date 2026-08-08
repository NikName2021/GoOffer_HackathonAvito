package metrics

import (
	"encoding/json"
	"net/http"
	"sync/atomic"
	"time"
)

var (
	HTTPRequests   atomic.Uint64
	RecapGenerated atomic.Uint64
	StartedAt      = time.Now().UTC()
)

func IncHTTP() {
	HTTPRequests.Add(1)
}

func IncRecapGenerated() {
	RecapGenerated.Add(1)
}

func Handler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":          "ok",
		"uptime_sec":      int(time.Since(StartedAt).Seconds()),
		"http_requests":   HTTPRequests.Load(),
		"recap_generated": RecapGenerated.Load(),
	})
}
