# SENTINEL Project Status

Last updated: 2026-10-04

## Project Summary

SENTINEL is an urban incident detection and emergency response application with:

- React, Vite, TypeScript, and Tailwind frontend
- FastAPI Python backend
- Supabase PostgreSQL, Auth, Realtime, and Storage integration
- Leaflet-based incident maps
- YOLO-based CCTV accident analysis

## Current Architecture

### Frontend

The frontend is in `src/` and runs with Vite.

Important paths:

- `src/pages/` - landing, citizen login, registration, reporting, and control room pages
- `src/context/AuthContext.tsx` - Supabase Auth session management
- `src/lib/supabase.ts` - Supabase browser client
- `src/lib/api.ts` - FastAPI API client with Supabase access-token headers
- `src/hooks/useIncidents.ts` - Supabase incident queries and Realtime subscriptions
- `src/hooks/useAlerts.ts` - Supabase alert queries and Realtime subscriptions

Authentication now uses Supabase Auth:

- `supabase.auth.signUp()`
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signOut()`

### Backend

The backend is in `backend/` and uses FastAPI, SQLAlchemy, PostgreSQL/PostGIS, and Supabase services.

Important paths:

- `backend/app/main.py` - FastAPI application
- `backend/app/config.py` - environment configuration
- `backend/app/database.py` - SQLAlchemy database engine
- `backend/app/auth.py` - Supabase JWT validation and local user synchronization
- `backend/app/models.py` - database models
- `backend/app/routers/` - API endpoints
- `backend/app/services/detector.py` - CCTV accident detector
- `backend/train_accident_model.py` - model training command
- `backend/predict_accidents.py` - video inference command
- `backend/convert_obb_to_yolo.py` - OBB label conversion utility

## Supabase Integration

Supabase is used for:

- PostgreSQL database
- Supabase Auth
- Realtime incident and alert updates
- Supabase Storage for evidence uploads

The database migrations are in `supabase/migrations/`.

The migrations create:

- `incidents`
- `alerts`
- `users`
- `citizen_reports`
- `incident_evidence`
- PostGIS support
- `incident-evidence` Storage bucket

Required environment files:

- Root `.env` for frontend values
- `backend/.env` for backend values

Never expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend or commit it to source control. Because the key was previously displayed during debugging, it should be rotated in Supabase and replaced locally.

The backend database URL must not contain literal square brackets around the password. Special characters in a password must be URL-encoded.

## Dataset Integration

The accident dataset is integrated at:

```text
backend/data/
├── data.yaml
├── train/
│   ├── images/
│   └── labels/
├── valid/
│   ├── images/
│   └── labels/
└── test/
    ├── images/
    └── labels/
```

Current dataset counts:

- Train: 6,803 images and 6,803 labels
- Validation: 650 images and 650 labels
- Test: 328 images and 326 labels

The two additional test images without label files may be unlabeled negative examples. They should be reviewed before relying on test metrics.

`backend/data/data.yaml` defines:

```yaml
path: backend/data
train: train/images
val: valid/images
test: test/images
names:
  0: Accident
  1: Non Accident
```

The labels currently contain standard YOLO detection rows with five fields, so OBB conversion is not required for the integrated copy.

## Model Status

### Existing model

`backend/weights/best.pt` exists, but it is the wrong model for accident detection. It contains 80 standard COCO classes such as `person`, `car`, and `bicycle`.

It must not be used for accident alerts.

The detector was changed to reject any model that does not contain an `Accident` class. This prevents the old COCO checkpoint from incorrectly treating `person` detections as accidents.

### Training output

Training was started with:

```bash
backend/venv/bin/python backend/train_accident_model.py --device cpu
```

The dataset loaded successfully and training reached approximately 83% of epoch 1 before it was intentionally stopped.

The interrupted run created preliminary files under:

```text
backend/weights/accident_yolov8n/
```

Those files include training plots and configuration, but no trained checkpoint was created:

```text
backend/weights/accident_yolov8n/weights/best.pt
```

is currently missing.

The trained model is therefore not ready for CCTV use yet.

## Training Workflow

Start training from the project root:

```bash
backend/venv/bin/python backend/train_accident_model.py --device cpu
```

On a supported GPU, use:

```bash
backend/venv/bin/python backend/train_accident_model.py --device 0
```

On Apple Silicon, MPS may be tested with:

```bash
backend/venv/bin/python backend/train_accident_model.py --device mps
```

Do not start a second training process while one is running.

The training script uses:

- `yolo26n.pt`
- 50 epochs
- 640 image size
- batch size 16
- patience 15
- `backend/data/data.yaml`

After training, the expected checkpoint is:

```text
backend/weights/accident_yolov8n/weights/best.pt
```

Verify its classes:

```bash
backend/venv/bin/python - <<'PY'
from ultralytics import YOLO

model = YOLO("backend/weights/accident_yolov8n/weights/best.pt")
print(model.names)
PY
```

Expected output:

```text
{0: 'Accident', 1: 'Non Accident'}
```

## Test Evaluation

After training, evaluate the held-out test split:

```bash
backend/venv/bin/python - <<'PY'
from ultralytics import YOLO

model = YOLO("backend/weights/accident_yolov8n/weights/best.pt")
metrics = model.val(
    data="backend/data/data.yaml",
    split="test",
    imgsz=640,
    device="cpu",
)
print("mAP50:", metrics.box.map50)
print("mAP50-95:", metrics.box.map)
PY
```

The validation split contains 650 images. The test split should be treated carefully because it contains two more images than label files.

## CCTV Inference

Run the standalone footage detector after training:

```bash
backend/venv/bin/python backend/predict_accidents.py path/to/cctv_test.mp4 \
  --weights backend/weights/accident_yolov8n/weights/best.pt
```

The annotated output is saved under:

```text
backend/runs/detect/accident_footage/
```

The FastAPI CCTV stream endpoint is:

```text
GET /api/v1/cctv/stream/{camera_id}?url=/absolute/path/to/video.mp4
```

The endpoint currently streams annotated MJPEG frames and applies a five-minute per-camera alert cooldown.

Before using the endpoint, update `backend/app/services/detector.py` to load the newly trained checkpoint instead of the old `backend/weights/best.pt`, or replace the old file only after confirming the new checkpoint contains the two accident classes.

## Application Validation

Frontend checks that passed:

```bash
npm run typecheck
npm run lint
```

Python syntax checks passed for the backend model scripts and CCTV files.

The backend can import successfully when optional CCTV dependencies are installed. If the accident checkpoint is incompatible, the CCTV feature is disabled instead of silently generating incorrect alerts.

Backend tests are present under `backend/tests/`, but database-dependent tests require a working `DATABASE_URL`.

## Recommended Next Steps

1. Restart training with the correct device. CPU training is very slow; try `--device mps` on Apple Silicon if supported.
2. Wait for `backend/weights/accident_yolov8n/weights/best.pt` to be created.
3. Verify the checkpoint contains `Accident` and `Non Accident`.
4. Run test-split evaluation and record mAP50 and mAP50-95.
5. Run `predict_accidents.py` on a real CCTV footage file.
6. Point the backend detector at the verified checkpoint.
7. Fix and verify the Supabase PostgreSQL `DATABASE_URL`.
8. Rotate the exposed Supabase service-role key.
9. Start FastAPI and verify `/api/v1/health` returns `database: ok`.
10. Test Supabase Auth login, citizen reports, Storage uploads, Realtime incidents, and the control room together.
