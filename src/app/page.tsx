import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpensesTableServer } from "@/components/expenses-table-server"
import { DashboardCardsServer } from "@/components/dashboard-cards-server"
import { PageHeader } from "@/components/page-header"
import { InteractiveWrapper } from "@/components/interactive-wrapper"
import { MonthNavigation } from "@/components/month-navigation"
import { MonthSummaryWrapper } from "@/components/month-summary-wrapper"
import { ExpenseCharts } from "@/components/expense-charts"
import { Toaster } from "@/components/ui/sonner"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

interface SearchParams {
  month?: string
}

async function getExpenses(monthYear: string) {
  const expenses = await prisma.expense.findMany({
    where: { monthYear },
    include: {
      category: true,
      paidBy: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })
  // Transform Date objects to strings for client components
  return expenses.map(expense => ({
    ...expense,
    date: expense.date.toISOString().split('T')[0],
    type: expense.type || 'EXPENSE'
  }))
}

export default async function Home({
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
  const expenses = await getExpenses(selectedMonth)

  const getMonthDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { 
      month: "long", 
      year: "numeric" 
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <PageHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Month Navigation */}
        <MonthNavigation initialMonth={selectedMonth} />

        {/* Dashboard Cards */}
        <DashboardCardsServer expenses={expenses} />

        {/* Charts Section */}
        <ExpenseCharts expenses={expenses} />

        {/* Expenses Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Gastos de {getMonthDisplay(selectedMonth)}</CardTitle>
                <CardDescription>
                  Gerencie os gastos do apartamento
                </CardDescription>
              </div>
              <InteractiveWrapper />
            </div>
          </CardHeader>
          <CardContent>
            <ExpensesTableServer expenses={expenses} />
          </CardContent>
        </Card>

        {/* Month Summary */}
        <MonthSummaryWrapper monthYear={selectedMonth} />
      </main>
    </div>
  )
}
