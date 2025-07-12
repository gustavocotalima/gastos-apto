"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link"
import { AirConditioningForm } from "@/components/air-conditioning-form"

export default function AirConditioningPage() {
  const currentMonth = new Date().toLocaleDateString("pt-BR", { 
    month: "long", 
    year: "numeric" 
  })

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
              <h1 className="text-2xl font-bold">Ar Condicionado</h1>
              <p className="text-muted-foreground">Calcule sua parte da conta de energia - {currentMonth}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <AirConditioningForm />
      </main>
    </div>
  )
}