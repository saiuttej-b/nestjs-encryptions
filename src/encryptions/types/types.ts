import { ModuleMetadata } from '@nestjs/common';

/**
 * Encryption options
 */
export type EncryptionOptions = {
  secret: string;
};

/**
 * Asynchronous encryption options
 */
export type EncryptionAsyncOptions = {
  imports?: ModuleMetadata['imports'];
  inject?: any[];
  useFactory: (...args: any[]) => EncryptionOptions | Promise<EncryptionOptions>;
};
