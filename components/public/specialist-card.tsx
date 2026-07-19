import Link from "next/link";
import { ArrowRight, Award, Star } from "lucide-react";
import type { SpecialistDto } from "@/lib/types";

export function SpecialistAvatar({ specialist, className = "size-20 text-xl" }: { specialist: Pick<SpecialistDto, "name" | "initials" | "color">; className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl font-extrabold text-white shadow-lg ${className}`}
      style={{ background: `linear-gradient(145deg, ${specialist.color}, color-mix(in srgb, ${specialist.color} 70%, #172033))` }}
      role="img"
      aria-label={`Аватар: ${specialist.name}`}
    >
      {specialist.initials}
    </span>
  );
}

export function SpecialistCard({ specialist, compact = false }: { specialist: SpecialistDto; compact?: boolean }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent-200 hover:shadow-soft sm:p-6">
      <div className="flex items-start gap-4">
        <SpecialistAvatar specialist={specialist} />
        <div className="min-w-0 pt-1">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-ink">{specialist.name}</h2>
          <p className="mt-1 text-sm font-medium text-accent-700">{specialist.title}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-ink"><Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />{specialist.rating.toFixed(1)}</span>
        </div>
      </div>
      <p className={`mt-5 text-sm leading-6 text-muted ${compact ? "line-clamp-3" : ""}`}>{specialist.bio}</p>
      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2 border-t border-line pt-4 text-sm text-muted">
          <Award className="size-4 text-accent-500" aria-hidden />
          Опыт {specialist.experience} {yearLabel(specialist.experience)}
        </div>
        <Link href={`/book?specialist=${encodeURIComponent(specialist.id)}`} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-50 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-600 hover:text-white">
          Выбрать специалиста <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function yearLabel(value: number) {
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "лет";
  if (last === 1) return "год";
  if (last >= 2 && last <= 4) return "года";
  return "лет";
}
