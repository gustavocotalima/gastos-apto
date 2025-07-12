"use client"

import { useRouter } from "next/navigation"
import { MonthSummary } from "./month-summary"

interface MonthSummaryWrapperProps {
  monthYear: string
}

export function MonthSummaryWrapper({ monthYear }: MonthSummaryWrapperProps) {
  const router = useRouter()

  const handleStatusChanged = () => {
    router.refresh()
  }

  return (
    <MonthSummary 
      monthYear={monthYear} 
      onStatusChanged={handleStatusChanged}
    />
  )
}