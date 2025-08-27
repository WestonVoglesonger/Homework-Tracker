# Homework Tracker

Minimal Next.js app to track courses and assignments with optional Canvas import.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind + basic components
- React Query + Zod
- NextAuth (Email + Google; Canvas token stored in Account provider "canvas")
- Prisma + SQLite (dev)

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

## Dev Container

This project includes a devcontainer with Postgres for local development.

- Files: `.devcontainer/devcontainer.json`, `.devcontainer/docker-compose.yml`
- Local DB URL inside container: `postgresql://postgres:postgres@db:5432/homework_dev`
- Prisma env in schema uses `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` which are set in the container.

Steps:
- Open in VS Code, run "Dev Containers: Reopen in Container"
- Run `pnpm prisma migrate dev` then `pnpm dev`


