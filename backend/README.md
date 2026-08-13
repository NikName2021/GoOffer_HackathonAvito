# GoOffer backend

Backend персональных «Итогов года»: cookie-аутентификация, CRUD профилей, детерминированная генерация recap, административный конструктор карточек, безопасный экспорт, миссии следующего года и Prometheus-метрики. Сервер написан на Go поверх стандартного `net/http`; данные хранятся в PostgreSQL, Redis используется только как кэш готовых итогов.

## Быстрый запуск через Docker Compose

Нужны Docker с Compose и свободные порты `80`, `8000`, `5446`, `6379`.

```bash
cp .env.example .env
docker network create result_year
docker compose --env-file .env up --build --wait
```

Команду выполняют из корня репозитория. Повторный `docker network create` может сообщить, что сеть уже существует — это нормально. После запуска доступны:

- frontend и same-origin API: `http://localhost` и `http://localhost/api/...`;
- backend напрямую: `http://localhost:8000`;
- healthcheck: `http://localhost:8000/health`;
- Swagger UI: `http://localhost:8000/docs/`;
- OpenAPI YAML: `http://localhost:8000/docs/swagger.yaml`;
- Prometheus metrics: `http://localhost:8000/metrics`.

Остановка без удаления данных:

```bash
docker compose --env-file .env down
```

`docker compose --env-file .env down --volumes` дополнительно безвозвратно удаляет локальные PostgreSQL/Redis volume.

## Локальный запуск через Go

Нужен Go 1.22+. Сначала запустите инфраструктуру из корня:

```bash
docker network create result_year
docker compose --env-file .env.example up -d postgres redis
```

Затем в отдельном терминале:

```bash
cd backend
DB_HOST=localhost \
DB_PORT=5446 \
DB_USER=result_year \
DB_PASSWORD=result_year_dev_password \
DB_NAME=result_year \
REDIS_URL=redis://localhost:6379 \
go run ./cmd/server
```

При старте сервер проверяет PostgreSQL и автоматически применяет ещё не выполненные `migrations/*.up.sql`. Недоступный PostgreSQL останавливает запуск; недоступный Redis логируется, а чтение/запись итогов продолжает работать через PostgreSQL.

## Переменные окружения

| Переменная | Обязательность и значение |
|---|---|
| `DB_USER` / `POSTGRES_USER` | Обязательна одна из двух. Пользователь PostgreSQL. |
| `DB_PASSWORD` / `POSTGRES_PASSWORD` | Обязательна одна из двух. Пароль PostgreSQL. |
| `DB_NAME` / `POSTGRES_DATABASE` | Обязательна одна из двух. Имя базы. |
| `DB_HOST` | Необязательно, по умолчанию `localhost`. |
| `DB_PORT` | Необязательно, по умолчанию `5432`; для локального Compose — `5446`. |
| `REDIS_URL` | Необязательно, по умолчанию `redis://localhost:6379`. |
| `PORT` | Необязательно, по умолчанию `8000`. |
| `SESSION_TTL` | Необязательно, Go duration, по умолчанию `24h`. |
| `RECAP_SHARE_TTL` | Необязательно, срок жизни публичной ссылки в формате Go duration, по умолчанию `72h`. |
| `PUBLIC_BASE_URL` | Публичный HTTP(S)-origin без path/query, например `https://recap.example.ru`. Используется в создаваемых share-ссылках; production Compose требует явное значение. |
| `COOKIE_SECURE` | Для локального HTTP `false`; в production Compose принудительно `true`. |
| `CORS_ORIGINS` | CSV без `*`, например `https://recap.example.ru`. Production Compose требует явное значение. При same-origin `/api` браузеру CORS не нужен, но origin всё равно задаётся явно как безопасный список. |

Неиспользуемых переменных Gin/Celery/secret key у Go-сервиса нет.

## Production

`docker-compose.prod.yaml` включает healthcheck PostgreSQL, Redis, backend и frontend; frontend стартует после healthy backend. Неиспользуемые `uploads` и `backend_logs` volume удалены.

Перед запуском production Compose:

