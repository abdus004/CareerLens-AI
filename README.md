# CareerLens AI

CareerLens AI is an AI-assisted career-preparation platform for students and job seekers. It brings profile and resume analysis, career recommendations, learning paths, assessments, mock interviews, certificates, placement drives, and job opportunities into one application.

## Features

- Account registration, email-confirmation-aware sign-in, and session management.
- Profile setup and account settings, including resume and avatar management.
- Resume analysis, skill analysis, and career intelligence recommendations.
- Personalized learning paths and job recommendations.
- Mock interviews with chat and voice modes.
- Timed skill assessments, answer review, and certificates for eligible results.
- User-uploaded and recommended certifications.
- Placement drives, notifications, and help/support features.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | FastAPI, Uvicorn, Pydantic |
| Authentication and data | Supabase Auth, Database, and Storage |
| AI | Google Gemini |
| Testing | Pytest, Vitest, React Testing Library |

## Architecture

The React single-page application in `frontend/` calls the FastAPI API in `backend/` through `VITE_API_URL`.

FastAPI validates Supabase access tokens before user-owned operations. Supabase provides authentication, persistence, and storage. Gemini powers AI-dependent analysis and guidance features.

The frontend stores a signed-in session in `localStorage` when **Remember Me** is selected and otherwise in `sessionStorage`. It refreshes expiring sessions through the backend, coordinates token rotation between browser tabs, retries eligible expired-session API requests once, and protects authenticated routes.

## Prerequisites

- Node.js and npm
- Python 3.12 or a compatible Python version
- A Supabase project with the required schema, Auth configuration, and Storage buckets
- One or more Gemini API keys for AI-enabled features

## Frontend setup

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env` and set the API URL for the environment:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

## Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment, then install dependencies:

```bash
pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and provide the required values. Do not commit the resulting local `.env` file.

Run the API locally:

```bash
uvicorn app.main:app --reload
```

## Environment configuration

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL for the FastAPI backend. |

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_KEY` | Yes | Server-side Supabase key used by the backend. Keep secret. |
| `GEMINI_API_KEY_1`–`GEMINI_API_KEY_6` | Yes for AI features | Gemini API keys used by AI-powered features. Keep secret. |
| `FRONTEND_ORIGINS` | No | Comma-separated additional allowed frontend origins for CORS. |

Use the checked-in `.env.example` files as templates. They contain placeholders only.

## Testing and quality checks

Backend tests:

```bash
cd backend
python -m pytest tests -q --disable-warnings
python -m compileall -q app tests
```

Frontend tests and checks:

```bash
cd frontend
npm test
npm run lint
npm run build
```

## Authentication and session management

- The backend classifies invalid credentials, unconfirmed accounts, rate limits, token expiry, and Supabase service failures separately.
- `POST /auth/refresh` rotates a refresh token using an isolated Supabase Auth client.
- `POST /auth/logout` revokes only the current session with Supabase local logout scope.
- Axios adds the current access token, refreshes eligible expired-session responses once, and does not retry authentication or destructive account endpoints.
- Protected routes restore the stored session before rendering user-only pages.

## Deployment prerequisites

- Set `VITE_API_URL` in the frontend deployment environment to the public HTTPS backend URL.
- Configure the backend with the required Supabase and Gemini variables.
- Add deployed frontend origins through `FRONTEND_ORIGINS` when they are not already covered by the backend defaults.
- Apply the repository migrations and seed data required by the target environment before enabling dependent features.

## Security notes

- Never commit `.env` files, Supabase keys, Gemini keys, access tokens, or refresh tokens.
- Keep production and test Supabase projects separate.
- Do not run destructive account endpoints against production during local testing.
