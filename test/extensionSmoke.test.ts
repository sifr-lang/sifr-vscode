import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const grammar = JSON.parse(fs.readFileSync(path.join(repoRoot, "syntaxes", "sifr.tmLanguage.json"), "utf8"));

const commands = new Set(packageJson.contributes.commands.map((item: { command: string }) => item.command));
for (const command of [
  "sifr.restartLanguageServer",
  "sifr.showLanguageServerLogs",
  "sifr.locateBinary",
  "sifr.runCheck",
  "sifr.runTests",
  "sifr.runLint",
  "sifr.checkFormat",
  "sifr.formatDocument",
  "sifr.showGeneratedRust",
  "sifr.explainDiagnostic",
]) {
  assert.ok(commands.has(command), `missing command ${command}`);
}

assert.equal(grammar.scopeName, "source.sifr");
assert.ok(grammar.fileTypes.includes("sifr"));
assert.deepEqual(packageJson.contributes.configuration.properties["sifr.lsp.trace.server"].enum, [
  "off",
  "messages",
  "verbose",
]);

console.log("extension smoke tests: PASS");
