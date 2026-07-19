import { describe, expect, it } from "vitest";
import { BUSINESS_TIME_ZONE } from "@/lib/business-timezone";

import {
  buildSlotLockStarts,
  calculateAvailableSlots,
  hasAppointmentCollision,
  rangesOverlap,
} from "@/lib/server/availability";

const timeZone = BUSINESS_TIME_ZONE;

describe("calculateAvailableSlots", () => {
  it("учитывает график и длительность услуги", () => {
    const slots = calculateAvailableSlots({
      date: "2026-07-20",
      workingHours: { startTime: "09:00", endTime: "11:00", isWorking: true },
      durationMinutes: 60,
      busyRanges: [],
      now: new Date("2026-07-19T00:00:00.000Z"),
      timeZone,
    });

    expect(slots.map((slot) => slot.time)).toEqual(["09:00", "09:30", "10:00"]);
    expect(slots[0]).toEqual({
      time: "09:00",
      startsAt: "2026-07-20T06:00:00.000Z",
      endsAt: "2026-07-20T07:00:00.000Z",
    });
  });

  it("исключает каждый интервал, пересекающий существующую запись", () => {
    const slots = calculateAvailableSlots({
      date: "2026-07-20",
      workingHours: { startTime: "09:00", endTime: "11:00", isWorking: true },
      durationMinutes: 60,
      busyRanges: [
        {
          startsAt: new Date("2026-07-20T07:00:00.000Z"),
          endsAt: new Date("2026-07-20T07:30:00.000Z"),
        },
      ],
      now: new Date("2026-07-19T00:00:00.000Z"),
      timeZone,
    });

    expect(slots.map((slot) => slot.time)).toEqual(["09:00"]);
  });

  it("не возвращает прошедшие интервалы текущего дня", () => {
    const slots = calculateAvailableSlots({
      date: "2026-07-20",
      workingHours: { startTime: "09:00", endTime: "11:00", isWorking: true },
      durationMinutes: 60,
      busyRanges: [],
      now: new Date("2026-07-20T06:45:00.000Z"),
      timeZone,
    });

    expect(slots.map((slot) => slot.time)).toEqual(["10:00"]);
  });

  it("возвращает пустой список для выходного", () => {
    expect(
      calculateAvailableSlots({
        date: "2026-07-20",
        workingHours: { startTime: "09:00", endTime: "18:00", isWorking: false },
        durationMinutes: 30,
        busyRanges: [],
        timeZone,
      }),
    ).toEqual([]);
  });
});

describe("защита от коллизий", () => {
  const existing = {
    startsAt: new Date("2026-07-20T07:00:00.000Z"),
    endsAt: new Date("2026-07-20T08:00:00.000Z"),
  };

  it("считает частичное и полное пересечение конфликтом", () => {
    expect(
      hasAppointmentCollision(
        {
          startsAt: new Date("2026-07-20T06:30:00.000Z"),
          endsAt: new Date("2026-07-20T07:30:00.000Z"),
        },
        [existing],
      ),
    ).toBe(true);
    expect(
      rangesOverlap(existing, {
        startsAt: new Date("2026-07-20T07:15:00.000Z"),
        endsAt: new Date("2026-07-20T07:30:00.000Z"),
      }),
    ).toBe(true);
  });

  it("разрешает соседние интервалы без пересечения", () => {
    expect(
      hasAppointmentCollision(
        {
          startsAt: new Date("2026-07-20T08:00:00.000Z"),
          endsAt: new Date("2026-07-20T09:00:00.000Z"),
        },
        [existing],
      ),
    ).toBe(false);
  });

  it("разбивает запись на уникальные 15-минутные блокировки", () => {
    const locks = buildSlotLockStarts(
      new Date("2026-07-20T07:00:00.000Z"),
      new Date("2026-07-20T08:00:00.000Z"),
    );
    expect(locks.map((date) => date.toISOString())).toEqual([
      "2026-07-20T07:00:00.000Z",
      "2026-07-20T07:15:00.000Z",
      "2026-07-20T07:30:00.000Z",
      "2026-07-20T07:45:00.000Z",
    ]);
  });
});
