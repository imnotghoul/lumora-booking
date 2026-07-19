import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, description, className }: { eyebrow: string; title: string; description: string; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden border-b border-line bg-white", className)}>
      <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="container-page relative py-12 sm:py-16 lg:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-600">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-balance text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">{description}</p>
      </div>
    </section>
  );
}
