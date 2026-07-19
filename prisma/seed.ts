import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { buildSlotLockStarts } from "../lib/server/availability";
import {
  addLocalDays,
  APP_TIMEZONE,
  getLocalDateString,
  zonedDateTimeToUtc,
} from "../lib/server/timezone";

const prisma = new PrismaClient();

const services = [
  {
    id: "service-facial",
    name: "Уход для сияния кожи",
    slug: "glow-facial",
    description: "Деликатное очищение, ферментный пилинг и увлажняющая маска для ровного тона и естественного сияния.",
    duration: 60,
    price: 4200,
    category: "Уход за лицом",
    icon: "Sparkles",
    featured: true,
  },
  {
    id: "service-massage",
    name: "Расслабляющий массаж",
    slug: "relax-massage",
    description: "Мягкая проработка всего тела, которая снимает напряжение, улучшает самочувствие и качество сна.",
    duration: 90,
    price: 5200,
    category: "Массаж",
    icon: "Waves",
    featured: true,
  },
  {
    id: "service-manicure",
    name: "Маникюр с покрытием",
    slug: "gel-manicure",
    description: "Комбинированный маникюр, бережное выравнивание и стойкое однотонное покрытие премиум-материалами.",
    duration: 90,
    price: 3200,
    category: "Ногтевой сервис",
    icon: "Hand",
    featured: true,
  },
  {
    id: "service-brows",
    name: "Архитектура и окрашивание бровей",
    slug: "brow-design",
    description: "Подбор гармоничной формы, коррекция и стойкое окрашивание с учётом особенностей лица и оттенка волос.",
    duration: 45,
    price: 2200,
    category: "Брови и ресницы",
    icon: "Eye",
    featured: false,
  },
  {
    id: "service-hair",
    name: "Стрижка и укладка",
    slug: "haircut-styling",
    description: "Персональная форма стрижки, уход и лёгкая укладка с рекомендациями по домашнему стайлингу.",
    duration: 60,
    price: 3800,
    category: "Волосы",
    icon: "Scissors",
    featured: true,
  },
  {
    id: "service-consultation",
    name: "Консультация косметолога",
    slug: "skin-consultation",
    description: "Диагностика состояния кожи и персональный план профессионального и домашнего ухода без навязывания процедур.",
    duration: 30,
    price: 1500,
    category: "Уход за лицом",
    icon: "MessageCircle",
    featured: false,
  },
] as const;

const specialists = [
  {
    id: "specialist-anna",
    name: "Анна Воронова",
    slug: "anna-voronova",
    title: "Ведущий косметолог",
    bio: "Работает с чувствительной и проблемной кожей, сочетая доказательный подход и бережные протоколы ухода.",
    experience: 9,
    rating: 4.9,
    color: "#6957D9",
    initials: "АВ",
  },
  {
    id: "specialist-maria",
    name: "Мария Соколова",
    slug: "maria-sokolova",
    title: "Массажист и телесный терапевт",
    bio: "Специализируется на расслабляющих и восстанавливающих техниках, помогает вернуть лёгкость и снизить стресс.",
    experience: 7,
    rating: 5,
    color: "#2E8B80",
    initials: "МС",
  },
  {
    id: "specialist-elena",
    name: "Елена Белова",
    slug: "elena-belova",
    title: "Nail-мастер и brow-стилист",
    bio: "Ценит чистую эстетику и точность: создаёт аккуратный маникюр и естественную архитектуру бровей.",
    experience: 6,
    rating: 4.8,
    color: "#C96C8A",
    initials: "ЕБ",
  },
  {
    id: "specialist-alexey",
    name: "Алексей Орлов",
    slug: "alexey-orlov",
    title: "Стилист по волосам",
    bio: "Создаёт практичные современные формы, которые легко поддерживать дома и которые красиво отрастают.",
    experience: 11,
    rating: 4.9,
    color: "#D78A39",
    initials: "АО",
  },
] as const;

const specialistServices: Record<string, string[]> = {
  "specialist-anna": ["service-facial", "service-consultation"],
  "specialist-maria": ["service-massage"],
  "specialist-elena": ["service-manicure", "service-brows"],
  "specialist-alexey": ["service-hair"],
};