1. Укажите сильные `POSTGRES_PASSWORD`, `PUBLIC_BASE_URL=https://<ваш-домен>`, production `CORS_ORIGINS=https://<ваш-домен>` и Nginx-конфигурацию в `NGINX_FILE`.
2. Завершайте TLS на Nginx или внешнем reverse proxy и передавайте `/api/` в backend. Репозиторий не содержит production-сертификатов.
3. Проверьте, что клиент открывает сайт по HTTPS. Backend выставляет `gooffer_session` с `Secure`, `HttpOnly`, `SameSite=Lax`, поэтому по обычному HTTP браузер cookie не отправит.
4. Создайте внешнюю сеть `result_year` и запустите `docker compose --env-file <prod-env> -f docker-compose.prod.yaml up -d --build --wait`.

Для smoke-проверки выполните регистрацию, затем `GET /api/auth/me`; у обоих ответов должен быть рабочий Secure cookie через HTTPS.

## Миграции и тестовые профили

Миграции встроены в бинарник (`migrations/migrate.go`) и выполняются транзакционно в лексикографическом порядке. Применённые имена записываются в `schema_migrations`; advisory lock не даёт двум экземплярам применить один файл одновременно.

На чистой базе миграция `002_seed_test_profiles` создаёт базовые демонстрационные профили, а `004_auth` — аккаунт:

```text
login: nikita
password: avito2026
```

Профили принадлежат этому аккаунту. Миграция `009_admin_card_definitions` назначает `nikita` администратором и добавляет правила настраиваемых Recap-карточек. Миграция `010_enrich_seed_profiles` расширяет набор до шести реалистичных персон: у каждой не менее шести просмотренных и трёх собственных объявлений, а восемь сделок связаны между профилями одинаковыми `adId`, ценой и датой покупки/продажи. Миграция `011_add_seed_activity_and_images` доводит историю каждого профиля минимум до 50 item-level событий и добавляет изображения ко всем просмотренным и собственным объявлениям. Миграция `012_achievement_definitions` переносит шесть встроенных ачивок и правила их получения в PostgreSQL. Миграция `017_seed_previous_year_activity` добавляет каждому профилю три просмотра и две продажи за 2025 год, чтобы recap 2026 показывал сравнение расходов, выручки и интересов с прошлым годом, а прогноз использовал динамику двух лет. Остальные аккаунты по умолчанию не имеют административных прав. Seed предназначен для демо/MVP. В production его следует вынести из набора production-миграций или заменить подготовкой демонстрационной среды.

`008_remove_legacy_actions` удаляет старые `actions/categories` из уже существующих баз. Единственный источник истины для recap — item-level JSONB `viewed_ads` и `own_ads` в профиле.

## API и ошибки

Полный контракт и примеры находятся в [Swagger](./docs/swagger.yaml). Основные группы:

- `/api/auth/*` — регистрация, вход, выход, текущий аккаунт;
- `/api/profiles*` — профили текущего аккаунта;
- `POST /api/recap/generate` и `GET /api/recap/{user_id}/{year}` — генерация и чтение итогов;
- `GET /api/recap/{user_id}/{year}/share` — авторизованные безопасные данные для PNG/текста;
- `POST /api/recap/{user_id}/{year}/shares` — создать временную публичную ссылку из выбранных карточек;
- `GET /api/public/recap-shares/{token}` — прочитать публичный снимок без авторизации;
- `DELETE /api/recap-shares/{share_id}` — досрочно отозвать свою ссылку;
- `/api/recap/{user_id}/{year}/mission` — выбор набора и прогресс миссий;
- `/api/profiles/{id}/missions` — выбранные миссии всех recap-годов профиля;
- `POST /api/recap/events` — только события из фиксированного allowlist;
- `/api/admin/card-definitions*` — создание, просмотр, полное обновление и удаление правил дополнительных карточек; доступно только администратору;
- `/api/admin/achievement-definitions*` — просмотр и редактирование шести встроенных ачивок без создания и удаления; изменения применяются при следующей генерации итогов.

Все profiles/recap/mission endpoint требуют cookie `gooffer_session` и проверяют владельца. Единственное исключение — чтение публичного снимка по криптографическому token. Чужой профиль, recap или share возвращается как `404`, чтобы не подтверждать существование ресурса.

Ошибки имеют единый формат:

```json
{
  "error": {
    "code": "invalid_profile",
    "message": "request body must be valid profile JSON",
    "request_id": "..."
  }
}
```

