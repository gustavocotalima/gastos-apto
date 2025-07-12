"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseForm } from "@/components/expense-form"
import { ExpensesTable } from "@/components/expenses-table"
import { DashboardCards } from "@/components/dashboard-cards"
import { LogOut, RefreshCw } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"

interface Expense {
  id: string
  date: string
  amount: number
  description: string
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

export default function Home() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const currentMonth = new Date().toLocaleDateString("pt-BR", { 
    month: "long", 
    year: "numeric" 
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses")
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchExpenses()
    setRefreshing(false)
  }

  const handleExpenseAdded = () => {
    fetchExpenses()
  }

  const handleExpenseDeleted = () => {
    fetchExpenses()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gastos do Apto</h1>
            <p className="text-muted-foreground">Olá, {session?.user?.name}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Cards */}
        <DashboardCards expenses={expenses} />

        {/* Expenses Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Gastos de {currentMonth}</CardTitle>
                <CardDescription>
                  Gerencie os gastos do apartamento
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <ExpenseForm onExpenseAdded={handleExpenseAdded} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ExpensesTable 
              expenses={expenses} 
              onExpenseDeleted={handleExpenseDeleted} 
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