async function main() {
  await prisma.appointmentSlot.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.specialistService.deleteMany();
  await prisma.specialist.deleteMany();
  await prisma.service.deleteMany();
  await prisma.adminUser.deleteMany();

  await prisma.service.createMany({ data: services.map((service) => ({ ...service })) });
  await prisma.specialist.createMany({
    data: specialists.map((specialist) => ({ ...specialist })),
  });

  await prisma.specialistService.createMany({
    data: Object.entries(specialistServices).flatMap(([specialistId, serviceIds]) =>
      serviceIds.map((serviceId) => ({ specialistId, serviceId })),
    ),
  });

  const workingHours: Record<string, { startTime: string; endTime: string }> = {
    "specialist-anna": { startTime: "09:00", endTime: "18:00" },
    "specialist-maria": { startTime: "10:00", endTime: "20:00" },
    "specialist-elena": { startTime: "09:30", endTime: "19:30" },
    "specialist-alexey": { startTime: "11:00", endTime: "20:00" },
  };
  await prisma.schedule.createMany({
    data: specialists.flatMap(({ id: specialistId }) =>
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        specialistId,
        dayOfWeek,
        startTime: workingHours[specialistId].startTime,
        endTime: workingHours[specialistId].endTime,
        isWorking: dayOfWeek !== 0,
      })),
    ),
  });

  const today = getLocalDateString(new Date(), APP_TIMEZONE);
  const now = new Date();
  const clients = [
    { id: "client-irina", name: "Ирина Лебедева", phone: "+79991234567", email: "irina@example.com", createdAt: now },
    { id: "client-dmitry", name: "Дмитрий Волков", phone: "+79992345678", email: "dmitry@example.com", createdAt: new Date(now.getTime() - 8 * 86_400_000) },
    { id: "client-olga", name: "Ольга Миронова", phone: "+79993456789", email: "olga@example.com", createdAt: new Date(now.getTime() - 18 * 86_400_000) },
    { id: "client-sofia", name: "София Романова", phone: "+79994567890", email: "sofia@example.com", createdAt: now },
    { id: "client-nikita", name: "Никита Фёдоров", phone: "+79995678901", email: "nikita@example.com", createdAt: new Date(now.getTime() - 35 * 86_400_000) },
  ];
  for (const client of clients) {
    await prisma.client.create({ data: client });
  }

  const appointmentSeeds = [
    { bookingNumber: "LM-DEMO-1001", clientId: "client-dmitry", serviceId: "service-facial", specialistId: "specialist-anna", date: today, time: "11:00", status: "COMPLETED" },
    { bookingNumber: "LM-DEMO-1002", clientId: "client-olga", serviceId: "service-massage", specialistId: "specialist-maria", date: today, time: "15:00", status: "CANCELLED" },
    { bookingNumber: "LM-DEMO-1003", clientId: "client-irina", serviceId: "service-manicure", specialistId: "specialist-elena", date: addLocalDays(today, 1), time: "11:30", status: "NEW" },
    { bookingNumber: "LM-DEMO-1004", clientId: "client-sofia", serviceId: "service-brows", specialistId: "specialist-elena", date: addLocalDays(today, 2), time: "16:30", status: "CONFIRMED" },
    { bookingNumber: "LM-DEMO-1005", clientId: "client-nikita", serviceId: "service-hair", specialistId: "specialist-alexey", date: addLocalDays(today, 3), time: "13:00", status: "CONFIRMED" },
  ];

  const durationByService = new Map<string, number>(
    services.map((service) => [service.id, service.duration]),
  );
  for (const appointmentSeed of appointmentSeeds) {
    const startsAt = zonedDateTimeToUtc(
      appointmentSeed.date,
      appointmentSeed.time,
      APP_TIMEZONE,
    );
    const endsAt = new Date(
      startsAt.getTime() + (durationByService.get(appointmentSeed.serviceId) ?? 30) * 60_000,
    );
    const appointment = await prisma.appointment.create({
      data: {
        bookingNumber: appointmentSeed.bookingNumber,
        clientId: appointmentSeed.clientId,
        serviceId: appointmentSeed.serviceId,
        specialistId: appointmentSeed.specialistId,
        startsAt,
        endsAt,
        status: appointmentSeed.status,
        cancelledAt: appointmentSeed.status === "CANCELLED" ? now : null,
      },
    });
    if (appointmentSeed.status !== "CANCELLED") {
      await prisma.appointmentSlot.createMany({
        data: buildSlotLockStarts(startsAt, endsAt).map((slotStart) => ({
          appointmentId: appointment.id,
          specialistId: appointmentSeed.specialistId,
          startsAt: slotStart,
        })),
      });
    }
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "Lumora2026!";
  await prisma.adminUser.create({
    data: {
      email: (process.env.ADMIN_EMAIL || "admin@lumora.ru").toLowerCase(),
      name: "Администратор Lumora",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });

  console.log("Демонстрационные данные созданы");
  console.log(`Администратор: ${process.env.ADMIN_EMAIL || "admin@lumora.ru"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
