---
name: project-scaleva
description: Scaleva — AI SMS CRM SaaS. Core stack, route map, and current feature state after pre-launch hardening.
metadata:
  type: project
---

Scaleva is an AI-powered SMS CRM. Businesses import customers (Square/Stripe/CSV/manual), generate personalized SMS via Claude, and send via Twilio. Monthly subscription via Stripe.

**Stack:** Next.js 14 App Router, Supabase (auth + Postgres), Twilio, Anthropic Claude, Stripe, Resend.

**Key routes:**
- `/api/messages/generate` — Claude API, 10s timeout, AI_UNAVAILABLE fallback
- `/api/messages/send` — retry ×3 w/ exponential backoff, quiet hours (8–21 local), opt-out check
- `/api/cron/send` — autopilot, batches of 10, 500ms between batches
- `/api/webhooks/twilio` — idempotent, STOP/START/HELP auto-replies, best reply hour tracking
- `/api/webhooks/stripe` — idempotent, dunning email on payment_failed
- `/api/auth/signup` — rate-limited (5/hr per IP), wraps Supabase signUp

**Post-launch hardening done (June 2026):**
- CSRF origin check in middleware for all non-webhook POST /api/ routes
- lib/sanitize.ts: sanitizePhone, sanitizeText, sanitizeEmail
- supabase/migrations/006_compliance.sql: processed_webhooks, customer_insights, new columns (opted_out, consent_given, consent_date, ltv, twilio_sid, topic, consent_verified)
- 14-day Stripe trial on all checkout sessions
- 80% message/customer usage warning banner in dashboard
- Bulk send (select all customers, Generate & Send to All) in dashboard
- Message search + status filter in message feed
- Onboarding wizard localStorage persistence (key: scaleva_onboarding_{userId})
- Settings page unsaved-changes warning (beforeunload + confirm dialog)
- Duplicate customer phone detection (409 DUPLICATE_PHONE with override option)
- Consent checkbox required when adding customers

**Why:** Pre-launch hardening sprint — TCPA compliance, reliability, and UX polish.

**5 growth features added (June 2026):**
- **Autonomous AI replies** — Twilio webhook auto-generates+sends Claude reply on customer message when `config.autoReplyEnabled = true`. Conversation history passed as context. Toggle in Settings → AI features.
- **Revenue attribution** — return-visit endpoint marks most recent outbound message (last 30 days) as `attributed=true`, `attributed_revenue=avg_visit_value`. New dashboard stat: "Revenue from messages."
- **Customer segments** — client-side computed: champion / new / almost_lapsed / at_risk. Filter tabs on customer table. Segment fed into `/api/messages/generate` to tune tone.
- **Review request automation** — on return visit, sends Google review SMS if `config.reviewRequestEnabled+reviewLink` set and `last_review_request_at > 60 days`. Toggle + link field in Settings.
- **Win-back sequences** — `sequence_enrollments` table. Enroll on any outbound send (step 1, fires in 7d). Steps 2+3 fire 14d/24d later. Exit on reply or return. Cron at `/api/cron/sequences` runs daily 10am. Toggle in Settings.
- Migration: `supabase/migrations/007_features.sql` adds `messages.attributed`, `messages.attributed_revenue`, `customers.last_review_request_at`, `sequence_enrollments` table.
