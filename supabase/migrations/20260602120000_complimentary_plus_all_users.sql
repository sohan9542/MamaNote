-- Every user: 7-day full Plus on signup (no card), then 3 logs/day free tier.

create or replace function public.ensure_subscription_row()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, complimentary_premium_until)
  values (new.id, now() + interval '7 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Existing users without a trial end date get 7 days from now.
update public.subscriptions
set complimentary_premium_until = coalesce(complimentary_premium_until, now() + interval '7 days')
where complimentary_premium_until is null;

notify pgrst, 'reload schema';
