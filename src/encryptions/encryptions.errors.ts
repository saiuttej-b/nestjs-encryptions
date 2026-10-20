/**
 * Thrown when a payload is not v1 AES-256-GCM or legacy AES-256-CBC.
 */
export class InvalidCiphertextError extends Error {
  constructor() {
    super('Invalid ciphertext. Expected a v1 AES-256-GCM payload or a legacy AES-256-CBC payload.');
    this.name = 'InvalidCiphertextError';
  }
}

/**
 * Thrown when a well-formed payload cannot be decrypted.
 */
export class DecryptionFailedError extends Error {
  constructor() {
    super('Decryption failed.');
    this.name = 'DecryptionFailedError';
  }
}
