import { describe, expect, it } from "vitest"
import {
  getBillingCycleEndDate,
  getBillingCycleStartDate,
  getBillingMonthYear,
  shiftMonthYear,
} from "@/lib/billing-cycle"

describe("billing cycle", () => {
  it("uses the calendar month when the cycle starts on day 1", () => {
    expect(getBillingMonthYear(new Date("2026-09-01T12:00:00Z"), 1)).toBe("2026-09")
  })

  it("keeps dates before the start day in the previous cycle", () => {
    expect(getBillingMonthYear(new Date("2026-09-10T12:00:00Z"), 11)).toBe("2026-08")
    expect(getBillingMonthYear(new Date("2026-09-11T12:00:00Z"), 11)).toBe("2026-09")
  })

  it("handles year boundaries", () => {
    expect(getBillingMonthYear(new Date("2026-01-10T12:00:00Z"), 11)).toBe("2025-12")
    expect(shiftMonthYear("2026-01", -1)).toBe("2025-12")
  })

  it("returns the inclusive cycle date range", () => {
    expect(getBillingCycleStartDate("2026-09", 11).toISOString()).toBe(
      "2026-09-11T12:00:00.000Z"
    )
    expect(getBillingCycleEndDate("2026-09", 11).toISOString()).toBe(
      "2026-10-10T12:00:00.000Z"
    )
  })

  it("uses the last day when the configured day does not exist", () => {
    expect(getBillingCycleStartDate("2026-02", 31).toISOString()).toBe(
      "2026-02-28T12:00:00.000Z"
    )
    expect(getBillingMonthYear(new Date("2026-02-27T12:00:00Z"), 31)).toBe(
      "2026-01"
    )
    expect(getBillingMonthYear(new Date("2026-02-28T12:00:00Z"), 31)).toBe(
      "2026-02"
    )
  })
})
