# Backend — GoOffer «Итоги года»

HTTP API на Go: генерация персональных итогов года по тестовым профилям,  
создание/удаление профилей (после auth), безопасный share.

Полный сценарий продукта и быстрый старт: **[корневой README](../README.md)**.  
Схема слоёв: **[ARCHITECTURE.txt](./ARCHITECTURE.txt)**.

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

Миграции применяются при старте (`migrations/migrate.go` + `*.up.sql`).

---

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/health` | — | Healthcheck |
| `GET` | `/api/profiles` | опц.* | Список профилей |
| `GET` | `/api/profiles/{id}` | опц.* | Профиль |
| `POST` | `/api/profiles` | **да** | Создать профиль + демо-активность |
| `DELETE` | `/api/profiles/{id}` | **да** | Удалить профиль (CASCADE) |
| `POST` | `/api/recap/generate` | опц.* | Генерация итогов |
| `GET` | `/api/recap/{user_id}/{year}` | опц.* | Личный recap |
| `GET` | `/api/recap/{user_id}/{year}/share` | опц.* | Share **без** `id` / `user_id` |
| `POST` | `/api/recap/generate-all?year=2025` | опц.* | Пересчёт всех профилей |
| `POST` | `/api/auth/login` | — | Cookie-сессия |
| `POST` | `/api/auth/register` | — | Регистрация |
| `POST` | `/api/auth/logout` | — | Выход |
| `GET` | `/api/auth/me` | cookie | Текущий аккаунт |

\* при `AUTH_REQUIRED=true` чтение profiles/recap тоже требует сессию.  
`POST` / `DELETE` `/api/profiles` **всегда** требуют сессию (cookie `gooffer_session`).

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

### Create profile (auth)

```bash
curl -s -c /tmp/c.txt -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"demo","password":"demo123"}'

curl -s -b /tmp/c.txt -X POST http://localhost:8000/api/profiles \
  -H 'Content-Type: application/json' \
  -d '{"name":"Мукам","profile_type":"universal","year":2025,"avatar":""}'
```

| Поле | Обязательно | Описание |
|------|-------------|----------|
| `name` | да | Имя профиля (до 80 символов) |
| `profile_type` | да | `seller` \| `buyer` \| `veteran` \| `newbie` \| `universal` |
| `year` | нет | Год для seed-активности (по умолчанию 2025) |
| `avatar` | нет | URL фото; пусто → **абстрактный** аватар (не фото людей) |

После create сидируется демо-активность по `profile_type`, чтобы сразу можно было собрать итоги.

### Delete profile (auth)

```bash
curl -s -b /tmp/c.txt -X DELETE \
  http://localhost:8000/api/profiles/{uuid}
```

Ожидается **204**. С UI seed-пятёрка не удаляется; API при наличии сессии может удалить любой id.

### Share

Тело **без** `id` и `user_id` — безопасно для публичной карточки / PNG.

---

## Тестовые профили (seed)

| Имя | UUID | Тип |
|-----|------|-----|
| Алексей Продавец | `11111111-1111-1111-1111-111111111111` | seller |
| Мария Покупатель | `22222222-2222-2222-2222-222222222222` | buyer |
| Иван Ветеран | `33333333-3333-3333-3333-333333333333` | veteran |
| Елена Новичок | `44444444-4444-4444-4444-444444444444` | newbie |
| Пётр Универсал | `55555555-5555-5555-5555-555555555555` | universal |

Seed: `migrations/002_seed_test_profiles.up.sql`.

Демо-аккаунт auth: `demo` / `demo123`.

---

## Архитектура

```text
cmd/server          DI, миграции, HTTP
internal/domain     User, Action, Recap, Achievement, Recommendation, Story
internal/usecase    generator (metrics → achievements → story → recommendations)
                    profile (List / Get / Create / Delete + SeedDemoActivity)
                    auth
internal/repository postgres + redis (NoopCache fallback)
internal/delivery   handlers, dto, middleware
migrations/         001–004
tests/unit|integration
```

Clean Architecture: зависимости внутрь (domain ← usecase ← adapters).

`profile.New(logger, userRepo, actionRepo)` — `actionRepo` нужен для seed при Create.

Подробности: `ARCHITECTURE.txt`.

---

## Пайплайн генерации

1. Действия пользователя за год (`actions`)  
2. Метрики  
3. Ачивки по фиксированным порогам  
4. Story (persona + текст)  
5. Рекомендации (1–3 CTA)  
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

Unit: generator, achievements, story, recommendations, share DTO, recap handler, auth.  
Integration: HTTP API на in-memory repos (Postgres не обязателен).

Конфиг: `.golangci.yml`.

---

## Почему PostgreSQL + Redis

- **PostgreSQL** — users/actions/recaps, JSONB, воспроизводимый seed, CASCADE при delete  
- **Redis** — кэш recap (TTL); при недоступности — `NoopCache`, API не падает  

---

## Auth

- Cookie session `gooffer_session` (HttpOnly, SameSite=Lax)  
- Demo: `demo` / `demo123`  
- Для демо recap обычно `AUTH_REQUIRED=false` (см. `.env.example`)  
- Create/Delete профилей требуют сессию независимо от `AUTH_REQUIRED`

---

## Ограничения MVP

- Тестовые / синтетические профили, не боевые event-stream Avito  
- Share path может содержать `user_id` (тело обезличено)  
- Рекомендации — CTA без deep-link на конкретные объявления  
- SeedDemoActivity при create — упрощённая активность для демо итогов  
```