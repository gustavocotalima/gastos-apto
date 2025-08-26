"use client"

import { useSession } from "next-auth/react"

export function UserGreeting() {
  const { data: session } = useSession()
  
  return (
    <p className="text-muted-foreground">
      {session?.user?.name ? `Olá, ${session.user.name}` : "Carregando..."}
    </p>
  )
}