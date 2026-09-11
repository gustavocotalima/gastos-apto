import { prisma } from "@/lib/prisma"
import { DEFAULT_BILLING_CYCLE_START_DAY } from "@/lib/billing-cycle"

const SETTINGS_ID = "default"

export async function getBillingCycleStartDay() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { billingCycleStartDay: true },
  })

  return settings?.billingCycleStartDay ?? DEFAULT_BILLING_CYCLE_START_DAY
}

export async function setBillingCycleStartDay(billingCycleStartDay: number) {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { billingCycleStartDay },
    create: { id: SETTINGS_ID, billingCycleStartDay },
    select: { billingCycleStartDay: true },
  })
}
