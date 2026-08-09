# Frontend — "Итоги года"

React + TypeScript + Vite. UI для backend GoOffer (кейс Avito «Итоги года»).

Общий запуск и API: **[корневой README](../README.md)**.

---

## Запуск

1. Backend: из корня репо `docker compose up` (порт **8000**).  
2. Frontend:

```bash
cd frontend
echo 'VITE_API_URL=/api' > .env.local
npm install
npm run dev
```

Открыть: **http://localhost:5173**

`VITE_API_URL=/api` — через Vite proxy на backend (удобно для cookie-сессии).

Без proxy:

```env
VITE_API_URL=http://localhost:8000/api
```

Не смешивайте в браузере `localhost` и `127.0.0.1` — cookie привязана к хосту.

---

## Пользовательский сценарий

| Шаг | Экран | Что происходит |
|-----|--------|----------------|
| 1 | `/` Home | Seed-профили, persona-badge, выбор для compare |
| 2 | «Итоги 2025» | `POST /api/recap/generate` → `/recap/:userId/2025` |
| 3 | Recap | Story, метрики, ачивки, рекомендации |
| 4 | Share | `/share/:userId/2025` — без id в данных, **PNG**, копирование ссылки |
| 5 | Compare | Два профиля side-by-side |
| 6 | «Перегенерировать все» | `POST /api/recap/generate-all` |
| 7 | Login | `demo` / `demo123` или продолжить без входа |
| 8 | После входа | **«+ Добавить профиль»** → имя, тип, опц. URL фото |
| 9 | Созданный профиль | Абстрактный аватар (если нет URL), **удаление** (корзина) |

**Новичок (Елена):** «тихий год», мало/нет ачивок, мягкий empty state — контраст к ветерану/покупателю.

**Create без фото:** backend отдаёт abstract avatar (не фото людей).  
**Delete:** только у не-seed профилей и только после login.

---

## Скрипты

```bash
npm run dev        # разработка
npm run build      # production → build/
npm run preview    # просмотр build
npm run lint       # eslint
npm test           # vitest (unit)
npm run test:watch # vitest watch
```

---

## Структура `src`

```text
api/                 axios: profiles, recap, auth, create/delete profile, generate-all
pages/               Home, Recap, Share, Compare, Login
components/recap/    StoryHero, PersonaBadge, EmptyState, MetricCard,
                     AchievementBadge, RecommendationCard, CategoryChart, …
components/profile/  CreateProfileDialog
components/sidebar/  Sidebar (login state)
hooks/               useProfiles, useRecap, useAuth, useCreateProfile, useDeleteProfile
utils/               buildStory, formatterNumber
constants/           backendProfiles (UUID + tagline)
```

---

## Зависимости UI (важное)

- `@tanstack/react-query` — кэш profiles / recap / mutations  
- `html-to-image` — скачивание share-card в PNG  
- `lucide-react` — иконки  
- Tailwind — стили  
- `axios` — `withCredentials: true` (cookie session)

---

## Auth и профили

| Действие | API | UI |
|----------|-----|-----|
| Список | `GET /api/profiles` | Home |
| Создать | `POST /api/profiles` | «+» после login |
| Удалить | `DELETE /api/profiles/{id}` | корзина (не seed) |
| Сессия | cookie `gooffer_session` | Sidebar: demo / Выйти |

Seed UUID не показываем корзину (защита демо-пятёрки).

---

## Тесты

```bash
npm test
```

Vitest + Testing Library, jsdom:

- `utils/buildStory` — persona / fallback narrative  
- `utils/formatterNumber` — формат чисел / plural  
- `components/recap/PersonaBadge` — labels  

---

## Полировка (UX)

- Persona-badge на карточках и в hero  
- Empty states: нет recap / нет ачивок / ошибка API  
- Loading с понятным текстом  
- Микрокопирайт ошибок («backend на порту 8000»)  
- Create dialog: тип поведения + опциональное фото  

---

## Ограничения

- Deep-link на реальные объявления Avito не реализован (CTA-заглушки)  
- Share URL может содержать `user_id`; JSON share — без идентификаторов  
- Удаление seed-профилей с UI отключено  
```