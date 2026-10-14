#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_FILE = path.resolve(__dirname, '../api-keys.json');

function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) {
    return { keys: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
  } catch {
    return { keys: [] };
  }
}

function saveKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

function generateKey() {
  return 'lo_live_' + crypto.randomBytes(24).toString('base64url');
}

const command = process.argv[2];
const arg = process.argv[3];

if (command === 'create') {
  const name = arg || 'Default Client';
  const newKey = generateKey();
  const keyHash = crypto.createHash('sha256').update(newKey).digest('hex');
  const data = loadKeys();
  const entry = {
    id: 'key_' + crypto.randomBytes(4).toString('hex'),
    name,
    keyHash: keyHash,
    prefix: newKey.slice(0, 12) + '...',
    createdAt: new Date().toISOString(),
    active: true
  };
  data.keys.push(entry);
  saveKeys(data);
  console.log('\n========================================================');
  console.log('  NEW API KEY CREATED');
  console.log('========================================================');
  console.log(`  Name:   ${entry.name}`);
  console.log(`  ID:     ${entry.id}`);
  console.log(`  Key:    ${newKey}`);
  console.log('  ⚠️  IMPORTANT: Copy this key now! It is cryptographically');
  console.log('      hashed with SHA-256 and will NEVER be stored in plaintext.');
  console.log('========================================================\n');
} else if (command === 'list') {
  const data = loadKeys();
  console.log('\n========================================================================');
  console.log('  REGISTERED API KEYS (CRYPTOGRAPHICALLY HASHED)');
  console.log('========================================================================');
  if (data.keys.length === 0) {
    console.log('  No API keys found. Run: node scripts/manage-api-keys.js create "<Name>"');
  } else {
    for (const k of data.keys) {
      console.log(`  [${k.active ? 'ACTIVE' : 'REVOKED'}] ${k.name}`);
      console.log(`    Prefix: ${k.prefix || (k.key ? k.key.slice(0, 12) + '...' : 'Unknown')}`);
      console.log(`    Hash:   ${(k.keyHash || 'legacy').slice(0, 16)}...`);
      console.log(`    ID:     ${k.id} | Created: ${k.createdAt}\n`);
    }
  }
  console.log('========================================================================\n');
} else if (command === 'revoke') {
  if (!arg) {
    console.error('Please specify the key ID or key string to revoke.');
    process.exit(1);
  }
  const data = loadKeys();
  let found = false;
  for (const k of data.keys) {
    if (k.id === arg || k.key === arg) {
      k.active = false;
      found = true;
      break;
    }
  }
  if (found) {
    saveKeys(data);
    console.log(`[OK] Key '${arg}' has been revoked successfully.`);
  } else {
    console.error(`[ERROR] Key '${arg}' not found.`);
  }
} else {
  console.log(`
Usage:
  node scripts/manage-api-keys.js create "<Name>"   Create a new API key
  node scripts/manage-api-keys.js list              List all API keys
  node scripts/manage-api-keys.js revoke "<ID/Key>" Revoke an API key
  `);
}
