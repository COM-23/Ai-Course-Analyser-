#!/usr/bin/env bash
set -e

ZIP_NAME="learn-overseas-windows.zip"
echo "Creating $ZIP_NAME for Windows Server deployment..."

rm -f "$ZIP_NAME"

zip -q -r "$ZIP_NAME" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x "*.log" \
  -x "aitunnel*.log" \
  -x ".user_uploaded/*" \
  -x ".DS_Store" \
  -x "*.zip" \
  -x "programs.csv" \
  -x "programs.raw.csv" \
  -x "programs.csv.enc" \
  -x "$ZIP_NAME"

echo "Package created successfully: $ZIP_NAME"
ls -lh "$ZIP_NAME"
