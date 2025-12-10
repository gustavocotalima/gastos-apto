"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface PreviousExpense {
  id: string
  description: string
  amount: number
  type: 'EXPENSE' | 'CREDIT'
  categoryId: string
  categoryName: string
  paidById: string
  paidByName: string
}

interface CopyExpensesDialogProps {
  currentMonthYear: string
  onExpensesCopied: () => void
}

export function CopyExpensesDialog({ currentMonthYear, onExpensesCopied }: CopyExpensesDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [previousMonth, setPreviousMonth] = useState("")
  const [expenses, setExpenses] = useState<PreviousExpense[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      fetchPreviousMonthExpenses()
    }
  }, [open, currentMonthYear])

  const fetchPreviousMonthExpenses = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/expenses/copy-from-previous?monthYear=${currentMonthYear}`)
      if (response.ok) {
        const data = await response.json()
        setPreviousMonth(data.previousMonth)
        setExpenses(data.expenses)
        // Select all by default
        setSelectedIds(new Set(data.expenses.map((e: PreviousExpense) => e.id)))
      } else {
        toast.error("Erro ao carregar gastos do mês anterior")
      }
    } catch (error) {
      toast.error("Erro ao carregar gastos do mês anterior")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpense = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(expenses.map(e => e.id)))
    }
  }

  const handleCopy = async () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos um gasto para copiar")
      return
    }

    setIsCopying(true)
    try {
      const response = await fetch("/api/expenses/copy-from-previous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expenseIds: Array.from(selectedIds),
          targetMonthYear: currentMonthYear,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${selectedIds.size} gasto(s) copiado(s) com sucesso!`)
        setOpen(false)
        onExpensesCopied()
      } else {
        toast.error("Erro ao copiar gastos")
      }
    } catch (error) {
      toast.error("Erro ao copiar gastos")
    } finally {
      setIsCopying(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  const totalSelected = expenses
    .filter(e => selectedIds.has(e.id))
    .reduce((sum, e) => sum + (e.type === 'CREDIT' ? -e.amount : e.amount), 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="h-4 w-4" />
          Copiar do Mês Anterior
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Copiar Gastos do Mês Anterior</DialogTitle>
          <DialogDescription>
            Selecione os gastos de {previousMonth ? formatMonth(previousMonth) : "..."} para copiar para {formatMonth(currentMonthYear)}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando gastos...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum gasto encontrado no mês anterior.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.size === expenses.length}
                  onCheckedChange={toggleAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Selecionar todos ({expenses.length})
                </label>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selecionado(s)
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedIds.has(expense.id) ? "bg-accent border-accent" : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    id={expense.id}
                    checked={selectedIds.has(expense.id)}
                    onCheckedChange={() => toggleExpense(expense.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={expense.id}
                        className="text-sm font-medium cursor-pointer truncate"
                      >
                        {expense.description}
                      </label>
                      <span className={`text-sm font-mono ml-2 ${
                        expense.type === 'CREDIT' ? 'text-green-600' : ''
                      }`}>
                        {expense.type === 'CREDIT' ? '+' : ''}
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                      <span>{expense.categoryName}</span>
                      <span>•</span>
                      <span>{expense.paidByName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total selecionado:</span>
                <span className="text-lg font-bold font-mono">
                  {formatCurrency(totalSelected)}
                </span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCopying}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCopy}
                disabled={isCopying || selectedIds.size === 0}
              >
                {isCopying ? "Copiando..." : `Copiar ${selectedIds.size} gasto(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
