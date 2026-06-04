-- Google Play / internal test account
-- Email: test@gmail.com  Password: Test123456
-- Permanent Plus (lifetime purchase row — no Paddle IDs required)

create extension if not exists pgcrypto;

do $$
declare
  v_user_id uuid;
  v_email text := 'test@gmail.com';
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email);

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt('Test123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  insert into public.subscriptions (
    user_id,
    status,
    plan,
    provider,
    paddle_customer_id,
    paddle_subscription_id,
    current_period_end,
    complimentary_premium_until,
    updated_at
  ) values (
    v_user_id,
    'active',
    'lifetime',
    'paddle',
    null,
    null,
    null,
    null,
    now()
  )
  on conflict (user_id) do update set
    status = excluded.status,
    plan = excluded.plan,
    paddle_customer_id = excluded.paddle_customer_id,
    paddle_subscription_id = excluded.paddle_subscription_id,
    current_period_end = excluded.current_period_end,
    complimentary_premium_until = excluded.complimentary_premium_until,
    updated_at = excluded.updated_at;
end $$;
