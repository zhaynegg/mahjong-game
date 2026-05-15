# Mahjong Focus (Django + React)

Modern Mahjong Solitaire web platform built with scalable architecture: Django backend and React frontend.

Live Demo: https://mahjong-focus.onrender.com
## User and pro user creation
There is a pro user with username - "zhassyn" and password - "123456".
But if you decide to create your own pro user. There is "upgrade to pro" button in the menu. Card number should to be 4242 4242 4242 4242. Other credentials can be written randomly.
### PLEASE NOTE THAT AUTHORIZATION AND AUTHENTIFICATION may take some time
## Key features

- Interactive tile layout
- Manual tile selection
- Mahjong rule validation
- Score system
- Timer and move counter
- Shuffle functionality
- Multiple layouts by difficulty
- Layout generator by difficulty
- User authentication (register/login)
- Persistent progress and match history
- Dark/light theme support
- Hint system + undo moves
- Responsive interface
- Daily Challenge with shared global layout
- AI Coach for strategy assistance
- Social layer:
  - daily leaderboard
  - city rankings
- Monetization-ready architecture:
  - Upgrade to Pro flow
  - future premium skins/subscription support

## Product Vision

Mahjong Focus is designed for short focus sessions and long-term player retention.

Core engagement systems include:

- daily challenges that encourage return sessions
- leaderboards and city rankings for social motivation
- AI-assisted hints that reduce frustration for beginners
- scalable architecture prepared for future expansion:
  - tournaments
  - premium cosmetics
  - subscriptions
  - community features

## Screenshots

### Home Screen

<img width="1445" height="787" alt="image" src="https://github.com/user-attachments/assets/862c1bfb-6284-437e-8e0a-0c3032273d00" />

### Gameplay

<img width="1449" height="785" alt="image" src="https://github.com/user-attachments/assets/46c16a30-9fad-4141-be78-43a072d99e99" />

### Layout Builder

<img width="1449" height="799" alt="image" src="https://github.com/user-attachments/assets/26d8bd2c-4cf3-436b-8a4d-6f26244eb4b2" />

### Layout sharing page

<img width="1456" height="830" alt="image" src="https://github.com/user-attachments/assets/8ad82eda-baec-44a8-9403-5e68fe318422" />


## Stack

- Backend: Django + SQLite locally, Supabase Postgres when `DATABASE_URL` is set
- Frontend: React + Vite

## Deploy on Render

Project was set for Render Blueprint. The root of repository has `render.yaml`, which creates:

- `mahjong-focus-api` — Django backend web service
- `mahjong-focus` — React/Vite static site
- `mahjong-focus-db` — Render Postgres

### 1: Blueprint

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

### 2: Manual Render setup

Backend web service:

- Root directory: `mahjong/backend`
- Runtime: Python
- Build command: `./build.sh`
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

## Local development

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
