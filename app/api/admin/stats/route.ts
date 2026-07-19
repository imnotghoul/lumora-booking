import { handleApiError, jsonSuccess } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import {
  APP_TIMEZONE,
  getLocalDateString,
  getZonedDayRange,
  getZonedMonthRange,
} from "@/lib/server/timezone";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const today = getZonedDayRange(getLocalDateString(now, APP_TIMEZONE), APP_TIMEZONE);
    const month = getZonedMonthRange(now, APP_TIMEZONE);
    const [todayAppointments, newClients, cancellations, completed] = await Promise.all([
      prisma.appointment.count({
        where: {
          startsAt: { gte: today.start, lt: today.end },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.client.count({
        where: { createdAt: { gte: today.start, lt: today.end } },
      }),
      prisma.appointment.count({
        where: { cancelledAt: { gte: today.start, lt: today.end } },
      }),
      prisma.appointment.findMany({
        where: {
          startsAt: { gte: month.start, lt: month.end },
          status: "COMPLETED",
        },
        select: { service: { select: { price: true } } },
      }),
    ]);

    return jsonSuccess({
      todayAppointments,
      newClients,
      cancellations,
      revenue: completed.reduce((total, item) => total + item.service.price, 0),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
