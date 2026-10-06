import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The parent folder has its own lockfile; pin the workspace root here.
  turbopack: { root: __dirname },
}

export default nextConfig
