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

## Запуск локально

### Backend

```bash
cd backend
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
cd backend
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
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://127.0.0.1:8000/api`
