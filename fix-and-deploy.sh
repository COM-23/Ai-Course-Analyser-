#!/bin/bash
set -e

SERVER="admin_learn_overseas@192.168.0.66"
REMOTE_DIR="~/ai-course-analyser"
LOCAL_DIR="/Users/dishik/Downloads/Internship /Ai Course Analyser"

echo "======================================"
echo "  LEARN OVERSEAS - FIX & DEPLOY"
echo "======================================"

echo ""
echo "Step 1: Syncing fixed code + working DB to server..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.db-wal' \
  --exclude '*.db-shm' \
  --exclude 'programs.raw.csv' \
  "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

echo ""
echo "Step 2: Rebuilding native modules + app on server..."
ssh "$SERVER" bash << 'REMOTE'
  set -e
  cd ~/ai-course-analyser

  echo "  -> Cleaning stale WAL/lock files..."
  rm -f students.db-wal students.db-shm
  chmod 664 students.db 2>/dev/null || true

  echo "  -> Installing dependencies (including stable sqlite)..."
  npm install --prefer-offline 2>&1 | tail -5

  echo "  -> Verifying SQLite engine & AI Database counts..."
  node -e "
    let ok = false;
    try {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync('students.db');
      console.log('     [OK] Users in DB:', db.prepare('SELECT count(*) as c FROM users').get().c);
      console.log('     [OK] Universities in DB:', db.prepare('SELECT count(*) as c FROM universities').get().c);
      console.log('     [OK] Programs in DB:', db.prepare('SELECT count(*) as c FROM programs').get().c);
      ok = true;
    } catch(e) {}
    if (!ok) {
      try {
        const BetterSqlite = require('better-sqlite3');
        const db = new BetterSqlite('students.db');
        console.log('     [OK] better-sqlite3: Universities:', db.prepare('SELECT count(*) as c FROM universities').get().c);
        console.log('     [OK] better-sqlite3: Programs:', db.prepare('SELECT count(*) as c FROM programs').get().c);
      } catch(e) {
        console.log('     [INFO] Fallback error:', e.message);
      }
    }
  "

  echo "  -> Building app with Webpack..."
  npm run build

  echo "  -> Starting fresh PM2 processes for Web App and AI Tunnel..."
  pm2 delete LearnOverseas 2>/dev/null || true
  pm2 delete LearnOverseasAI 2>/dev/null || true
  pm2 flush 2>/dev/null || true
  pm2 start npm --name LearnOverseas --cwd /home/admin_learn_overseas/ai-course-analyser -- start -- -p 3004 -H 0.0.0.0
  pm2 start tunnel-service.js --name LearnOverseasAI --cwd /home/admin_learn_overseas/ai-course-analyser
  pm2 save 2>/dev/null || true
  pm2 startup 2>/dev/null || true

  echo "  -> Waiting 10 seconds for server to initialize..."
  sleep 10

  echo "  -> Testing login API..."
  LOGIN_OUTPUT=$(curl -s -i -X POST http://localhost:3004/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"superadmin","password":"superadmin"}' 2>&1 || true)

  echo "  Result: $LOGIN_OUTPUT"

  if echo "$LOGIN_OUTPUT" | grep -q "200 OK"; then
    echo ""
    echo "  ======================================"
    echo "  🎉 DEPLOY SUCCESSFUL! LOGIN VERIFIED!"
    echo "  App: http://192.168.0.66:3004"
    echo "  Login: superadmin / superadmin"
    echo "  ======================================"
  else
    echo ""
    echo "  [DIAGNOSTIC] Checking server error logs:"
    pm2 logs LearnOverseas --err --lines 20 --nostream 2>/dev/null || true
  fi
REMOTE

