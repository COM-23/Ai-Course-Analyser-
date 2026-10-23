#!/usr/bin/env node
/**
 * LEARN OVERSEAS - CONFIDENTIAL DATA ENCRYPTOR
 * Military-grade AES-256-CBC with HMAC-SHA256 (Authenticated Encryption)
 * 
 * Protects confidential university and program CSV datasets.
 * Usage:
 *   node scripts/encrypt-csv.js <path-to-csv> [optional-secret-passphrase]
 * Example:
 *   node scripts/encrypt-csv.js programs.csv
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAGIC = Buffer.from('LO_ENC_V1'); // 9 bytes identifier

async function encryptFile() {
  const targetArg = process.argv[2] || 'programs.csv';
  const inputPath = path.resolve(process.cwd(), targetArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] File not found: ${inputPath}`);
    process.exit(1);
  }

  const outputPath = inputPath + '.enc';
  const passphrase = process.argv[3] || process.env.CSV_ENCRYPTION_KEY || 'LearnOverseas@SecuredData2026!';

  console.log('========================================================');
  console.log('  CONFIDENTIAL CSV ENCRYPTION UTILITY');
  console.log('========================================================');
  console.log(`  Source File:      ${path.basename(inputPath)} (${(fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`  Destination:      ${path.basename(outputPath)}`);
  console.log(`  Cipher Algorithm: AES-256-CBC + HMAC-SHA256 (Authenticated)`);
  console.log('--------------------------------------------------------');

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);

  // Derive 64 bytes: 32 bytes for AES-256 key + 32 bytes for HMAC-SHA256 key
  const derivedKey = crypto.scryptSync(passphrase, salt, 64);
  const encKey = derivedKey.subarray(0, 32);
  const macKey = derivedKey.subarray(32, 64);

  const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
  const hmac = crypto.createHmac('sha256', macKey);

  const inputStream = fs.createReadStream(inputPath);
  const outputStream = fs.createWriteStream(outputPath);

  // Write file header: [MAGIC: 9 bytes] + [SALT: 16 bytes] + [IV: 16 bytes]
  outputStream.write(MAGIC);
  outputStream.write(salt);
  outputStream.write(iv);
  hmac.update(MAGIC);
  hmac.update(salt);
  hmac.update(iv);

  let processedBytes = 0;
  const totalBytes = fs.statSync(inputPath).size;

  inputStream.on('data', (chunk) => {
    processedBytes += chunk.length;
    const encrypted = cipher.update(chunk);
    if (encrypted.length > 0) {
      outputStream.write(encrypted);
      hmac.update(encrypted);
    }
    const percent = ((processedBytes / totalBytes) * 100).toFixed(1);
    process.stdout.write(`\r  [Encrypting] Progress: ${percent}% (${(processedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB)...`);
  });

  inputStream.on('end', () => {
    const finalEncrypted = cipher.final();
    if (finalEncrypted.length > 0) {
      outputStream.write(finalEncrypted);
      hmac.update(finalEncrypted);
    }

    const mac = hmac.digest(); // 32 bytes HMAC
    outputStream.write(mac);
    outputStream.end();

    console.log(`\n\n  [SUCCESS] Encryption complete!`);
    console.log(`  Encrypted File:   ${outputPath}`);
    console.log(`  File Size:        ${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Encryption Key:   ${process.argv[3] || process.env.CSV_ENCRYPTION_KEY ? '(Provided by user/env)' : 'Default system key used'}`);
    console.log('--------------------------------------------------------');
    console.log('  IMPORTANT SECURITY NOTE:');
    console.log('  1. The encrypted file (*.enc) is safely excluded by .gitignore.');
    console.log('  2. You can safely delete or archive the plaintext CSV file.');
    console.log('  3. To restore or decrypt, run: node scripts/decrypt-csv.js ' + path.basename(outputPath));
    console.log('========================================================\n');
  });

  inputStream.on('error', (err) => {
    console.error('\n[ERROR] Encryption stream failed:', err);
    process.exit(1);
  });
}

encryptFile().catch(console.error);
