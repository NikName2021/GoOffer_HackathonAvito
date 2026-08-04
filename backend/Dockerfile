# syntax=docker/dockerfile:1

# ── Stage 1: собираем бинарник сервера ──────────────────────────────────────
FROM golang:1.25-alpine AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build \
	-trimpath \
	-ldflags="-s -w" \
	-o /out/server ./cmd/server

# ── Stage 2: минимальный runtime-образ ──────────────────────────────────────
FROM alpine:3.22

# wget — для HEALTHCHECK; migrate — для автонаката SQL при старте
RUN apk add --no-cache ca-certificates wget

COPY --from=migrate/migrate:v4.18.1 /usr/local/bin/migrate /usr/local/bin/migrate
COPY --from=build /out/server /server
COPY migrations /migrations
COPY scripts/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh /server \
	&& adduser -D -u 65532 -H -s /sbin/nologin appuser \
	&& chown -R appuser:appuser /migrations

ENV PORT=8000 \
	RUN_MIGRATIONS=true

EXPOSE 8000

USER 65532:65532

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
	CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
