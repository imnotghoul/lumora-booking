import Link from "next/link";
import { ArrowRight, Clock3, Flower2, HeartPulse, Scissors, Sparkles, WandSparkles, type LucideIcon } from "lucide-react";
import type { ServiceDto } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const icons: Record<string, LucideIcon> = {
  scissors: Scissors,
  sparkles: Sparkles,
  flower: Flower2,
  wellness: HeartPulse,
  wand: WandSparkles,
};

export function ServiceGlyph({ icon, className = "size-5" }: { icon: string; className?: string }) {
  const Icon = icons[icon.toLowerCase()] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}

export function ServiceCard({ service, compact = false }: { service: ServiceDto; compact?: boolean }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent-200 hover:shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent-50 text-accent-600 transition-colors group-hover:bg-accent-600 group-hover:text-white">
          <ServiceGlyph icon={service.icon} />
        </span>
        {service.featured ? <Badge tone="accent">Популярно</Badge> : null}
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-accent-600">{service.category}</p>
      <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-ink">{service.name}</h2>
      <p className={`mt-3 text-sm leading-6 text-muted ${compact ? "line-clamp-2" : ""}`}>{service.description}</p>
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="flex items-center gap-1.5 text-sm text-muted"><Clock3 className="size-4 text-accent-500" aria-hidden />{formatDuration(service.duration)}</span>
          <span className="text-lg font-extrabold text-ink">{formatPrice(service.price)}</span>
        </div>
        <Link href={`/book?service=${encodeURIComponent(service.id)}`} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-50 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-600 hover:text-white">
          Выбрать услугу <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
