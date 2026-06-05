# Scaleva

An AI-powered CRM that sends personalized SMS outreach to customers on behalf
of small businesses. Built with **Next.js 14 (App Router)**, **Supabase** (auth
+ Postgres), **Tailwind CSS**, **Claude** (message generation), and **Twilio**
(SMS delivery). TypeScript throughout.

## Project structure

```
/app          App Router pages + API routes
  page.tsx        landing
  login/          email + password login
  signup/         account creation
  onboarding/     business setup wizard
  dashboard/      customers, messages, stats
  admin/          cross-business admin overview
  auth/callback/  Supabase email-confirmation handler
  api/messages/   generate (Claude) + send (Twilio) routes
/components    Reusable UI (Button, Input, Card, Badge, Navbar)
/lib          Service clients (supabase, claude, twilio)
/utils        Helpers + hand-written database types
/supabase     schema.sql (tables + RLS)
```

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Purpose |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `ANTHROPIC_API_KEY` | Claude API key (server-side) |
   | `TWILIO_ACCOUNT_SID` | Twilio account SID |
   | `TWILIO_AUTH_TOKEN` | Twilio auth token |
   | `TWILIO_PHONE_NUMBER` | Twilio sending number (E.164) |
   | `ADMIN_EMAILS` | _(optional)_ comma-separated admin allowlist for `/admin` |

3. Provision the database — run [`supabase/schema.sql`](supabase/schema.sql) in
   the Supabase SQL editor. This creates the `businesses`, `customers`,
   `messages`, and `interactions` tables with Row Level Security.

4. Run the dev server:

   ```bash
   npm run dev
   ```

## Notes

- The `businesses` table includes an `owner_id` (referencing `auth.users`) in
  addition to the originally specified columns. It's required so RLS can
  isolate each business's data to the user who created it.
- The Claude and Twilio clients are server-only — they're used from the route
  handlers under `app/api/messages/` and must never be imported into client
  components.
