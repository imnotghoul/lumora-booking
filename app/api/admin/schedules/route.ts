import { z } from "zod";

import { NotFoundError } from "@/lib/server/errors";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { updateSchedulesSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function toScheduleDto(schedule: {
  id: string;
  specialistId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}) {
  return {
    id: schedule.id,
    specialistId: schedule.specialistId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    isWorking: schedule.isWorking,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const specialistId = z.string().trim().min(1).max(100).optional().parse(
      new URL(request.url).searchParams.get("specialistId") || undefined,
    );
    const schedules = await prisma.schedule.findMany({
      where: specialistId ? { specialistId } : undefined,
      orderBy: [{ specialistId: "asc" }, { dayOfWeek: "asc" }],
    });
    return jsonSuccess(schedules.map(toScheduleDto));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const input = updateSchedulesSchema.parse(await readJson(request));
    const schedules = await prisma.$transaction(async (tx) => {
      const specialist = await tx.specialist.findUnique({
        where: { id: input.specialistId },
        select: { id: true },
      });
      if (!specialist) throw new NotFoundError("Специалист не найден");

      await tx.schedule.deleteMany({ where: { specialistId: input.specialistId } });
      if (input.schedules.length > 0) {
        await tx.schedule.createMany({
          data: input.schedules.map((schedule) => ({
            ...schedule,
            specialistId: input.specialistId,
          })),
        });
      }
      return tx.schedule.findMany({
        where: { specialistId: input.specialistId },
        orderBy: { dayOfWeek: "asc" },
      });
    });
    return jsonSuccess(schedules.map(toScheduleDto));
  } catch (error) {
    return handleApiError(error);
  }
}
