import { statusTone } from "@/lib/format";

export function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold ring-1 text-safe ${statusTone(value)}`}>
      {value.replace("_", " ")}
    </span>
  );
}
