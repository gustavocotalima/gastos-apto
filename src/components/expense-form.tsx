"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Edit } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

interface ExpenseFormProps {
  onExpenseAdded: () => void
  editingExpense?: {
    id: string
    date: string
    amount: number
    description: string
    categoryId: string
    paidById: string
    type?: 'EXPENSE' | 'CREDIT'
  }
  onEditComplete?: () => void
}

export function ExpenseForm({ onExpenseAdded, editingExpense, onEditComplete }: ExpenseFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Form data
  const [date, setDate] = useState(editingExpense?.date || new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState(editingExpense?.amount.toString() || "")
  const [description, setDescription] = useState(editingExpense?.description || "")
  const [categoryId, setCategoryId] = useState(editingExpense?.categoryId || "")
  const [paidById, setPaidById] = useState(editingExpense?.paidById || "")
  const [type, setType] = useState<'EXPENSE' | 'CREDIT'>(editingExpense?.type || 'EXPENSE')

  useEffect(() => {
    fetchCategories()
    fetchUsers()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      toast.error("Erro ao carregar categorias")
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      toast.error("Erro ao carregar usuários")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses"
      const method = editingExpense ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date + 'T12:00:00.000Z',
          amount: parseFloat(amount),
          description,
          categoryId,
          paidById,
          type,
        }),
      })

      if (response.ok) {
        toast.success(editingExpense ? "Gasto atualizado com sucesso!" : "Gasto adicionado com sucesso!")
        setOpen(false)
        if (!editingExpense) resetForm()
        onExpenseAdded()
        if (onEditComplete) onEditComplete()
      } else {
        toast.error(editingExpense ? "Erro ao atualizar gasto" : "Erro ao adicionar gasto")
      }
    } catch (error) {
      toast.error(editingExpense ? "Erro ao atualizar gasto" : "Erro ao adicionar gasto")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0])
    setAmount("")
    setDescription("")
    setCategoryId("")
    setPaidById("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editingExpense && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Gasto
          </Button>
        </DialogTrigger>
      )}
      {editingExpense && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Editar Gasto" : "Adicionar Novo Gasto"}</DialogTitle>
          <DialogDescription>
            {editingExpense
              ? "Edite os dados do gasto."
              : "Preencha os dados do gasto para adicionar ao mês atual."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Quem pagou</Label>
            <Select value={paidById} onValueChange={setPaidById} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione quem pagou" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o gasto (opcional)..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <RadioGroup
              value={type}
              onValueChange={(value: 'EXPENSE' | 'CREDIT') => setType(value)}
              className="flex flex-row space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EXPENSE" id="expense" />
                <Label htmlFor="expense">Gasto</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CREDIT" id="credit" />
                <Label htmlFor="credit">Crédito</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}