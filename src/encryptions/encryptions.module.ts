import { DynamicModule, Module } from '@nestjs/common';
import { ENCRYPTION_OPTIONS } from './constants/encryptions.constants';
import { EncryptionService } from './services/encryption.service';
import { EncryptionAsyncOptions, EncryptionOptions } from './types/types';

/**
 * Encryption module
 */
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionsModule {
  private static createModule(options: EncryptionOptions): DynamicModule {
    return {
      module: EncryptionsModule,
      providers: [
        {
          provide: ENCRYPTION_OPTIONS,
          useValue: options,
        },
        EncryptionService,
      ],
      exports: [EncryptionService],
    };
  }

  private static createAsyncModule(options: EncryptionAsyncOptions): DynamicModule {
    return {
      module: EncryptionsModule,
      imports: options.imports,
      providers: [
        {
          provide: ENCRYPTION_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        EncryptionService,
      ],
      exports: [EncryptionService],
    };
  }

  /**
   * Creates a global encryption module with the provided options.
   *
   * @param {EncryptionOptions} options - Encryption options.
   * @returns {DynamicModule} - The created encryption module.
   */
  static forRoot(options: EncryptionOptions): DynamicModule {
    const module = this.createModule(options);
    module.global = true;
    return module;
  }

  /**
   * Creates a global encryption module with the provided async options.
   *
   * @param {EncryptionAsyncOptions} options - Encryption options.
   * @returns {Promise<DynamicModule>} - The created encryption module.
   */
  static forRootAsync(options: EncryptionAsyncOptions): DynamicModule {
    const module = this.createAsyncModule(options);
    module.global = true;
    return module;
  }

  /**
   * Registers the encryption module with the provided options.
   *
   * @param {EncryptionOptions} options - Encryption options.
   * @returns {DynamicModule} - The registered encryption module.
   */
  static register(options: EncryptionOptions): DynamicModule {
    return this.createModule(options);
  }

  /**
   * Registers the encryption module with the provided async options.
   *
   * @param {EncryptionAsyncOptions} options - Encryption options.
   * @returns {Promise<DynamicModule>} - The registered encryption module.
   */
  static registerAsync(options: EncryptionAsyncOptions): DynamicModule {
    return this.createAsyncModule(options);
  }
}
