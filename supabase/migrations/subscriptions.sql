-- MamaNote Plus subscriptions (Paddle entitlements cache)
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

-- Inserts/updates only via service role (webhooks + edge functions)

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

-- Backfill existing users
insert into public.subscriptions (user_id)
select id from auth.users
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
