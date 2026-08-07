# Backend — GoOffer «Итоги года»

HTTP API на Go: генерация персональных итогов года по тестовым профилям.

Полный сценарий продукта и быстрый старт: **[корневой README](../README.md)**.

---

## Запуск

```bash
# из корня репозитория
cp .env.example .env
docker compose up --build
```

API: `http://localhost:8000`  
Health: `GET /health`

Локально (Postgres + Redis уже в compose):

```bash
cd backend
go run ./cmd/server
```

Миграции применяются при старте через `go:embed` (`migrations/migrate.go` + `*.up.sql`).

---

## API

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Healthcheck |
| `GET` | `/api/profiles` | Список тестовых профилей |
| `GET` | `/api/profiles/{id}` | Профиль |
| `POST` | `/api/recap/generate` | Генерация итогов |
| `GET` | `/api/recap/{user_id}/{year}` | Личный recap |
| `GET` | `/api/recap/{user_id}/{year}/share` | Share **без** `id` / `user_id` |
| `POST` | `/api/recap/generate-all?year=2025` | Пересчёт всех профилей |
| `POST` | `/api/auth/login` | Cookie-сессия (опционально) |
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/logout` | Выход |
| `GET` | `/api/auth/me` | Текущий аккаунт |

### Generate

```bash
curl -s -X POST http://localhost:8000/api/recap/generate \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"22222222-2222-2222-2222-222222222222","year":2025}'
```

Ответ включает:

- счётчики: views, messages, favorites, purchases, sales, activity_days  
- `top_categories`, `achievements[]`, `recommendations[]`  
- `story` (persona, headline, summary, insights, highlights)

Лишние поля в body отклоняются (`DisallowUnknownFields`).

### Share

Тело **без** `id` и `user_id` — безопасно для публичной карточки / PNG.

---

## Тестовые профили

| Имя | UUID | Тип |
|-----|------|-----|
| Алексей Продавец | `11111111-1111-1111-1111-111111111111` | seller |
| Мария Покупатель | `22222222-2222-2222-2222-222222222222` | buyer |
| Иван Ветеран | `33333333-3333-3333-3333-333333333333` | veteran |
| Елена Новичок | `44444444-4444-4444-4444-444444444444` | newbie |
| Пётр Универсал | `55555555-5555-5555-5555-555555555555` | universal |

Seed: `migrations/002_seed_test_profiles.up.sql` (объёмы достаточны для ачивок у «активных» профилей).

---

## Архитектура

```text
cmd/server          DI, миграции, HTTP
internal/domain     User, Action, Recap, Achievement, Recommendation, Story
internal/usecase    generator (metrics → achievements → recommendations → story)
                    profile, auth
internal/repository postgres + redis (NoopCache fallback)
internal/delivery   handlers, dto, middleware
migrations/         embed *.up.sql (001–004)
tests/unit|integration
```

Clean Architecture: зависимости направлены внутрь (domain ← usecase ← adapters).

Подробности: `ARCHITECTURE.txt`.

---

## Пайплайн генерации

1. Действия пользователя за год (`actions`)  
2. Метрики  
3. Ачивки по фиксированным порогам  
4. Рекомендации (1–3 CTA)  
5. Story (persona + текст)  
6. Save + cache (Redis / Noop)

---

## Тесты и линтер

```bash
cd backend
go test ./tests/unit/... -count=1 -v
go test ./tests/integration/... -count=1 -v
go test ./tests/... -count=1
golangci-lint run ./...
```

Конфиг: `.golangci.yml` (также в корне репозитория).

---

## Почему PostgreSQL + Redis

- **PostgreSQL** — users/actions/recaps, JSONB, воспроизводимый seed  
- **Redis** — кэш recap (TTL); при недоступности — `NoopCache`, API не падает  

---

## Auth

- Cookie session, demo: `demo` / `demo123`  
- Для демо recap обычно `AUTH_REQUIRED=false` (см. `.env.example`)

---

## Ограничения MVP

- Тестовые профили, не боевые event-stream Avito  
- Share path может содержать `user_id` (тело обезличено)  
- Рекомендации — CTA без deep-link на объявления  
