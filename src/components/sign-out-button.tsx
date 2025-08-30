"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => signOut()} 
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden lg:inline">Sair</span>
    </Button>
  )
}