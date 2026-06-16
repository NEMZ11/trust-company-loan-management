import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/ui";
import { money } from "@/lib/format";
import { balanceFor, paidTotal } from "@/lib/loan-math";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const [loans, staff, repayments] = await Promise.all([
    prisma.loan.findMany({ include: { borrower: true, repayments: true, assignedOfficer: true } }),
    prisma.user.findMany({ include: { loans: { include: { repayments: true } }, branch: true }, orderBy: { name: "asc" } }),
    prisma.repayment.findMany({ orderBy: { paymentDate: "desc" } })
  ]);

  const statuses = ["ACTIVE", "COMPLETED", "DEFAULTED", "PENDING", "APPROVED"];
  const monthly = repayments.reduce<Record<string, number>>((acc, repayment) => {
    const key = format(repayment.paymentDate, "yyyy-MM");
    acc[key] = (acc[key] ?? 0) + Number(repayment.amountPaid);
    return acc;
  }, {});

  return (
    <AppShell title="Reports & Analytics">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Loan Portfolio by Status" />
          <div className="grid gap-3 p-5">
            {statuses.map((status) => {
              const group = loans.filter((loan) => loan.status === status);
              return (
                <div key={status} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-4">
                  <div className="flex min-w-0 items-center gap-3"><Badge value={status} /><span className="text-sm text-slate-500 text-safe">{group.length} loans</span></div>
                  <div className="font-semibold number-safe">{money(group.reduce((sum, loan) => sum + Number(loan.amount), 0))}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Monthly Repayments" />
          <div className="divide-y divide-slate-100">
            {Object.entries(monthly).map(([month, total]) => (
              <div key={month} className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span className="font-medium text-safe">{month}</span>
                <span className="font-bold number-safe">{money(total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Staff Performance" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-3">Staff member</th><th>Branch</th><th>Assigned loans</th><th>Active/defaulted</th><th>Collections</th><th>Outstanding</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((user) => {
                const collections = user.loans.reduce((sum, loan) => sum + paidTotal(loan.repayments), 0);
                const outstanding = user.loans.reduce((sum, loan) => sum + balanceFor(loan), 0);
                return (
                  <tr key={user.id}>
                    <td className="px-5 py-3 font-semibold text-safe">{user.name}</td>
                    <td className="text-safe">{user.branch?.name ?? "Unassigned"}</td>
                    <td>{user.loans.length}</td>
                    <td>{user.loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "DEFAULTED").length}</td>
                    <td className="number-safe">{money(collections)}</td>
                    <td className="number-safe">{money(outstanding)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
