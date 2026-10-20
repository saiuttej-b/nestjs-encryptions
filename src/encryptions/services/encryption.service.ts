import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ENCRYPTION_OPTIONS } from '../constants/encryptions.constants';
import { DecryptionFailedError, InvalidCiphertextError } from '../encryptions.errors';
import type { EncryptionOptions } from '../types/types';

const GCM_ALGORITHM = 'aes-256-gcm';
const CBC_ALGORITHM = 'aes-256-cbc';
const GCM_IV_LENGTH = 12;
const CBC_IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_CHARACTER_LIMIT = 32;
const KEY_ERROR = 'Invalid encryption key. Key must be at most 32 characters long';

/**
 * Encrypts with AES-256-GCM, decrypts GCM and legacy CBC payloads, and hashes with bcrypt.
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  constructor(@Inject(ENCRYPTION_OPTIONS) private readonly options: EncryptionOptions) {}

  /**
   * Rejects a module secret longer than 32 characters.
   */
  onModuleInit(): void {
    this.assertKeyLength(this.options.secret);
  }

  /**
   * Encrypts `value` with AES-256-GCM.
   *
   * The payload is `v1:<iv>:<authTag>:<ciphertext>`, with each segment base64-encoded.
   * `options.key` overrides the module secret for this call.
   */
  encrypt(value: string, options?: { key?: string }): string {
    const key = this.getKey(options?.key);
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv(GCM_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      'v1',
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  /**
   * Decrypts a v1 AES-256-GCM payload or a legacy AES-256-CBC payload.
   *
   * Returns null when `suppressError` is true and the payload is invalid or authentication fails.
   * A key longer than 32 characters still throws.
   */
  decrypt(
    encryptedValue: string,
    options?: { key?: string; suppressError?: boolean },
  ): string | null {
    try {
      const key = this.getKey(options?.key);
      if (encryptedValue.startsWith('v1:')) {
        return this.decryptGcm(encryptedValue, key);
      }

      return this.decryptLegacyCbc(encryptedValue, key);
    } catch (error) {
      if (
        options?.suppressError &&
        (error instanceof InvalidCiphertextError || error instanceof DecryptionFailedError)
      ) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Hashes `value` with bcrypt. `salt` defaults to 10 rounds. An explicit `0` is forwarded.
   */
  hash(value: string, salt?: number): Promise<string> {
    return bcrypt.hash(value, salt ?? 10);
  }

  /**
   * Returns whether `value` matches a bcrypt hash.
   */
  compareHash(value: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(value, hashed);
  }

  private getKey(key?: string): string {
    if (!key) {
      key = this.options.secret;
    }

    this.assertKeyLength(key);
    return key.padStart(KEY_CHARACTER_LIMIT, '0');
  }

  private assertKeyLength(key: string): void {
    if (key.length > KEY_CHARACTER_LIMIT) {
      throw new Error(KEY_ERROR);
    }
  }

  private decryptGcm(payload: string, key: string): string {
    const parts = payload.split(':');
    if (parts.length !== 4) {
      throw new InvalidCiphertextError();
    }

    const iv = Buffer.from(parts[1], 'base64');
    const authTag = Buffer.from(parts[2], 'base64');
    const encrypted = Buffer.from(parts[3], 'base64');
    if (iv.length !== GCM_IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new InvalidCiphertextError();
    }

    try {
      const decipher = crypto.createDecipheriv(GCM_ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      throw new DecryptionFailedError();
    }
  }

  private decryptLegacyCbc(payload: string, key: string): string {
    const parts = payload.split(':');
    if (parts.length !== 2) {
      throw new InvalidCiphertextError();
    }

    const iv = Buffer.from(parts[0], 'base64');
    if (iv.length !== CBC_IV_LENGTH || parts[1].length === 0) {
      throw new InvalidCiphertextError();
    }

    try {
      const decipher = crypto.createDecipheriv(CBC_ALGORITHM, key, iv);
      const decrypted = Buffer.concat([decipher.update(parts[1], 'base64'), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      throw new DecryptionFailedError();
    }
  }
}
