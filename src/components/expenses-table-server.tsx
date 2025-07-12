import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExpenseDeleteButton } from "./expense-delete-button"

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
    <div className="border rounded-lg">
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
              <TableCell>{formatDate(expense.date)}</TableCell>
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
  )
}