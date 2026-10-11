# MamaNote

Gentle baby tracking for new parents — log feeds, sleep, diapers, medicine, and milestones, then spot patterns without the noise.

**Live product:** [mamanoteapp.com](https://www.mamanoteapp.com)

This repository is the **MamaNote** mobile app (Expo / React Native) with a Supabase backend and Edge Functions. The marketing site at the link above describes the product; this repo is the application source.

---

## Features

Implemented in this codebase (aligned with the live product):

- Email/password auth with email OTP verification (Supabase Auth)
- Baby profiles and activity logging (feeding, sleep, diaper, pump, medicine, notes, and related subtypes)
- Home quick actions, log sheet, and stats / insights views
- Light / dark theme (system follow + manual toggle)
- Freemium model: complimentary Plus trial, then daily log limits; MamaNote Plus via Paddle checkout
- Activity sharing via tokenized links / QR (view-only Edge Function)
- AI-assisted daily routine generation (Supabase Edge Function + Anthropic; mock fallback without API key)
- Sleep hub, growth & milestones, local medicine reminders (device notifications)
- Push notification scaffolding (Expo Notifications)

---

## Tech stack

| Area                 | Choice                                                   |
| -------------------- | -------------------------------------------------------- |
| App framework        | Expo SDK 54, React Native 0.81, React 19                 |
| Language             | TypeScript (strict)                                      |
| Routing              | Expo Router (file-based)                                 |
| Styling              | NativeWind v4 (Tailwind CSS 3.4)                         |
| State                | Zustand                                                  |
| Backend              | Supabase (Postgres, Auth, RLS, Realtime, Edge Functions) |
| Payments             | Paddle (checkout + webhooks via Edge Functions)          |
| Animation / gestures | Reanimated 4, Gesture Handler                            |
| Icons                | lucide-react-native                                      |

---

## Architecture

```
app/                     Expo Router screens & layouts (auth, tabs, share, paywall return)
src/
  components/            UI building blocks and feature sheets
  constants/             Design tokens, activity catalog, freemium/subscription config
  hooks/                 Fonts, theme, Plus activation polling
  lib/                   Supabase client, auth, subscriptions, sharing, notifications
  store/                 Zustand stores (auth, baby, theme, subscription, …)
  types/                 Database & domain types
  utils/                 Pure helpers (dates, sleep log, stats filters, …)
supabase/
  schema.sql             Base schema reference
  RUN_IN_SQL_EDITOR.sql  Idempotent SQL to apply in the Supabase dashboard
  migrations/            Incremental SQL migrations
  functions/             Deno Edge Functions (checkout, webhooks, share, AI schedule)
```

Client code talks to Supabase with the **anon** key (`EXPO_PUBLIC_*`). Premium gates and share creation are enforced in app logic and RLS / Edge Functions. Paddle and Anthropic secrets stay server-side (`supabase secrets`).

---

## Requirements

- **Node.js 20.19+** (Expo SDK 54)
- npm
- A Supabase project
- Optional: Supabase CLI (Edge Functions), EAS CLI (native builds), Paddle + Anthropic keys for full Plus / AI flows

---

## Local setup

```bash
git clone <repo-url>
cd <repo>
npm install
cp .env.example .env
```

Fill in `.env` (see [Environment variables](#environment-variables)). Then:

1. In the Supabase SQL editor, run [`supabase/RUN_IN_SQL_EDITOR.sql`](./supabase/RUN_IN_SQL_EDITOR.sql).
2. Enable 6-digit email OTP — see [`supabase/AUTH_SETUP.md`](./supabase/AUTH_SETUP.md).
3. Start the app:

```bash
npm start          # Expo dev server — press i / a / w
npm run ios        # iOS (simulator / device)
npm run android    # Android
npm run web        # Web
```

Artwork expectations live in [`assets/README.md`](./assets/README.md).

### Edge Functions (optional)

```bash
supabase functions deploy generate-schedule
supabase functions deploy create-checkout
supabase functions deploy create-customer-portal
supabase functions deploy paddle-webhook
supabase functions deploy get-shared-activities
```

Set server secrets as needed (never in the Expo app):

```bash
supabase secrets set ANTHROPIC_API_KEY=...
supabase secrets set PADDLE_API_KEY=...
supabase secrets set PADDLE_WEBHOOK_SECRET=...
supabase secrets set PADDLE_ENV=sandbox
```

Without `ANTHROPIC_API_KEY`, `generate-schedule` returns a mock routine so the UI remains testable.

---

## Environment variables

Copy [`.env.example`](./.env.example). Names only — values come from your Supabase / Paddle dashboards:

| Variable                            | Where                           | Purpose                    |
| ----------------------------------- | ------------------------------- | -------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`          | App                             | Supabase project URL       |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`     | App                             | Supabase anon (public) key |
| `EXPO_PUBLIC_PADDLE_PRICE_MONTHLY`  | App                             | Paddle price id (monthly)  |
| `EXPO_PUBLIC_PADDLE_PRICE_ANNUAL`   | App                             | Paddle price id (annual)   |
| `EXPO_PUBLIC_PADDLE_PRICE_LIFETIME` | App                             | Paddle price id (lifetime) |
| `EXPO_PUBLIC_SHARE_BASE_URL`        | App (optional)                  | Public share link base     |
| `EXPO_PUBLIC_FEEDBACK_EMAIL`        | App (optional)                  | Profile feedback mailto    |
| `EXPO_PUBLIC_PLAY_STORE_URL`        | App (optional)                  | Store link                 |
| `EXPO_PUBLIC_APP_STORE_URL`         | App (optional)                  | Store link                 |
| `ANTHROPIC_API_KEY`                 | Edge Function secret            | AI routine generation      |
| `PADDLE_API_KEY`                    | Edge Function secret            | Checkout / portal          |
| `PADDLE_WEBHOOK_SECRET`             | Edge Function secret            | Webhook verification       |
| `PADDLE_ENV`                        | Edge Function secret            | `sandbox` or live          |
| `PADDLE_CHECKOUT_URL`               | Edge Function secret (optional) | Checkout domain override   |

`EXPO_PUBLIC_*` values are inlined at build time — restart Expo after changing them.

---

## Scripts

| Script                                        | Description              |
| --------------------------------------------- | ------------------------ |
| `npm start`                                   | Expo dev server          |
| `npm run ios` / `android` / `web`             | Platform targets         |
| `npm run lint`                                | ESLint via `expo lint`   |
| `npm run lint:fix`                            | ESLint autofix           |
| `npm run format` / `format:check`             | Prettier                 |
| `npm run typecheck`                           | `tsc --noEmit`           |
| `npm test`                                    | Vitest unit tests        |
| `npm run test:watch`                          | Vitest watch mode        |
| `npm run assets:placeholder` / `assets:brand` | Asset generation helpers |
| `npm run build:dev:android` / `ios`           | EAS development builds   |

CI runs install → lint → typecheck → format check → test on `main` (see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)). Native EAS builds are not run in CI (they need Expo credentials).

---

## Theming

Tokens live in [`src/constants/colors.ts`](./src/constants/colors.ts) and are mirrored in [`tailwind.config.js`](./tailwind.config.js). NativeWind uses `darkMode: 'class'`; the theme store toggles the scheme.

```tsx
import { useTheme } from '@hooks/useTheme';

const { toggle, mode, isDark } = useTheme();
```

---

## Supabase schema (overview)

| Table                     | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `profiles`                | One row per auth user (trigger-created)   |
| `babies`                  | Baby profiles for a user                  |
| `log_entries`             | Activity logs                             |
| `baby_routines`           | Generated daily schedules                 |
| `subscriptions` / related | Plus entitlement & Paddle linkage         |
| `activity_shares`         | Share tokens for view-only activity feeds |

Tables use **Row Level Security** so users only access their own data. Realtime is enabled where the app subscribes (e.g. babies / log entries).

---

## Author

**Sohanur Rahman** ([sohan9542](https://github.com/sohan9542))

---

## License

MIT — see [LICENSE](./LICENSE).
