# Coolify Deployment

Use the existing `DBKU Career Portal` project and the `production` environment.

## 1. PostgreSQL

Create a PostgreSQL resource in Coolify and keep the default PostgreSQL 18 image.

Suggested values:

- Name: `dbku-career-postgres`
- Database: `dbku_career_portal`
- Username: `dbku_portal`

Copy the internal database URL from Coolify after creation. The backend uses it as `DATABASE_URL`.

## 2. Backend

Create an application from the GitHub repository:

- Repository: `Amirul-url/DBKU-Career-Portal`
- Branch: `main`
- Base directory: `/backend`
- Build pack: Dockerfile
- Port: `8000`

Environment variables:

```env
DEBUG=False
USE_SQLITE=False
SECRET_KEY=replace-with-a-long-random-secret
DATABASE_URL=postgres://dbku_portal:password@postgres-host:5432/dbku_career_portal
ALLOWED_HOSTS=backend-domain.example.com
CORS_ALLOWED_ORIGINS=https://frontend-domain.example.com
CSRF_TRUSTED_ORIGINS=https://frontend-domain.example.com,https://backend-domain.example.com
FRONTEND_URL=https://frontend-domain.example.com
JWT_ACCESS_TOKEN_HOURS=8
JWT_REFRESH_TOKEN_MINUTES=480
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_SSL_REDIRECT=False
SECURE_HSTS_SECONDS=0
NOTIFICATION_SIDE_EFFECTS_ENABLED=False
NOTIFICATION_EMAIL_ENABLED=False
WHATSAPP_ENABLED=False
```

Add persistent storage for uploaded files:

- Container path: `/app/media`

The backend container runs migrations and `collectstatic` automatically on startup.

## 3. Frontend

Create another application from the same GitHub repository:

- Repository: `Amirul-url/DBKU-Career-Portal`
- Branch: `main`
- Base directory: `/frontend`
- Build pack: Dockerfile
- Port: `80`

Build variable:

```env
VITE_API_URL=https://backend-domain.example.com/api
```

Set the frontend domain first if possible. If the generated or custom backend domain changes, update `VITE_API_URL` and redeploy the frontend.

## 4. First Admin Account

After backend deployment is healthy, open the backend terminal in Coolify and run:

```sh
python manage.py createsuperuser
```

Use the created account to sign in to the Django admin or the portal superadmin area.
