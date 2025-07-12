"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { Card } from "@/components/ui/card"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-orange-500 dark:bg-orange-600 text-white border-orange-600 dark:border-orange-700">
      <div className="flex items-center gap-2 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Modo offline - algumas funcionalidades podem estar limitadas</span>
      </div>
    </Card>
  )
}