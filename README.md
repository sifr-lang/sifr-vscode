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

Node.js 26.8.2 and independently selected npm 12.0.2 are required. The checked-in
`.node-version`, package metadata, and npm `devEngines` policy all select those
exact versions and reject a different development toolchain.

```bash
item_npm_root="$(mktemp -d "${TMPDIR:-/tmp}/sifr-vscode-npm.XXXXXX")"
item_npm_bin="$(bash scripts/setup-npm.sh "${item_npm_root}")"
export PATH="${item_npm_bin}:${PATH}"
npm ci --ignore-scripts --include=dev
npm run lint
npm run typecheck
npm test
npm run test:extension
npm run package
npm audit
```

To qualify activation in the exact VS Code application selected by
`engines.vscode`, set `VSCODE_EXECUTABLE_PATH` to that application's absolute
executable path and run `npm run test:application`. The test uses isolated
user data and extensions directories and checks activation and registered
commands. CLI/LSP behavior additionally requires compiler qualification.

Use `sifr.lsp.path` to point at a local Sifr binary when it is not on `PATH`.

## Compatibility

Version `0.2.0` supports stable Sifr compiler and CLI/LSP releases in the
range `>=0.1.0,<0.2.0`. The extension requires VS Code `^1.137.0` and launches
the language server with `sifr lsp --stdio`.

## Versioning

The extension version is intentionally independent from the Sifr compiler
version. Marketplace metadata and release notes declare the supported Sifr
compiler/LSP range; they do not point at one mutable active compiler version.
