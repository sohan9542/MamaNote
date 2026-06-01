-- Every user gets 7-day Plus trial (no Paddle). See 20260602120000 for signup trigger.

alter table public.subscriptions
  add column if not exists complimentary_premium_until timestamptz;

comment on column public.subscriptions.complimentary_premium_until is
  'Full Plus access until this timestamp (7 days from signup; no subscription required).';

update public.subscriptions
set complimentary_premium_until = coalesce(complimentary_premium_until, now() + interval '7 days')
where complimentary_premium_until is null;

notify pgrst, 'reload schema';
