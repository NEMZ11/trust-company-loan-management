import { AppShell } from "@/components/app-shell";
import { Button, Card, CardHeader, Field } from "@/components/ui";
import { createBranchAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BranchesPage() {
  await requireAdmin();
  const branches = await prisma.branch.findMany({ include: { users: true, loans: true }, orderBy: { name: "asc" } });

  return (
    <AppShell title="Branch Management">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
        <Card>
          <CardHeader title="Branches" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Branch</th><th>Code</th><th>Address</th><th>Phone</th><th>Staff</th><th>Loans</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="px-5 py-3 font-semibold text-safe">{branch.name}</td>
                    <td className="text-safe">{branch.code}</td>
                    <td className="text-safe">{branch.address}</td>
                    <td className="number-safe">{branch.phone}</td>
                    <td>{branch.users.length}</td>
                    <td>{branch.loans.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Add Branch</h2>
          <form action={createBranchAction} className="grid gap-4">
            <Field label="Name"><input name="name" required /></Field>
            <Field label="Code"><input name="code" required /></Field>
            <Field label="Address"><input name="address" required /></Field>
            <Field label="Phone"><input name="phone" /></Field>
            <Button>Create branch</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
