// src/lib/crypto.ts

// Lightweight client-side AES-256-GCM encryption using Web Crypto.
// - Derives a key from a passphrase with PBKDF2 (100k iterations).
// - Encrypts UTF-8 text and returns a base64 payload that includes IV + salt.
// - Decrypts from the same base64 payload.
// NOTE: For production HIPAA, you'll replace passphrases with public-key E2EE
// (e.g., FlowCrypt/YubiKey) — this module is still safe for interim exports.

function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function bytesToUtf8(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function toBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}
function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    utf8ToBytes(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function aesEncryptToBase64(plainText: string, passphrase: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    utf8ToBytes(plainText)
  );
  // payload layout: [ salt(16) | iv(12) | ciphertext(...) ]
  const payload = concatBytes(concatBytes(salt, iv), new Uint8Array(cipherBuf));
  return toBase64(payload);
}

export async function aesDecryptFromBase64(b64: string, passphrase: string): Promise<string> {
  const payload = fromBase64(b64);
  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 28);
  const ciphertext = payload.slice(28);
  const key = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return bytesToUtf8(new Uint8Array(plainBuf));
}

// Helper: download any string as an encrypted .enc file
export async function encryptAndDownload(filenameBase: string, content: string, passphrase: string) {
  const b64 = await aesEncryptToBase64(content, passphrase);
  const blob = new Blob([b64], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.enc`;
  a.click();
  URL.revokeObjectURL(url);
}
