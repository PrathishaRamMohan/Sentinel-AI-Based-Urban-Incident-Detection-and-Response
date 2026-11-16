# Sentinel-AI-Based-Urban-Incident-Detection-and-Response
Built a platform that detects road accidents from CCTV footage using a fine-tuned YOLOv8n model and automatically routes each incident to the responsible police station, with a real-time dashboard for human oversight.

# 🚨 SENTINEL: Intelligent Urban Incident Detection and Response

**An AI-powered, multi-source platform that detects road accidents from CCTV footage, collects location-tagged citizen reports, and gives control room operators a single real-time view of every incident.**

> Phase I project for **AI19711**, B.Tech Artificial Intelligence and Machine Learning, Rajalakshmi Engineering College, Chennai.

---

## The Problem

Cities rely on CCTV cameras and citizen reports, but the two rarely work together:

- Most CCTV footage is only reviewed *after* an incident, and operators cannot watch hundreds of feeds at once.
- Citizen reports arrive by phone with unclear locations and must be forwarded manually to the responsible police station.
- Camera evidence, citizen reports and responder information live in separate places, so no one has the full picture.

For road accidents, these gaps add critical minutes before help arrives.

## The Solution

SENTINEL connects four things into one workflow:

1. **CCTV video analytics:** a fine-tuned YOLO object detector recognises accident scenes in video.
2. **Citizen reporting:** a web app captures the incident type, description, photo or video evidence and the reporter's exact location (GPS or map pin).
3. **Geospatial storage:** every incident is stored as a PostGIS point for location-based queries.
4. **Control room dashboard:** operators see incidents, alerts and response status update in real time and keep the final decision, so a human stays in the loop.

The project supports UN SDG 9 (Industry, Innovation and Infrastructure), SDG 11 (Sustainable Cities and Communities) and SDG 16 (Peace, Justice and Strong Institutions).

## Features

**Accident detection (CCTV)**
- YOLO-based `AccidentDetector` that classifies scenes as `Accident` or `Non Accident`
- Frame skipping (about 1 in 15 frames) to keep up with live video on modest hardware
- Confidence threshold and a **five-minute per-camera cooldown** so one accident does not raise repeated alerts
- Safety check that refuses to load any model without an `Accident` class, so a generic COCO model can never raise false accident alerts
- MJPEG stream endpoint for browser viewing, plus a standalone script that annotates saved footage

**Citizen reporting**
- Sign-up and sign-in with Supabase Authentication
- Five incident types: Road Accident, Possible Physical Altercation, Medical Emergency, Fire, Other
- Location from the browser Geolocation API, with an interactive Leaflet map to place or adjust a pin
- Optional photo and video evidence uploaded to Supabase Storage (size-limited, type-checked)
- Each report creates a linked incident, stored with a PostGIS point

**Control room**
- Live incident map, statistics bar and alerts feed
- Real-time updates through Supabase Realtime, with no page refresh needed
- Response Tracker that moves each incident through **Reported → Dispatched → En Route → On Scene → Resolved**

**Engineering**
- Versioned SQL migrations, Docker and Docker Compose setup, and a Pytest backend test suite

## Architecture

```
 CCTV / test videos ──► OpenCV + YOLO detector ──┐
                                                  ▼
 Citizen web app ───────────────────────────► FastAPI backend ──► Supabase
 (React, Leaflet, GPS)                        (SQLAlchemy,         PostgreSQL + PostGIS
                                               GeoAlchemy2)        Auth · Storage · Realtime
                                                                          │
                                                                          ▼
                                                              Control room dashboard
                                                              (live map, alerts, tracker)
```

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, React Leaflet |
| Backend | Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic, GeoAlchemy2 |
| Database and cloud | Supabase: PostgreSQL with PostGIS, Auth, Realtime, Storage |
| Machine learning | Ultralytics YOLO (YOLOv8n, YOLO26n), OpenCV, PyTorch |
| Deployment | Docker, Docker Compose |

## Accident Detection Model

**Dataset:** Roboflow "Car Accident" dataset (v1, CC BY 4.0), exported in YOLO format and resized to 640×640. Two classes: `Accident` and `Non Accident`.

| Split | Images | Accident boxes | Non Accident boxes |
|---|---|---|---|
| Train | 6,803 | 7,697 | 3,476 |
| Validation | 650 | 717 | 312 |
| Test | 328 | 367 | 168 |

The original labels were oriented bounding boxes, converted to axis-aligned YOLO format with `backend/convert_obb_to_yolo.py`.

**Training:** transfer learning from COCO-pretrained YOLOv8n (about 3 million parameters, 6.25 MB), 50 epochs, batch size 16, image size 640, Ultralytics augmentation.

**Results on the validation split**

| Metric | Score |
|---|---|
| Precision | 0.941 |
| Recall | 0.908 |
| mAP@50 | 0.951 |
| mAP@50-95 | 0.771 |

Per class, 681 of 717 Accident objects (recall 0.950) and 295 of 312 Non Accident objects (recall 0.946) were detected, and only 9 of 985 matched objects received the wrong class. The F1-confidence curve peaks at **0.92 at a confidence of about 0.66** and stays flat across a wide range, so performance does not depend on a very precise threshold.

