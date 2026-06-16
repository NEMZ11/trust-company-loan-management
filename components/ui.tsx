import { cloneElement, isValidElement, useId } from "react";
import { clsx } from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("min-w-0 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-soft", className)}>{children}</div>;
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-5 py-4">
      <h2 className="min-w-0 text-sm font-semibold text-slate-900 text-safe">{title}</h2>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function Button({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      className={clsx(
        "inline-flex min-w-0 items-center justify-center rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const control =
    isValidElement(children) && typeof children.type !== "symbol"
      ? cloneElement(children, {
          ...(children.props ?? {}),
          id: children.props?.id ?? id,
          "aria-label": children.props?.["aria-label"] ?? label
        })
      : children;

  return (
    <div className="grid min-w-0 gap-1.5">
      <label className="text-safe" htmlFor={id}>{label}</label>
      {control}
    </div>
  );
}
