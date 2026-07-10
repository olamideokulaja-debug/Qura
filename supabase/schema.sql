-- Qura key-value store: per-account rows plus optional 'shared' rows,
-- protected by row level security. Run this in the Supabase SQL editor.

create table if not exists public.kv (
  owner      text not null,        -- the user's id, or the literal 'shared'
  key        text not null,
  value      text,
  updated_at timestamptz not null default now(),
  primary key (owner, key)
);

alter table public.kv enable row level security;

create policy "kv read"   on public.kv for select using (owner = auth.uid()::text or owner = 'shared');
create policy "kv insert" on public.kv for insert with check (owner = auth.uid()::text or owner = 'shared');
create policy "kv update" on public.kv for update using (owner = auth.uid()::text or owner = 'shared') with check (owner = auth.uid()::text or owner = 'shared');
create policy "kv delete" on public.kv for delete using (owner = auth.uid()::text or owner = 'shared');
