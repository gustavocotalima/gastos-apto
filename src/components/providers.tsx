"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallPrompt } from "./pwa-install-prompt"
import { OfflineIndicator } from "./offline-indicator"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      {children}
      <PWAInstallPrompt />
      <OfflineIndicator />
    </ThemeProvider>
  )
}
