# DBKU Job and Internship Portal

A local-first job and internship portal using the same stack pattern as dbku-fasTrack.

## Structure

- `backend/` - Django REST API
- `frontend/` - React/Vite frontend
- `docs/` - Project notes

## Local Development

Backend runs at `http://127.0.0.1:8000`.
Frontend runs at `http://localhost:5173`.

## Database

Local development uses PostgreSQL. Create a local role and database, set `DATABASE_URL` in `backend/.env`, then run Django migrations:

```powershell
$env:PGPASSWORD="postgres"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "CREATE ROLE dbku_portal LOGIN PASSWORD 'change-me';"
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -h 127.0.0.1 -U postgres -O dbku_portal dbku_career_portal
```

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py migrate
```
