import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Button, Card, CardHeader, Field } from "@/components/ui";
import { markNotificationGroupReadAction, recordRepaymentAction } from "@/app/actions";
import { money, shortDate } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { balanceFor } from "@/lib/loan-math";
import { prisma } from "@/lib/prisma";

export default async function RepaymentsPage() {
  const user = await requireUser();
  const [loans, repayments] = await Promise.all([
    prisma.loan.findMany({
      where: {
        status: { in: ["APPROVED", "ACTIVE", "DEFAULTED"] },
        ...(user.role === "STAFF" ? { assignedOfficerId: user.id } : {})
      },
      include: { borrower: true, repayments: true },
      orderBy: { dueDate: "asc" }
    }),
    prisma.repayment.findMany({ include: { loan: { include: { borrower: true } }, recordedBy: true }, orderBy: { paymentDate: "desc" } })
  ]);

  return (
    <AppShell title="Repayment Tracking">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)]">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Record Repayment</h2>
          <form action={recordRepaymentAction} className="grid gap-4">
            <Field label="Loan">
              <select name="loanId" required>
                {loans.map((loan) => (
                  <option key={loan.id} value={loan.id}>{loan.loanNumber} - {loan.borrower.fullName} ({money(balanceFor(loan))} due)</option>
                ))}
              </select>
            </Field>
            <Field label="Amount paid"><input name="amountPaid" type="number" min="1" required /></Field>
            <Field label="Payment date"><input name="paymentDate" type="date" required /></Field>
            <Field label="Payment method">
              <select name="method"><option>CASH</option><option>BANK_TRANSFER</option><option>MOBILE_MONEY</option><option>CARD</option><option>CHEQUE</option></select>
            </Field>
            <Field label="Reference"><input name="reference" /></Field>
            <Field label="Notes"><textarea name="notes" rows={3} /></Field>
            <Button>Record payment</Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Repayment History"
            action={
              user.role === "ADMIN" ? (
                <form action={markNotificationGroupReadAction}>
                  <input type="hidden" name="category" value="REPAYMENTS" />
                  <button className="rounded-md border border-blue-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    Mark reviewed
                  </button>
                </form>
              ) : null
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Date</th><th>Borrower</th><th>Loan</th><th>Amount</th><th>Method</th><th>Recorded by</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repayments.map((repayment) => (
                  <tr key={repayment.id}>
                    <td className="px-5 py-3">{shortDate(repayment.paymentDate)}</td>
                    <td className="text-safe">{repayment.loan.borrower.fullName}</td>
                    <td className="text-safe">{repayment.loan.loanNumber}</td>
                    <td className="font-semibold number-safe">{money(repayment.amountPaid)}</td>
                    <td><Badge value={repayment.method} /></td>
                    <td className="text-safe">{repayment.recordedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
