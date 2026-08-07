# Frontend — «Итоги года»

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

`VITE_API_URL=/api` — через Vite proxy на backend (удобно для cookie).

Без proxy:

```env
VITE_API_URL=http://localhost:8000/api
```

Не смешивайте в браузере `localhost` и `127.0.0.1`.

---

## Пользовательский сценарий

| Шаг | Экран | Что происходит |
|-----|--------|----------------|
| 1 | `/` Home | 5 профилей, persona-badge, выбор для compare |
| 2 | Кнопка «Итоги 2025» | `POST /api/recap/generate` → `/recap/:userId/2025` |
| 3 | Recap | Story, метрики, ачивки, рекомендации, FadeIn |
| 4 | Share | `/share/:userId/2025` — без id в данных, **PNG**, копирование ссылки |
| 5 | Compare | Два профиля side-by-side |
| 6 | «Перегенерировать все» | `POST /api/recap/generate-all` |
| 7 | Login | `demo` / `demo123` или продолжить без входа |

**Новичок (Елена):** «тихий год», 0 ачивок, мягкий empty state — контраст к ветерану/покупателю.

---

## Скрипты

```bash
npm run dev       # разработка
npm run build     # production
npm run preview   # просмотр build
npm run lint      # eslint
```

---

## Структура `src`

```text
api/              axios: profiles, recap, auth, generate-all
pages/            Home, Recap, Share, Compare, Login
components/recap/ StoryHero, PersonaBadge, EmptyState, FadeIn,
                  MetricCard, AchievementBadge, RecommendationCard
components/sidebar/
hooks/            useProfiles, useRecap, useAuth
utils/            buildStory (fallback narrative)
constants/        backendProfiles (UUID + tagline)
```

---

## Зависимости UI (важное)

- `@tanstack/react-query` — кэш recap / profiles  
- `html-to-image` — скачивание share-card в PNG  
- `lucide-react` — иконки  
- Tailwind — стили  

---

## Полировка (UX)

- Persona-badge на карточках и в hero  
- Empty states: нет recap / нет ачивок / ошибка API  
- Loading-спиннеры с понятным текстом  
- Микрокопирайт ошибок («backend на порту 8000»)  

---

## Ограничения

- Deep-link на реальные объявления Avito не реализован (CTA-заглушки)  
- Share URL может содержать `user_id`; JSON share — без идентификаторов  
