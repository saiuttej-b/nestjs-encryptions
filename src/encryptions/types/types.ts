import { ModuleMetadata } from '@nestjs/common';

/**
 * Module options. `secret` must be at most 32 characters.
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
