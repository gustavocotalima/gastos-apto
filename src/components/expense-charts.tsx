"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface Expense {
  id: string
  amount: number
  description: string
  date: Date
  category: {
    id: string
    name: string
  }
  paidBy: {
    id: string
    name: string
  }
}

interface ExpenseChartsProps {
  expenses: Expense[]
}

const COLORS = [
  '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#06b6d4',
  '#eab308', '#f97316', '#14b8a6', '#ec4899', '#84cc16', '#6366f1'
]

export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  // Filter out credits (negative amounts)
  const actualExpenses = expenses.filter(expense => expense.amount > 0)

  // Aggregate expenses by category (excluding credits)
  const categoryData = actualExpenses.reduce((acc, expense) => {
    const categoryName = expense.category.name
    if (!acc[categoryName]) {
      acc[categoryName] = 0
    }
    acc[categoryName] += expense.amount
    return acc
  }, {} as Record<string, number>)

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }))

  // Aggregate expenses by payer (excluding credits)
  const payerData = actualExpenses.reduce((acc, expense) => {
    const payerName = expense.paidBy.name
    if (!acc[payerName]) {
      acc[payerName] = 0
    }
    acc[payerName] += expense.amount
    return acc
  }, {} as Record<string, number>)

  const payerChartData = Object.entries(payerData).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const totalExpenses = actualExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (actualExpenses.length === 0) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
            <CardDescription>Distribuição dos gastos por categoria</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Nenhum gasto encontrado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Pagador</CardTitle>
            <CardDescription>Quem mais gastou no período</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Nenhum gasto encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Category Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
          <CardDescription>
            Total: {formatCurrency(totalExpenses)} • {categoryChartData.length} categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payer Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Pagador</CardTitle>
          <CardDescription>Quem mais gastou no período</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payerChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}