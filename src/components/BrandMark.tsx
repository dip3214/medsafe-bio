import { HeartPulse } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5" aria-label="MedSafe">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-4 ring-accent/35">
        <HeartPulse className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="truncate text-xl font-bold tracking-normal text-primary">
          med<span className="text-brand-secondary">Safe</span>
        </span>
      )}
    </span>
  );
}