| HTTP | Типичные коды | Когда |
|---|---|---|
| `400` | `invalid_request`, `invalid_profile`, `invalid_id`, `invalid_year`, `invalid_event`, `invalid_mission`, `invalid_share` | Некорректный JSON, поле, UUID, год, enum или набор публичных карточек. |
| `401` | `unauthorized`, `invalid_credentials` | Нет действующей cookie или неверная пара логин/пароль. |
| `403` | `forbidden` | Сессия действительна, но у аккаунта нет прав администратора. |
| `404` | `profile_not_found`, `recap_not_found`, `not_found` | Ресурс не существует, не принадлежит аккаунту или маршрут неизвестен. |
| `409` | `login_taken` | Логин уже зарегистрирован. |
| `500` | `internal_error` | Неожиданная ошибка; подробность остаётся в server log, клиент получает `request_id`. |

## Ограничения входных данных

- тело `POST/PUT /api/profiles` — не более 32 MiB;
- `views` — не более 10 000 элементов;
- `ownAds` — не более 10 000 элементов;
- `viewedAt` одного объявления — от 1 до 10 000 событий;
- `adId` уникален одновременно между `views` и `ownAds`;
- data URL одного изображения — не более 7 MiB; разрешены PNG/JPG/WEBP либо HTTP(S) URL;
- остальные auth/recap/mission/event тела — не более 1 MiB;
- год recap — от 2000 до текущего UTC-года.

JSON декодируется с запретом неизвестных полей и второго объекта в теле.

## Семантика года и источник данных

Год определяется в UTC. В recap попадает только активность, которую можно отнести к выбранному году:

- просмотр — каждое `viewedAt[type=watch]`; повторные просмотры считаются отдельно;
- избранное — одно `like`-событие объявления;
- покупка — одно `buy`-событие, включая признак Авито Доставки;
- публикация и seller engagement — `ownAds` с `publishedAt` выбранного года;
- продажа — `isSold=true` и `soldAt` выбранного года;
- отзыв — `review.createdAt` выбранного года;
- активный день — уникальная UTC-дата любого учтённого события.

`chatsCount`, `likes` и объявление без `publishedAt` — недатированные snapshots. Они остаются в profile API, но не входят в годовые метрики, карточки и достижения. Поля `total_messages`, `buyer.chats_count` и `seller.likes_received` сохранены для совместимости и равны нулю.

Для старых просмотров без `viewedAt` допускается датированный fallback: `viewCount` относится к году `lastViewedAt`, а избранное/покупка — к своим датам. Недатированные значения не угадываются.

## Правила генерации

Генерация детерминирована для одного профиля и года, кроме новых `id/generated_at`. Категории сравниваются по числу покупок, избранного, продаж, просмотров и активности объявлений; при полном равенстве — по имени. Самая крупная покупка выбирается по цене, объявление-звезда — по просмотрам, затем по названию.

| Условие | Карточка | Причина/CTA | Share |
|---|---|---|---|
| Всегда | `year_overview` | Краткий headline года | Да |
| Есть активность в категории, но нет donut | `main_interest` | `open_category` | Да |
| Не менее двух категорий | `category_mix` | Donut до 4 категорий + «Другое», `open_category` | Да, без самой диаграммы |
| Есть датированная активность | `activity_rhythm` | Stacked bar по 12 месяцам | Да, без самой диаграммы |
| Есть просмотры | `viewed_findings` | `open_recommendations` | Да |
| Есть покупки с доставкой | `avito_delivery` | Счётчик доставок | Да |
| Есть избранное | `favorites` | `open_favorites` | Да |
| Есть покупка | `largest_purchase` | Максимальная цена, `open_listing` | Нет |
| Более одной покупки | `purchases` | Счётчик покупок | Да |
| Есть публикации года | `seller_portfolio` | `create_listing` | Да |
| Есть публикации года | `star_listing` | Максимум просмотров, `open_own_listing` | Да, но title нейтрализуется |
| Есть продажи | `second_life` | `create_listing` | Да |
| Есть просмотры/избранное/контакты seller | `listing_views`, `seller_favorites`, `seller_contacts` | Seller engagement | Да |
| Есть отзывы года | `reviews` | Средняя оценка | Да |
| Есть buyer и seller данные | `both_sides` | Общие сделки | Да |
| Более одной категории | `interest_circle` | `open_recommendations` | Да |
| `joinedAt` не позже года | `avito_history` | Стаж профиля | Да |
| Всегда | `next_step` | Один финальный CTA по типу профиля | Да |

Порядок: overview → до одной общей карточки → до двух диаграмм → до двух buyer → до двух seller → до одной combined → заполнение свободных мест → finale. Максимум — 9 карточек. Пустой профиль получает overview и finale; buyer-only, seller-only и mixed получают соответствующие ветки.

