create extension if not exists vector with schema extensions;

create table if not exists public.doc_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid references public.family_members(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.doc_chunks to authenticated;
grant all on public.doc_chunks to service_role;

alter table public.doc_chunks enable row level security;

drop policy if exists "own chunks select" on public.doc_chunks;
create policy "own chunks select" on public.doc_chunks for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own chunks insert" on public.doc_chunks;
create policy "own chunks insert" on public.doc_chunks for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own chunks update" on public.doc_chunks;
create policy "own chunks update" on public.doc_chunks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own chunks delete" on public.doc_chunks;
create policy "own chunks delete" on public.doc_chunks for delete to authenticated using (auth.uid() = user_id);

create index if not exists doc_chunks_doc_idx on public.doc_chunks (document_id);
create index if not exists doc_chunks_user_idx on public.doc_chunks (user_id);
create index if not exists doc_chunks_embedding_idx on public.doc_chunks using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_doc_chunks(
  query_embedding extensions.vector(1536),
  match_count integer default 8,
  p_member_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select c.id, c.document_id, c.content, c.metadata,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.doc_chunks c
  where c.embedding is not null
    and (p_member_id is null or c.member_id = p_member_id)
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 30));
$$;

grant execute on function public.match_doc_chunks(extensions.vector, integer, uuid) to authenticated;