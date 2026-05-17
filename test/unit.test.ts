import assert from "node:assert/strict";
import {
  lspArgs,
  normalizeBinaryPath,
  normalizeDiagnosticsMode,
  normalizeTrace,
  serverCommand,
} from "../src/config";

assert.deepEqual(lspArgs, ["lsp", "--stdio"]);
assert.equal(normalizeBinaryPath("  /tmp/sifr  "), "/tmp/sifr");
assert.equal(normalizeBinaryPath(""), "sifr");
assert.equal(normalizeBinaryPath(undefined), "sifr");
assert.equal(normalizeTrace("messages"), "messages");
assert.equal(normalizeTrace("verbose"), "verbose");
assert.equal(normalizeTrace("bad"), "off");
assert.equal(normalizeDiagnosticsMode("off"), "off");
assert.equal(normalizeDiagnosticsMode("workspace"), "workspace");
assert.equal(normalizeDiagnosticsMode("bad"), "open-files");
assert.deepEqual(serverCommand("sifr"), { command: "sifr", args: ["lsp", "--stdio"] });

console.log("unit tests: PASS");
