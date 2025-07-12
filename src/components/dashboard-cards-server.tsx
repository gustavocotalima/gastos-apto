import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users } from "lucide-react"

interface Expense {
  id: string
  amount: number
  category: {
    id: string
    name: string
    splitType: string
    user1user2?: number
    user3?: number
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

  // Calculate split amounts based on category rules
  const calculateSplit = () => {
    let user1Total = 0
    let user2Total = 0 
    let user3Total = 0

    expenses.forEach((expense) => {
      const { category, amount } = expense
      
      if (category.splitType === 'DEFAULT') {
        // Default: 2/3 for user1+user2, 1/3 for user3
        const user1user2Share = amount * (2/3)
        const user3Share = amount * (1/3)
        
        user1Total += user1user2Share / 2 // Split equally between user1 and user2
        user2Total += user1user2Share / 2
        user3Total += user3Share
      } else if (category.splitType === 'CUSTOM') {
        // Custom percentages
        const user1user2Percent = (category.user1user2 || 0) / 100
        const user3Percent = (category.user3 || 0) / 100
        
        const user1user2Share = amount * user1user2Percent
        const user3Share = amount * user3Percent
        
        user1Total += user1user2Share / 2 // Split equally between user1 and user2
        user2Total += user1user2Share / 2
        user3Total += user3Share
      }
    })

    return { user1Total, user2Total, user3Total }
  }

  const { user1Total, user2Total, user3Total } = calculateSplit()

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
            {totalExpenses} {totalExpenses === 1 ? 'gasto' : 'gastos'} este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">user1</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(user1Total)}</div>
          <p className="text-xs text-muted-foreground">
            Sua parte dos gastos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">user2</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(user2Total)}</div>
          <p className="text-xs text-muted-foreground">
            Parte do user2
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">user3</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(user3Total)}</div>
          <p className="text-xs text-muted-foreground">
            Parte do user3
          </p>
        </CardContent>
      </Card>
    </div>
  )
}