# Frontend — GoOffer «Итоги года»

UI на **React + TypeScript + Vite** для кейса Avito Start «Итоги года».

Пользователь (после входа в API):

1. выбирает / создаёт профиль;
2. запускает генерацию recap;
3. проходит **связный сценарий** (gift → слайды → charts → reason → CTA);
4. делится карточкой (preview / PNG) **без чувствительных id в данных share**.

Общий запуск продукта: **[../README.md](../README.md)**  
Backend API: **[../backend/README.md](../backend/README.md)**

---

## Стек

| Область | Технологии |
|---------|------------|
| UI | React 19, TypeScript, Vite |
| Стили | Tailwind CSS 4, shadcn / Base UI |
| Данные | TanStack React Query, Axios |
| Состояние auth | Redux Toolkit |
| Анимация | Motion (`motion/react`) |
| Графики | Recharts |
| Роутинг | react-router-dom |
| Тесты | Jest (unit), Playwright (e2e-скрипты) |

---

## Требования

- Node.js **20+** (в CI используется 24)
- Запущенный backend на **http://localhost:8000** (или ваш URL)
- Для полного сценария — сессия API (`nikita` / `avito2026`, см. backend README)

---

## Быстрый старт

```bash
# 1. Backend (из корня репо)
docker network create result_year   # один раз
cp .env.example .env
docker compose up --build

# 2. Frontend
cd frontend
npm install
npm run dev
```

Dev-сервер Vite: обычно **http://localhost:5173**

Production-сборка отдаётся сервисом `frontend` в Docker Compose (nginx, порт **80**).

### Переменные окружения

Создайте `.env` / `.env.local` при необходимости:

```env
# Пример: прямой доступ к API
VITE_API_URL=http://localhost:8000/api
```

Если используете proxy через nginx в compose — UI ходит на тот же origin, cookie session работают проще.

**Не смешивайте** в браузере `localhost` и `127.0.0.1` для cookie.

---

## Скрипты

```bash
npm run dev            # разработка
npm run build          # tsc + vite build → папка build/
npm run preview        # просмотр production-сборки
npm run lint           # ESLint
npm test               # Jest unit
npm run test:watch
npm run test:coverage
npm run test:e2e       # Playwright (scripts/run-playwright.mjs)
npm run generate:test-json   # фикстуры import профилей
```

---

## Пользовательский сценарий

| Шаг | Экран / модуль | Что происходит |
|-----|----------------|----------------|
| 1 | Auth (sidebar / account) | Login / register → cookie на API |
| 2 | `HomePage` `/` | Список профилей, создание, import JSON |
| 3 | Генерация | `POST /api/recap/generate` через hooks |
| 4 | Recap experience | Gift intro → **RecapViewer** (слайды) |
| 5 | Контент слайдов | Metrics, charts, achievements, **reason**, CTA |
| 6 | Share | `RecapSharePreview` + PNG (`recapShareImage`) |
| 7 | Mission (опц.) | `RecapMission`, progress, select option |
| 8 | Analytics | `useRecapViewAnalytics` → `POST /api/recap/events` |

Дополнительно: маршрут `/avito/*` (`AvitoPage`) — вспомогательный/интеграционный UI.

---

## Структура `src`

```text
src/
├── api/                    # axios client, profiles, recap, auth
├── components/
│   ├── recap/              # ядро «Итогов года»
│   │   ├── RecapViewer.tsx
│   │   ├── RecapSlide.tsx
│   │   ├── RecapGiftIntro.tsx
│   │   ├── RecapBarChart.tsx / RecapDonutChart.tsx
│   │   ├── RecapReason.tsx
│   │   ├── RecapSharePreview.tsx
│   │   ├── RecapAchievements.tsx
│   │   ├── mission/        # RecapMission, progress, options
│   │   └── …
│   ├── profileCards/       # карточки профилей, create/import/delete
│   ├── sidebar/
│   └── ui/                 # button, dialog, chart primitives
├── hooks/
│   ├── useProfiles.ts
│   ├── useRecap.ts
│   ├── useMission.ts
│   └── useRecapViewAnalytics.ts
├── pages/
│   ├── Home.tsx
│   └── Avito.tsx
├── store/                  # auth Redux
├── types/                  # recap, profile, auth
├── utils/
│   ├── recapCopy.ts
│   ├── recapCta.ts
│   ├── recapShareImage.ts
│   └── recapStorage.ts
├── config/paths.ts
└── routes/routes.tsx
```

Тесты: `frontend/tests/unit/` (RecapExperience, Mission, CTA, storage, events…).

---

## Связь с backend

| UI-ожидание | API |
|-------------|-----|
| Список / CRUD профилей | `/api/profiles` |
| Generate / get recap | `/api/recap/generate`, `/api/recap/{id}/{year}` |
| Share | `/api/recap/{id}/{year}/share` (без id в теле) |
| Events | `POST /api/recap/events` |
| Mission | `GET/PUT .../mission` |
| Сессия | `POST /api/auth/login` → cookie |

Backend отдаёт **cards** (`reason`, `visualization`, `cta`) — frontend не «угадывает» историю, а **рендерит** объяснимый сценарий. Это напрямую бьёт в формулировку кейса про связный recap и следующее действие.

Демо-логин API: **`nikita` / `avito2026`** (см. backend README).

---

## Ключевые UX-решения

1. **Досмотреть до конца** — `RecapViewer`: прогресс, next/prev, анимации (Motion).  
2. **Объяснимость** — `RecapReason` + тексты из cards/copy utils.  
3. **Эмоция** — gift intro, scene, charts (Recharts).  
4. **Share** — preview + PNG, данные с share-endpoint без user id.  
5. **Mission** — игровой next-step поверх CTA.

---

## Docker

`frontend/Dockerfile` собирает static build и отдаёт через nginx.  
В root `docker-compose.yaml` сервис `frontend` монтирует конфиг из `docker/config/nginx/`.

```bash
# из корня
docker compose up --build frontend
# UI: http://localhost
```

---

## Качество

```bash
cd frontend
npm run lint
npm test -- --ci --runInBand
npm run build
```

CI (`.github/workflows/ci.yml`): `npm ci` → test → lint → build.

---

## Ограничения MVP

- Без backend и логина основной сценарий `/api` недоступен (protected API).  
- CTA не ведут на боевые объявления Avito.  
- Для жюри подготовьте: backend up → login → 1 профиль → generate → долистать viewer → share.

---

## Troubleshooting

| Проблема | Что проверить |
|----------|----------------|
| 401 на API | Логин, cookie, один host (`localhost` vs `127.0.0.1`) |
| CORS | Origin фронта в настройках backend / same-origin через nginx |
| Пустой список профилей | Сессия, seed миграций, account_id |
| Чёрный экран recap | Ответ generate: есть ли `cards[]`, смотри Network |
| PNG share пустой | CORS картинок / `cacheBust` в html-to-image path |

---

## License

Учебный / хакатонный MVP. Не официальный продукт Avito.