-- ========================================================
-- VECTOR SIMILARITY SEARCH & MATCH RPC FOR PGVECTOR
-- e-Mate AI Semantic Document Chunk Retrieval
-- ========================================================

-- 1. HNSW Similarity Index on Vector Embeddings
-- HNSW (Hierarchical Navigable Small World) provides superior query throughput and recall
-- compared to IVFFlat, without requiring a training step or periodic index rebuilding.
create index if not exists idx_document_chunks_embedding_hnsw
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 2. MATCH DOCUMENT CHUNKS RPC FUNCTION
-- Calculates cosine similarity: 1 - (embedding <=> query_embedding)
-- Returns top-K nearest chunks with full metadata and similarity score.
create or replace function public.match_document_chunks (
  query_embedding vector(768),
  match_count integer default 5,
  filter_document_id uuid default null,
  filter_user_id uuid default null,
  similarity_threshold float default 0.0
)
returns table (
  id text,
  document_id uuid,
  source text,
  page_or_section text,
  text text,
  position_index integer,
  heading text,
  heading_level integer,
  page_number integer,
  metadata jsonb,
  similarity float
)
language plpgsql
stable
security invoker
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.source,
    dc.page_or_section,
    dc.text,
    dc.position_index,
    dc.heading,
    dc.heading_level,
    dc.page_number,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where (filter_document_id is null or dc.document_id = filter_document_id)
    and (filter_user_id is null or dc.user_id = filter_user_id or dc.user_id is null)
    and dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) >= similarity_threshold
  order by dc.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

-- 3. Grant execute permissions on RPC
grant execute on function public.match_document_chunks(vector(768), integer, uuid, uuid, float) to authenticated;
grant execute on function public.match_document_chunks(vector(768), integer, uuid, uuid, float) to anon;
grant execute on function public.match_document_chunks(vector(768), integer, uuid, uuid, float) to service_role;
