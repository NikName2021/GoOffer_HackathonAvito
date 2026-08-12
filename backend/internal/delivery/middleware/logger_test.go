package middleware

import "testing"

func TestSafeLogPathRedactsPublicRecapToken(t *testing.T) {
	const token = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA"
	path := publicRecapSharePathPrefix + token

	if got := safeLogPath(path); got != publicRecapSharePathPrefix+"{token}" {
		t.Fatalf("safe log path = %q", got)
	}
	if got := safeLogPath("/api/recap/user/2026"); got != "/api/recap/user/2026" {
		t.Fatalf("ordinary log path = %q", got)
	}
}
