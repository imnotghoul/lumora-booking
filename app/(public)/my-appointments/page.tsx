import type { Metadata } from "next";
import { MyAppointments } from "@/components/booking/my-appointments";
import { PageHero } from "@/components/public/page-hero";

export const metadata: Metadata = { title: "Мои записи", description: "Найдите, проверьте или отмените свою запись в Lumora.", robots: { index: false, follow: false } };

export default function MyAppointmentsPage() {
  return <><PageHero eyebrow="Личный раздел" title="Мои записи" description="Проверяйте будущие визиты и управляйте ими без звонка. Для поиска нужен телефон или email из формы записи." /><section className="container-page py-10 sm:py-14"><MyAppointments /></section></>;
}
