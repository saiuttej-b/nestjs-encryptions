import { DynamicModule, Module } from '@nestjs/common';
import { ENCRYPTION_OPTIONS } from './constants/encryptions.constants';
import { EncryptionService } from './services/encryption.service';
import { EncryptionAsyncOptions, EncryptionOptions } from './types/types';

/**
 * Registers `EncryptionService`.
 *
 * `forRoot` and `forRootAsync` are global. `register` and `registerAsync` are not.
 */
@Module({})
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
   * Creates a global encryption module.
   */
  static forRoot(options: EncryptionOptions): DynamicModule {
    const encryptionModule = this.createModule(options);
    encryptionModule.global = true;
    return encryptionModule;
  }

  /**
   * Creates a global encryption module from an async factory.
   */
  static forRootAsync(options: EncryptionAsyncOptions): DynamicModule {
    const encryptionModule = this.createAsyncModule(options);
    encryptionModule.global = true;
    return encryptionModule;
  }

  /**
   * Registers an encryption module with the importing module.
   */
  static register(options: EncryptionOptions): DynamicModule {
    return this.createModule(options);
  }

  /**
   * Registers an encryption module from an async factory.
   */
  static registerAsync(options: EncryptionAsyncOptions): DynamicModule {
    return this.createAsyncModule(options);
  }
}
