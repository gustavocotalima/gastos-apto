import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import {
  getBillingCycleStartDay,
  setBillingCycleStartDay,
} from "@/lib/billing-cycle-settings"
import {
  handleApiError,
  AuthenticationError,
} from "@/lib/errors"

const billingCycleSchema = z.object({
  startDay: z.number().int().min(1).max(31),
})

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new AuthenticationError()
  }
}

export async function GET() {
  try {
    await requireSession()
    const startDay = await getBillingCycleStartDay()
    return NextResponse.json({ startDay })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requireSession()
    const { startDay } = billingCycleSchema.parse(await request.json())
    const settings = await setBillingCycleStartDay(startDay)
    return NextResponse.json({ startDay: settings.billingCycleStartDay })
  } catch (error) {
    return handleApiError(error)
  }
}
