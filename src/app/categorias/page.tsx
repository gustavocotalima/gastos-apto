"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/category-form"
import { CategoriesList } from "@/components/categories-list"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link"

interface Category {
  id: string
  name: string
  splitType: "DEFAULT" | "CUSTOM"
  user1user2?: number
  user3?: number
}

export default function CategoriesPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCategories()
    setRefreshing(false)
  }

  const handleCategoryChanged = () => {
    fetchCategories()
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
              <p className="text-muted-foreground">Configure as categorias e suas divisões</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>
                  Gerencie as categorias e configure como os gastos devem ser divididos
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
                <CategoryForm onCategoryChanged={handleCategoryChanged} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CategoriesList 
              categories={categories} 
              onCategoryChanged={handleCategoryChanged} 
            />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Como funciona a divisão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Divisão Padrão:</strong> user1 e user2 dividem 2/3 do valor (33.33% cada), user3 paga 1/3 (33.33%)
            </div>
            <div>
              <strong>Divisão Personalizada:</strong> Você define os percentuais exatos para user1+user2 e user3
            </div>
            <div className="text-muted-foreground">
              💡 Dica: Use divisão personalizada para casos especiais como "Garagem user3" ou "Desconto Total"
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}