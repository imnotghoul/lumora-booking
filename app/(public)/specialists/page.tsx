import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { SpecialistsCatalog } from "@/components/public/specialists-catalog";

export const metadata: Metadata = { title: "Специалисты", description: "Команда Lumora: опыт, рейтинги, направления работы и онлайн-запись." };

export default function SpecialistsPage() {
  return <><PageHero eyebrow="Команда Lumora" title="Мастеры с тонким чувством стиля и заботы" description="Выбирайте по направлению, опыту или просто по ощущению «мой человек». Каждый специалист прошёл профессиональный отбор." /><section className="container-page py-10 sm:py-14"><SpecialistsCatalog /></section></>;
}
