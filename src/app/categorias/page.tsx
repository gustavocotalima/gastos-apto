import { PageHeader } from "@/components/page-header"
import { Toaster } from "@/components/ui/sonner"
import { CategoriesListServer } from "@/components/categories-list-server"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      splits: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      }
    },
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
      
      <PageHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Categories Management */}
        <CategoriesListServer categories={categories} />
      </main>
    </div>
  )
}