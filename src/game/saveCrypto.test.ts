import { describe, expect, it } from 'vitest';
import { decryptSave, ENCRYPTED_SAVE_FORMAT, encryptSave, isEncryptedSave, SAVE_KDF_ITERATIONS } from './saveCrypto';

describe('encrypted portable saves', () => {
  it('round-trips a save through PBKDF2 and AES-GCM with a SHA-256 checksum', async () => {
    const source = JSON.stringify({ format: 'last-bastion-save', state: { gold: 777, unlockedStage: 5 } });
    const encrypted = await encryptSave(source, 'bastion-test-password');
    const envelope = JSON.parse(encrypted) as Record<string, any>;

    expect(envelope.format).toBe(ENCRYPTED_SAVE_FORMAT);
    expect(envelope.gameVersion).toBe('0.2.0');
    expect(envelope.saveSchemaVersion).toBe(2);
    expect(envelope.encryption.algorithm).toBe('AES-GCM');
    expect(envelope.kdf.algorithm).toBe('PBKDF2');
    expect(envelope.kdf.iterations).toBe(SAVE_KDF_ITERATIONS);
    expect(envelope.checksum.algorithm).toBe('SHA-256');
    expect(isEncryptedSave(encrypted)).toBe(true);
    expect(await decryptSave(encrypted, 'bastion-test-password')).toBe(source);
    await expect(decryptSave(encrypted, 'wrong-password')).rejects.toThrow();
  });

  it('rejects ciphertext that no longer matches its checksum', async () => {
    const encrypted = JSON.parse(await encryptSave('{"gold":100}', 'bastion-test-password')) as Record<string, any>;
    encrypted.ciphertext = `${encrypted.ciphertext.slice(0, -4)}AAAA`;
    await expect(decryptSave(JSON.stringify(encrypted), 'bastion-test-password')).rejects.toThrow('CHECKSUM_MISMATCH');
  });
});
