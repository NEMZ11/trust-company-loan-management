import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Button, Card, CardHeader, Field } from "@/components/ui";
import { createLoanAction, markNotificationGroupReadAction, updateLoanStatusAction } from "@/app/actions";
import { money, shortDate } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { balanceFor, paidTotal, totalDue } from "@/lib/loan-math";
import { prisma } from "@/lib/prisma";

export default async function LoansPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; officer?: string; dueFrom?: string; dueTo?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const [loans, borrowers, staff, branches] = await Promise.all([
    prisma.loan.findMany({
      where: {
        AND: [
          user.role === "STAFF" ? { assignedOfficerId: user.id } : {},
          params.q ? { OR: [{ loanNumber: { contains: params.q } }, { borrower: { fullName: { contains: params.q } } }, { borrower: { phone: { contains: params.q } } }] } : {},
          params.status ? { status: params.status as any } : {},
          params.officer ? { assignedOfficerId: params.officer } : {},
          params.dueFrom ? { dueDate: { gte: new Date(params.dueFrom) } } : {},
          params.dueTo ? { dueDate: { lte: new Date(params.dueTo) } } : {}
        ]
      },
      include: { borrower: true, repayments: true, assignedOfficer: true, branch: true, guarantors: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.borrower.findMany({ orderBy: { fullName: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } })
  ]);
  const portfolio = {
    pending: loans.filter((loan) => loan.status === "PENDING").length,
    active: loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "APPROVED").length,
    defaulted: loans.filter((loan) => loan.status === "DEFAULTED").length,
    outstanding: loans.reduce((sum, loan) => sum + balanceFor(loan), 0)
  };

  return (
    <AppShell title="Loan Management">
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(380px,440px)]">
        <Card>
          <CardHeader
            title="Loans"
            action={
              user.role === "ADMIN" ? (
                <form action={markNotificationGroupReadAction}>
                  <input type="hidden" name="category" value="LOANS" />
                  <button className="rounded-md border border-blue-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    Mark reviewed
                  </button>
                </form>
              ) : null
            }
          />
          <div className="grid gap-3 border-b border-blue-100 p-5 md:grid-cols-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-blue-700">Pending approvals</div>
              <div className="mt-2 text-2xl font-bold text-blue-950 number-safe">{portfolio.pending}</div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-blue-700">Active exposure</div>
              <div className="mt-2 text-2xl font-bold text-blue-950 number-safe">{portfolio.active}</div>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-red-700">Defaulted</div>
              <div className="mt-2 text-2xl font-bold text-red-950 number-safe">{portfolio.defaulted}</div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-blue-700">Outstanding</div>
              <div className="mt-2 text-xl font-bold text-blue-950 number-safe">{money(portfolio.outstanding)}</div>
            </div>
          </div>
          <form className="grid min-w-0 gap-3 border-b border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-6">
            <input name="q" placeholder="Borrower, phone, loan no." defaultValue={params.q ?? ""} />
            <select name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option><option>PENDING</option><option>APPROVED</option><option>ACTIVE</option><option>COMPLETED</option><option>DEFAULTED</option>
            </select>
            <select name="officer" defaultValue={params.officer ?? ""}>
              <option value="">All staff</option>{staff.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            <input name="dueFrom" type="date" defaultValue={params.dueFrom ?? ""} />
            <input name="dueTo" type="date" defaultValue={params.dueTo ?? ""} />
            <Button>Filter</Button>
          </form>
          <div className="grid gap-4 p-5">
            {loans.map((loan) => {
              const paid = paidTotal(loan.repayments);
              const due = totalDue(loan);
              const balance = balanceFor(loan);
              const progress = due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0;

              return (
                <article key={loan.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base font-bold text-slate-950 text-safe">{loan.loanNumber}</div>
                          <div className="mt-1 text-sm text-slate-500 text-safe">{loan.borrower.fullName} · {loan.borrower.phone}</div>
                        </div>
                        <Badge value={loan.status} />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <div className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-semibold uppercase text-slate-500">Principal</div>
                          <div className="mt-1 font-bold number-safe">{money(loan.amount)}</div>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-semibold uppercase text-slate-500">Outstanding</div>
                          <div className="mt-1 font-bold text-red-700 number-safe">{money(balance)}</div>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-semibold uppercase text-slate-500">Due date</div>
                          <div className="mt-1 font-bold">{shortDate(loan.dueDate)}</div>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-semibold uppercase text-slate-500">Officer</div>
                          <div className="mt-1 font-bold text-safe">{loan.assignedOfficer.name}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase text-slate-500">
                          <span>Repayment progress</span>
                          <span className="number-safe">{money(paid)} of {money(due)}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-blue-100 bg-brand-50 p-3">
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Branch</span><span className="font-semibold text-safe">{loan.branch.code}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Interest</span><span className="font-semibold number-safe">{Number(loan.interestRate)}%</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Extra interest</span><span className="font-semibold number-safe">{Number(loan.extraInterestRate)}%</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Penalty</span><span className="font-semibold number-safe">{money(loan.latePenaltyAmount)}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Duration</span><span className="font-semibold">{loan.durationMonths} months</span></div>
                      </div>

                      {user.role === "ADMIN" ? (
                        <form action={updateLoanStatusAction} className="mt-4 grid gap-2 border-t border-blue-100 pt-3">
                          <input type="hidden" name="loanId" value={loan.id} />
                          <label>Admin decision</label>
                          <select name="status" defaultValue={loan.status}>
                            <option>PENDING</option>
                            <option>APPROVED</option>
                            <option>ACTIVE</option>
                            <option>COMPLETED</option>
                            <option>DEFAULTED</option>
                          </select>
                          <button className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">Update loan</button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Create Loan</h2>
          <form action={createLoanAction} className="grid gap-4">
            <Field label="Borrower"><select name="borrowerId" required>{borrowers.map((b) => <option key={b.id} value={b.id}>{b.fullName}</option>)}</select></Field>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Field label="Amount"><input name="amount" type="number" min="1" required /></Field>
              <Field label="Interest rate %"><input name="interestRate" type="number" min="0" step="0.1" required /></Field>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Field label="Duration months"><input name="durationMonths" type="number" min="1" required /></Field>
              <Field label="Start date"><input name="startDate" type="date" required /></Field>
            </div>
            {user.role === "ADMIN" ? (
              <>
                <Field label="Status"><select name="status" defaultValue="PENDING"><option>PENDING</option><option>APPROVED</option><option>ACTIVE</option></select></Field>
                <Field label="Loan officer"><select name="assignedOfficerId">{staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
                <Field label="Branch"><select name="branchId">{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
              </>
            ) : (
              <div className="rounded-md border border-blue-100 bg-brand-50 px-3 py-2 text-sm text-slate-700">
                Staff loan submissions are automatically marked pending for administrator approval.
              </div>
            )}
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Field label="Late penalty amount"><input name="latePenaltyAmount" type="number" min="0" defaultValue="0" /></Field>
              <Field label="Extra interest rate %"><input name="extraInterestRate" type="number" min="0" step="0.1" defaultValue="0" /></Field>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-3 text-xs font-bold uppercase text-slate-500">Guarantor</div>
              <div className="grid gap-3">
                <input name="guarantorName" placeholder="Full name" required />
                <input name="guarantorPhone" placeholder="Phone" required />
                <input name="guarantorRelationship" placeholder="Relationship" required />
                <input name="guarantorAddress" placeholder="Address" required />
                <input name="guarantorIdentification" placeholder="Identification number" required />
              </div>
            </div>
            <Field label="Notes"><textarea name="notes" rows={3} /></Field>
            <Button>Create loan</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
