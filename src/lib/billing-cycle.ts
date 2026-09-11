export const DEFAULT_BILLING_CYCLE_START_DAY = 1
export const MAX_BILLING_CYCLE_START_DAY = 31
export const BILLING_TIME_ZONE = "America/Sao_Paulo"

function validateStartDay(startDay: number) {
  if (
    !Number.isInteger(startDay) ||
    startDay < DEFAULT_BILLING_CYCLE_START_DAY ||
    startDay > MAX_BILLING_CYCLE_START_DAY
  ) {
    throw new RangeError(
      `Billing cycle start day must be between 1 and ${MAX_BILLING_CYCLE_START_DAY}`
    )
  }
}

function parseMonthYear(monthYear: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(monthYear)
  const year = match ? Number(match[1]) : Number.NaN
  const month = match ? Number(match[2]) : Number.NaN

  if (!match || month < 1 || month > 12) {
    throw new RangeError("Month must use the YYYY-MM format")
  }

  return { year, month }
}

function formatMonthYear(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function getEffectiveStartDay(year: number, month: number, startDay: number) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return Math.min(startDay, daysInMonth)
}

function getDateParts(date: Date) {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Date must be valid")
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BILLING_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date)

  const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  return {
    year: valueFor("year"),
    month: valueFor("month"),
    day: valueFor("day"),
  }
}

export function getBillingMonthYear(date: Date, startDay: number) {
  validateStartDay(startDay)
  const { year, month, day } = getDateParts(date)
  const effectiveStartDay = getEffectiveStartDay(year, month, startDay)
  return formatMonthYear(year, day < effectiveStartDay ? month - 1 : month)
}

export function getCurrentBillingMonthYear(
  startDay: number,
  now: Date = new Date()
) {
  return getBillingMonthYear(now, startDay)
}

export function shiftMonthYear(monthYear: string, offset: number) {
  const { year, month } = parseMonthYear(monthYear)
  return formatMonthYear(year, month + offset)
}

export function getBillingCycleStartDate(monthYear: string, startDay: number) {
  validateStartDay(startDay)
  const { year, month } = parseMonthYear(monthYear)
  const effectiveStartDay = getEffectiveStartDay(year, month, startDay)
  return new Date(Date.UTC(year, month - 1, effectiveStartDay, 12))
}

export function getBillingCycleEndDate(monthYear: string, startDay: number) {
  const nextStart = getBillingCycleStartDate(shiftMonthYear(monthYear, 1), startDay)
  nextStart.setUTCDate(nextStart.getUTCDate() - 1)
  return nextStart
}
