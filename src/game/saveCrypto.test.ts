import { describe, expect, it } from 'vitest';
import { decryptSave, ENCRYPTED_SAVE_FORMAT, ENCRYPTED_SAVE_VERSION, encryptLegacyPasswordSave, encryptSave, isEncryptedSave, LEGACY_PASSWORD_SAVE_VERSION, requiresSavePassword, SAVE_KDF_ITERATIONS } from './saveCrypto';

describe('encrypted portable saves', () => {
  it('round-trips an application-managed save without asking for a password', async () => {
    const source = JSON.stringify({ format: 'last-bastion-save', state: { gold: 777, unlockedStage: 5 } });
    const encrypted = await encryptSave(source);
    const envelope = JSON.parse(encrypted) as Record<string, any>;

    expect(envelope.format).toBe(ENCRYPTED_SAVE_FORMAT);
    expect(envelope.version).toBe(ENCRYPTED_SAVE_VERSION);
    expect(envelope.protection).toBe('application-managed');
    expect(envelope.gameVersion).toBe('0.2.0');
    expect(envelope.saveSchemaVersion).toBe(12);
    expect(envelope.encryption.algorithm).toBe('AES-GCM');
    expect(envelope.kdf.algorithm).toBe('PBKDF2');
    expect(envelope.kdf.iterations).toBe(SAVE_KDF_ITERATIONS);
    expect(envelope.checksum.algorithm).toBe('SHA-256');
    expect(isEncryptedSave(encrypted)).toBe(true);
    expect(requiresSavePassword(encrypted)).toBe(false);
    expect(await decryptSave(encrypted)).toBe(source);
  });

  it('keeps version-one password saves importable without imposing a new length rule', async () => {
    const source = JSON.stringify({ format: 'last-bastion-save', state: { gold: 321 } });
    const encrypted = await encryptLegacyPasswordSave(source, 'x');
    const envelope = JSON.parse(encrypted) as Record<string, any>;

    expect(envelope.version).toBe(LEGACY_PASSWORD_SAVE_VERSION);
    expect(requiresSavePassword(encrypted)).toBe(true);
    await expect(decryptSave(encrypted)).rejects.toThrow('PASSWORD_REQUIRED');
    expect(await decryptSave(encrypted, 'x')).toBe(source);
    await expect(decryptSave(encrypted, 'wrong-password')).rejects.toThrow();
  });

  it('rejects ciphertext that no longer matches its checksum', async () => {
    const encrypted = JSON.parse(await encryptSave('{"gold":100}')) as Record<string, any>;
    encrypted.ciphertext = `${encrypted.ciphertext.slice(0, -4)}AAAA`;
    await expect(decryptSave(JSON.stringify(encrypted))).rejects.toThrow('CHECKSUM_MISMATCH');
  });
});
