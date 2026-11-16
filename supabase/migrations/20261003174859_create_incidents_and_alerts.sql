/*
# Create incidents and alerts tables for SENTINEL urban incident dashboard

1. New Tables
- `incidents`: Records of urban emergencies (fire, accident, crime, medical, hazmat, etc.)
  - id (uuid PK)
  - type (text, not null) — incident category
  - location_name (text, not null) — human-readable address/area
  - latitude (numeric) — map latitude
  - longitude (numeric) — map longitude
  - severity (text, not null) — 'Critical' | 'High' | 'Medium' | 'Low'
  - description (text) — optional details
  - status (text, not null, default 'Reported') — 'Reported' | 'Dispatched' | 'En Route' | 'On Scene' | 'Resolved'
  - dispatched_at (timestamptz) — when responders were dispatched
  - resolved_at (timestamptz) — when incident was resolved
  - created_at (timestamptz, default now())
- `alerts`: System-generated alerts shown in the real-time feed
  - id (uuid PK)
  - title (text, not null)
  - message (text, not null)
  - level (text, not null) — 'critical' | 'warning' | 'info'
  - source (text) — system module that generated the alert
  - created_at (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- This is a single-tenant app with no sign-in screen, so all policies use TO anon, authenticated
  with USING (true) / WITH CHECK (true) because the data is intentionally public/shared.

3. Notes
- No user_id columns or auth references — no sign-in screen in this app.
- Incidents are seeded with realistic mock data on first run from the frontend.
*/

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  location_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  severity text NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  description text,
  status text NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Dispatched', 'En Route', 'On Scene', 'Resolved')),
  dispatched_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
CREATE POLICY "anon_insert_incidents" ON incidents FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
CREATE POLICY "anon_update_incidents" ON incidents FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;
CREATE POLICY "anon_delete_incidents" ON incidents FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  level text NOT NULL CHECK (level IN ('critical', 'warning', 'info')),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
