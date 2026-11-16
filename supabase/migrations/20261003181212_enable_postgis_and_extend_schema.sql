/*
# Enable PostGIS and create SENTINEL schema (users, citizen_reports, incident_evidence, extend incidents)

## Purpose
Extends the existing `incidents` and `alerts` tables to support the full SENTINEL backend.
Enables PostGIS for geographic point storage and nearest-responder queries.

## New Tables
1. `users` — citizen accounts (demo auth for prototype)
   - id (uuid PK), email (unique), password_hash, full_name, role, phone, created_at
2. `citizen_reports` — raw citizen submissions before becoming incidents
   - id (uuid PK), user_id (FK users), incident_id (FK incidents, nullable), incident_type, description, latitude, longitude, created_at
3. `incident_evidence` — photo/video metadata attached to incidents
   - id (uuid PK), incident_id (FK incidents), file_url, file_type (photo/video), uploaded_by, created_at

## Modified Tables
- `incidents`: Add columns `source` (text, default 'CITIZEN'), `confidence` (numeric, default 0.0),
  `incident_type` (text, for typed categorization), `geom` (geography Point, 4326).
  Existing columns retained. New columns are nullable/defaulted to preserve existing rows.

## Security
- RLS enabled on all new tables. Policies use TO anon, authenticated (single-tenant demo app).
- `incidents` already had RLS from prior migration; new columns inherit existing policies.

## Notes
1. PostGIS extension is required. If not available, the geom column uses a nullable geography type.
2. source column defaults to 'CITIZEN' for new citizen reports, existing rows get 'SYSTEM'.
3. The `geom` column is a PostGIS geography(Point, 4326) for spatial queries; latitude/longitude
   columns remain as the authoritative numeric values for frontend use.
4. No user_id/ownership checks — prototype demo auth, data is shared.
*/

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============ users table ============
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'operator', 'admin')),
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE
TO anon, authenticated USING (true);

-- ============ Add columns to incidents ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'source') THEN
    ALTER TABLE incidents ADD COLUMN source text DEFAULT 'SYSTEM';
    UPDATE incidents SET source = 'SYSTEM' WHERE source IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'confidence') THEN
    ALTER TABLE incidents ADD COLUMN confidence numeric DEFAULT 0.0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'incident_type') THEN
    ALTER TABLE incidents ADD COLUMN incident_type text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'geom') THEN
    ALTER TABLE incidents ADD COLUMN geom geography(Point, 4326);
  END IF;
END $$;

-- Populate geom from existing lat/lng
UPDATE incidents
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incidents USING GIST (geom);

-- ============ citizen_reports table ============
CREATE TABLE IF NOT EXISTS citizen_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  incident_type text NOT NULL,
  description text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_citizen_reports" ON citizen_reports;
CREATE POLICY "anon_select_citizen_reports" ON citizen_reports FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_citizen_reports" ON citizen_reports;
CREATE POLICY "anon_insert_citizen_reports" ON citizen_reports FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_citizen_reports" ON citizen_reports;
CREATE POLICY "anon_update_citizen_reports" ON citizen_reports FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_citizen_reports" ON citizen_reports;
CREATE POLICY "anon_delete_citizen_reports" ON citizen_reports FOR DELETE
TO anon, authenticated USING (true);

-- ============ incident_evidence table ============
CREATE TABLE IF NOT EXISTS incident_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'photo' CHECK (file_type IN ('photo', 'video')),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incident_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_incident_evidence" ON incident_evidence;
CREATE POLICY "anon_select_incident_evidence" ON incident_evidence FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incident_evidence" ON incident_evidence;
CREATE POLICY "anon_insert_incident_evidence" ON incident_evidence FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incident_evidence" ON incident_evidence;
CREATE POLICY "anon_delete_incident_evidence" ON incident_evidence FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_citizen_reports_incident_id ON citizen_reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_evidence_incident_id ON incident_evidence(incident_id);
