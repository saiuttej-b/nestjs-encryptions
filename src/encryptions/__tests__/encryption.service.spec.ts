import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DecryptionFailedError, EncryptionService, InvalidCiphertextError } from '../../index';

jest.mock('bcrypt', () => {
  const actual = jest.requireActual<typeof import('bcrypt')>('bcrypt');
  return {
    hash: jest.fn((value: string | Buffer, salt: string | number) => actual.hash(value, salt)),
    compare: jest.fn((value: string | Buffer, hashed: string) => actual.compare(value, hashed)),
  };
});

const secret = 'test-secret';

function legacyCiphertext(value: string, keySecret: string): string {
  const key = keySecret.padStart(32, '0');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
}

function tamperTag(payload: string): string {
  const parts = payload.split(':');
  const tag = Buffer.from(parts[2] ?? '', 'base64');
  tag[0] ^= 0xff;
  parts[2] = tag.toString('base64');
  return parts.join(':');
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService({ secret });
    service.onModuleInit();
  });

  it('writes a versioned GCM payload and round-trips it', () => {
    const encrypted = service.encrypt('hello');
    const parts = encrypted.split(':');

    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('v1');
    expect(Buffer.from(parts[1] ?? '', 'base64')).toHaveLength(12);
    expect(Buffer.from(parts[2] ?? '', 'base64')).toHaveLength(16);
    expect(service.decrypt(encrypted)).toBe('hello');
    expect(service.encrypt('hello')).not.toBe(encrypted);
  });

  it('round-trips unicode and empty strings', () => {
    expect(service.decrypt(service.encrypt('héllo 😀'))).toBe('héllo 😀');
    expect(service.decrypt(service.encrypt(''))).toBe('');
  });

  it('uses a per-call key', () => {
    const encrypted = service.encrypt('hello', { key: 'custom-key' });

    expect(service.decrypt(encrypted, { key: 'custom-key' })).toBe('hello');
    expect(() => service.decrypt(encrypted)).toThrow(DecryptionFailedError);
  });

  it('decrypts a legacy CBC payload', () => {
    const legacy = legacyCiphertext('hello', secret);

    expect(legacy.startsWith('v1:')).toBe(false);
    expect(service.decrypt(legacy)).toBe('hello');
  });

  it('rejects a secret longer than 32 characters', () => {
    const invalid = new EncryptionService({ secret: 'a'.repeat(33) });

    expect(() => invalid.onModuleInit()).toThrow(
      'Invalid encryption key. Key must be at most 32 characters long',
    );
    expect(() => invalid.encrypt('value')).toThrow(
      'Invalid encryption key. Key must be at most 32 characters long',
    );
  });

  it('rejects a per-call key longer than 32 characters', () => {
    expect(() => service.encrypt('value', { key: 'b'.repeat(33) })).toThrow(
      'Invalid encryption key. Key must be at most 32 characters long',
    );
  });

  it('rejects malformed payloads', () => {
    const payloads = [
      'nope',
      'a:b:c',
      `${Buffer.alloc(16).toString('base64')}:`,
      `${Buffer.alloc(8).toString('base64')}:${Buffer.alloc(16).toString('base64')}`,
      'v1:only:three',
      `v1:${Buffer.alloc(8).toString('base64')}:${Buffer.alloc(16).toString('base64')}:aaaa`,
      `v1:${Buffer.alloc(12).toString('base64')}:${Buffer.alloc(8).toString('base64')}:aaaa`,
    ];

    for (const payload of payloads) {
      expect(() => service.decrypt(payload)).toThrow(InvalidCiphertextError);
    }
  });

  it('rejects a legacy payload that cannot be decrypted', () => {
    const iv = crypto.randomBytes(16).toString('base64');
    const misaligned = `${iv}:${Buffer.from('a').toString('base64')}`;

    expect(() => service.decrypt(misaligned)).toThrow(DecryptionFailedError);
    expect(() => service.decrypt(misaligned)).toThrow('Decryption failed.');
  });

  it('rejects a tampered GCM tag', () => {
    const tampered = tamperTag(service.encrypt('hello'));

    expect(() => service.decrypt(tampered)).toThrow(DecryptionFailedError);
    expect(() => service.decrypt(tampered, { suppressError: false })).toThrow(
      DecryptionFailedError,
    );
  });

  it('returns null when suppressError is set', () => {
    const tampered = tamperTag(service.encrypt('hello'));

    expect(service.decrypt('nope', { suppressError: true })).toBeNull();
    expect(service.decrypt(tampered, { suppressError: true })).toBeNull();
    expect(() => service.decrypt('payload', { suppressError: true, key: 'c'.repeat(33) })).toThrow(
      'Invalid encryption key. Key must be at most 32 characters long',
    );
  });

  it('compares a bcrypt hash', async () => {
    const hashed = await service.hash('password', 4);

    await expect(service.compareHash('password', hashed)).resolves.toBe(true);
    await expect(service.compareHash('other', hashed)).resolves.toBe(false);
  });

  it('defaults the bcrypt salt to 10 and forwards 0', async () => {
    const hashMock = jest.mocked(
      bcrypt.hash as (data: string | Buffer, saltOrRounds: string | number) => Promise<string>,
    );

    hashMock.mockResolvedValueOnce('hashed-zero');
    await expect(service.hash('password', 0)).resolves.toBe('hashed-zero');
    expect(hashMock).toHaveBeenCalledWith('password', 0);

    hashMock.mockResolvedValueOnce('hashed-default');
    await expect(service.hash('password')).resolves.toBe('hashed-default');
    expect(hashMock).toHaveBeenLastCalledWith('password', 10);
  });
});
