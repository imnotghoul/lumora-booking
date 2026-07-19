"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import type { ServiceDto, SpecialistDto } from "@/lib/types";
import { apiRequest } from "@/components/public/api-client";
import { ServiceCard } from "@/components/public/service-card";
import { SpecialistCard } from "@/components/public/specialist-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function HomeShowcase() {
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest<ServiceDto[]>("/api/services", { signal: controller.signal }),
      apiRequest<SpecialistDto[]>("/api/specialists", { signal: controller.signal }),
    ]).then(([serviceData, specialistData]) => {
      setServices(serviceData.filter((item) => item.active).sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3));
      setSpecialists(specialistData.filter((item) => item.active).slice(0, 3));
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Данные пока недоступны.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <ShowcaseSkeleton />;
  if (error) return <div className="container-page py-16"><EmptyState icon={CircleAlert} title="Не удалось загрузить подборку" description={error} /></div>;

  return (
    <>
      <section className="container-page py-16 sm:py-20" aria-labelledby="popular-services">
        <SectionHeading id="popular-services" eyebrow="Чаще выбирают" title="Популярные услуги" href="/services" linkLabel="Все услуги" />
        {services.length ? <div className="mt-8 grid gap-5 md:grid-cols-3">{services.map((service) => <ServiceCard key={service.id} service={service} compact />)}</div> : null}
      </section>
      <section className="border-y border-line bg-white" aria-labelledby="our-team">
        <div className="container-page py-16 sm:py-20">
          <SectionHeading id="our-team" eyebrow="Команда" title="Специалисты, которым доверяют" href="/specialists" linkLabel="Вся команда" />
          {specialists.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{specialists.map((specialist) => <SpecialistCard key={specialist.id} specialist={specialist} compact />)}</div> : null}
        </div>
      </section>
    </>
  );
}

function SectionHeading({ id, eyebrow, title, href, linkLabel }: { id: string; eyebrow: string; title: string; href: string; linkLabel: string }) {
  return <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent-600">{eyebrow}</p><h2 id={id} className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">{title}</h2></div><Link className={cn(buttonStyles({ variant: "outline" }), "w-fit")} href={href}>{linkLabel}<ArrowRight className="size-4" aria-hidden /></Link></div>;
}

function ShowcaseSkeleton() {
  return <div className="container-page py-16" role="status"><Skeleton className="h-8 w-72 max-w-full" /><div className="mt-8 grid gap-5 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-80" />)}</div><span className="sr-only">Загружаем подборку…</span></div>;
}
