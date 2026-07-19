import { BUSINESS_TIME_ZONE } from "@/lib/business-timezone";

export function formatBusinessDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: BUSINESS_TIME_ZONE,
    ...options,
  }).format(new Date(value));
}

export function toMoscowDateTimeInput(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function moscowInputToIso(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = targetAsUtc;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value ?? 0);
    const representedAsUtc = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second"),
    );
    const difference = targetAsUtc - representedAsUtc;
    candidate += difference;
    if (difference === 0) break;
  }

  return new Date(candidate).toISOString();
}

export function todayInputValue() {
  return businessDateKey(new Date());
}

export function businessDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function businessDateFromKey(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

export function addBusinessDays(value: string | Date, amount: number) {
  const date = businessDateFromKey(businessDateKey(value));
  date.setUTCDate(date.getUTCDate() + amount);
  return date;
}

export function startOfBusinessWeek(value: string | Date) {
  const date = businessDateFromKey(businessDateKey(value));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date;
}

export function isSameBusinessDay(first: string | Date, second: string | Date) {
  return businessDateKey(first) === businessDateKey(second);
}
