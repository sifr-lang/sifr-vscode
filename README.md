# Sifr VS Code Extension

VS Code language support for Sifr. The extension registers `.sifr` files,
contributes syntax highlighting, and launches the native language server:

```bash
sifr lsp --stdio
```

All semantic behavior is delegated to Sifr CLI/LSP surfaces. The extension does
not implement parsing, type checking, diagnostics, formatting, linting, rename,
references, ownership analysis, or generated-Rust logic.

Formatting is provided by the native LSP document formatting provider. Use the
`Sifr: Format Document` command or VS Code `editor.formatOnSave`; `sifr.format.enable`
controls whether the server advertises formatting support.

## Local Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run test:extension
npm run package
```

Use `sifr.lsp.path` to point at a local Sifr binary when it is not on `PATH`.

## Versioning

This extension version is intentionally independent from the Sifr compiler
version while Phase 36 is active. Release notes must state the supported Sifr
compiler/LSP version range before marketplace publication.
