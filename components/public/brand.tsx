import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-xl", className)} aria-label="Lumora — на главную">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-md shadow-accent-200/60 transition-transform group-hover:-rotate-3 group-hover:scale-105">
        <Sparkles className="size-5" aria-hidden />
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block text-lg font-extrabold tracking-[-0.025em] text-ink">Lumora</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">студия заботы</span>
        </span>
      ) : null}
    </Link>
  );
}
