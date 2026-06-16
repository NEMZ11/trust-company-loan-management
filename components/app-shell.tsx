import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Users,
  UserRoundCog
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { BrandLogo } from "@/components/brand";
import { prisma } from "@/lib/prisma";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/borrowers", label: "Borrowers", icon: Users, category: "BORROWERS" },
  { href: "/loans", label: "Loans", icon: BadgeDollarSign, category: "LOANS" },
  { href: "/repayments", label: "Repayments", icon: ReceiptText, category: "REPAYMENTS" },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/branches", label: "Branches", icon: Building2, adminOnly: true },
  { href: "/staff", label: "Staff", icon: UserRoundCog, adminOnly: true }
];

export async function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const visibleLinks = links.filter((item) => !item.adminOnly || user.role === "ADMIN");
  const notifications =
    user.role === "ADMIN"
      ? await prisma.notification.groupBy({
          by: ["category"],
          where: { read: false },
          _count: { _all: true }
        })
      : [];
  const notificationCounts = new Map(notifications.map((item) => [item.category, item._count._all]));

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-blue-100 bg-white lg:block">
        <div className="border-b border-blue-100 px-4 py-5">
          <BrandLogo compact />
        </div>
        <nav className="grid gap-1 px-3 py-4">
          {visibleLinks.map((item) => {
            const count = item.category ? notificationCounts.get(item.category) ?? 0 : 0;
            return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-w-0 items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-100 hover:bg-brand-50 hover:text-brand-700"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{item.label}</span>
              {count > 0 ? (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/95 backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-brand-700 via-brand-600 to-accent-600" />
          <div className="flex min-h-16 min-w-0 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-950 text-safe">{title}</h1>
              <p className="text-sm text-slate-500 text-safe">{user.branch?.name ?? "No branch assigned"}</p>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 max-w-64 text-right sm:block">
                <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
                <div className="truncate text-xs text-slate-500">{user.email}</div>
              </div>
              <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">{user.role}</span>
              <form action={logoutAction}>
                <button className="rounded-md border border-blue-100 p-2 text-slate-600 hover:bg-brand-50 hover:text-brand-700" title="Log out">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-blue-100 px-4 py-2 lg:hidden">
            {visibleLinks.map((item) => {
              const count = item.category ? notificationCounts.get(item.category) ?? 0 : 0;
              return (
              <Link key={item.href} href={item.href} className="relative whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                {item.label}
                {count > 0 ? <span className="ml-1 inline-block h-2 w-2 rounded-full bg-accent-600" /> : null}
              </Link>
              );
            })}
          </nav>
        </header>
        <main className="min-w-0 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
