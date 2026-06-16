# Trust Company Launch Guide

This app is ready to be prepared for public hosting. For internet access by several staff members, use a hosted PostgreSQL database and a Node/Next.js hosting provider.

## What Is Already Launch-Hardened

- Login sessions are stored in HTTP-only cookies.
- Session cookies are signed with `APP_SESSION_SECRET`.
- Cookies are marked secure in production.
- Demo credentials are hidden from the production login screen.
- Prisma client generation runs during build/install.
- PostgreSQL is configured in `prisma/schema.prisma`.

## Required Production Environment Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
APP_SESSION_SECRET="a-long-random-secret"
```

Use a unique `APP_SESSION_SECRET` for production. Do not use the local demo value.

## Recommended Deployment Shape

Use:

- Render Free Web Service for the web app.
- Neon Free PostgreSQL for shared production data.
- HTTPS only.
- Private admin credentials created after the production seed/setup step.

The project is configured for PostgreSQL. Run the production database setup against the hosted `DATABASE_URL`.

## Launch Checklist

1. Create the hosting project.
2. Create a hosted PostgreSQL database.
3. Add `DATABASE_URL` and `APP_SESSION_SECRET` to the hosting environment.
4. Run `npm run db:push` once against the production database.
5. Run `npm run db:seed` once only if you want the starter demo accounts.
6. Build the app.
7. Open the public URL and log in as admin.
8. Change seeded/demo passwords before giving access to staff.

## Free Render + Neon Launch

1. Push this project to a GitHub repository.
2. In Render, create a new Web Service from that repository.
3. Use these settings:

```text
Runtime: Node
Build Command: npm install && npm run db:push && npm run build
Start Command: npm run start
Plan: Free
```

4. Add these Render environment variables:

```text
DATABASE_URL=your Neon PostgreSQL connection string
APP_SESSION_SECRET=a long random secret
```

5. Deploy the service.
6. Open the Render public URL.
7. Log in with the seeded admin account, then change the password before giving access to staff.

## Temporary Preview Option

For a quick private preview, the app can still run locally on a port such as `5179`, but that is not a real public launch. A localhost URL only works on this computer.
