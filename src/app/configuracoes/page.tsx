import { PageHeader } from "@/components/page-header"
import { CipConfigurationForm } from "@/components/cip-configuration-form"
import { MonthNavigation } from "@/components/month-navigation"
import { Toaster } from "@/components/ui/sonner"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

interface SearchParams {
  month?: string
}

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  
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
        <MonthNavigation initialMonth={selectedMonth} basePath="/configuracoes" />

        {/* CIP Configuration */}
        <CipConfigurationForm monthYear={selectedMonth} />
      </main>
    </div>
  )
}