# Trust Company Loan Management System

A browser-based internal loan operations platform for a lending business. The system supports borrower onboarding, loan applications, guarantor management, repayment tracking, overdue monitoring, branch operations, staff accounts, and reporting.

## Why This Project Matters

This project models a real business workflow rather than a toy CRUD app. It shows how software can support lending operations, reduce manual tracking, and give staff a clearer view of borrowers, loans, repayments, overdue accounts, and branch performance.

## Screenshots

### Desktop Login

![Desktop login](./public/screenshots/login-desktop.png)

### Mobile Login

![Mobile login](./public/screenshots/login-mobile.png)

### Admin Reports

![Admin reports](./public/screenshots/reports-admin.png)

### Staff Settings

![Staff settings](./public/screenshots/settings-staff.png)

## Tech Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend:** Next.js server actions, Node.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth/Security:** Staff login, password hashing, role-based access
- **Testing:** Playwright end-to-end tests
- **Tools:** Git, GitHub, VS Code, npm

## Features

- Secure staff login with administrator and staff roles
- Borrower profiles with KYC status, contact data, emergency contact, and notes
- Loan creation with officer assignment, branch assignment, interest, duration, due date, penalties, guarantor details, and status
- Repayment tracking with remaining balance calculation
- Automatic completion when a loan is fully paid
- Overdue/default monitoring with days overdue
- Dashboard metrics for borrowers, active loans, overdue loans, money loaned, repayments, and outstanding balances
- Search and filtering for borrowers, loan status, due dates, and assigned staff
- Reports for loan status, monthly repayments, and staff performance
- Branch and staff administration

## Architecture

```mermaid
flowchart TD
    User["Staff / Admin User"] --> UI["Next.js + React UI"]
    UI --> Actions["Server Actions / API Logic"]
    Actions --> Auth["Authentication and Role Checks"]
    Actions --> Validation["Input Validation"]
    Actions --> Services["Loan and Repayment Workflows"]
    Services --> Prisma["Prisma ORM"]
    Prisma --> DB[("PostgreSQL Database")]

    DB --> Users["Users and Roles"]
    DB --> Branches["Branches"]
    DB --> Borrowers["Borrowers"]
    DB --> Loans["Loans"]
    DB --> Guarantors["Guarantors"]
    DB --> Repayments["Repayment Schedules and Payments"]

    Services --> Reports["Reports and Dashboard Metrics"]
    Reports --> UI
```

## Data Model

Main Prisma models:

- `User`
- `Branch`
- `Borrower`
- `Loan`
- `Guarantor`
- `RepaymentSchedule`
- `Repayment`
- `Notification`
- `AuditLog`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npx prisma generate
```

3. Create `.env` from `.env.example`:

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

7. Open:

```text
http://localhost:3000
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

## What I Built

- Designed the application structure and lending workflow.
- Implemented borrower, loan, guarantor, repayment, branch, staff, notification, and audit-log data models.
- Built staff-facing screens for loan operations and reporting.
- Added role-aware access patterns for administrator and staff users.
- Prepared deployment and backup/restore documentation for production readiness.

## Production Notes

Seeded local accounts are intended for development only. Keep passwords out of public documentation, rotate all seeded credentials before production use, enforce HTTPS, and set a strong `APP_SESSION_SECRET`.

## Future .NET Version

Because some junior developer roles require .NET, a smaller ASP.NET Core Web API version would be a strong follow-up project:

- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- JWT authentication
- CRUD endpoints for borrowers, loans, guarantors, and repayments
- xUnit unit tests
- Swagger/OpenAPI documentation
