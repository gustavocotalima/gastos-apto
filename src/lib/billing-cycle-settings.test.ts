import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const transactionClient = {
    appSettings: {
      upsert: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    airConditioningUsage: {
      updateMany: vi.fn(),
    },
  }

  return {
    transactionClient,
    transaction: vi.fn(
      async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient)
    ),
  }
})

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}))

import { setBillingCycleStartDay } from "@/lib/billing-cycle-settings"

describe("setBillingCycleStartDay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transactionClient.appSettings.upsert.mockResolvedValue({
      billingCycleStartDay: 12,
    })
    mocks.transactionClient.expense.findMany.mockResolvedValue([
      {
        id: "before-start",
        date: new Date("2026-08-11T12:00:00.000Z"),
        monthYear: "2026-08",
      },
      {
        id: "on-start",
        date: new Date("2026-08-12T12:00:00.000Z"),
        monthYear: "2026-08",
      },
      {
        id: "before-next-start",
        date: new Date("2026-09-11T12:00:00.000Z"),
        monthYear: "2026-09",
      },
    ])
  })

  it("reassigns existing expenses and linked AC usage to the new cycles", async () => {
    await expect(setBillingCycleStartDay(12)).resolves.toEqual({
      billingCycleStartDay: 12,
    })

    expect(mocks.transactionClient.expense.updateMany).toHaveBeenCalledTimes(2)
    expect(mocks.transactionClient.expense.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["before-start"] } },
      data: { monthYear: "2026-07" },
    })
    expect(mocks.transactionClient.expense.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["before-next-start"] } },
      data: { monthYear: "2026-08" },
    })

    expect(
      mocks.transactionClient.airConditioningUsage.updateMany
    ).toHaveBeenCalledTimes(2)
  })
})
