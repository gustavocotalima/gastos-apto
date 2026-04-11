declare module "next-pwa" {
  import type { NextConfig } from "next"

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    sw?: string
    scope?: string
    publicExcludes?: string[]
    buildExcludes?: (string | RegExp)[]
    runtimeCaching?: unknown[]
    fallbacks?: Record<string, string>
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
    customWorkerDir?: string
  }

  function withPWA(
    config: PWAConfig
  ): (nextConfig: NextConfig) => NextConfig

  export default withPWA
}
