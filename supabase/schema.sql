-- Forte Compass — Supabase schema and tenant row-level security.
-- Run this once in the Supabase SQL editor when you connect a real backend.
-- Until then the app runs in seeded demo mode and needs none of this.

-- Organisations (tenants). Imade Forte is tenant one.
create table if not exists organisations (
  id text primary key,
  name text not null,
  brand jsonb default '{}'::jsonb,
  priorities jsonb default '[]'::jsonb,
  rubric jsonb default '{}'::jsonb,
  rag jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Profiles. One per signed-in user, bound to a tenant.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  tenant_id text references organisations(id),
  name text,
  role text,          -- chairman | md | lead | staff | hr | admin | superadmin
  subsidiary text,
  cadence_tier text,  -- ops | leadership
  photo text,
  created_at timestamptz default now()
);

-- Per-tenant application data, stored as keyed JSON documents (objectives, key_results,
-- scores, cycles). A single table keeps row-level security simple and robust.
create table if not exists kv (
  tenant_id text references organisations(id),
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (tenant_id, key)
);

alter table organisations enable row level security;
alter table profiles enable row level security;
alter table kv enable row level security;

-- Helper: the tenant of the current user.
create or replace function current_tenant() returns text
language sql stable as $$
  select tenant_id from profiles where id = auth.uid()
$$;

-- A user reads and writes only their own profile, and reads peers in the same tenant.
drop policy if exists profile_self on profiles;
create policy profile_self on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profile_peers_read on profiles;
create policy profile_peers_read on profiles
  for select using (tenant_id = current_tenant());

-- A user reads and writes only rows for their own tenant. No query crosses tenants.
drop policy if exists kv_tenant on kv;
create policy kv_tenant on kv
  for all using (tenant_id = current_tenant()) with check (tenant_id = current_tenant());

-- A user reads only their own organisation record.
drop policy if exists org_read on organisations;
create policy org_read on organisations
  for select using (id = current_tenant());

-- Seed the two tenants.
insert into organisations (id, name, brand) values
  ('imade-forte', 'Imade Forte Holdings Ltd.',
   '{"navy":"#0E2240","gold":"#B8924A","font":"Lora"}'::jsonb)
on conflict (id) do nothing;

insert into organisations (id, name, brand) values
  ('demo', 'Demo Company',
   '{"navy":"#1B2A3A","gold":"#7C8AA0","font":"Lora"}'::jsonb)
on conflict (id) do nothing;
