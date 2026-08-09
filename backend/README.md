# Backend — GoOffer «Итоги года»

HTTP API на **Go 1.22+** для кейса Avito Start «Итоги года».

Сервис:

- хранит тестовые / пользовательские профили и активность;
- генерирует **персональный recap** (метрики, ачивки, summary buyer/seller, **cards** с reason / visualization / CTA);
- отдаёт **share-card** без `id` и `user_id` в теле;
- поддерживает auth (cookie-session), missions, Prometheus metrics, Swagger.

Корневой запуск всего продукта: **[../README.md](../README.md)**.

---

## Стек

| Компонент | Выбор |
|-----------|--------|
| Язык | Go 1.22 |
| HTTP | stdlib `net/http` (ServeMux) |
| БД | PostgreSQL 17 |
| Кэш | Redis 8 |
| Миграции | SQL + `go:embed`, apply при старте |
| Auth | Cookie session + Argon2id |
| Наблюдаемость | `slog` JSON, `GET /metrics` (Prometheus) |
| Документация API | `docs/swagger.yaml` |
| Линтер | `.golangci.yml` |
| Тесты | `tests/unit`, `tests/integration` |

**Почему PostgreSQL:** реляционная модель users / actions / recaps, JSONB для гибких полей cards/summary, воспроизводимый seed. Redis — кэш recap, не source of truth.

---

## Быстрый старт

### Через Docker (рекомендуется)

Из **корня** репозитория:

```bash
docker network create result_year   # один раз (сеть external в compose)
cp .env.example .env
docker compose up --build
```

| URL | Назначение |
|-----|------------|
| http://localhost:8000/health | Healthcheck |
| http://localhost:8000/metrics | Prometheus |
| http://localhost:8000/api/… | API (нужна сессия) |

```bash
curl -s http://localhost:8000/health
# {"status":"ok"} или аналог
```

### Локально (`go run`)

1. Поднимите Postgres + Redis (`docker compose up -d postgres redis`).
2. Пропишите DSN/Redis в env (см. `.env.example`).
3. Из каталога `backend`:

```bash
go mod download
go run ./cmd/server
```

Миграции применятся при старте (`migrations.Apply`).

---

## Демо-аккаунт (seed)

Миграция `004_auth.up.sql` + тесты:

| Поле | Значение |
|------|----------|
| login | `nikita` |
| password | `avito2026` |

```bash
curl -s -c /tmp/gooffer.txt -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"nikita","password":"avito2026"}'

curl -s -b /tmp/gooffer.txt http://localhost:8000/api/auth/me
curl -s -b /tmp/gooffer.txt http://localhost:8000/api/profiles
```

Без cookie запросы к `/api/*` (кроме публичных, если появятся) вернут 401.

---

## API

### Публичные

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Liveness |
| `GET` | `/metrics` | Prometheus metrics |

### Auth

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/login` | Вход, cookie session |
| `POST` | `/api/auth/logout` | Выход |
| `GET` | `/api/auth/me` | Текущий аккаунт |

### Profiles (требуется сессия)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/profiles` | Список профилей аккаунта / seed |
| `POST` | `/api/profiles` | Создать профиль |
| `GET` | `/api/profiles/{id}` | Профиль по ID |
| `PUT` | `/api/profiles/{id}` | Обновить |
| `DELETE` | `/api/profiles/{id}` | Удалить |

### Recap (требуется сессия)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/recap/generate` | Генерация итогов |
| `GET` | `/api/recap/{user_id}/{year}` | Получить recap |
| `GET` | `/api/recap/{user_id}/{year}/share` | Share **без** `id` / `user_id` |
| `POST` | `/api/recap/events` | Аналитика просмотра / события |
| `GET` | `/api/recap/{user_id}/{year}/mission` | Миссия |
| `PUT` | `/api/recap/{user_id}/{year}/mission` | Выбор опции миссии |

Полная OpenAPI-схема: `docs/swagger.yaml`.

### Generate — пример

```bash
curl -s -b /tmp/gooffer.txt -X POST http://localhost:8000/api/recap/generate \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"11111111-1111-4111-8111-111111111111","year":2025}'
```

Типичный ответ включает:

- `total_views`, `total_messages`, `total_favorites`, `total_purchases`, `total_sales`, `activity_days`
- `top_categories[]`
- `achievements[]` — slug, title, description, icon
- `summary` — headline, description, buyer / seller / combined
- `cards[]` — title, description, **reason**, presentation, visualization, **cta**, shareable
- `generated_at`

