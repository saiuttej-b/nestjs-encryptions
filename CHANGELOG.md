# Changelog

## 1.0.0

### Added

- Authenticated AES-256-GCM ciphertext: `v1:<iv>:<authTag>:<ciphertext>`.
- `InvalidCiphertextError` and `DecryptionFailedError`.

### Changed

- `encrypt` writes AES-256-GCM. `decrypt` still reads legacy AES-256-CBC payloads from 0.2.x. New ciphertext is not readable by 0.2.x.
- Decryption failures throw `DecryptionFailedError` instead of raw OpenSSL errors. `suppressError: true` returns `null` for `InvalidCiphertextError` and `DecryptionFailedError`.
- `hash` keeps an explicit salt of `0`.
- Import `EncryptionsModule` through `forRoot`, `forRootAsync`, `register`, or `registerAsync`.
