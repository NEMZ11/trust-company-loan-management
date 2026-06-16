import { addDays } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/ui";
import { daysPast, money, shortDate } from "@/lib/format";
import { balanceFor, paidTotal } from "@/lib/loan-math";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [borrowerCount, loans, repayments, dueSoon] = await Promise.all([
    prisma.borrower.count(),
    prisma.loan.findMany({ include: { borrower: true, repayments: true, assignedOfficer: true }, orderBy: { createdAt: "desc" } }),
    prisma.repayment.findMany({ include: { loan: { include: { borrower: true } }, recordedBy: true }, orderBy: { paymentDate: "desc" }, take: 6 }),
    prisma.loan.findMany({
      where: { dueDate: { gte: new Date(), lte: addDays(new Date(), 30) }, status: { in: ["ACTIVE", "APPROVED"] } },
      include: { borrower: true, assignedOfficer: true },
      orderBy: { dueDate: "asc" },
      take: 6
    })
  ]);

  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "APPROVED");
  const overdueLoans = loans.filter((loan) => loan.dueDate < new Date() && loan.status !== "COMPLETED");
  const totalLoaned = loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
  const totalRepaid = loans.reduce((sum, loan) => sum + paidTotal(loan.repayments), 0);
  const outstanding = loans.reduce((sum, loan) => sum + balanceFor(loan), 0);

  const stats = [
    ["Total borrowers", borrowerCount.toLocaleString()],
    ["Active loans", activeLoans.length.toLocaleString()],
    ["Overdue loans", overdueLoans.length.toLocaleString()],
    ["Money loaned out", money(totalLoaned)],
    ["Repayments received", money(totalRepaid)],
    ["Outstanding balances", money(outstanding)]
  ];

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label} className="p-5">
            <div className="text-sm font-medium text-slate-500 text-safe">{label}</div>
            <div className="mt-2 text-xl font-bold text-slate-950 number-safe sm:text-2xl">{value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Overdue and Default Monitoring" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Loan</th><th>Borrower</th><th>Days overdue</th><th>Balance</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-5 py-3 font-semibold">{loan.loanNumber}</td>
                    <td>{loan.borrower.fullName}</td>
                    <td>{daysPast(loan.dueDate)}</td>
                    <td>{money(balanceFor(loan))}</td>
                    <td><Badge value={loan.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Repayment Activity" />
          <div className="divide-y divide-slate-100">
            {repayments.map((repayment) => (
              <div key={repayment.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-safe">{repayment.loan.borrower.fullName}</div>
                  <div className="text-slate-500 text-safe">{repayment.loan.loanNumber} recorded by {repayment.recordedBy.name}</div>
                </div>
                <div className="min-w-0 text-right">
                  <div className="font-bold text-slate-950 number-safe">{money(repayment.amountPaid)}</div>
                  <div className="text-xs text-slate-500">{shortDate(repayment.paymentDate)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Loans Due Soon" />
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {dueSoon.map((loan) => (
            <div key={loan.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 font-semibold text-safe">{loan.borrower.fullName}</div>
                <Badge value={loan.status} />
              </div>
              <div className="mt-2 text-sm text-slate-500 text-safe">{loan.loanNumber} due {shortDate(loan.dueDate)}</div>
              <div className="mt-1 text-sm text-slate-500 text-safe">Officer: {loan.assignedOfficer.name}</div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
