import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hay un package-lock.json en la carpeta padre. Sin esto Turbopack la elige
  // como raiz y arrastra archivos ajenos al proyecto (ej: su proxy.ts).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },
}

export default nextConfig
