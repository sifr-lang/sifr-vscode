# Changelog

## 0.1.2

- Add a Sifr file icon contribution for `.sifr` files in VS Code file
  explorers and icon themes that use language icon metadata.
- Add a manifest lint check that keeps the file icon contribution registered.

## 0.1.1

- Fix extension activation in packaged VSIX builds by including runtime
  dependencies needed by the native LSP client.
- Add a packaging smoke assertion that prevents excluding
  `vscode-languageclient` from release artifacts.
- Refresh the marketplace icon.

## 0.1.0

- Marketplace-ready initial release for Sifr CLI/LSP `0.0.x`.
- Registers `.sifr` files, TextMate syntax highlighting, Sifr language
  configuration, native LSP launch through `sifr lsp --stdio`, and command
  palette actions for check, test, lint, format, generated Rust preview, and
  diagnostic explanation.
- Requires VS Code `^1.90.0` and a `sifr` executable on `PATH`, or an explicit
  `sifr.lsp.path` setting.

## 0.0.0

- Initial developer tooling extension scaffold with Sifr language registration, native
  LSP launcher, command wiring, syntax highlighting, local validation scripts,
  and package generation.
