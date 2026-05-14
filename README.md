# Mahjong Focus (Django + React)

Современная веб-платформа маджонга с архитектурой под масштабирование: backend на Django, frontend на React.

## Что реализовано по уровням

### Level 1 (Слабый)
- Интерактивная раскладка плиток
- Ручной клик по плиткам

### Level 2 (Средний)
- Проверка правил: удаляются только свободные одинаковые плитки
- Подсчет очков, таймер, счетчик ходов
- Shuffle
- Несколько раскладок через уровни сложности

### Level 3 (Сильный)
- Генератор раскладок по сложности
- Авторизация (register/login)
- История игр и сохранение прогресса в БД
- Темная/светлая тема
- Подсказки + отмена хода
- Адаптивный интерфейс

### Level 4 (Великий)
- Daily Challenge с общей ежедневной раскладкой
- AI Coach (API-подсказки стратегии)
- Социальный слой: daily leaderboard + рейтинг городов
- Продуктовый сигнал монетизации: кнопка Upgrade to Pro

## Для кого и ценность

Продукт ориентирован на пользователей, которым нужны короткие фокус-сессии и ощущение прогресса:
- ежедневные челленджи возвращают пользователя
- рейтинг по городам добавляет социальную мотивацию
- AI coach снижает фрустрацию у новичков
- архитектура готова к расширению (платные скины, турниры, подписка Pro)

## Стек

- Backend: Django + SQLite locally, Supabase Postgres when `DATABASE_URL` is set
- Frontend: React + Vite

## Деплой на Render

Проект подготовлен для Render Blueprint. В корне репозитория есть `render.yaml`, который создает:

- `mahjong-focus-api` — Django backend web service
- `mahjong-focus` — React/Vite static site
- `mahjong-focus-db` — Render Postgres

### Вариант 1: Blueprint

1. Push project to GitHub.
2. In Render Dashboard open **New -> Blueprint**.
3. Select this repository.
4. Render will read `render.yaml`.
5. During creation, enter secret values for:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

Default production URLs used by `render.yaml`:

- Frontend: `https://mahjong-focus.onrender.com`
- Backend API: `https://mahjong-focus-api.onrender.com/api`

If Render asks you to change service names because a name is taken, update the related URLs in `render.yaml`:

- frontend `VITE_API_URL`
- backend `DJANGO_ALLOWED_HOSTS`
- backend `CORS_ALLOWED_ORIGINS`
- backend `CSRF_TRUSTED_ORIGINS`
- backend `FRONTEND_URL`

### Вариант 2: Manual Render setup

Backend web service:

- Root directory: `mahjong/backend`
- Runtime: Python
- Build command: `./build.sh`
- Pre-deploy command: `python manage.py migrate`
- Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- Health check path: `/api/health`

Backend environment:

```bash
DJANGO_SECRET_KEY=strong-random-secret
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=mahjong-focus-api.onrender.com
DATABASE_URL=postgresql://...
CORS_ALLOW_ALL_ORIGINS=false
CORS_ALLOWED_ORIGINS=https://mahjong-focus.onrender.com
CSRF_TRUSTED_ORIGINS=https://mahjong-focus.onrender.com
FRONTEND_URL=https://mahjong-focus.onrender.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Frontend static site:

- Root directory: `mahjong/frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Rewrite rule: `/* -> /index.html`

Frontend environment:

```bash
VITE_API_URL=https://mahjong-focus-api.onrender.com/api
```

## Запуск локально

### Backend

```bash
cd mahjong/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### Supabase Database

1. Create a Supabase project.
2. Open Project Settings -> Database -> Connection string.
3. Copy the pooled Postgres URI and put it in `backend/.env` as `DATABASE_URL`.

Example:

```bash
cd mahjong/backend
cp .env.example .env
```

Then edit `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

Run migrations. Django automatically reads `backend/.env` if it exists:

```bash
python manage.py migrate
```

If `DATABASE_URL` is not set, Django uses local `backend/db.sqlite3`.

### Frontend

```bash
cd mahjong/frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://127.0.0.1:8000/api`
