import { type DynamicModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EncryptionService, EncryptionsModule } from '../../index';

function factoryProvider(dynamicModule: DynamicModule): { inject?: unknown; useFactory: unknown } {
  const provider = dynamicModule.providers?.find(
    (entry) => typeof entry === 'object' && entry !== null && 'useFactory' in entry,
  );

  if (!provider || !('useFactory' in provider)) {
    throw new Error('expected factory provider');
  }

  return provider;
}

describe('EncryptionsModule', () => {
  it('registers a global module from forRoot', () => {
    const dynamicModule = EncryptionsModule.forRoot({ secret: 'test-secret' });

    expect(dynamicModule.global).toBe(true);
    expect(dynamicModule.module).toBe(EncryptionsModule);
    expect(dynamicModule.exports).toEqual([EncryptionService]);
  });

  it('registers a feature module from register', () => {
    const dynamicModule = EncryptionsModule.register({ secret: 'test-secret' });

    expect(dynamicModule.global).toBeUndefined();
    expect(dynamicModule.exports).toEqual([EncryptionService]);
  });

  it('registers a global module from forRootAsync', () => {
    const dynamicModule = EncryptionsModule.forRootAsync({
      imports: [],
      inject: ['SECRET'],
      useFactory: (value: string) => ({ secret: value }),
    });

    expect(dynamicModule.global).toBe(true);
    expect(dynamicModule.imports).toEqual([]);
    expect(factoryProvider(dynamicModule).inject).toEqual(['SECRET']);
  });

  it('registers a feature module from registerAsync', () => {
    const dynamicModule = EncryptionsModule.registerAsync({
      useFactory: () => ({ secret: 'test-secret' }),
    });

    expect(dynamicModule.global).toBeUndefined();
    expect(factoryProvider(dynamicModule).useFactory).toEqual(expect.any(Function));
  });

  it('resolves the service from forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EncryptionsModule.forRoot({ secret: 'test-secret' })],
    }).compile();

    const service = moduleRef.get(EncryptionService);
    expect(service).toBeInstanceOf(EncryptionService);
    expect(service.decrypt(service.encrypt('hello'))).toBe('hello');
    await moduleRef.close();
  });

  it('resolves the service from register', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EncryptionsModule.register({ secret: 'register-secret' })],
    }).compile();

    expect(moduleRef.get(EncryptionService)).toBeInstanceOf(EncryptionService);
    await moduleRef.close();
  });

  it('resolves the service from forRootAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EncryptionsModule.forRootAsync({
          useFactory: () => Promise.resolve({ secret: 'async-secret' }),
        }),
      ],
    }).compile();

    const service = moduleRef.get(EncryptionService);
    expect(service.decrypt(service.encrypt('hello'))).toBe('hello');
    await moduleRef.close();
  });

  it('resolves the service from registerAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EncryptionsModule.registerAsync({
          useFactory: () => ({ secret: 'register-secret' }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(EncryptionService)).toBeInstanceOf(EncryptionService);
    await moduleRef.close();
  });

  it('does not provide EncryptionService until it is registered', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EncryptionsModule],
    }).compile();

    expect(() => moduleRef.get(EncryptionService)).toThrow();
    await moduleRef.close();
  });
});
