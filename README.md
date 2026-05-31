# 🌸 Mamanote

A soft, calming baby tracking app — built with Expo, React Native, NativeWind, Supabase, and Zustand.

> **Tagline:** Gentle tracking for your little one.

---

## ✨ Features (initial setup)

- 🍼 Bottom tab navigation: **Home · Log · Stats · Profile**
- 🌗 Light / Dark mode with system follow + manual toggle
- 🌷 Pastel design system (soft pink, mint, lavender, warm beige)
- 🔐 Email/password auth via **Supabase**
- 📥 Quick-log entries (feeding, sleep, diaper, pump, medicine, notes)
- 📊 Daily insights stub with stat cards
- 🔔 Push notifications scaffolding (Expo Notifications)
- ⚡ State management with **Zustand**
- 🎞 Smooth interactions with **Reanimated** & **Gesture Handler**
- 🧭 File-based routing with **Expo Router**
- 🎨 Styling with **NativeWind v4 (Tailwind CSS)**

---

## 🧱 Tech stack

| Concern        | Library                              |
| -------------- | ------------------------------------ |
| Framework      | Expo SDK 54 + React Native 0.81      |
| Language       | TypeScript 5.9 + React 19.1          |
| Routing        | `expo-router` (file-based)           |
| Styling        | `nativewind` v4 (Tailwind 3.4)       |
| State          | `zustand`                            |
| Backend        | `@supabase/supabase-js`              |
| Animation      | `react-native-reanimated` v3         |
| Gestures       | `react-native-gesture-handler`       |
| Notifications  | `expo-notifications`                 |
| Icons          | `lucide-react-native`                |
| Storage        | `@react-native-async-storage/async-storage` |

---

## 📂 Folder structure

```
mamanote/
├─ app/                      # Expo Router (file-based routes)
│  ├─ _layout.tsx            # Root layout + auth gate + theme
│  ├─ index.tsx              # Auth redirect
│  ├─ +not-found.tsx
│  ├─ (auth)/
│  │  ├─ _layout.tsx
│  │  ├─ sign-in.tsx
│  │  └─ sign-up.tsx
│  └─ (tabs)/
│     ├─ _layout.tsx         # Bottom tab navigator
│     ├─ index.tsx           # Home
│     ├─ log.tsx             # Add log entry
│     ├─ stats.tsx           # Daily insights
│     └─ profile.tsx         # Profile + settings
├─ src/
│  ├─ components/            # Reusable UI (Button, Card, Input, etc.)
│  ├─ screens/               # (Reserved for larger composite screens)
│  ├─ lib/                   # supabase client, auth helpers, notifications
│  ├─ store/                 # Zustand stores (auth, theme, baby)
│  ├─ hooks/                 # useTheme, useColorScheme
│  ├─ utils/                 # date, cn (classnames)
│  ├─ types/                 # database types
│  └─ constants/             # colors, spacing, radius
├─ assets/                   # icon, splash, notification icon
├─ supabase/
│  └─ schema.sql             # Run in Supabase SQL editor
├─ app.json
├─ babel.config.js
├─ metro.config.js
├─ tailwind.config.js
├─ global.css
├─ tsconfig.json
├─ .env.example
└─ package.json
```

---

## 📦 SDK 54 notes

This project targets **Expo SDK 54** (React Native 0.81, React 19.1).

- **Node.js:** use **20.19+** (required by SDK 54).
- **Reanimated v4** + **react-native-worklets** — required by NativeWind 4.2+ on SDK 54. Babel uses `nativewind/babel` (worklets plugin); `babel-preset-expo` auto-plugins are disabled to avoid duplicates.
- **Expo Router:** upgraded to **v6** with SDK 54.
- **Upgrade command** (if you fork this later):

  ```bash
  npx expo install expo@^54.0.0 --fix
  ```

---

## 🚀 Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the full file [`supabase/RUN_IN_SQL_EDITOR.sql`](./supabase/RUN_IN_SQL_EDITOR.sql) (fixes *"table not in schema cache"*). Wait for **Success**, then retry the app.
3. Enable **6-digit email OTP** for sign-up — see [supabase/AUTH_SETUP.md](./supabase/AUTH_SETUP.md).
3. Copy `Project URL` and `anon public key` from **Project Settings → API**.
4. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

> `EXPO_PUBLIC_*` env vars are inlined at build time — restart `expo start` after changing them.

### 3. Add app artwork

Drop your final PNG files into `assets/` (see `assets/README.md`):

- `icon.png` — 1024×1024
- `adaptive-icon.png` — 1024×1024 (Android, transparent BG)
- `splash.png` — 1284×2778
- `favicon.png` — 48×48
- `notification-icon.png` — 96×96 (white-on-transparent)

### 4. Run the app

```bash
npm run start       # then press i / a / w
# or directly
npm run ios
npm run android
npm run web
```

### 6. AI daily routine (Claude)

The **Stats** tab builds a weekly activity chart and can generate a personalized daily routine via Claude.

1. Re-run [`supabase/RUN_IN_SQL_EDITOR.sql`](./supabase/RUN_IN_SQL_EDITOR.sql) if you set up the DB before this feature (adds `baby_routines` table).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project.
3. Deploy the edge function:

   ```bash
   supabase functions deploy generate-schedule
   ```

4. Set your Anthropic API key as a **server secret** (never in the Expo app):

   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
   ```

Without `ANTHROPIC_API_KEY`, the function returns a **mock routine** so you can test the UI locally.

---

## 🌗 Theming

Theme tokens live in [`src/constants/colors.ts`](./src/constants/colors.ts) and are mirrored in [`tailwind.config.js`](./tailwind.config.js). Use Tailwind classes with the `dark:` variant — NativeWind is configured with `darkMode: 'class'` and the theme store toggles the document `colorScheme`.

```tsx
<View className="bg-pink-50 dark:bg-ink-800">
  <Text className="text-ink-800 dark:text-ink-50">Hello mama</Text>
</View>
```

To toggle in code:

```ts
import { useTheme } from '@hooks/useTheme';

const { toggle, mode, isDark } = useTheme();
```

---

## 🧪 Supabase schema overview

| Table           | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `profiles`      | One row per auth user (auto-created via trigger)          |
| `babies`        | Babies belonging to a user                                |
| `log_entries`   | Feeding / sleep / diaper / pump / medication / note logs  |
| `baby_routines` | AI-generated daily schedules (Claude via edge function)   |

All tables ship with **Row Level Security** so users only see their own rows. Realtime is enabled on `babies` and `log_entries`.

---

## 🛣 Roadmap ideas

- Onboarding flow + add-baby wizard
- Growth charts (weight, height, head circumference)
- Sleep timer with background tracking
- Multi-caregiver sharing
- Cloud sync indicator + offline queue
- Localization (i18n)

---

## 📄 License

MIT
