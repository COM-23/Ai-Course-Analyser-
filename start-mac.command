#!/bin/bash
cd "$(dirname "$0")"
echo "========================================================"
echo "  LEARN OVERSEAS - AI COURSE ANALYSER (MAC)"
echo "========================================================"
echo "Current folder: $(pwd)"
echo ""

echo "Checking Node.js..."
node -v

echo "Starting server on port 3004..."
echo "Open in your browser: http://localhost:3004"
echo ""

PORT=3004 npm run dev
