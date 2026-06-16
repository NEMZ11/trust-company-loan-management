"use client";

import { useActionState } from "react";
import { ArrowRight, BadgeDollarSign, Building2, ShieldCheck } from "lucide-react";
import { loginAction } from "@/app/actions";
import { BrandLogo } from "@/components/brand";
import { Button, Field } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  const showDemoCredentials = process.env.NODE_ENV !== "production";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,rgba(219,234,254,0.35)_24%,transparent_52%),radial-gradient(circle_at_bottom_right,#fee2e2_0%,rgba(254,226,226,0.45)_18%,transparent_46%),linear-gradient(135deg,#eef4ff_0%,#f8fbff_40%,#fff7f5_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-full overflow-hidden bg-[linear-gradient(160deg,#17347d_0%,#1e40af_48%,#dc2626_100%)] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff22_0%,transparent_38%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.08)_100%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              Staff Portal
            </div>
            <BrandLogo className="mt-8 justify-start" compact />
            <h1 className="mt-10 max-w-sm text-4xl font-semibold leading-tight text-white">
              Loan operations with cleaner approvals, clearer portfolios, and branch-level control.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/78">
              Sign in to manage borrowers, review submissions, track repayments, and keep the lending book moving with confidence.
            </p>
          </div>

          <div className="relative mt-10 grid gap-4">
            <div className="flex items-start gap-3 rounded-2xl border border-white/16 bg-white/10 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div>
                <div className="text-sm font-semibold text-white">Protected access</div>
                <p className="mt-1 text-sm leading-6 text-white/75">Separate administrator and staff access keeps approvals and updates accountable.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/16 bg-white/10 p-4">
              <BadgeDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div>
                <div className="text-sm font-semibold text-white">Live loan visibility</div>
                <p className="mt-1 text-sm leading-6 text-white/75">Track exposure, penalties, extra interest, repayments, and overdue balances in one place.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/16 bg-white/10 p-4">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div>
                <div className="text-sm font-semibold text-white">Branch-ready workflow</div>
                <p className="mt-1 text-sm leading-6 text-white/75">Built for head office oversight while still fitting daily branch operations.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                Staff Portal
              </div>
              <BrandLogo className="mt-5 justify-start" compact />
            </div>

            <div className="mt-6 lg:mt-0">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Internal access</div>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Sign in to Trust Loans</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use your staff or administrator account to continue into the loan operations workspace.
              </p>
            </div>

            <form action={action} className="mt-8 grid gap-4">
              <Field label="Email">
                <input name="email" type="email" defaultValue={showDemoCredentials ? "admin@trustcompany.local" : ""} required />
              </Field>
              <Field label="Password">
                <input name="password" type="password" defaultValue={showDemoCredentials ? "admin123" : ""} required />
              </Field>
              {state?.error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p> : null}
              <Button className="mt-2 gap-2 rounded-xl py-3">
                {pending ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {showDemoCredentials ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-700">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Demo access</div>
                <div className="mt-3 space-y-2">
                  <p>Admin: admin@trustcompany.local / admin123</p>
                  <p>Staff: williams@trustcompany.local / williams123</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
