import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExpenseDeleteButton } from "./expense-delete-button"
import { Card } from "@/components/ui/card"

interface Expense {
  id: string
  date: string
  amount: number
  description: string
  category: {
    id: string
    name: string
  }
  paidBy: {
    id: string
    name: string
  }
}

interface ExpensesTableServerProps {
  expenses: Expense[]
}

export function ExpensesTableServer({ expenses }: ExpensesTableServerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum gasto encontrado para este mês.
      </div>
    )
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-medium text-sm mb-1">
                  {expense.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(expense.date)} • {expense.category.name}
                </div>
              </div>
              <ExpenseDeleteButton expenseId={expense.id} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Pago por: {expense.paidBy.name}
              </span>
              <span className="font-mono font-semibold">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Pagador</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(expense.date)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {expense.description}
                </TableCell>
                <TableCell>{expense.category.name}</TableCell>
                <TableCell>{expense.paidBy.name}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell>
                  <ExpenseDeleteButton expenseId={expense.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}