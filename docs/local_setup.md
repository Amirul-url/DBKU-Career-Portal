# Local Setup

The project uses separate frontend and backend env files.

## Backend

- Copy `backend/.env.example` to `backend/.env` if needed.
- Local default database is SQLite.
- API base path is `/api`.
- Email delivery uses Brevo when enabled. Set `BREVO_API_KEY`,
  `BREVO_SENDER_NAME`, and a verified `BREVO_SENDER_EMAIL` in `backend/.env`,
  then set `NOTIFICATION_EMAIL_ENABLED=True`.

## Frontend

- Copy `frontend/.env.example` to `frontend/.env` if needed.
- `VITE_API_URL` should point to the backend API.
