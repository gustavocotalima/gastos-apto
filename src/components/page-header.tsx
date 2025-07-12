"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Settings, Zap } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

export function PageHeader() {
  const { data: session } = useSession()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gastos do Apto</h1>
          <p className="text-muted-foreground">Olá, {session?.user?.name}</p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Link href="/ar-condicionado">
            <Button variant="outline" className="gap-2">
              <Zap className="h-4 w-4" />
              Ar Condicionado
            </Button>
          </Link>
          <Link href="/categorias">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Categorias
            </Button>
          </Link>
          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}