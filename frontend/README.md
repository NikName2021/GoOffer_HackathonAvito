# GoOffer frontend

Frontend персональных «Итогов года» на React, TypeScript и Vite. Пользователь входит в аккаунт, выбирает или создаёт профиль, генерирует recap, просматривает связную историю со слайдами и графиками, выбирает миссию и может скачать безопасную PNG-карточку.

Общий запуск продукта описан в [корневом README](../README.md), контракт API и правила расчёта — в [документации backend](../backend/README.md).

## Стек

| Область | Технологии |
|---|---|
| UI | React 19, TypeScript, Vite 8 |
| Стили | Tailwind CSS 4, Base UI / shadcn |
| Данные | TanStack Query, Axios |
| Состояние авторизации | Redux Toolkit |
| Анимации | Motion |
| Графики | Recharts |
| Маршрутизация | React Router |
| Тесты | Jest, Testing Library, Playwright |

## Требования

- Node.js 22+; Docker-образ использует Node.js 22, CI — Node.js 24;
- npm из поставки Node.js;
- для ручной работы с настоящими данными — запущенный backend на `http://localhost:8000` либо другой адрес, указанный в окружении.

## Локальный запуск

Сначала из корня репозитория подготовьте окружение и запустите backend с инфраструктурой:

```bash
cp .env.example .env
docker network create result_year
docker compose --env-file .env up -d postgres redis backend
```

Затем запустите Vite:

```bash
cd frontend
npm ci
npm run dev
```

Приложение будет доступно на <http://localhost:5173>. Демо-аккаунт:

```text
login: nikita
password: avito2026
```

Не смешивайте `localhost` и `127.0.0.1`: cookie сессии привязана к host браузера.

### Адрес API

По умолчанию frontend обращается к `http://localhost:8000/api`. Для другого backend создайте `frontend/.env.local`:

```env
VITE_BASE_API_URL=https://recap.example.ru/api
```

При полном запуске через Docker frontend открывается на <http://localhost>, а Nginx проксирует `/api` в backend на том же origin.

## npm-скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript-проверка и production-сборка в `build/` |
| `npm run preview` | Локальный просмотр production-сборки |
| `npm run lint` | ESLint |
| `npm test -- --ci --runInBand` | Unit-тесты Jest |
| `npm run test:watch` | Jest в watch-режиме |
| `npm run test:coverage` | Unit-тесты с coverage |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright с интерактивным UI |
| `npm run generate:test-json` | Генерация JSON-фикстур импорта профилей |

Перед первым E2E-запуском установите Chromium:

```bash
npx playwright install chromium
```

E2E-тесты сами поднимают Vite на порту `4173` и подменяют API, поэтому работающий backend для них не требуется.

## Пользовательский сценарий

| Шаг | Экран или модуль | Что происходит |
|---|---|---|
| 1 | Auth dialog / account panel | Регистрация или вход, получение cookie-сессии |
| 2 | `HomePage` | Список профилей, создание, редактирование и JSON-импорт |
| 3 | Генерация | `POST /api/recap/generate` через React Query hooks |
| 4 | `RecapExperience` | Gift intro и переход к истории |
| 5 | `RecapViewer` | Слайды, достижения, графики, объяснения и CTA |
| 6 | `RecapSharePreview` | Безопасный share-ответ и создание PNG через Canvas API |
| 7 | `RecapMission` | Выбор миссии и отображение прогресса |
| 8 | `useRecapViewAnalytics` | Отправка разрешённых продуктовых событий |

Маршрут `/avito/*` содержит демонстрационный интерфейс Avito и точку входа в итоги года.

## Структура

```text
frontend/
├── public/                     # favicon и примеры импортируемых JSON
├── scripts/                    # Playwright runner и генератор фикстур
├── src/
│   ├── api/                    # Axios-клиенты auth, profiles, recap и mission
│   ├── components/
│   │   ├── auth/               # вход, регистрация и панель аккаунта
│   │   ├── avitoStatic/        # демонстрационный интерфейс Avito
│   │   ├── profileCards/       # карточки и CRUD профилей
│   │   ├── recap/              # viewer, слайды, графики, share и missions
│   │   ├── sidebar/            # навигация и выбор профиля
│   │   └── ui/                 # переиспользуемые UI-примитивы
│   ├── hooks/                  # React Query и аналитика просмотра
│   ├── pages/                  # HomePage и AvitoPage
│   ├── routes/                 # маршруты приложения
│   ├── store/                  # Redux auth-state
│   ├── types/                  # TypeScript-модели API
│   └── utils/                  # CTA, тексты, storage и Canvas share image
└── tests/
    ├── unit/                   # Jest / Testing Library
    └── e2e/                    # Playwright со mock API
```

## Связь с backend

| Возможность UI | API |
|---|---|
| Авторизация | `/api/auth/register`, `/login`, `/logout`, `/me` |
| CRUD профилей | `/api/profiles` и `/api/profiles/{id}` |
| Генерация и чтение recap | `/api/recap/generate`, `/api/recap/{id}/{year}` |
| Данные для публикации | `/api/recap/{id}/{year}/share` |
| Продуктовые события | `POST /api/recap/events` |
| Миссия | `GET/PUT /api/recap/{id}/{year}/mission` |

Backend возвращает готовые упорядоченные карточки с `reason`, `presentation`, `visualization` и `cta`. Frontend отображает этот контракт и не рассчитывает годовые метрики самостоятельно.

Share endpoint требует сессию владельца и возвращает allowlist данных без идентификаторов, ссылок на объявления и изображений. PNG размером 1080×1350 создаётся локально через Canvas API.

## Docker

`frontend/Dockerfile` собирает приложение в multi-stage образе и копирует `build/` в Nginx. Корневой Compose монтирует выбранную конфигурацию из `docker/config/nginx/`.

```bash
docker compose --env-file .env up -d --build frontend
```

## Проверки

```bash
cd frontend
npm ci
npm test -- --ci --runInBand
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

## Ограничения MVP

- основной сценарий требует работающего backend и активной сессии;
- CTA моделируют продуктовые действия, но не открывают реальные объявления Avito;
- публичных share-ссылок нет: пользователь скачивает PNG или копирует текст;
- изображения объявлений загружаются по URL/data URL, отдельного upload API и object storage нет.


GoOffer — учебный хакатонный прототип, а не официальный продукт Avito.
