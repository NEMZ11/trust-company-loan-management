import { differenceInCalendarDays, format } from "date-fns";

export function money(value: number | string | { toString(): string }) {
  const numeric = Number(value);
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function shortDate(value: Date | string) {
  return format(new Date(value), "MMM d, yyyy");
}

export function daysPast(date: Date | string) {
  return Math.max(0, differenceInCalendarDays(new Date(), new Date(date)));
}

export function loanPrincipalWithInterest(amount: number, interestRate: number) {
  return amount + amount * (interestRate / 100);
}

export function statusTone(status: string) {
  const tones: Record<string, string> = {
    PENDING: "bg-blue-50 text-blue-700 ring-blue-200",
    VERIFIED: "bg-blue-50 text-blue-800 ring-blue-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
    APPROVED: "bg-blue-50 text-blue-700 ring-blue-200",
    ACTIVE: "bg-blue-50 text-blue-800 ring-blue-200",
    COMPLETED: "bg-slate-100 text-slate-700 ring-slate-200",
    DEFAULTED: "bg-red-50 text-red-700 ring-red-200",
    ADMIN: "bg-brand-50 text-brand-700 ring-brand-100",
    STAFF: "bg-slate-100 text-slate-700 ring-slate-200"
  };

  return tones[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
}
