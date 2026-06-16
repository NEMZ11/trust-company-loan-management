import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Button, Card, CardHeader, Field } from "@/components/ui";
import { createStaffAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StaffPage() {
  await requireAdmin();
  const [staff, branches] = await Promise.all([
    prisma.user.findMany({ include: { branch: true, loans: true }, orderBy: { name: "asc" } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell title="Staff Administration">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
        <Card>
          <CardHeader title="Staff Accounts" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Assigned loans</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-3 font-semibold text-safe">{user.name}</td>
                    <td className="text-safe">{user.email}</td>
                    <td><Badge value={user.role} /></td>
                    <td className="text-safe">{user.branch?.name ?? "Unassigned"}</td>
                    <td>{user.loans.length}</td>
                    <td>{user.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Create Staff Account</h2>
          <form action={createStaffAction} className="grid gap-4">
            <Field label="Name"><input name="name" required /></Field>
            <Field label="Email"><input name="email" type="email" required /></Field>
            <Field label="Phone"><input name="phone" /></Field>
            <Field label="Role"><select name="role"><option value="STAFF">Staff / Loan Officer</option><option value="ADMIN">Administrator</option></select></Field>
            <Field label="Branch"><select name="branchId">{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></Field>
            <Field label="Temporary password"><input name="password" defaultValue="staff123" /></Field>
            <Button>Create staff</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
