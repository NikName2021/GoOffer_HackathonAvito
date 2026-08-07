GOLANGCI_LINT_VERSION ?= v2.11.0
TOOLS_DIR := $(CURDIR)/.bin
GOLANGCI_LINT := $(TOOLS_DIR)/golangci-lint

.PHONY: lint

lint: $(GOLANGCI_LINT)
	$(GOLANGCI_LINT) run ./...

$(GOLANGCI_LINT):
	mkdir -p $(TOOLS_DIR)
	GOBIN=$(TOOLS_DIR) go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION)
