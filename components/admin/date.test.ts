import { describe, expect, it } from "vitest";

import {
  businessDateKey,
  isSameBusinessDay,
  moscowInputToIso,
  startOfBusinessWeek,
} from "@/components/admin/date";

describe("business timezone helpers", () => {
  it("assigns late UTC appointments to the next Moscow day", () => {
    expect(businessDateKey("2026-07-19T21:30:00.000Z")).toBe("2026-07-20");
    expect(
      isSameBusinessDay("2026-07-19T21:30:00.000Z", "2026-07-20T12:00:00.000Z"),
    ).toBe(true);
  });

  it("builds a Monday-based week independent of the browser timezone", () => {
    expect(businessDateKey(startOfBusinessWeek("2026-07-23T21:30:00.000Z"))).toBe(
      "2026-07-20",
    );
  });

  it("converts a Moscow datetime-local value to UTC", () => {
    expect(moscowInputToIso("2026-07-20T10:00")).toBe("2026-07-20T07:00:00.000Z");
  });
});
