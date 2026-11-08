/**
 * hashService.ts
 * 
 * Hardware-accelerated SHA-256 cryptographic digest generator for PayPilot
 * audit reports and scoped share links. Includes deterministic canonical
 * JSON stringification and a pure-JS fallback for headless/test environments.
 */

export interface SignedReportPayload<T = any> {
  id: string;
  reportType: 'RECOVERY_AUDIT' | 'PAYMENT_TRUTH' | 'FINANCIAL_TWIN' | 'COMPLIANCE_SUMMARY';
  title: string;
  generatedAt: string;
  expiresAt: string;
  generatedBy: string;
  scope: 'READ_ONLY' | 'ACCOUNTANT_VERIFIED' | 'EXECUTIVE_SUMMARY';
  data: T;
}

export interface SignedReport<T = any> {
  payload: SignedReportPayload<T>;
  payloadHash: string;
  signatureBadge: string;
  shortHash: string;
  isVerified: boolean;
}

/**
 * Deterministically serializes any JavaScript object or primitive by recursively
 * sorting dictionary keys. This guarantees identical SHA-256 hashes for identical data.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalStringify(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const keyValues = sortedKeys.map((key) => {
    return JSON.stringify(key) + ':' + canonicalStringify(obj[key]);
  });
  return '{' + keyValues.join(',') + '}';
}

/**
 * Portable 32-bit pure TypeScript SHA-256 implementation (FIPS PUB 180-2 compliant).
 * Used automatically when window.crypto.subtle is unavailable (Node.js/Vitest/jsdom).
 */
export function pureJsSha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Pre-processing (Padding)
  const bytes: number[] = [];
  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code < 2048) {
      bytes.push((code >> 6) | 192);
      bytes.push((code & 63) | 128);
    } else {
      bytes.push((code >> 12) | 224);
      bytes.push(((code >> 6) & 63) | 128);
      bytes.push((code & 63) | 128);
    }
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) {
    bytes.push(0);
  }
  // Append 64-bit length big-endian
  bytes.push(0, 0, 0, 0);
  bytes.push((bitLength >>> 24) & 255);
  bytes.push((bitLength >>> 16) & 255);
  bytes.push((bitLength >>> 8) & 255);
  bytes.push(bitLength & 255);

  const w = new Int32Array(64);

  // Process each 512-bit (64-byte) chunk
  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = chunk + i * 4;
      w[i] = (bytes[idx] << 24) | (bytes[idx + 1] << 16) | (bytes[idx + 2] << 8) | bytes[idx + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  function toHex(val: number): string {
    return (val >>> 0).toString(16).padStart(8, '0');
  }

  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
}

/**
 * Computes the 64-character lowercase hexadecimal SHA-256 digest of a string or object.
 */
export async function computeSha256(input: string | Record<string, any>): Promise<string> {
  const normalizedText = typeof input === 'string' ? input : canonicalStringify(input);

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
  if (cryptoObj && cryptoObj.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalizedText);
      const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return pureJsSha256(normalizedText);
    }
  }

  return pureJsSha256(normalizedText);
}


/**
 * Formats a 64-character SHA-256 hash into a stylized PayPilot badge string.
 * Example: "#PAY-SHA256-4D8B9A1F-8E304C22"
 */
export function formatSignatureBadge(hexHash: string): string {
  const clean = hexHash.replace(/[^a-fA-F0-9]/g, '');
  const prefix = clean.slice(0, 8).toUpperCase();
  const suffix = clean.slice(-8).toUpperCase();
  return `#PAY-SHA256-${prefix}-${suffix}`;
}

/**
 * Signs an arbitrary report payload, generating an immutable verifiable package.
 */
export async function signReportPayload<T = any>(
  payloadData: Omit<SignedReportPayload<T>, 'generatedAt' | 'expiresAt'>,
  validityHours = 72
): Promise<SignedReport<T>> {
  const now = new Date();
  const expires = new Date(now.getTime() + validityHours * 60 * 60 * 1000);

  const fullPayload: SignedReportPayload<T> = {
    ...payloadData,
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  const payloadHash = await computeSha256(fullPayload);
  const signatureBadge = formatSignatureBadge(payloadHash);
  const shortHash = payloadHash.slice(0, 12);

  return {
    payload: fullPayload,
    payloadHash,
    signatureBadge,
    shortHash,
    isVerified: true,
  };
}

/**
 * Verifies that a signed report's payload matches its declared cryptographic hash.
 */
export async function verifyReportIntegrity(report: SignedReport): Promise<boolean> {
  try {
    const computed = await computeSha256(report.payload);
    return computed.toLowerCase() === report.payloadHash.toLowerCase();
  } catch {
    return false;
  }
}
