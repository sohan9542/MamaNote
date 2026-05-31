-- =============================================================================
-- MAMANOTE — Run this ENTIRE file once in Supabase Dashboard → SQL Editor → Run
-- Fixes: "Could not find the table 'public.babies' in the schema cache"
-- =============================================================================

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update using (auth.uid() = id);

-- 2. Babies (required for onboarding)
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

drop policy if exists "Owner can read babies" on public.babies;
create policy "Owner can read babies"
  on public.babies for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert babies" on public.babies;
create policy "Owner can insert babies"
  on public.babies for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update babies" on public.babies;
create policy "Owner can update babies"
  on public.babies for update using (auth.uid() = user_id);

drop policy if exists "Owner can delete babies" on public.babies;
create policy "Owner can delete babies"
  on public.babies for delete using (auth.uid() = user_id);

-- 3. Log entries
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

drop policy if exists "Owner can read entries" on public.log_entries;
create policy "Owner can read entries"
  on public.log_entries for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert entries" on public.log_entries;
create policy "Owner can insert entries"
  on public.log_entries for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update entries" on public.log_entries;
create policy "Owner can update entries"
  on public.log_entries for update using (auth.uid() = user_id);

drop policy if exists "Owner can delete entries" on public.log_entries;
create policy "Owner can delete entries"
  on public.log_entries for delete using (auth.uid() = user_id);

-- 4. AI-generated routines (Claude schedule)
create table if not exists public.baby_routines (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_days int not null default 7,
  summary text,
  schedule jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists baby_routines_baby_created_idx
  on public.baby_routines (baby_id, created_at desc);

alter table public.baby_routines enable row level security;

drop policy if exists "Owner can read routines" on public.baby_routines;
create policy "Owner can read routines"
  on public.baby_routines for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert routines" on public.baby_routines;
create policy "Owner can insert routines"
  on public.baby_routines for insert with check (auth.uid() = user_id);

-- 5. New-user profile trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. API access (anon + authenticated roles)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public
  grant all on tables to anon, authenticated;

-- 7. Subscriptions (Paddle entitlements)
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'free'
    check (status in ('free', 'trialing', 'active', 'canceled', 'past_due')),
  plan text check (plan in ('monthly', 'annual', 'lifetime')),
  provider text not null default 'paddle',
  paddle_customer_id text,
  paddle_subscription_id text,
  free_ai_generations_used int not null default 0,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_paddle_customer_idx
  on public.subscriptions (paddle_customer_id)
  where paddle_customer_id is not null;

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

create or replace function public.ensure_subscription_row()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_subscription on auth.users;
create trigger on_auth_user_subscription
  after insert on auth.users
  for each row execute procedure public.ensure_subscription_row();

insert into public.subscriptions (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- 8. Refresh PostgREST schema cache (fixes "schema cache" errors)
notify pgrst, 'reload schema';

-- 9. Shareable activity links ------------------------------------------------
create table if not exists public.activity_shares (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  filter_mode text not null check (filter_mode in ('all', 'categories')),
  activity_ids text[] not null default '{}',
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists activity_shares_token_idx
  on public.activity_shares (token);

alter table public.activity_shares enable row level security;

drop policy if exists "Owner can read own shares" on public.activity_shares;
create policy "Owner can read own shares"
  on public.activity_shares for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert shares" on public.activity_shares;
create policy "Owner can insert shares"
  on public.activity_shares for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can delete shares" on public.activity_shares;
create policy "Owner can delete shares"
  on public.activity_shares for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
