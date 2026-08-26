# DBKU Job and Internship Portal

A local-first job and internship portal using the same stack pattern as dbku-fasTrack.

## Structure

- `backend/` - Django REST API
- `frontend/` - React/Vite frontend
- `docs/` - Project notes and Mermaid process flows

## Documentation

- [Permohonan Latihan Industri flow](docs/permohonan-li-flow.md)
- [Permohonan Jawatan DBKU flow](docs/permohonan-jawatan-dbku-flow.md)

The flow documents describe applicant, HRM, department, notification, status, and access-control workflows using Mermaid diagrams.

## Local Development

The project supports Windows and Linux/macOS local development.

Backend runs at `http://127.0.0.1:8000`.
Frontend runs at `http://localhost:5173`.

### Backend

Copy the backend environment file when needed:

```powershell
Copy-Item backend/.env.example backend/.env
```

```bash
cp backend/.env.example backend/.env
```

Create and activate a Python virtual environment:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend

Copy the frontend environment file when needed:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

```bash
cp frontend/.env.example frontend/.env
```

Install dependencies and start Vite:

```powershell
cd frontend
npm ci
npm run dev
```

```bash
cd frontend
npm ci
npm run dev
```

## Database

Local development defaults to SQLite when `DATABASE_URL` is not set. PostgreSQL is supported on both Windows and Linux by setting `DATABASE_URL` in `backend/.env`:

```env
DATABASE_URL=postgres://dbku_portal:change-me@127.0.0.1:5432/dbku_career_portal
```

Windows PostgreSQL example:

```powershell
$env:PGPASSWORD="postgres"
psql -h 127.0.0.1 -U postgres -d postgres -c "CREATE ROLE dbku_portal LOGIN PASSWORD 'change-me';"
createdb -h 127.0.0.1 -U postgres -O dbku_portal dbku_career_portal
```

Linux PostgreSQL example:

```bash
sudo -u postgres psql -c "CREATE ROLE dbku_portal LOGIN PASSWORD 'change-me';"
sudo -u postgres createdb -O dbku_portal dbku_career_portal
```

After changing database settings, run migrations again:

```bash
cd backend
python manage.py migrate
```
