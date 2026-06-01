-- MamaNote – initial Supabase schema
-- Run this once in your Supabase project's SQL editor.

-- 1. Profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Babies ------------------------------------------------------------------
create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birth_date date not null,
  gender text check (gender in ('girl', 'boy', 'other')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.babies enable row level security;

create policy "Owner can read babies"
  on public.babies for select using (auth.uid() = user_id);
create policy "Owner can insert babies"
  on public.babies for insert with check (auth.uid() = user_id);
create policy "Owner can update babies"
  on public.babies for update using (auth.uid() = user_id);
create policy "Owner can delete babies"
  on public.babies for delete using (auth.uid() = user_id);

-- 3. Log entries -------------------------------------------------------------
create table if not exists public.log_entries (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('feeding','sleep','diaper','pump','medication','note')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  amount numeric,
  unit text,
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists log_entries_baby_started_idx
  on public.log_entries (baby_id, started_at desc);

alter table public.log_entries enable row level security;

create policy "Owner can read entries"
  on public.log_entries for select using (auth.uid() = user_id);
create policy "Owner can insert entries"
  on public.log_entries for insert with check (auth.uid() = user_id);
create policy "Owner can update entries"
  on public.log_entries for update using (auth.uid() = user_id);
create policy "Owner can delete entries"
  on public.log_entries for delete using (auth.uid() = user_id);

-- 4. Realtime ---------------------------------------------------------------
alter publication supabase_realtime add table public.log_entries;
alter publication supabase_realtime add table public.babies;
