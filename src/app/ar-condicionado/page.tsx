import { PageHeader } from "@/components/page-header"
import { Toaster } from "@/components/ui/sonner"
import { AirConditioningForm } from "@/components/air-conditioning-form"
import { MonthNavigation } from "@/components/month-navigation"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

interface SearchParams {
  month?: string
}

export default async function AirConditioningPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/login")
  }

  const params = await searchParams
  const selectedMonth = params.month || new Date().toISOString().slice(0, 7)

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      <PageHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Month Navigation */}
        <MonthNavigation initialMonth={selectedMonth} basePath="/ar-condicionado" />

        {/* Air Conditioning Calculation */}
        <AirConditioningForm monthYear={selectedMonth} />
      </main>
    </div>
  )
}
