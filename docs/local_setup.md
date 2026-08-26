# Local Setup

The project uses separate frontend and backend env files.

## Backend

- Copy `backend/.env.example` to `backend/.env` if needed.
- Local default database is SQLite.
- API base path is `/api`.
- Email delivery uses Brevo when enabled. Set `BREVO_API_KEY`,
  `BREVO_SENDER_NAME`, and a verified `BREVO_SENDER_EMAIL` in `backend/.env`,
  then set `NOTIFICATION_EMAIL_ENABLED=True`.

### Windows

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Linux/macOS

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### PostgreSQL Optional

Set `DATABASE_URL` in `backend/.env` to use PostgreSQL instead of SQLite:

```env
DATABASE_URL=postgres://dbku_portal:change-me@127.0.0.1:5432/dbku_career_portal
```

## Frontend

- Copy `frontend/.env.example` to `frontend/.env` if needed.
- `VITE_API_URL` should point to the backend API.

The frontend commands are the same on Windows and Linux/macOS:

```bash
cd frontend
npm ci
npm run dev
```
