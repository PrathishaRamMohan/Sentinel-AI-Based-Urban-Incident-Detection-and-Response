# SENTINEL · Urban Incident Detection & Response

AI-Powered Multi-Source Urban Incident Detection and Emergency Response System.

## Architecture

```
project/
├── src/                        # React + Vite + Tailwind frontend
│   ├── pages/                  # Route-level pages (Landing, Citizen, ControlRoom)
│   ├── components/             # Reusable UI components
│   ├── context/AuthContext.tsx # Citizen auth state
│   ├── hooks/                  # Supabase realtime hooks
│   └── lib/                    # API client, Supabase client, utilities
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── config.py           # Environment-based settings
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models.py           # ORM models (User, Incident, CitizenReport, Evidence)
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── auth.py             # Password hashing & JWT
│   │   └── routers/            # API route handlers
│   ├── tests/                  # Pytest backend tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── Dockerfile                  # Frontend Docker
└── .env                        # Frontend environment (VITE_ vars)
```

## Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL with PostGIS (or use the included Supabase project)

## Running the Frontend

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Running the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

# Start the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API runs at `http://localhost:8000` with interactive docs at `/docs`.

## Running with Docker

```bash
docker-compose up --build
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:8000`

## Running Backend Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register a citizen account |
| POST | `/api/v1/auth/login` | Login and receive JWT |
| POST | `/api/v1/citizen-reports` | Submit a citizen incident report |
| POST | `/api/v1/citizen-reports/with-evidence` | Submit report with file uploads |
| GET | `/api/v1/citizen-reports/{id}` | Retrieve a specific report |
| GET | `/api/v1/incidents` | List all incidents |
| GET | `/api/v1/incidents/{id}` | Retrieve a specific incident |
| GET | `/api/v1/health` | Health check |

## Frontend Routes

| Path | Description |
|------|-------------|
| `/` | Landing page with citizen/control room access |
| `/citizen/login` | Citizen sign-in |
| `/citizen/register` | Citizen account creation |
| `/citizen/report` | Emergency reporting with geolocation + Leaflet map |
| `/control-room` | Operator dashboard (existing incident management UI) |

## Environment Variables

### Frontend (`.env`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_API_BASE_URL` — FastAPI backend URL (default: `http://localhost:8000`)

### Backend (`backend/.env`)
- `DATABASE_URL` — Supabase session-pooler PostgreSQL connection string
- `SECRET_KEY` — local fallback JWT secret; use a long random value
- `CORS_ORIGINS` — frontend origin, normally `http://localhost:5173`
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — backend-only service role key; never expose it to the frontend
- `SUPABASE_JWT_SECRET` — Supabase JWT secret used to verify access tokens
- `SUPABASE_STORAGE_BUCKET` — Storage bucket name, normally `incident-evidence`

Run all SQL files in `supabase/migrations/` before starting the backend. The final migration creates the public evidence bucket used by report uploads.
