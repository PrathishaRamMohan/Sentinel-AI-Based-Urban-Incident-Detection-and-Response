-- Add updated_at column to incidents table if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'updated_at') THEN
    ALTER TABLE incidents ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
