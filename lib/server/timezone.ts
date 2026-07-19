import { BUSINESS_TIME_ZONE } from "@/lib/business-timezone";

const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

export const APP_TIMEZONE = BUSINESS_TIME_ZONE;

export type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
};

function getFormatter(timeZone: string) {
  const cached = dateTimeFormatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  dateTimeFormatterCache.set(timeZone, formatter);
  return formatter;
}

export function getZonedDateParts(date: Date, timeZone = APP_TIMEZONE): ZonedDateParts {
  const values: Record<string, string> = {};
  for (const part of getFormatter(timeZone).formatToParts(date)) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    dayOfWeek: weekdays[values.weekday] ?? 0,
  };
}

export function zonedDateTimeToUtc(
  localDate: string,
  localTime: string,
  timeZone = APP_TIMEZONE,
) {
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let candidate = targetAsUtc;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const parts = getZonedDateParts(new Date(candidate), timeZone);
    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0,
    );
    const difference = targetAsUtc - representedAsUtc;
    candidate += difference;
    if (difference === 0) break;
  }

  return new Date(candidate);
}

export function getLocalDateString(date: Date, timeZone = APP_TIMEZONE) {
  const parts = getZonedDateParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getLocalTimeString(date: Date, timeZone = APP_TIMEZONE) {
  const parts = getZonedDateParts(date, timeZone);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function addLocalDays(localDate: string, amount: number) {
  const [year, month, day] = localDate.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + amount));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

export function getZonedDayRange(localDate: string, timeZone = APP_TIMEZONE) {
  return {
    start: zonedDateTimeToUtc(localDate, "00:00", timeZone),
    end: zonedDateTimeToUtc(addLocalDays(localDate, 1), "00:00", timeZone),
  };
}

export function getZonedMonthRange(date: Date, timeZone = APP_TIMEZONE) {
  const parts = getZonedDateParts(date, timeZone);
  const startDate = `${parts.year}-${String(parts.month).padStart(2, "0")}-01`;
  const nextMonth = new Date(Date.UTC(parts.year, parts.month, 1));
  const endDate = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return {
    start: zonedDateTimeToUtc(startDate, "00:00", timeZone),
    end: zonedDateTimeToUtc(endDate, "00:00", timeZone),
  };
}
