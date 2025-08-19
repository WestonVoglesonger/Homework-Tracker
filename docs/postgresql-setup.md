# PostgreSQL Setup for Production

## Environment Setup

1. **Update your environment variables**:
   ```bash
   # .env or .env.production
   DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
   ```

2. **Update Prisma schema**:
   In `prisma/schema.prisma`, comment out SQLite and uncomment PostgreSQL:
   ```prisma
   datasource db {
     // For SQLite (development)
     // provider = "sqlite"
     // url      = env("DATABASE_URL")
     
     // For PostgreSQL (production)
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

## Hosting Options

### Vercel Postgres
- Built-in integration with Vercel
- Automatic connection string in environment

### Supabase
- Free tier available
- Built on PostgreSQL
- Connection string format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

### Railway
- Easy deployment
- Automatic SSL
- Connection string provided in dashboard

### Neon
- Serverless PostgreSQL
- Auto-scaling
- Connection pooling built-in

## Automated Canvas Sync

To set up hourly Canvas sync:

1. **Set CRON_SECRET in environment**:
   ```bash
   CRON_SECRET="your-secure-random-string"
   ```

2. **Configure cron job** (Vercel example):
   ```json
   {
     "crons": [{
       "path": "/api/canvas/sync",
       "schedule": "0 * * * *"
     }]
   }
   ```

3. **Or use external service** like cron-job.org:
   - URL: `https://your-domain.com/api/canvas/sync`
   - Method: POST
   - Headers: `Authorization: Bearer your-secure-random-string`
   - Schedule: Every hour
