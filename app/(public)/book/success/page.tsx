import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingSuccess } from "@/components/booking/booking-success";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Запись подтверждена", robots: { index: false, follow: false } };

export default function BookingSuccessPage() {
  return <section className="container-page py-12 sm:py-16"><Suspense fallback={<div className="mx-auto max-w-3xl"><Skeleton className="mx-auto size-20 rounded-full" /><Skeleton className="mx-auto mt-8 h-10 w-96 max-w-full" /><Skeleton className="mt-8 h-80" /></div>}><BookingSuccess /></Suspense></section>;
}
