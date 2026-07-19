import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";

import type { AppointmentDto, AppointmentStatus } from "@/lib/types";
import type { CreateAppointmentInput, UpdateAppointmentInput } from "@/lib/validation";
import {
  buildSlotLockStarts,
  calculateAvailableSlots,
} from "@/lib/server/availability";
import { BookingConflictError, DomainError, NotFoundError } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import {
  APP_TIMEZONE,
  getLocalDateString,
  getZonedDateParts,
  getZonedDayRange,
  zonedDateTimeToUtc,
} from "@/lib/server/timezone";

export const appointmentInclude = {
  client: true,
  service: true,
  specialist: true,
} satisfies Prisma.AppointmentInclude;

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

type TransactionClient = Prisma.TransactionClient;

export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return `+${digits}`;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function generateBookingNumber(date = new Date()) {
  const datePart = getLocalDateString(date, APP_TIMEZONE).replaceAll("-", "");
  return `LM-${datePart}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function toAppointmentDto(appointment: AppointmentWithRelations): AppointmentDto {
  return {
    id: appointment.id,
    bookingNumber: appointment.bookingNumber,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status as AppointmentStatus,
    notes: appointment.notes,
    client: {
      id: appointment.client.id,
      name: appointment.client.name,
      phone: appointment.client.phone,
      email: appointment.client.email,
    },
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      duration: appointment.service.duration,
      price: appointment.service.price,
    },
    specialist: {
      id: appointment.specialist.id,
      name: appointment.specialist.name,
      title: appointment.specialist.title,
      color: appointment.specialist.color,
      initials: appointment.specialist.initials,
    },
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function loadPlacementEntities(
  tx: TransactionClient,
  serviceId: string,
  specialistId: string,
  requireActive: boolean,
) {
  const service = await tx.service.findUnique({ where: { id: serviceId } });
  if (!service || (requireActive && !service.active)) {
    throw new NotFoundError("Услуга не найдена или недоступна");
  }

  const specialist = await tx.specialist.findFirst({
    where: {
      id: specialistId,
      ...(requireActive ? { active: true } : {}),
      services: { some: { serviceId } },
    },
  });
  if (!specialist) {
    throw new NotFoundError("Специалист не оказывает выбранную услугу");
  }
  return { service, specialist };
}

async function ensurePlacementAvailable(
  tx: TransactionClient,
  {
    serviceId,
    specialistId,
    startsAt,
    excludeAppointmentId,
    now = new Date(),
    requireActive = true,
  }: {
    serviceId: string;
    specialistId: string;
    startsAt: Date;
    excludeAppointmentId?: string;
    now?: Date;
    requireActive?: boolean;
  },
) {
  if (Number.isNaN(startsAt.getTime())) throw new DomainError("Некорректная дата записи");
  if (startsAt < now) throw new DomainError("Нельзя создать запись на прошедшее время", 422);

  const { service, specialist } = await loadPlacementEntities(
    tx,
    serviceId,
    specialistId,
    requireActive,
  );
  const endsAt = new Date(startsAt.getTime() + service.duration * 60_000);
  const local = getZonedDateParts(startsAt, APP_TIMEZONE);
  const localDate = getLocalDateString(startsAt, APP_TIMEZONE);
  const schedule = await tx.schedule.findUnique({
    where: {
      specialistId_dayOfWeek: {
        specialistId,
        dayOfWeek: local.dayOfWeek,
      },
    },
  });

  if (!schedule?.isWorking) {
    throw new DomainError("В выбранный день специалист не работает", 422);
  }

  const scheduleStart = zonedDateTimeToUtc(localDate, schedule.startTime, APP_TIMEZONE);
  const scheduleEnd = zonedDateTimeToUtc(localDate, schedule.endTime, APP_TIMEZONE);
  const offsetMinutes = (startsAt.getTime() - scheduleStart.getTime()) / 60_000;
  if (
    startsAt < scheduleStart ||
    endsAt > scheduleEnd ||
    offsetMinutes < 0 ||
    offsetMinutes % 15 !== 0
  ) {
    throw new DomainError("Время находится вне рабочего графика специалиста", 422);
  }

  const collision = await tx.appointment.findFirst({
    where: {
      specialistId,
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { id: true },
  });
  if (collision) throw new BookingConflictError();

  return { service, specialist, startsAt, endsAt };
}

export async function getAvailability({
  serviceId,
  specialistId,
  date,
  now = new Date(),
}: {
  serviceId: string;
  specialistId: string;
  date: string;
  now?: Date;
}) {
  if (date < getLocalDateString(now, APP_TIMEZONE)) {
    throw new DomainError("Нельзя выбрать прошедшую дату", 422);
  }

  const service = await prisma.service.findFirst({ where: { id: serviceId, active: true } });
  if (!service) throw new NotFoundError("Услуга не найдена или недоступна");

  const specialist = await prisma.specialist.findFirst({
    where: { id: specialistId, active: true, services: { some: { serviceId } } },
  });
  if (!specialist) throw new NotFoundError("Специалист не оказывает выбранную услугу");

  const dayOfWeek = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  const [schedule, busyRanges] = await Promise.all([
    prisma.schedule.findUnique({
      where: { specialistId_dayOfWeek: { specialistId, dayOfWeek } },
    }),
    prisma.appointment.findMany({
      where: {
        specialistId,
        status: { not: "CANCELLED" },
        startsAt: { lt: getZonedDayRange(date, APP_TIMEZONE).end },
        endsAt: { gt: getZonedDayRange(date, APP_TIMEZONE).start },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  return {
    date,
    timezone: APP_TIMEZONE,
    slots: calculateAvailableSlots({
      date,
      workingHours: schedule,
      durationMinutes: service.duration,
      busyRanges,
      now,
      timeZone: APP_TIMEZONE,
    }),
  };
}

export async function createAppointment(
  input: CreateAppointmentInput,
  options: { allowStatus?: boolean } = {},
) {
  const startsAt = new Date(input.startsAt);
  const status: AppointmentStatus = options.allowStatus && input.status ? input.status : "NEW";

  try {
    const appointment = await prisma.$transaction(
      async (tx) => {
        const placement = await ensurePlacementAvailable(tx, {
          serviceId: input.serviceId,
          specialistId: input.specialistId,
          startsAt,
        });
        const normalizedPhone = normalizePhone(input.client.phone);
        const normalizedEmail = normalizeEmail(input.client.email);
        const existingClient = await tx.client.findUnique({
          where: { phone: normalizedPhone },
        });
        if (existingClient && existingClient.email !== normalizedEmail) {
          throw new DomainError(
            "Телефон уже связан с другим email. Используйте прежние контакты или обратитесь к администратору",
            409,
            "CLIENT_CONTACT_CONFLICT",
          );
        }
        const client = existingClient
          ? await tx.client.update({
              where: { id: existingClient.id },
              data: { name: input.client.name.trim() },
            })
          : await tx.client.create({
              data: {
                name: input.client.name.trim(),
                phone: normalizedPhone,
                email: normalizedEmail,
              },
            });

        return tx.appointment.create({
          data: {
            bookingNumber: generateBookingNumber(),
            clientId: client.id,
            serviceId: input.serviceId,
            specialistId: input.specialistId,
            startsAt: placement.startsAt,
            endsAt: placement.endsAt,
            status,
            notes: input.notes?.trim() || null,
            cancelledAt: status === "CANCELLED" ? new Date() : null,
            ...(status !== "CANCELLED"
              ? {
                  slotLocks: {
                    create: buildSlotLockStarts(placement.startsAt, placement.endsAt).map(
                      (slotStart) => ({ specialistId: input.specialistId, startsAt: slotStart }),
                    ),
                  },
                }
              : {}),
          },
          include: appointmentInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return toAppointmentDto(appointment);
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new BookingConflictError();
    throw error;
  }
}

export async function findClientAppointments(contact: { phone: string; email: string }) {
  const clients = await prisma.client.findMany({
    where: {
      phone: normalizePhone(contact.phone),
      email: normalizeEmail(contact.email),
    },
    select: { id: true },
  });
  if (clients.length === 0) return [];

  const appointments = await prisma.appointment.findMany({
    where: { clientId: { in: clients.map(({ id }) => id) } },
    include: appointmentInclude,
    orderBy: { startsAt: "desc" },
  });
  return appointments.map(toAppointmentDto);
}

function contactMatches(
  client: { phone: string; email: string },
  contact: { phone: string; email: string },
) {
  return (
    client.phone === normalizePhone(contact.phone) &&
    client.email === normalizeEmail(contact.email)
  );
}

export async function cancelClientAppointment(
  id: string,
  contact: { phone: string; email: string },
) {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: appointmentInclude,
  });
  if (!existing || !contactMatches(existing.client, contact)) {
    throw new NotFoundError("Запись не найдена");
  }
  if (existing.status === "CANCELLED") return toAppointmentDto(existing);
  if (existing.startsAt < new Date()) {
    throw new DomainError("Прошедшую запись нельзя отменить", 422);
  }
  return cancelAppointmentByAdmin(id);
}

export async function cancelAppointmentByAdmin(id: string) {
  const appointment = await prisma.$transaction(async (tx) => {
    const existing = await tx.appointment.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundError("Запись не найдена");
    await tx.appointmentSlot.deleteMany({ where: { appointmentId: id } });
    return tx.appointment.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: appointmentInclude,
    });
  });
  return toAppointmentDto(appointment);
}

export async function updateAppointmentByAdmin(id: string, input: UpdateAppointmentInput) {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.appointment.findUnique({
          where: { id },
          include: appointmentInclude,
        });
        if (!existing) throw new NotFoundError("Запись не найдена");

        const serviceId = input.serviceId ?? existing.serviceId;
        const specialistId = input.specialistId ?? existing.specialistId;
        const startsAt = input.startsAt ? new Date(input.startsAt) : existing.startsAt;
        const status = input.status ?? (existing.status as AppointmentStatus);
        const placementChanged =
          serviceId !== existing.serviceId ||
          specialistId !== existing.specialistId ||
          startsAt.getTime() !== existing.startsAt.getTime();
        const needsNewLocks =
          status !== "CANCELLED" && (placementChanged || existing.status === "CANCELLED");

        let endsAt = existing.endsAt;
        if (needsNewLocks) {
          const placement = await ensurePlacementAvailable(tx, {
            serviceId,
            specialistId,
            startsAt,
            excludeAppointmentId: id,
          });
          endsAt = placement.endsAt;
        } else if (placementChanged) {
          const { service } = await loadPlacementEntities(tx, serviceId, specialistId, false);
          endsAt = new Date(startsAt.getTime() + service.duration * 60_000);
        }

        let clientId = existing.clientId;
        if (input.client) {
          const nextPhone = input.client.phone
            ? normalizePhone(input.client.phone)
            : existing.client.phone;
          const phoneOwner = await tx.client.findUnique({ where: { phone: nextPhone } });
          if (phoneOwner && phoneOwner.id !== existing.clientId) {
            clientId = phoneOwner.id;
            await tx.client.update({
              where: { id: phoneOwner.id },
              data: {
                name: input.client.name?.trim() ?? phoneOwner.name,
                email: input.client.email ? normalizeEmail(input.client.email) : phoneOwner.email,
              },
            });
          } else {
            await tx.client.update({
              where: { id: existing.clientId },
              data: {
                ...(input.client.name ? { name: input.client.name.trim() } : {}),
                ...(input.client.phone ? { phone: nextPhone } : {}),
                ...(input.client.email ? { email: normalizeEmail(input.client.email) } : {}),
              },
            });
          }
        }

        if (status === "CANCELLED" || needsNewLocks) {
          await tx.appointmentSlot.deleteMany({ where: { appointmentId: id } });
        }

        await tx.appointment.update({
          where: { id },
          data: {
            clientId,
            serviceId,
            specialistId,
            startsAt,
            endsAt,
            status,
            ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
            cancelledAt:
              status === "CANCELLED"
                ? existing.cancelledAt ?? new Date()
                : null,
          },
        });

        if (needsNewLocks) {
          await tx.appointmentSlot.createMany({
            data: buildSlotLockStarts(startsAt, endsAt).map((slotStart) => ({
              appointmentId: id,
              specialistId,
              startsAt: slotStart,
            })),
          });
        }

        return tx.appointment.findUniqueOrThrow({
          where: { id },
          include: appointmentInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return toAppointmentDto(result);
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new BookingConflictError();
    throw error;
  }
}

export async function listAdminAppointments(filters: {
  date?: string;
  specialistId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  search?: string;
}) {
  const dateRange = filters.date ? getZonedDayRange(filters.date, APP_TIMEZONE) : null;
  const where: Prisma.AppointmentWhereInput = {
    ...(dateRange ? { startsAt: { gte: dateRange.start, lt: dateRange.end } } : {}),
    ...(filters.specialistId ? { specialistId: filters.specialistId } : {}),
    ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { bookingNumber: { contains: filters.search } },
            { client: { is: { name: { contains: filters.search } } } },
            { client: { is: { phone: { contains: filters.search } } } },
            { client: { is: { email: { contains: filters.search } } } },
          ],
        }
      : {}),
  };
  const appointments = await prisma.appointment.findMany({
    where,
    include: appointmentInclude,
    orderBy: { startsAt: "desc" },
  });
  return appointments.map(toAppointmentDto);
}