Пороги достижений: 500/1000 просмотров, 5 продаж, 10 покупок, 100/300 активных дней. Сравнение включительное (`>=`).

## Безопасность share

Старый `GET .../share` остаётся авторизованным экспортом для PNG/текста. Он не читает актуальный профиль напрямую, а преобразует сохранённый recap через `ShareRecapCardDTO` с allowlist:

```text
kind, eyebrow, title, description, value, presentation
```

Из всего вложенного JSON исключены `id`, `user_id`, `ad_id`, `image_url`, `shareable`, `reason`, `visualization`, `cta` и `params`. Название собственного объявления заменяется нейтральной фразой; изображения объявлений не экспортируются. Unit, API и реальный integration-тест рекурсивно проверяют отсутствие запрещённых ключей.

Для публичной ссылки владелец передаёт от 1 до 9 уникальных `card_ids`; backend повторно проверяет, что каждая карточка существует и имеет `shareable=true`. В PostgreSQL сохраняется неизменяемый снимок выбранных карточек, всех уже полученных медалей и SHA-256 token, но не сам token. Публичная медаль содержит только `slug`, `title`, `description` и `icon`: `category`, идентификаторы пользователя, профиля и recap не сохраняются в snapshot. Изменение или повторная генерация исходного recap, а также последующее редактирование настроек ачивок уже опубликованный снимок не меняет. Старые снимки без поля `achievements` возвращаются как `"achievements": []`; отдельная миграция не нужна, потому что снимок хранится в JSONB.

Ссылка живёт `RECAP_SHARE_TTL` (по умолчанию 72 часа) и может быть досрочно отозвана владельцем. Неверный, истёкший и отозванный token одинаково возвращают `404`. Все ответы публичного маршрута используют `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow, noarchive` и `Referrer-Policy: no-referrer`; backend access log заменяет сам token шаблоном маршрута. Формат `responsive` предназначен для обычной страницы, `mobile_story` — для отдельной вертикальной мобильной вёрстки; изображения backend не рендерит.

## PostgreSQL и Redis

PostgreSQL выбран как durable source of truth: транзакции нужны для регистрации account+session, внешние ключи связывают владельцев/recap/mission, unique constraints делают повторную генерацию и выбор миссии предсказуемыми, JSONB сохраняет item-level профиль и versioned карточки без отдельной таблицы на каждый вариант.

Redis хранит только recap с TTL 24 часа и уменьшает задержку повторного чтения. PostgreSQL всегда записывается первым; повторная генерация заменяет кэш свежим объектом. Ошибка Redis не делает API недоступным.

## Тесты, coverage, lint и CI

```bash
cd backend
make test
make lint
make coverage
```

Реальные integration-тесты требуют PostgreSQL и Redis и тех же `DB_*`/`REDIS_URL`:

```bash
DB_HOST=localhost DB_PORT=5446 \
DB_USER=result_year DB_PASSWORD=result_year_dev_password DB_NAME=result_year \
REDIS_URL=redis://localhost:6379 \
make test-integration
```

CI содержит обязательный job с чистыми PostgreSQL и Redis services. Он применяет миграции и выполняет сценарий регистрация → профиль → генерация → повторная генерация/кэш → публичный share → отзыв ссылки → миссия. Отдельно публикуется `coverage.out`, а coverage пакетов бизнес-логики не может быть ниже 75%. OpenAPI проверяется Redocly.

Версия golangci-lint закреплена в `.golangci-version`. Включены:

- `govet` — ошибки типов, printf и конкурентности;
- `staticcheck` — расширенный статический анализ;
- `errcheck` — потерянные ошибки;
- `ineffassign` — бесполезные присваивания;
- `unused` — мёртвые сущности и зависимости.

`bodyclose` и `noctx` рассмотрены, но не включены: backend не выполняет исходящие HTTP-запросы, а ложные срабатывания сейчас приходились бы в основном на `httptest`.

## Границы MVP

- нет датированных событий чатов и общего `likes`, поэтому они исключены из recap;
- изображения хранятся в profile JSON как URL/data URL; отдельного object storage и upload API нет;
- тестовые профили находятся в миграциях и требуют отделения для строгого production-контура;
- Redis — необязательный кэш, не очередь и не source of truth;
- rate limiting пока не реализован; публичное чтение защищено длинным случайным token, ограниченным TTL и запретом кэширования/индексации.
