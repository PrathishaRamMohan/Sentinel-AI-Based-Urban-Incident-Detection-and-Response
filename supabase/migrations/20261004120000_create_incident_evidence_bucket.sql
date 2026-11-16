-- Create the bucket used by the FastAPI evidence upload endpoint.
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-evidence', 'incident-evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;