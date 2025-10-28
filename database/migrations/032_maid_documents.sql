-- Migration 032: Maid Documents storage and metadata

-- Create maid_documents table to store uploaded document metadata
CREATE TABLE IF NOT EXISTS maid_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_id UUID NOT NULL REFERENCES maid_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  custom_type_name TEXT,
  title TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_maid_documents_maid_id ON maid_documents(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_documents_uploaded_at ON maid_documents(uploaded_at DESC);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION update_maid_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_maid_documents_updated_at ON maid_documents;
CREATE TRIGGER trg_update_maid_documents_updated_at
  BEFORE UPDATE ON maid_documents
  FOR EACH ROW EXECUTE FUNCTION update_maid_documents_updated_at();

-- Enable RLS with owner-only policies
ALTER TABLE maid_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Maids can view own documents" ON maid_documents;
CREATE POLICY "Maids can view own documents" ON maid_documents
  FOR SELECT USING (maid_id = auth.uid());

DROP POLICY IF EXISTS "Maids can insert own documents" ON maid_documents;
CREATE POLICY "Maids can insert own documents" ON maid_documents
  FOR INSERT WITH CHECK (maid_id = auth.uid());

DROP POLICY IF EXISTS "Maids can update own documents" ON maid_documents;
CREATE POLICY "Maids can update own documents" ON maid_documents
  FOR UPDATE USING (maid_id = auth.uid()) WITH CHECK (maid_id = auth.uid());

DROP POLICY IF EXISTS "Maids can delete own documents" ON maid_documents;
CREATE POLICY "Maids can delete own documents" ON maid_documents
  FOR DELETE USING (maid_id = auth.uid());

