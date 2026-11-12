import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'node:sqlite'],
  outputFileTracingIncludes: {
    '/**': [
      './students.db.gz',
      './src/lib/db-seed.json'
    ]
  }
};

export default nextConfig;
