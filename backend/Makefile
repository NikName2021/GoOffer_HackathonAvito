GOLANGCI_LINT_VERSION ?= $(shell cat .golangci-version)
TOOLS_DIR := $(CURDIR)/.bin
GOLANGCI_LINT := $(TOOLS_DIR)/golangci-lint

.PHONY: test test-integration coverage lint

test:
	go test ./...

test-integration:
	go test -count=1 ./tests/integration/...

coverage:
	go test -coverpkg=./internal/usecase/... -coverprofile=coverage.out ./internal/usecase/... ./tests/unit/...
	go tool cover -func=coverage.out

lint: $(GOLANGCI_LINT)
	$(GOLANGCI_LINT) run ./...

$(GOLANGCI_LINT):
	mkdir -p $(TOOLS_DIR)
	GOBIN=$(TOOLS_DIR) go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION)
