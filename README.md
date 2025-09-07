# DueNorth

Minimal Next.js app to track courses and assignments with optional Canvas import.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind + basic components
- React Query + Zod
- NextAuth (Email + Google; Canvas token stored in Account provider "canvas")
- Prisma + SQLite (dev)

## Email Verification & Password Reset

This app supports email verification and password reset via secure, single-use tokens.

### Environment

- `NEXTAUTH_URL` – canonical base URL (e.g., `https://your-domain.com`)
- `EMAIL_FROM` – display From (e.g., `"Homework Tracker" <noreply@your-domain.com>`)
- `EMAIL_SERVER` – SMTP URI, e.g. `smtps://user:pass@smtp.your-domain.com:465`

If `EMAIL_SERVER` is not configured, emails are logged to console in development.

### Endpoints

- `POST /api/auth/verify/request` – body: `{ email }`
- `GET /api/auth/verify/confirm?email=...&token=...`
- `POST /api/auth/password/forgot` – body: `{ email }`
- `POST /api/auth/password/reset` – body: `{ email, token, newPassword }`

All endpoints are rate limited and return generic responses to avoid leaking account existence.

### Best Practices

- Tokens are random, hashed at rest, time-limited, and single-use.
- `CredentialsProvider` requires `emailVerified` to sign in.
- Configure SPF/DKIM/DMARC for your domain when using SMTP to improve deliverability.

### No-cost options

- Dev: console log emails; Ethereal Email for test inboxes.
- Production: a hosting-provided SMTP account (often included), or self-host (Postfix/Exim). Free-tier ESPs such as Brevo or Resend can be used if acceptable.

## Setup
1. Install pnpm and deps
```bash
pnpm i
```
2. Copy env
```bash
cp .env.example .env.local
```
3. Prisma migrate and seed (local dev vs production)
```bash
# Local dev (Dev Container with Postgres)
# Open in VS Code and run: "Dev Containers: Reopen in Container"
# Then, inside the container:
pnpm prisma migrate dev --name init
pnpm run db:seed

# Production (Supabase)
# Ensure POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING are set
pnpm prisma migrate deploy
```
4. Dev server
```bash
pnpm dev
```

## Scripts
- `pnpm dev` start dev server
- `pnpm prisma migrate dev` migrate db
- `pnpm run db:seed` seed sample data

## Vercel Cron for Canvas Sync

1. Set environment variables in Vercel:
   - `CRON_SECRET` = a strong random string (used to authorize the cron request)

2. Ensure `vercel.json` contains:
   ```json
   {
     "crons": [
       { "path": "/api/canvas/sync", "schedule": "0 */3 * * *" }
     ]
   }
   ```

Vercel will GET `/api/canvas/sync` every 3 hours and include `Authorization: Bearer ${CRON_SECRET}`. The route validates this header.

## Dev Container

This project includes a devcontainer with Postgres for local development.

- Files: `.devcontainer/devcontainer.json`, `.devcontainer/docker-compose.yml`
- Local DB URL inside container: `postgresql://postgres:postgres@db:5432/homework_dev`
- Prisma env in schema uses `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` which are set in the container.

Steps:
- Open in VS Code, run "Dev Containers: Reopen in Container"
- Run `pnpm prisma migrate dev` then `pnpm dev`


