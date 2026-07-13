-- REALMS FIELD — Supabase setup. Paste ALL of this into the Supabase SQL Editor and press Run.
-- Safe to run more than once.

-- 1. Roles (remembers which role each person picks)
create table if not exists kv (
  user_id uuid references auth.users(id) on delete cascade,
  k text not null,
  v jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, k)
);
alter table kv enable row level security;
drop policy if exists "own rows" on kv;
create policy "own rows" on kv for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Facilities
create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  area text,
  address text,
  lat double precision,
  lng double precision,
  last_visit date,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table facilities enable row level security;
drop policy if exists "auth facilities" on facilities;
create policy "auth facilities" on facilities for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- 3. Assignments (a planned day of visits)
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  visit_date date,
  area text,
  facility_ids jsonb,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table assignments enable row level security;
drop policy if exists "auth assignments" on assignments;
create policy "auth assignments" on assignments for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- 4. Visits (holds check-in, the assessment, and the debrief)
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  facility_id text,
  facility_name text,
  area text,
  status text default 'engaged',
  arrival_time timestamptz,
  lat double precision,
  lng double precision,
  team jsonb,
  person_in_charge jsonb,
  greeting_confirmed boolean default false,
  monitoring jsonb,
  score int,
  overall_rating text,
  debrief jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
-- if the visits table already existed, make sure the newer columns are present:
alter table visits add column if not exists monitoring jsonb;
alter table visits add column if not exists score int;
alter table visits add column if not exists overall_rating text;
alter table visits add column if not exists debrief jsonb;
alter table visits enable row level security;
drop policy if exists "auth visits" on visits;
create policy "auth visits" on visits for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- 5. Notifications log (auto customer-service alerts + manual notifications)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text, visit_id text, facility_name text, area text, channel text, status text, message text,
  created_by uuid references auth.users(id), created_at timestamptz default now()
);
alter table notifications enable row level security;
drop policy if exists "auth notifications" on notifications;
create policy "auth notifications" on notifications for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- 6. Call log (customer-service follow-up calls)
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  visit_id text, facility_name text, area text, outcome text, notes text, caller text,
  created_by uuid references auth.users(id), created_at timestamptz default now()
);
alter table calls enable row level security;
drop policy if exists "auth calls" on calls;
create policy "auth calls" on calls for all using (auth.uid() is not null) with check (auth.uid() is not null);
