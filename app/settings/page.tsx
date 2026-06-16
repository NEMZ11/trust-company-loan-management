import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button, Card, CardHeader, Field } from "@/components/ui";
import { resetStaffPasswordAction, toggleStaffActiveAction, updateCurrentUserAccountAction, updateCurrentUserPasswordAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusCopy: Record<string, { tone: string; message: string }> = {
  "account-saved": {
    tone: "border-blue-100 bg-blue-50 text-blue-800",
    message: "Account details updated."
  },
  "password-saved": {
    tone: "border-blue-100 bg-blue-50 text-blue-800",
    message: "Password changed successfully."
  },
  "staff-password-saved": {
    tone: "border-blue-100 bg-blue-50 text-blue-800",
    message: "Staff password updated."
  },
  "staff-status-saved": {
    tone: "border-blue-100 bg-blue-50 text-blue-800",
    message: "Staff access updated."
  },
  "invalid-account": {
    tone: "border-red-100 bg-red-50 text-red-700",
    message: "Enter a valid full name, email, and phone number."
  },
  "invalid-password": {
    tone: "border-red-100 bg-red-50 text-red-700",
    message: "Password update failed. Use at least 8 characters and make sure both password fields match."
  },
  "email-taken": {
    tone: "border-red-100 bg-red-50 text-red-700",
    message: "That email is already in use by another account."
  },
  "current-password-wrong": {
    tone: "border-red-100 bg-red-50 text-red-700",
    message: "Current password is incorrect."
  },
  "staff-password-short": {
    tone: "border-red-100 bg-red-50 text-red-700",
    message: "Staff passwords must be at least 8 characters long."
  }
};

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const status = params.status ? statusCopy[params.status] : null;
  const managedUsers =
    user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { id: { not: user.id } },
          include: { branch: true },
          orderBy: [{ role: "asc" }, { name: "asc" }]
        })
      : [];

  return (
    <AppShell title="Settings">
      <div className="grid gap-6">
        {status ? (
          <div className={`rounded-lg border px-4 py-3 text-sm ${status.tone}`}>{status.message}</div>
        ) : null}

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Account" />
            <div className="grid gap-5 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Role</div>
                  <div className="mt-2"><Badge value={user.role} /></div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Branch</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{user.branch?.name ?? "Unassigned"}</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">User</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{user.name}</div>
                </div>
              </div>

              <form action={updateCurrentUserAccountAction} className="grid gap-4">
                <Field label="Full name">
                  <input name="name" defaultValue={user.name} required />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" defaultValue={user.email} required />
                </Field>
                <Field label="Phone">
                  <input name="phone" defaultValue={user.phone ?? ""} />
                </Field>
                <Button>Save account details</Button>
              </form>
            </div>
          </Card>

          <Card>
            <CardHeader title="Security" />
            <div className="grid gap-5 p-5">
              <form action={updateCurrentUserPasswordAction} className="grid gap-4">
                <Field label="Current password">
                  <input name="currentPassword" type="password" required />
                </Field>
                <Field label="New password">
                  <input name="newPassword" type="password" minLength={8} required />
                </Field>
                <Field label="Confirm new password">
                  <input name="confirmPassword" type="password" minLength={8} required />
                </Field>
                <Button>Change password</Button>
              </form>
            </div>
          </Card>
        </div>

        {user.role === "ADMIN" ? (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,380px)]">
            <Card>
              <CardHeader title="Staff Access Control" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {managedUsers.map((managedUser) => (
                      <tr key={managedUser.id}>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900 text-safe">{managedUser.name}</div>
                        </td>
                        <td className="text-safe">{managedUser.email}</td>
                        <td><Badge value={managedUser.role} /></td>
                        <td className="text-safe">{managedUser.branch?.name ?? "Unassigned"}</td>
                        <td>{managedUser.isActive ? "Active" : "Inactive"}</td>
                        <td className="px-5 py-3">
                          <form action={toggleStaffActiveAction} className="flex justify-end">
                            <input type="hidden" name="staffId" value={managedUser.id} />
                            <input type="hidden" name="makeActive" value={managedUser.isActive ? "false" : "true"} />
                            <ConfirmSubmitButton
                              className={`rounded-md px-3 py-2 text-xs font-semibold ${
                                managedUser.isActive
                                  ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border border-blue-100 bg-brand-50 text-brand-700 hover:bg-brand-100"
                              }`}
                              message={`${managedUser.isActive ? "Deactivate" : "Reactivate"} ${managedUser.name}?`}
                            >
                              {managedUser.isActive ? "Deactivate" : "Reactivate"}
                            </ConfirmSubmitButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Reset Staff Password</h2>
              <form action={resetStaffPasswordAction} className="grid gap-4">
                <Field label="Staff member">
                  <select name="staffId" required>
                    {managedUsers.map((managedUser) => (
                      <option key={managedUser.id} value={managedUser.id}>
                        {managedUser.name} - {managedUser.role}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="New password">
                  <input name="newPassword" minLength={8} required />
                </Field>
                <Button>Reset password</Button>
              </form>
              <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                Staff records and branches still have their dedicated management screens.
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link className="font-semibold text-brand-700 hover:text-brand-800" href="/staff">
                    Open staff administration
                  </Link>
                  <Link className="font-semibold text-brand-700 hover:text-brand-800" href="/branches">
                    Open branch management
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
