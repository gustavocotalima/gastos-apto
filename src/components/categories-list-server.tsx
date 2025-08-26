import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/category-form"
import { CategoryItem } from "@/components/category-item"

interface CategorySplit {
  userId: string
  percentage: number
  user: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  splitType: "EQUAL" | "CUSTOM"
  splits?: CategorySplit[]
}

interface CategoriesListServerProps {
  categories: Category[]
}

export function CategoriesListServer({ categories }: CategoriesListServerProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Gerenciar Categorias</CardTitle>
            <CardDescription>
              Configure as categorias e suas divisões
            </CardDescription>
          </div>
          <CategoryForm />
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma categoria encontrada.
            <div className="mt-4">
              <CategoryForm />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(category => (
              <CategoryItem key={category.id} category={category} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}