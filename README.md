# Trust Company Loan Management System

A browser-based internal loan operations platform for Trust Company. The system manages borrowers, guarantors, loans, repayments, overdue monitoring, branch structure, staff accounts, and reporting.

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Node.js server actions
- Prisma ORM
- PostgreSQL database

## Features

- Secure staff login with administrator and staff roles
- Dashboard metrics for borrowers, active loans, overdue loans, money loaned, repayments, and outstanding balances
- Borrower profiles with KYC status, contact data, emergency contact, and notes
- Loan creation with guarantor information, officer assignment, branch assignment, interest, duration, due date, penalties, and status
- Repayment tracking with remaining balance calculation and automatic completion when fully paid
- Overdue/default monitoring with days overdue
- Search and filters for borrowers, loan status, due dates, and assigned staff
- Reports for loan status, monthly repayments, and staff performance
- Branch and staff administration

## Demo Credentials

Administrator:

```text
Email: admin@trustcompany.local
Password: admin123
```

Staff / Loan Officer:

```text
Email: daniel@trustcompany.local
Password: staff123
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npx prisma generate
```

3. Add your PostgreSQL database URL to `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
APP_SESSION_SECRET="replace-with-a-long-random-secret"
```

4. Push the database schema:

```bash
npm run db:push
```

5. Seed demo data:

```bash
npm run db:seed
```

6. Start the development server:

```bash
npm run dev
```

7. Open the app:

```text
http://localhost:3000
```

## Useful Commands

```bash
npm run build
npm run db:generate
npm run db:push
npm run db:seed
npx prisma studio
```

## Public Deployment

Localhost is only for previewing the system on this computer. To let other people access Trust Company online, deploy the app to a Next.js hosting provider and connect it to a hosted PostgreSQL database.

Production launch requires:

- `DATABASE_URL`
- `APP_SESSION_SECRET`
- HTTPS
- Demo passwords changed before giving access to real staff

See `DEPLOYMENT.md` for the launch checklist.

## Database

The Prisma schema is in `prisma/schema.prisma`. The app uses PostgreSQL through Prisma. Run `npm run db:push` to create/update the database tables, then run `npm run db:seed` only when you intentionally want demo data.

Main models:

- `User`
- `Branch`
- `Borrower`
- `Loan`
- `Guarantor`
- `RepaymentSchedule`
- `Repayment`

## Notes

For production deployment, set a strong `APP_SESSION_SECRET`, enforce HTTPS, and change all seeded/demo passwords.
