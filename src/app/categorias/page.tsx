import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryFormWrapper } from "@/components/category-form-wrapper"
import { CategoriesListServer } from "@/components/categories-list-server"
import { ArrowLeft } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })
  return categories
}

export default async function CategoriesPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const categories = await getCategories()

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
              <CategoryFormWrapper />
            </div>
          </CardHeader>
          <CardContent>
            <CategoriesListServer categories={categories} />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Como funciona a divisão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Divisão Igual:</strong> O valor é dividido igualmente entre todos os usuários ativos
            </div>
            <div>
              <strong>Divisão Personalizada:</strong> Você define os percentuais exatos para cada usuário
            </div>
            <div className="text-muted-foreground">
              💡 Dica: Use divisão personalizada para casos especiais como gastos que não devem ser divididos igualmente
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}