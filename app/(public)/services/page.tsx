import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { ServicesCatalog } from "@/components/public/services-catalog";

export const metadata: Metadata = { title: "Услуги и цены", description: "Каталог услуг Lumora: актуальные цены, длительность и онлайн-запись." };

export default function ServicesPage() {
  return <><PageHero eyebrow="Каталог" title="Всё, чтобы почувствовать себя лучше" description="Прозрачные цены, понятная длительность и никаких скрытых условий. Выберите то, что подходит именно вам." /><section className="container-page py-10 sm:py-14"><ServicesCatalog /></section></>;
}
