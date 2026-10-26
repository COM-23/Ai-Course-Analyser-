import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xenova/transformers', 'better-sqlite3', 'pdf-parse', 'node:sqlite'],
  outputFileTracingIncludes: {
    '/**': [
      './students.db',
      './students.db.gz',
      './src/lib/db-seed.json'
    ]
  }
};

export default nextConfig;
