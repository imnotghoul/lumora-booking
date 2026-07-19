import Link from "next/link";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/components/public/brand";

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_.8fr_.9fr] lg:py-16">
        <div>
          <Brand />
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted">Место, где забота о себе легко становится частью вашего дня.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">Навигация</h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted">
            <li><Link className="hover:text-accent-700" href="/services">Услуги и цены</Link></li>
            <li><Link className="hover:text-accent-700" href="/specialists">Наши специалисты</Link></li>
            <li><Link className="hover:text-accent-700" href="/book">Онлайн-запись</Link></li>
            <li><Link className="hover:text-accent-700" href="/admin/login">Для сотрудников</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">Контакты</h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted">
            <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden /><span>Москва, ул. Покровка, 12</span></li>
            <li><a className="flex gap-3 hover:text-accent-700" href="tel:+74951234567"><Phone className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden />+7 (495) 123-45-67</a></li>
            <li><a className="flex gap-3 hover:text-accent-700" href="mailto:hello@lumora.ru"><Mail className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden />hello@lumora.ru</a></li>
            <li className="flex gap-3"><Clock3 className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden /><span>Пн–Сб, 09:00–21:00</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lumora. Все права защищены.</p>
          <p>Демонстрационный portfolio-проект</p>
        </div>
      </div>
    </footer>
  );
}
