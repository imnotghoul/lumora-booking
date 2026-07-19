import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Онлайн-запись", description: "Запишитесь в Lumora за пять простых шагов: услуга, специалист, время, контакты и подтверждение." };

export default function BookPage() {
  return (
    <section className="container-page py-8 sm:py-12">
      <div className="mb-7 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-accent-600">Онлайн-запись</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-4xl">Найдите своё время</h1><p className="mt-3 text-sm leading-6 text-muted sm:text-base">Пять простых шагов — и всё готово. Никакой предоплаты.</p></div>
      <Suspense fallback={<><Skeleton className="h-20" /><Skeleton className="mt-6 h-[560px]" /></>}><BookingWizard /></Suspense>
    </section>
  );
}
