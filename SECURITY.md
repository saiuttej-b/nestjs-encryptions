# Security

Report vulnerabilities through [GitHub Security Advisories](https://github.com/saiuttej-b/nestjs-encryptions/security/advisories/new).

`encrypt` writes AES-256-GCM payloads. Decryption fails when the ciphertext or auth tag is modified.

`decrypt` still accepts legacy AES-256-CBC payloads from 0.2.x. Those payloads are decrypted only. CBC does not authenticate the ciphertext. Re-encrypt stored values with the current `encrypt` method when you can.

Do not log plaintext or the module secret.
