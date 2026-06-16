import { clsx } from "clsx";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={clsx(compact ? "flex items-center" : "flex justify-center", className)}>
      <img
        src="/company-logo.svg"
        alt="Trust Company logo"
        className={compact ? "h-20 w-auto object-contain" : "h-auto w-full max-w-sm object-contain"}
      />
    </div>
  );
}
