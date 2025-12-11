-- =============================================
-- 9.7.1: AI Semantic Cache Table
-- Migration: 2025-12-11
-- Description: Enable pgvector and create cache table
-- =============================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create ai_cache table
CREATE TABLE IF NOT EXISTS ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding vector(768), -- Dimensions for Google text-embedding-004
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Create Indexes
-- Exact match index for traditional caching fallback
CREATE INDEX IF NOT EXISTS idx_ai_cache_prompt ON ai_cache(prompt);

-- Vector similarity index (IVFFlat)
-- Note: Requires some data to be effective, but creating it early is fine.
-- Using vector_cosine_ops for cosine similarity.
CREATE INDEX IF NOT EXISTS idx_ai_cache_embedding ON ai_cache USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Enable RLS (Security)
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- Deny public access (Service Role only)
CREATE POLICY "Deny public access on ai_cache"
ON ai_cache
FOR ALL
TO anon
USING (false);

-- 5. Create Semantic Search Function (RPC)
CREATE OR REPLACE FUNCTION match_cached_response (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  response text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_cache.id,
    ai_cache.response,
    1 - (ai_cache.embedding <=> query_embedding) AS similarity
  FROM ai_cache
  WHERE 1 - (ai_cache.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_cache.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
