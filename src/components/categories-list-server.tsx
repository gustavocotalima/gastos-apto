import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/category-form"
import { CategoryDeleteButton } from "@/components/category-delete-button"

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
  const getSplitDisplay = (category: Category) => {
    if (category.splitType === "EQUAL") {
      return "Divisão igual entre todos"
    }
    
    if (category.splits && category.splits.length > 0) {
      return category.splits
        .map(split => `${split.user.name}: ${split.percentage.toFixed(1)}%`)
        .join(" • ")
    }
    
    return "Configuração personalizada"
  }

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
              <div key={category.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getSplitDisplay(category)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <CategoryForm category={category} />
                    <CategoryDeleteButton 
                      categoryId={category.id} 
                      categoryName={category.name} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}