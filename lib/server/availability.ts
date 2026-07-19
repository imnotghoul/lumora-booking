import {
  APP_TIMEZONE,
  getLocalTimeString,
  zonedDateTimeToUtc,
} from "@/lib/server/timezone";

export type BusyRange = { startsAt: Date; endsAt: Date };
export type WorkingHours = {
  startTime: string;
  endTime: string;
  isWorking: boolean;
};

export type AvailableSlot = {
  time: string;
  startsAt: string;
  endsAt: string;
};

export function rangesOverlap(first: BusyRange, second: BusyRange) {
  return first.startsAt < second.endsAt && second.startsAt < first.endsAt;
}

export function hasAppointmentCollision(
  candidate: BusyRange,
  appointments: BusyRange[],
) {
  return appointments.some((appointment) => rangesOverlap(candidate, appointment));
}

export function buildSlotLockStarts(
  startsAt: Date,
  endsAt: Date,
  granularityMinutes = 15,
) {
  const result: Date[] = [];
  const step = granularityMinutes * 60_000;
  for (let cursor = startsAt.getTime(); cursor < endsAt.getTime(); cursor += step) {
    result.push(new Date(cursor));
  }
  return result;
}

export function calculateAvailableSlots({
  date,
  workingHours,
  durationMinutes,
  busyRanges,
  now = new Date(),
  timeZone = APP_TIMEZONE,
  intervalMinutes = 30,
}: {
  date: string;
  workingHours: WorkingHours | null;
  durationMinutes: number;
  busyRanges: BusyRange[];
  now?: Date;
  timeZone?: string;
  intervalMinutes?: number;
}): AvailableSlot[] {
  if (!workingHours?.isWorking) return [];

  const scheduleStart = zonedDateTimeToUtc(date, workingHours.startTime, timeZone);
  const scheduleEnd = zonedDateTimeToUtc(date, workingHours.endTime, timeZone);
  const duration = durationMinutes * 60_000;
  const interval = intervalMinutes * 60_000;
  const result: AvailableSlot[] = [];

  for (
    let cursor = scheduleStart.getTime();
    cursor + duration <= scheduleEnd.getTime();
    cursor += interval
  ) {
    const startsAt = new Date(cursor);
    const endsAt = new Date(cursor + duration);
    if (startsAt < now) continue;
    if (hasAppointmentCollision({ startsAt, endsAt }, busyRanges)) continue;

    result.push({
      time: getLocalTimeString(startsAt, timeZone),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  }

  return result;
}
