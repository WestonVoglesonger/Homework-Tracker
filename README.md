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
3. Prisma migrate and seed
```bash
pnpm prisma migrate dev --name init
pnpm run db:seed
```
4. Dev server
```bash
pnpm dev
```

## Scripts
- `pnpm dev` start dev server
- `pnpm prisma migrate dev` migrate db
- `pnpm run db:seed` seed sample data


