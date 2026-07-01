# Architecture

The Trust Company Loan Management System is a Next.js application backed by PostgreSQL through Prisma ORM. It is structured around the operational workflow of a lending business: staff users manage borrowers, loans, guarantors, repayments, branches, reports, notifications, and audit history.

## System Flow

```mermaid
flowchart TD
    User["Staff / Admin User"] --> UI["Next.js App Router + React UI"]
    UI --> Actions["Server Actions / API Logic"]
    Actions --> Auth["Authentication and Role Checks"]
    Actions --> Validation["Validation and Business Rules"]
    Actions --> Workflows["Loan, Borrower, Guarantor, Repayment Workflows"]
    Workflows --> Prisma["Prisma ORM"]
    Prisma --> DB[("PostgreSQL")]

    DB --> UserModel["User"]
    DB --> BranchModel["Branch"]
    DB --> BorrowerModel["Borrower"]
    DB --> LoanModel["Loan"]
    DB --> GuarantorModel["Guarantor"]
    DB --> ScheduleModel["RepaymentSchedule"]
    DB --> RepaymentModel["Repayment"]
    DB --> NotificationModel["Notification"]
    DB --> AuditLogModel["AuditLog"]

    Workflows --> Dashboard["Dashboard Metrics"]
    Workflows --> Reports["Reports"]
    Dashboard --> UI
    Reports --> UI
```

## Main Responsibilities

- **UI layer:** Staff-facing screens for login, dashboard, borrowers, loans, repayments, reports, and settings.
- **Server logic:** Handles secured data access, workflow actions, validation, and business rules.
- **Database layer:** Prisma models represent the lending domain and enforce relational structure.
- **Security layer:** Login, password hashing, staff/admin roles, and production secret configuration.
- **Operational layer:** Deployment checklist, backup/restore guidance, and audit history.

## Core Entities

- `User`: staff and administrator accounts.
- `Branch`: branch-level organization.
- `Borrower`: customer identity, KYC status, contact details, and notes.
- `Loan`: loan amount, interest, officer assignment, branch, status, due date, penalties, and lifecycle.
- `Guarantor`: guarantor details connected to a loan.
- `RepaymentSchedule`: expected repayment dates and amounts.
- `Repayment`: actual repayment records.
- `Notification`: operational notices.
- `AuditLog`: trace of key actions.

## Design Notes

- The system is built around business workflows rather than isolated screens.
- Prisma keeps data access typed and consistent with the schema.
- Role-based access separates administrator and staff responsibilities.
- Reports and dashboard metrics give management visibility into repayment and overdue-loan status.
