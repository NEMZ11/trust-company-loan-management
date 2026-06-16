import Image from "next/image";
import { clsx } from "clsx";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={clsx(compact ? "flex items-center" : "flex justify-center", className)}>
      <Image
        src="/company-logo.svg"
        alt="Trust Company logo"
        width={320}
        height={96}
        className={compact ? "h-20 w-auto object-contain" : "h-auto w-full max-w-sm object-contain"}
      />
    </div>
  );
}