### Share

Тело **не** содержит `id` и `user_id` — безопасно для публичной карточки / PNG на фронте.

---

## Пайплайн генерации

```text
actions (год)
    → metrics
    → achievements (пороговые правила)
    → summary (buyer / seller / combined)
    → cards (объяснимые слайды + CTA)
    → persist (Postgres) + cache (Redis)
```

Код: `internal/usecase/generator/` (`metrics.go`, `cards.go`, `charts.go`, `achievements.go`, `generator.go`).

---

## Архитектура

```text
backend/
├── cmd/server/main.go          # DI, миграции, HTTP
├── internal/
│   ├── domain/                 # Recap, RecapCard, Summary, Achievement, User…
│   ├── usecase/
│   │   ├── generator/          # бизнес-логика recap
│   │   ├── profile/
│   │   ├── auth/
│   │   ├── mission/
│   │   └── ports/              # интерфейсы репозиториев
│   ├── repository/
│   │   ├── postgres/
│   │   └── redis/              # cache + cached_recap_repository
│   ├── delivery/
│   │   ├── handlers/
│   │   ├── dto/
│   │   └── middleware/         # auth, cors, recovery, request_id, logger
│   ├── server/                 # router, prometheus
│   ├── config/
│   └── observability/
├── migrations/                 # 001…007 *.up.sql / *.down.sql + migrate.go
├── tests/unit|integration/
├── docs/                       # swagger
├── Dockerfile
├── .golangci.yml
└── go.mod
```

**Правило:** зависимости направлены внутрь (domain ← usecase ← adapters).

Детали слоёв: `ARCHITECTURE.txt` (если актуален — сверяйте с кодом).

---

## Миграции

| Файл | Назначение |
|------|------------|
| `001_init` | Базовые таблицы |
| `002_seed_test_profiles` | Тестовые пользователи + категории/actions |
| `003_profile_details` | Детали профиля / активность |
| `004_auth` | accounts, sessions, привязка users |
| `005_profile_crud` | Расширение CRUD |
| `006_recap_cards` | Поля cards в recap |
| `007_recap_missions` | Миссии |

Применяются автоматически при старте сервера (embed).

---

## Тестовые профили (seed)

| UUID | Имя | Тип |
|------|-----|-----|
| `11111111-1111-4111-8111-111111111111` | Анна Смирнова | mixed |
| `22222222-2222-4222-8222-222222222222` | Михаил Орлов | seller |
| `33333333-3333-4333-8333-333333333333` | Елена Коваль | buyer |
| `44444444-4444-4444-8444-444444444444` | Даниил Волков | mixed |

---

## Тесты и линтер

```bash
cd backend

go test ./tests/unit/... -count=1 -v
go test ./tests/integration/... -count=1 -v
go test ./... -count=1

golangci-lint run ./...
```

Unit: generator, achievements, profile request/summary, recap response, password hash.  
Integration: auth, profiles, recap, mission, repository.

CI: `.github/workflows/ci.yml` (go test, golangci-lint, compose smoke).

---

## Dockerfile

Multi-stage: `golang` build → Alpine runtime, static binary.  
Healthcheck (если настроен) бьёт в `/health`.

Сборка контекст: каталог `backend/` (см. root `docker-compose.yaml`).

---

## Переменные окружения

См. корневой `.env.example`. Типично:

- `PORT` / `DB_*` / `POSTGRES_*`
- `REDIS_URL`
- режим release (`GIN_MODE` в compose может присутствовать как legacy-имя)

Не коммитьте `.env` с секретами.

---

## Ограничения MVP

- Данные seed / пользовательский ввод, не боевой event-stream Avito.
- Share: тело обезличено; path может содержать `user_id`.
- CTA на cards — продуктовые, без deep-link на реальные объявления.
- Для жюри: заранее показать login `nikita` / `avito2026` или вынести seed-профили в публичный read-only режим (если решите ослабить auth).

---

## Полезные команды

```bash
# логи backend-контейнера
docker compose logs -f backend

# пересоздать БД с нуля
docker compose down -v
docker network create result_year
docker compose up --build
```

---

## License

Учебный / хакатонный MVP. Не является официальным продуктом Avito.
