#!/usr/bin/env node
/**
 * LEARN OVERSEAS - CONFIDENTIAL DATA DECRYPTOR
 * Authenticated Decryption for AES-256-CBC with HMAC-SHA256
 * 
 * Usage:
 *   node scripts/decrypt-csv.js <path-to-enc-file> [optional-secret-passphrase]
 * Example:
 *   node scripts/decrypt-csv.js programs.csv.enc
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Transform } = require('stream');

const MAGIC = Buffer.from('LO_ENC_V1'); // 9 bytes

/**
 * Returns a readable stream of decrypted plaintext directly in RAM.
 * Can be piped directly to readline / CSV parsers with ZERO temporary files on disk.
 */
function createDecryptedReadStream(encPath, passphrase) {
  passphrase = passphrase || process.env.CSV_ENCRYPTION_KEY || 'LearnOverseas@SecuredData2026!';

  const fd = fs.openSync(encPath, 'r');
  const header = Buffer.alloc(9 + 16 + 16);
  fs.readSync(fd, header, 0, header.length, 0);

  const fileMagic = header.subarray(0, 9);
  if (!fileMagic.equals(MAGIC)) {
    fs.closeSync(fd);
    throw new Error('Invalid file format: MAGIC header mismatch');
  }

  const salt = header.subarray(9, 25);
  const iv = header.subarray(25, 41);

  const derivedKey = crypto.scryptSync(passphrase, salt, 64);
  const encKey = derivedKey.subarray(0, 32);
  const macKey = derivedKey.subarray(32, 64);

  const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
  const hmac = crypto.createHmac('sha256', macKey);

  hmac.update(fileMagic);
  hmac.update(salt);
  hmac.update(iv);

  const stat = fs.fstatSync(fd);
  const totalCiphertextLen = stat.size - header.length - 32; // excluding header and 32-byte MAC
  fs.closeSync(fd);

  if (totalCiphertextLen < 0) {
    throw new Error('Encrypted file corrupted: file too small');
  }

  // Stream ciphertext up to totalCiphertextLen, passing chunks to decipher and hmac
  let bytesReadFromCiphertext = 0;
  const rawStream = fs.createReadStream(encPath, { start: header.length });

  let macBuffer = Buffer.alloc(0);

  const filterStream = new Transform({
    transform(chunk, encoding, callback) {
      if (bytesReadFromCiphertext < totalCiphertextLen) {
        const needed = totalCiphertextLen - bytesReadFromCiphertext;
        if (chunk.length <= needed) {
          bytesReadFromCiphertext += chunk.length;
          hmac.update(chunk);
          this.push(decipher.update(chunk));
        } else {
          const cipherChunk = chunk.subarray(0, needed);
          const remaining = chunk.subarray(needed);
          bytesReadFromCiphertext += cipherChunk.length;
          hmac.update(cipherChunk);
          this.push(decipher.update(cipherChunk));
          macBuffer = Buffer.concat([macBuffer, remaining]);
        }
      } else {
        macBuffer = Buffer.concat([macBuffer, chunk]);
      }
      callback();
    },
    flush(callback) {
      try {
        const finalChunk = decipher.final();
        if (finalChunk.length > 0) {
          this.push(finalChunk);
        }

        const expectedMac = hmac.digest();
        if (macBuffer.length !== 32 || !crypto.timingSafeEqual(macBuffer, expectedMac)) {
          return callback(new Error('CRITICAL INTEGRITY ERROR: Authentication tag mismatch! Passphrase incorrect or file modified.'));
        }
        callback();
      } catch (err) {
        callback(err);
      }
    }
  });

  return rawStream.pipe(filterStream);
}

async function decryptFileCli() {
  const targetArg = process.argv[2] || 'programs.csv.enc';
  const inputPath = path.resolve(process.cwd(), targetArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] File not found: ${inputPath}`);
    process.exit(1);
  }

  let outputPath = inputPath.endsWith('.enc') ? inputPath.slice(0, -4) : inputPath + '.decrypted.csv';
  if (outputPath === inputPath) outputPath += '.decrypted.csv';

  const passphrase = process.argv[3] || process.env.CSV_ENCRYPTION_KEY || 'LearnOverseas@SecuredData2026!';

  console.log('========================================================');
  console.log('  CONFIDENTIAL CSV DECRYPTION UTILITY');
  console.log('========================================================');
  console.log(`  Source File:      ${path.basename(inputPath)}`);
  console.log(`  Destination:      ${path.basename(outputPath)}`);
  console.log(`  Cipher Algorithm: AES-256-CBC + HMAC-SHA256 (Authenticated)`);
  console.log('--------------------------------------------------------');

  const decryptedStream = createDecryptedReadStream(inputPath, passphrase);
  const writeStream = fs.createWriteStream(outputPath);

  let decryptedBytes = 0;
  decryptedStream.on('data', (chunk) => {
    decryptedBytes += chunk.length;
    process.stdout.write(`\r  [Decrypting] Restored: ${(decryptedBytes / (1024 * 1024)).toFixed(1)} MB...`);
  });

  decryptedStream.on('error', (err) => {
    console.error('\n[ERROR] Decryption failed:', err.message);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    process.exit(1);
  });

  decryptedStream.pipe(writeStream);

  writeStream.on('finish', () => {
    console.log(`\n\n  [SUCCESS] Decryption complete & verified!`);
    console.log(`  Restored File:    ${outputPath}`);
    console.log(`  File Size:        ${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB`);
    console.log('========================================================\n');
  });
}

if (require.main === module) {
  decryptFileCli().catch(console.error);
}

module.exports = {
  createDecryptedReadStream
};
