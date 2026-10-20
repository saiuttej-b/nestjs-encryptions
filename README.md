<h3 align="center">NestJS Encryptions</h3>

<div align="center">
  <a href="https://www.npmjs.com/package/@saiuttej/nestjs-encryptions">
    <img src="https://img.shields.io/npm/v/@saiuttej/nestjs-encryptions" alt="npm version">
  </a>
  <a href="https://github.com/saiuttej-b/nestjs-encryptions/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@saiuttej/nestjs-encryptions" alt="license">
  </a>
  <a href="https://github.com/saiuttej-b/nestjs-encryptions/actions/workflows/ci.yml">
    <img src="https://github.com/saiuttej-b/nestjs-encryptions/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
</div>

Encrypt strings with AES-256-GCM and hash passwords with bcrypt. `decrypt` still reads legacy AES-256-CBC payloads written by 0.2.x.

Requires Node.js 20 or newer, NestJS 10, 11, or 12, and `bcrypt` 6.

## Installation

`bcrypt` is a peer dependency. Install it with this package.

Install via NPM:

```bash
npm install @saiuttej/nestjs-encryptions bcrypt
```

Install via Yarn:

```bash
yarn add @saiuttej/nestjs-encryptions bcrypt
```

Install via PNPM:

```bash
pnpm add @saiuttej/nestjs-encryptions bcrypt
```

## Register

`forRoot` and `forRootAsync` register a global module. `register` and `registerAsync` register a feature module.

```ts
import { Injectable, Module } from '@nestjs/common';
import { EncryptionsModule, EncryptionService } from '@saiuttej/nestjs-encryptions';

@Module({
  imports: [EncryptionsModule.forRoot({ secret: 'app-secret' })],
})
export class AppModule {}

@Injectable()
export class TokenService {
  constructor(private readonly encryption: EncryptionService) {}

  seal(value: string): string {
    return this.encryption.encrypt(value);
  }

  open(payload: string): string | null {
    return this.encryption.decrypt(payload, { suppressError: true });
  }
}
```

`secret` must be at most 32 characters. A shorter secret is left-padded with `0` to 32 characters.

Read the secret from the environment with `forRootAsync`:

```ts
import { Module } from '@nestjs/common';
import { EncryptionsModule } from '@saiuttej/nestjs-encryptions';

@Module({
  imports: [
    EncryptionsModule.forRootAsync({
      useFactory: () => ({
        secret: process.env.ENCRYPTION_SECRET ?? 'app-secret',
      }),
    }),
  ],
})
export class AppModule {}
```

A feature module can own its own options:

```ts
import { Module } from '@nestjs/common';
import { EncryptionsModule } from '@saiuttej/nestjs-encryptions';

@Module({
  imports: [EncryptionsModule.register({ secret: 'feature-secret' })],
})
export class BillingModule {}
```

## Encrypt and decrypt

`encrypt` returns a versioned payload. Each segment is base64:

```text
v1:<iv>:<authTag>:<ciphertext>
```

The IV is 12 bytes and the auth tag is 16 bytes. Two calls with the same plaintext return different payloads.

```ts
const payload = this.encryption.encrypt('hello');
const value = this.encryption.decrypt(payload);
```

Pass `key` to override the module secret for one call:

```ts
const payload = this.encryption.encrypt('hello', { key: 'custom-key' });
const value = this.encryption.decrypt(payload, { key: 'custom-key' });
```

`decrypt` throws `InvalidCiphertextError` when the payload shape is wrong, and `DecryptionFailedError` when authentication or padding fails. `suppressError: true` returns `null` for those two errors. A key longer than 32 characters still throws.

Legacy payloads from 0.2.x use `<iv>:<ciphertext>` and AES-256-CBC. `decrypt` still reads them. CBC does not authenticate the ciphertext. New payloads are not readable by 0.2.x.

## Hash

```ts
const hashed = await this.encryption.hash('password');
const matches = await this.encryption.compareHash('password', hashed);
```

`hash` uses bcrypt. The salt defaults to 10 rounds. Pass a number to choose the rounds. An explicit `0` is forwarded to bcrypt.

## API

| Method                       | Behavior                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `encrypt(value, options?)`   | Returns `v1:<iv>:<authTag>:<ciphertext>`. `options.key` overrides the module secret. |
| `decrypt(payload, options?)` | Decrypts a v1 GCM payload or a legacy CBC payload.                                   |
| `hash(value, salt?)`         | Returns a bcrypt hash. `salt` defaults to 10 rounds.                                 |
| `compareHash(value, hash)`   | Returns whether `value` matches a bcrypt hash.                                       |

`decrypt` throws `InvalidCiphertextError` or `DecryptionFailedError`. With `suppressError: true`, those errors return `null`.

## Rules

- `secret` and a per-call `key` must be at most 32 characters. Shorter values are left-padded with `0`.
- `forRoot` and `forRootAsync` are global. `register` and `registerAsync` are not.
- Importing `EncryptionsModule` directly does not provide `EncryptionService`.
- GCM payloads fail decryption when the ciphertext or auth tag changes. Legacy CBC payloads do not have that check.
- `bcrypt` must be installed in the host application.

## Author

**B Sai Uttej**

## License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
