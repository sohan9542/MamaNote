-- Shareable activity log links (read via edge function with token)
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

create index if not exists activity_shares_baby_idx
  on public.activity_shares (baby_id, created_at desc);

alter table public.activity_shares enable row level security;

drop policy if exists "Owner can read own shares" on public.activity_shares;
create policy "Owner can read own shares"
  on public.activity_shares for select
  using (auth.uid() = user_id);

drop policy if exists "Owner can insert shares" on public.activity_shares;
create policy "Owner can insert shares"
  on public.activity_shares for insert
  with check (auth.uid() = user_id);

drop policy if exists "Owner can delete shares" on public.activity_shares;
create policy "Owner can delete shares"
  on public.activity_shares for delete
  using (auth.uid() = user_id);
