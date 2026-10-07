import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xenova/transformers', 'better-sqlite3', 'pdf-parse']
};

export default nextConfig;