The newer **YOLO26n** (end-to-end, no NMS step, built for edge devices) has been initialised on the same dataset. Evaluation on the 328-image test split and the YOLOv8n versus YOLO26n comparison are planned next.

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- A [Supabase](https://supabase.com) project (PostgreSQL with PostGIS, Auth, Storage and Realtime)

### 1. Clone

```bash
git clone https://github.com/PrathishaRamMohan/sentinel.git
cd sentinel
```

### 2. Set up the database

Run every SQL file in `supabase/migrations/` in order in the Supabase SQL editor. They create the `incidents`, `alerts`, `users`, `citizen_reports` and `incident_evidence` tables, enable PostGIS, and create the public `incident-evidence` storage bucket.

### 3. Configure environment variables

**Frontend**, in `.env` at the project root:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000
```

**Backend**, in `backend/.env`:

```
DATABASE_URL=your-supabase-postgres-connection-string
SECRET_KEY=a-long-random-value
CORS_ORIGINS=http://localhost:5173
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_STORAGE_BUCKET=incident-evidence
```

> ⚠️ The service-role key is backend-only. Never expose it in the frontend or commit it. `.env` files are already git-ignored. URL-encode any special characters in the database password.

### 4. Add the trained accident model

Place the fine-tuned accident detector at `backend/weights/best.pt`. It must contain the classes `Accident` and `Non Accident`. If the file is missing or is a generic COCO model, the CCTV endpoint is disabled and returns `503` instead of producing incorrect alerts.

To train your own model, extract the dataset under `backend/data/` (with a `data.yaml`) and run:

```bash
python backend/train_accident_model.py --model yolov8n.pt --device 0     # NVIDIA GPU
python backend/train_accident_model.py --model yolov8n.pt --device cpu   # CPU (slow)
```

Training writes the best checkpoint to `backend/weights/accident_yolov8n/weights/best.pt`. Copy it to `backend/weights/best.pt` once you have confirmed its classes.

### 5. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API runs at http://localhost:8000, with interactive docs at `/docs`.

### 6. Run the frontend

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

### Or run everything with Docker

```bash
docker-compose up --build
```

Frontend: http://localhost:5173 · Backend: http://localhost:8000

## Usage

| Route | Description |
|---|---|
| `/` | Landing page with citizen and control room access |
| `/citizen/register`, `/citizen/login` | Citizen account creation and sign-in |
| `/citizen/report` | Report an incident with automatic location and optional evidence |
| `/control-room` | Operator dashboard: map, statistics, alerts feed and response tracker |

**Run the detector on a video file**

```bash
python backend/predict_accidents.py path/to/cctv_test.mp4 \
  --weights backend/weights/accident_yolov8n/weights/best.pt
```

An annotated video is saved to `backend/runs/detect/accident_footage/`.

**Stream a camera or video through the API**

```
GET /api/v1/cctv/stream/{camera_id}?url=/absolute/path/to/video.mp4
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a citizen account |
| POST | `/api/v1/auth/login` | Log in and receive a JWT |
| POST | `/api/v1/citizen-reports` | Submit a citizen incident report |
| POST | `/api/v1/citizen-reports/with-evidence` | Submit a report with photo or video uploads |
| GET | `/api/v1/citizen-reports/{id}` | Retrieve a report |
| GET | `/api/v1/incidents` | List incidents (filter by `status` and `source`) |
| GET | `/api/v1/incidents/{id}` | Retrieve an incident |
| GET | `/api/v1/cctv/stream/{camera_id}` | MJPEG stream with accident detection |
| GET | `/api/v1/health` | API and database health check |

## Tests

```bash
cd backend
pytest tests/ -v
```

Database-dependent tests need a working `DATABASE_URL`.

## Project Structure

```
sentinel/
├── src/                        # React + Vite + Tailwind frontend
│   ├── pages/                  # Landing, citizen login/register/report, control room
│   ├── components/             # Map, stats bar, alerts feed, response tracker, report form
│   ├── context/AuthContext.tsx # Supabase Auth session
│   ├── hooks/                  # Supabase Realtime hooks (incidents, alerts)
│   └── lib/                    # API client, Supabase client, utilities
├── backend/
│   ├── app/                    # FastAPI app: routers, models, schemas, auth, detector service
│   ├── tests/                  # Pytest tests
│   ├── train_accident_model.py # Train the YOLO accident detector
│   ├── predict_accidents.py    # Run the detector on a video file
│   ├── convert_obb_to_yolo.py  # Convert oriented boxes to YOLO format
│   └── weights/                # Model weights (best.pt)
├── supabase/migrations/        # SQL schema, PostGIS and storage bucket
├── docker-compose.yml
└── Dockerfile
```

## Roadmap

- **Police station routing:** store station locations and coverage perimeters, assign each incident to the station whose perimeter contains it, with a nearest-station fallback, using PostGIS
- **End-to-end CCTV integration:** create an incident and alert automatically for every confirmed detection, and draw bounding boxes on the streamed video
- Evaluate YOLOv8n and YOLO26n on the 328-image test split and on real CCTV footage, then choose the deployment model
- Tracking (ByteTrack) to confirm accidents across frames and tell crashes from stopped vehicles
- Role-based access for operators and police stations, with audit logs of status changes
- Report to the nearest ambulance service, fire station and hospital, depending on incident type
- Map-based control room with camera locations and station boundaries
- Edge deployment (ONNX or TensorRT), a mobile app with an SOS shortcut and regional language support, and accident hotspot analysis

## Team

- **Prathisha R** (2116231501119)
- **Preethi G** (2116231501122)
- **Supraja R** (2116231501164)

Guided by **Mr. V. Vijayabhaskar**, Assistant Professor (SG), Department of Artificial Intelligence and Machine Learning, Rajalakshmi Engineering College, Chennai.

## Acknowledgements

- [Roboflow Universe](https://universe.roboflow.com/nta-hiqre/car-accident-zbvjc) for the Car Accident dataset (CC BY 4.0)
- [Ultralytics](https://github.com/ultralytics/ultralytics) for the YOLO framework
- Supabase, PostGIS, FastAPI and OpenStreetMap
