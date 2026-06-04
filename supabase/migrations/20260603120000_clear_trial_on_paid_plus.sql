-- Paid Paddle Plus supersedes the complimentary trial; stop showing trial UI.
update public.subscriptions
set complimentary_premium_until = null
where status in ('active', 'trialing')
  and complimentary_premium_until is not null;

notify pgrst, 'reload schema';
