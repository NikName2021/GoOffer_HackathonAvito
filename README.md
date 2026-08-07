# GoOffer — «Итоги года» (Avito Hackathon, Кейс 3)

MVP веб-приложения: **тестовый профиль → генерация итогов → персональная история** (метрики, ачивки, рекомендации, story) → **безопасный share** без `id` / `user_id`.

> Не «таблица логов», а сценарий: что делал пользователь на площадке, какие бейджи заработал и какой следующий шаг в продукте.

---

## Стек

| Слой | Технологии |
|------|------------|
| Backend | Go, `net/http`, PostgreSQL, Redis, Docker Compose |
| Frontend | React, TypeScript, Vite, React Query, Tailwind |
| Качество | unit + integration тесты, golangci-lint, ESLint |

---

## Почему PostgreSQL

Реляционная модель (`users`, `actions`, `recaps`) + **JSONB** для гибких полей recap (`achievements`, `recommendations`, `story`, `top_categories`). Миграции и seed дают **воспроизводимые** тестовые профили. Redis — только кэш recap, не источник истины.

Тестовые данные ≠ «ненастоящая» архитектура: тот же слой репозиториев готов к реальным событиям Avito.

---

## Быстрый старт

### Весь стек

```bash
cp .env.example .env
docker compose up --build
```

| Сервис | URL |
|--------|-----|
| Backend API | http://localhost:8000 |
| Health | http://localhost:8000/health |
| Frontend (если в compose) | http://localhost |
| Frontend (dev) | http://localhost:5173 |

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/api/profiles
```

### Только frontend (dev)

```bash
cd frontend
echo 'VITE_API_URL=/api' > .env.local
npm install
npm run dev
```

Vite proxy: `/api` → `http://127.0.0.1:8000`.

### Auth (опционально)

По умолчанию recap-демо **без логина** (`AUTH_REQUIRED=false`).

```bash
curl -s -c /tmp/c.txt -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"demo","password":"demo123"}'
```

---

## Сценарий для жюри (5 минут)

1. Главная — **5 тестовых профилей** с persona-badge  
2. **«Итоги 2025»** → generate → экран recap (story, цифры, ачивки, CTA)  
3. **Елена Новичок** — «тихий год», без ачивок, но с рекомендациями  
4. **Share** — карточка без `id`/`user_id`, скачать **PNG**  
5. Отметить **2 профиля** → **Сравнить** (разные правила генерации)  
6. **Перегенерировать все** — удобно перед демо  
7. (опционально) Войти: `demo` / `demo123`

---

## API

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Healthcheck |
| `GET` | `/api/profiles` | Тестовые профили |
| `GET` | `/api/profiles/{id}` | Профиль |
| `POST` | `/api/recap/generate` | `{"user_id","year"}` → recap |
| `GET` | `/api/recap/{user_id}/{year}` | Личный recap |
| `GET` | `/api/recap/{user_id}/{year}/share` | Share без идентификаторов |
| `POST` | `/api/recap/generate-all?year=2025` | Пересчёт всех профилей |
| `POST` | `/api/auth/login` | Сессия (cookie) |

```bash
curl -s -X POST http://localhost:8000/api/recap/generate \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"22222222-2222-2222-2222-222222222222","year":2025}'
```

В ответе: `total_*`, `top_categories`, `achievements`, `recommendations`, `story`.  
В share — **без** `id` и `user_id`.

---

## Тестовые профили

| Имя | UUID | Тип |
|-----|------|-----|
| Алексей Продавец | `11111111-1111-1111-1111-111111111111` | seller |
| Мария Покупатель | `22222222-2222-2222-2222-222222222222` | buyer |
| Иван Ветеран | `33333333-3333-3333-3333-333333333333` | veteran |
| Елена Новичок | `44444444-4444-4444-4444-444444444444` | newbie |
| Пётр Универсал | `55555555-5555-5555-5555-555555555555` | universal |

---

## Что сверх MVP

- Story / persona / highlights (связный текст, не только цифры)  
- Сравнение двух профилей side-by-side  
- Share PNG (`html-to-image`)  
- Перегенерация всех recap одной кнопкой  
- Полировка UI: empty states, persona-badge, микрокопирайт  
- Опциональный auth (cookie session)

---

## Тесты

```bash
cd backend
go test ./tests/... -count=1
golangci-lint run ./...
```

```bash
cd frontend
npm run lint
```

---

## Структура репозитория

```text
backend/          Go API (Clean Architecture)
frontend/         React UI сценария «Итоги года»
docker-compose.yaml
README.md         ← этот файл
```

Подробнее: `backend/README.md`, `backend/ARCHITECTURE.txt`, `frontend/README.md`.

---

## Ограничения MVP

- Тестовые профили и seed, не продакшен-события Avito  
- Share URL может содержать `user_id` (тело ответа обезличено)  
- Рекомендации — продуктовые CTA, не deep-link на конкретные объявления  

---

## License

Учебный / хакатонный MVP. Не является официальным продуктом Avito.
