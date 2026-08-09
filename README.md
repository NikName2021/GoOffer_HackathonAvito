# GoOffer — «Итоги года» (Avito Start, Кейс 3)

MVP веб-приложения, которое превращает годовую активность пользователя классифайда в **персональный recap**:

- связная история (не «таблица логов»);
- метрики, ачивки, **cards** с объяснением (*reason*) и CTA;
- просмотр **слайдами** (досмотреть до конца);
- **share-card** без `id` / `user_id` в теле ответа.

> Пользователь входит → выбирает или создаёт профиль → генерирует итоги → проходит experience → делится карточкой.

Подробности по слоям:

- Backend: [`backend/README.md`](backend/README.md)
- Frontend: [`frontend/README.md`](frontend/README.md)

---

## Зачем это нужно

| Пользователю | Бизнесу Avito |
|--------------|---------------|
| Увидеть свой год на площадке | Повод вернуться в продукт |
| Узнать себя в ачивках и категориях | Эмоциональная связь с брендом |
| Понять следующий шаг | Подталкивание к действию |

Ключевое отличие от обычной статистики: backend отдаёт не только `total_*`, но и **cards** (`title`, `description`, `reason`, `presentation`, `visualization`, `cta`) — frontend знает, *что* показать, *почему* и *какой next step*.

---

## Стек

| Слой | Технологии |
|------|------------|
| Backend | Go 1.22, PostgreSQL 17, Redis 8, embed-миграции |
| Frontend | React, TypeScript, Vite, Tailwind, Motion, Recharts |
| API docs | Swagger (`backend/docs/`) |
| Observability | Prometheus `GET /metrics`, папка `monitoring/` |
| CI | GitHub Actions: Go tests + lint, frontend test/lint/build, compose smoke |
| Deploy | Docker Compose, `docker-compose.prod.yaml`, `deploy.sh` |

---

## Быстрый старт

### 1. Окружение

```bash
cp .env.example .env
# при необходимости: python3 create_env.py
```

### 2. Docker network (обязательно один раз)

В `docker-compose.yaml` сеть `result_year` помечена как **external**:

```bash
docker network create result_year
```

### 3. Весь стек

```bash
docker compose up --build
```

| Сервис | URL |
|--------|-----|
| Frontend (nginx) | http://localhost |
| Backend API | http://localhost:8000 |
| Health | http://localhost:8000/health |
| Metrics | http://localhost:8000/metrics |

```bash
curl -s http://localhost:8000/health
```

### 4. Frontend в режиме разработки

```bash
cd frontend
npm install
npm run dev
```

Обычно: http://localhost:5173  
Backend должен быть доступен (compose или `go run`).

---

## Демо для жюри (3–5 минут)

**Аккаунт (seed):**

| login | password |
|-------|----------|
| `nikita` | `avito2026` |

1. Открыть UI → **войти** (`nikita` / `avito2026`).  
2. Выбрать тестовый профиль (Анна / Михаил / Елена / Даниил) или создать свой.  
3. Запустить **генерацию итогов** за год.  
4. Пройти **RecapViewer** до конца (gift → слайды → charts → reason → CTA).  
5. Открыть **share** — в JSON нет `id` / `user_id`; при необходимости скачать PNG.  
6. (опционально) Mission / events analytics.

```bash
# проверка API
curl -s -c /tmp/g.txt -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"nikita","password":"avito2026"}'

curl -s -b /tmp/g.txt http://localhost:8000/api/profiles
```

---

## API (кратко)

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/health` | нет | Liveness |
| `GET` | `/metrics` | нет | Prometheus |
| `POST` | `/api/auth/login` | нет | Сессия (cookie) |
| `GET` | `/api/profiles` | да | Профили |
| `POST` | `/api/recap/generate` | да | Генерация recap |
| `GET` | `/api/recap/{user_id}/{year}` | да | Личный recap |
| `GET` | `/api/recap/{user_id}/{year}/share` | да* | Share без id в теле |
| `POST` | `/api/recap/events` | да | Аналитика просмотра |
| `GET/PUT` | `/api/recap/.../mission` | да | Миссия |

\* Уточняйте middleware в вашей сборке; в текущей схеме `/api/*` защищён сессией.

Полный список и схемы: `backend/docs/swagger.yaml`, [`backend/README.md`](backend/README.md).

---

## Тестовые профили (seed)

| UUID | Имя | Тип |
|------|-----|-----|
| `11111111-1111-4111-8111-111111111111` | Анна Смирнова | mixed |
| `22222222-2222-4222-8222-222222222222` | Михаил Орлов | seller |
| `33333333-3333-4333-8333-333333333333` | Елена Коваль | buyer |
| `44444444-4444-4444-8444-444444444444` | Даниил Волков | mixed |

Данные активности — миграции `002` / `003`.

---

## Архитектура (обзор)

```text
frontend/     React UI: RecapViewer, gift, charts, share, profiles
backend/      Go API: generator (metrics → cards → achievements), auth, profiles
migrations/   embed SQL 001–007
monitoring/   VictoriaMetrics / Grafana / Loki (опционально)
docker/       nginx configs
.github/      CI pipeline
```

Backend: Clean Architecture (domain → usecase → repository / delivery).  
Frontend: hooks + recap components поверх контракта cards/summary.

---

## Качество и CI

```bash
# Backend
cd backend && go test ./tests/... -count=1 && golangci-lint run ./...

# Frontend
cd frontend && npm test -- --ci --runInBand && npm run lint && npm run build
```

GitHub Actions (`.github/workflows/ci.yml`):

- Go unit/integration + golangci-lint  
- Frontend test + lint + build  
- Docker Compose smoke (на push)

---

## Monitoring (опционально)

```bash
cd monitoring
cp .env.example .env   # если есть
docker compose up -d
```

Нужен для демонстрации инженерии; для basic-сценария жюри достаточно health + recap UI.

---

## Production

- `docker-compose.prod.yaml` — прод-ориентированный compose  
- `deploy.sh` — скрипт выката (проверьте пути к frontend; устаревшие `spa/` при наличии поправьте)

Рекомендация ментора: **публичная ссылка**, чтобы жюри не поднимало стек локально («отличный результат»).

---

## Ограничения MVP

- Не боевой event-stream Avito — seed и пользовательские профили.  
- Share: тело обезличено; URL может содержать `user_id`.  
- CTA без deep-link на реальные объявления.  
- API за auth — для демо используйте `nikita` / `avito2026`.  

---

## Структура репозитория

```text
.
├── backend/                  # Go API
├── frontend/                 # React UI
├── monitoring/               # metrics / logs stack
├── docker/                   # nginx
├── docker-compose.yaml
├── docker-compose.prod.yaml
├── deploy.sh
├── .env.example
├── .github/workflows/ci.yml
├── README.md                 # этот файл
├── backend/README.md
└── frontend/README.md
```

---

## Команда / прозрачность

Проект выполнен в рамках хакатона Avito Start, кейс 3 «Итоги года».  
ИИ мог использоваться для ускорения черновиков кода и документации; архитектура, проверка сценариев и ответственность за результат — за командой.

## License

Учебный / хакатонный MVP. Не является официальным продуктом Avito.
