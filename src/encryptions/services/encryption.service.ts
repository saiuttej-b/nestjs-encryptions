import { Inject, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import * as crypto from 'crypto';
import { ENCRYPTION_OPTIONS } from '../constants/encryptions.constants';
import type { EncryptionOptions } from '../types/types';

/**
 * Provides encryption and hashing services.

 * This service encrypts and decrypts strings using the AES-256-CBC algorithm. 
 * It also provides functions for hashing and comparing strings using bcrypt.
 */
@Injectable()
export class EncryptionService {
  /**
   * The encryption algorithm used by the service.
   *
   * @private
   * @readonly
   * @memberof EncryptionService
   * @type {string}
   */
  private readonly algorithm: string = 'aes-256-cbc';

  /**
   * Creates a new instance of the EncryptionService.
   *
   * @param {EncryptionOptions} options - Encryption options.
   */
  constructor(@Inject(ENCRYPTION_OPTIONS) private readonly options: EncryptionOptions) {}

  /**
   * Validates the encryption key.
   *
   * The key must be at most 32 characters long.
   *
   * @protected
   */
  protected onModuleInit() {
    if (this.options.secret.length > 32) {
      const message = 'Invalid encryption key. Key must be at most 32 characters long';
      throw new Error(message);
    }
  }

  /**
   * Gets the encryption key.
   *
   * - Uses the key from the options if provided.
   * - Otherwise, uses the key from the config service.
   * - Pads the key with 0s to ensure it is 32 characters long.
   * - Throws an error if no key is provided.
   *
   * @param {string} [options?.key] - Optional encryption key from options.
   * @returns {string} - 32-character encryption key.
   */
  private getKey(key?: string): string {
    if (!key) key = this.options.secret;
    if (key.length > 32) {
      const message = 'Invalid encryption key. Key must be at most 32 characters long';
      throw new Error(message);
    }

    return key.padStart(32, '0');
  }

  /**
   * Encrypts the given string using the AES-256-CBC algorithm.
   *
   * @param {string} value - The string to encrypt.
   * @param {EncryptionOptions} [options] - Optional encryption options (e.g., custom key).
   * @returns {string} - The encrypted string.
   */
  encrypt(value: string, options?: { key?: string }): string {
    const key = this.getKey(options?.key);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return `${iv.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypts the given string using the AES-256-CBC algorithm.
   *
   * @param {string} encryptedValue - The encrypted string.
   * @param {DecryptionOptions} [options] - Optional decryption options (e.g., custom key, suppressError).
   * @returns {string | null} - The decrypted string, or null if decryption fails and `suppressError` is true.
   */
  decrypt(
    encryptedValue: string,
    options?: { key?: string; suppressError?: boolean },
  ): string | null {
    const key = this.getKey(options?.key);

    const [ivHex, encrypted] = encryptedValue.split(':');
    const iv = Buffer.from(ivHex, 'base64');

    try {
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error: any) {
      if (options?.suppressError) return null;

      throw error;
    }
  }

  /**
   * Hashes the given string using bcrypt.
   *
   * @param {string} value - The string to hash.
   * @param {number} [saltOrRounds=10] - The number of rounds to hash the value (default: 10).
   * @returns {Promise<string>} - The hashed string.
   */
  hash(value: string, salt?: number): Promise<string> {
    return hash(value, salt || 10);
  }

  /**
   * Compares the given string with a hashed string using bcrypt.
   *
   * @param {string} value - The string to compare.
   * @param {string} hash - The hashed string.
   * @returns {Promise<boolean>} - True if the string matches the hash, false otherwise.
   */
  compareHash(value: string, hash: string): Promise<boolean> {
    return compare(value, hash);
  }
}
