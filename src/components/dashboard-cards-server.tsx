import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users } from "lucide-react"

interface Expense {
  id: string
  amount: number
  category: {
    id: string
    name: string
    splitType: string
  }
  paidBy: {
    id: string
    name: string
  }
}

interface DashboardCardsServerProps {
  expenses: Expense[]
}

export function DashboardCardsServer({ expenses }: DashboardCardsServerProps) {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalExpenses = expenses.length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {totalExpenses} gasto{totalExpenses !== 1 ? 's' : ''} registrado{totalExpenses !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quantidade</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalExpenses}</div>
          <p className="text-xs text-muted-foreground">
            Gastos neste mês
          </p>
        </CardContent>
      </Card>
    </div>
  )
}