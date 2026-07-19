export const BUSINESS_TIME_ZONE = "Europe/Moscow";

function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function getBusinessDateKey(date = new Date()) {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export type BookingDate = {
  value: string;
  weekday: string;
  day: string;
  month: string;
  fullLabel: string;
};

export function getBookingDates(count = 21): BookingDate[] {
  const [year, month, day] = getBusinessDateKey().split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index, 12));
    const value = date.toISOString().slice(0, 10);
    return {
      value,
      weekday: new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "UTC" })
        .format(date)
        .replace(".", ""),
      day: String(date.getUTCDate()),
      month: new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "UTC" })
        .format(date)
        .replace(".", ""),
      fullLabel: new Intl.DateTimeFormat("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(date),
    };
  });
}

export function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: BUSINESS_TIME_ZONE,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}
