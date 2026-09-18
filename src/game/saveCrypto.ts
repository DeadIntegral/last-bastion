import { GAME_VERSION, SAVE_SCHEMA_VERSION } from '../data/version';

export const ENCRYPTED_SAVE_FORMAT = 'last-bastion-encrypted-save';
export const ENCRYPTED_SAVE_VERSION = 1;
export const SAVE_KDF_ITERATIONS = 210_000;
export const MAX_SAVE_FILE_BYTES = 2_000_000;

interface EncryptedSaveEnvelope {
  format: typeof ENCRYPTED_SAVE_FORMAT;
  version: typeof ENCRYPTED_SAVE_VERSION;
  gameVersion?: string;
  saveSchemaVersion?: number;
  encryption: {
    algorithm: 'AES-GCM';
    keyLength: 256;
    iv: string;
  };
  kdf: {
    algorithm: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string;
  };
  encoding: 'base64';
  checksum: {
    algorithm: 'SHA-256';
    value: string;
  };
  ciphertext: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(salt), iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function checksum(bytes: Uint8Array): Promise<string> {
  return bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', toArrayBuffer(bytes))));
}

function isEnvelope(value: unknown): value is EncryptedSaveEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<EncryptedSaveEnvelope>;
  return envelope.format === ENCRYPTED_SAVE_FORMAT
    && envelope.version === ENCRYPTED_SAVE_VERSION
    && envelope.encryption?.algorithm === 'AES-GCM'
    && envelope.encryption.keyLength === 256
    && typeof envelope.encryption.iv === 'string'
    && envelope.kdf?.algorithm === 'PBKDF2'
    && envelope.kdf.hash === 'SHA-256'
    && Number.isInteger(envelope.kdf.iterations)
    && envelope.kdf.iterations >= 100_000
    && envelope.kdf.iterations <= 1_000_000
    && typeof envelope.kdf.salt === 'string'
    && envelope.encoding === 'base64'
    && envelope.checksum?.algorithm === 'SHA-256'
    && typeof envelope.checksum.value === 'string'
    && typeof envelope.ciphertext === 'string';
}

export function isEncryptedSave(serialized: string): boolean {
  try {
    return isEnvelope(JSON.parse(serialized));
  } catch {
    return false;
  }
}

export async function encryptSave(serialized: string, password: string): Promise<string> {
  if (password.length < 8) throw new Error('PASSWORD_TOO_SHORT');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, SAVE_KDF_ITERATIONS);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(encoder.encode(serialized))));
  const envelope: EncryptedSaveEnvelope = {
    format: ENCRYPTED_SAVE_FORMAT,
    version: ENCRYPTED_SAVE_VERSION,
    gameVersion: GAME_VERSION,
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    encryption: { algorithm: 'AES-GCM', keyLength: 256, iv: bytesToBase64(iv) },
    kdf: { algorithm: 'PBKDF2', hash: 'SHA-256', iterations: SAVE_KDF_ITERATIONS, salt: bytesToBase64(salt) },
    encoding: 'base64',
    checksum: { algorithm: 'SHA-256', value: await checksum(ciphertext) },
    ciphertext: bytesToBase64(ciphertext),
  };
  return JSON.stringify(envelope, null, 2);
}

export async function decryptSave(serialized: string, password: string): Promise<string> {
  const parsed = JSON.parse(serialized) as unknown;
  if (!isEnvelope(parsed)) throw new Error('INVALID_ENVELOPE');
  const ciphertext = base64ToBytes(parsed.ciphertext);
  if (await checksum(ciphertext) !== parsed.checksum.value) throw new Error('CHECKSUM_MISMATCH');
  const salt = base64ToBytes(parsed.kdf.salt);
  const iv = base64ToBytes(parsed.encryption.iv);
  const key = await deriveKey(password, salt, parsed.kdf.iterations);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext));
  return decoder.decode(plaintext);
}
