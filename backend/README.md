# Backend — GoOffer «Итоги года»

Go API, которое по действиям пользователя собирает персональный **recap**: метрики, ачивки, историю года и рекомендации.

---

## Стек

- **Go** (см. `go.mod`)
- **PostgreSQL 17** — пользователи, actions, recaps, auth
- **Redis** — кэш recap (при недоступности — noop, сервис работает)
- **pgx**, **go-redis**, стандартный `net/http` (ServeMux Go 1.22+)

---

## Быстрый старт

Из **корня** репозитория:

```bash
cp .env.example .env
docker compose up --build
```

API: http://localhost:8000  
Health: `GET /health` → `{"status":"ok"}`

### Локально без Docker (опционально)

```bash
cd backend
export DB_HOST=localhost DB_PORT=5446 DB_USER=result_year \
  DB_PASSWORD=result_year_dev_password DB_NAME=result_year \
  REDIS_HOST=localhost REDIS_PORT=6379 SERVER_PORT=8000
go run ./cmd/server
```

Миграции применяются автоматически при старте (`migrations.Apply`).

---

## API

| Method | Path | Описание |
|---|---|---|
| `GET` | `/health` | Healthcheck |
| `GET` | `/api/profiles` | Список тестовых профилей |
| `GET` | `/api/profiles/{id}` | Профиль по UUID |
| `POST` | `/api/recap/generate` | Сгенерировать итоги года |
| `GET` | `/api/recap/{user_id}/{year}` | Личный recap |
| `GET` | `/api/recap/{user_id}/{year}/share` | Публичная share-card (без id/user_id) |
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/login` | Вход (HttpOnly cookie `gooffer_session`) |
| `POST` | `/api/auth/logout` | Выход |
| `GET` | `/api/auth/me` | Текущий аккаунт |

### Генерация

```bash
curl -s -X POST http://localhost:8000/api/recap/generate \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"22222222-2222-2222-2222-222222222222","year":2025}'
```

Ответ: `201 Created` + объект recap.  
Неизвестные поля в body отклоняются (`DisallowUnknownFields`).

### Auth (опционально)

По умолчанию `AUTH_REQUIRED=false`.

Демо-аккаунт: `demo` / `demo123`.

```env
AUTH_REQUIRED=true
```

---

## Правила генерации

### Действия

| Тип | Смысл |
|---|---|
| `view` | Просмотр объявления |
| `message` | Сообщение |
| `favorite` | Избранное |
| `purchase` | Покупка |
| `sale` | Продажа |

### Ачивки

| Slug | Условие |
|---|---|
| `curious` | ≥ 500 views |
| `explorer` | ≥ 1000 views |
| `social_butterfly` | ≥ 50 messages |
| `seller_master` | ≥ 5 sales |
| `shopaholic` | ≥ 10 purchases |
| `enthusiast` | ≥ 100 activity days |
| `veteran` | ≥ 300 activity days |

### Story и рекомендации

- **Story**: persona (`seller` / `buyer` / `mixed` / `explorer` / `newbie`) + headline, summary, insights
- **Recommendations**: 1–3 CTA (категория, избранное, объявление, чаты) без PII
- **Share**: без `id` и `user_id`

---

## Тестовые профили

| Имя | UUID | Тип |
|---|---|---|
| Алексей Продавец | `11111111-1111-1111-1111-111111111111` | seller |
| Мария Покупатель | `22222222-2222-2222-2222-222222222222` | buyer |
| Иван Ветеран | `33333333-3333-3333-3333-333333333333` | veteran |
| Елена Новичок | `44444444-4444-4444-4444-444444444444` | newbie |
| Пётр Универсал | `55555555-5555-5555-5555-555555555555` | universal |

---

## Архитектура

```text
cmd/server → delivery → usecase → domain
                ↓
         repository (postgres / redis)
```

Подробности: `ARCHITECTURE.txt`.

---

## Тесты и линтер

```bash
cd backend
go test ./tests/unit/... -count=1 -v
go test ./tests/integration/... -count=1 -v
golangci-lint run ./...
```

---

## Почему PostgreSQL

Реляционная модель users/actions/recaps, JSONB для гибких полей, простой seed. Redis — только кэш recap (TTL 24h), не источник истины.

---

## Ограничения MVP

- Тестовые профили, не продакшен-события Avito
- Share path может содержать `user_id` (тело обезличено)
- Рекомендации — CTA без deep-link на конкретные объявления
```
