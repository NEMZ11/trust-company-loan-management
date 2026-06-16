import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Button, Card, CardHeader, Field } from "@/components/ui";
import { createBorrowerAction, markNotificationGroupReadAction, updateBorrowerKycAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BorrowersPage({ searchParams }: { searchParams: Promise<{ q?: string; kyc?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q ?? "";
  const borrowers = await prisma.borrower.findMany({
    where: {
      AND: [
        q ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }, { nationalId: { contains: q } }] } : {},
        params.kyc ? { kycStatus: params.kyc as any } : {}
      ]
    },
    include: { loans: true },
    orderBy: { createdAt: "desc" }
  });
  const kycStats = [
    { label: "Pending review", value: borrowers.filter((borrower) => borrower.kycStatus === "PENDING").length, tone: "border-blue-100 bg-blue-50 text-blue-800" },
    { label: "Verified", value: borrowers.filter((borrower) => borrower.kycStatus === "VERIFIED").length, tone: "border-blue-100 bg-white text-blue-800" },
    { label: "Rejected", value: borrowers.filter((borrower) => borrower.kycStatus === "REJECTED").length, tone: "border-red-100 bg-red-50 text-red-800" }
  ];

  return (
    <AppShell title="Borrower Management">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
        <Card>
          <CardHeader
            title="Borrowers"
            action={
              user.role === "ADMIN" ? (
                <form action={markNotificationGroupReadAction}>
                  <input type="hidden" name="category" value="BORROWERS" />
                  <button className="rounded-md border border-blue-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    Mark reviewed
                  </button>
                </form>
              ) : null
            }
          />
          <div className="grid gap-3 border-b border-blue-100 p-5 md:grid-cols-3">
            {kycStats.map((stat) => (
              <div key={stat.label} className={`rounded-lg border p-4 ${stat.tone}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.06em]">{stat.label}</div>
                <div className="mt-2 text-2xl font-bold number-safe">{stat.value}</div>
              </div>
            ))}
          </div>
          <form className="grid min-w-0 gap-3 border-b border-slate-100 p-5 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input name="q" placeholder="Search name, phone, or ID" defaultValue={q} />
            <select name="kyc" defaultValue={params.kyc ?? ""}>
              <option value="">All KYC statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <Button>Filter</Button>
          </form>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {borrowers.map((borrower) => (
              <article key={borrower.id} className="min-w-0 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-bold text-slate-950 text-safe">{borrower.fullName}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 text-safe">{borrower.nationalId}</div>
                  </div>
                  <Badge value={borrower.kycStatus} />
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-md bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Phone</div>
                    <div className="mt-1 font-medium number-safe">{borrower.phone}</div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Occupation</div>
                    <div className="mt-1 font-medium text-safe">{borrower.occupation}</div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Emergency contact</div>
                    <div className="mt-1 font-medium text-safe">{borrower.emergencyContact}</div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Loan records</div>
                    <div className="mt-1 font-medium">{borrower.loans.length}</div>
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-slate-100 p-3 text-sm text-slate-600 text-safe">
                  {borrower.address}
                  {borrower.notes ? <span> · {borrower.notes}</span> : null}
                </div>

                {user.role === "ADMIN" ? (
                  <form action={updateBorrowerKycAction} className="mt-4 flex min-w-0 flex-wrap items-end gap-2 border-t border-blue-100 pt-4">
                    <input type="hidden" name="borrowerId" value={borrower.id} />
                    <div className="min-w-44 flex-1">
                      <label>KYC decision</label>
                      <select name="kycStatus" defaultValue={borrower.kycStatus}>
                        <option value="PENDING">Pending</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    <button className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">Save KYC</button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Add Borrower</h2>
          <form action={createBorrowerAction} className="grid gap-4">
            <Field label="Full name"><input name="fullName" required /></Field>
            <Field label="Phone number"><input name="phone" required /></Field>
            <Field label="National ID"><input name="nationalId" required /></Field>
            <Field label="Address"><input name="address" required /></Field>
            <Field label="Occupation or business"><input name="occupation" required /></Field>
            <Field label="Emergency contact"><input name="emergencyContact" required /></Field>
            <div className="rounded-md border border-blue-100 bg-brand-50 px-3 py-2 text-sm text-slate-700">
              New borrowers are registered as pending until an administrator verifies or rejects KYC.
            </div>
            <Field label="Notes"><textarea name="notes" rows={3} /></Field>
            <Button>Create borrower</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
