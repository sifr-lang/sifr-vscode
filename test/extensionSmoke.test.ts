import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const grammar = JSON.parse(fs.readFileSync(path.join(repoRoot, "syntaxes", "sifr.tmLanguage.json"), "utf8"));
const vscodeIgnore = fs.readFileSync(path.join(repoRoot, ".vscodeignore"), "utf8");

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
assert.ok(
  packageJson.dependencies["vscode-languageclient"],
  "vscode-languageclient must be a packaged runtime dependency",
);
assert.ok(
  !vscodeIgnore
    .split(/\r?\n/)
    .some(line => line.trim() === "node_modules/**" || line.trim() === "node_modules"),
  ".vscodeignore must not exclude packaged runtime dependencies",
);
assert.ok(
  packageJson.scripts.package.includes("$npm_package_version"),
  "package script must name VSIX artifacts from package version",
);

function toolchainMatches(manifest: typeof packageJson): boolean {
  const node = manifest.engines.node.split(".")[0];
  const nodeTypes = manifest.devDependencies["@types/node"].split(".")[0];
  const vscode = manifest.engines.vscode.replace(/^\^/, "").split(".").slice(0, 2).join(".");
  const vscodeTypes = manifest.devDependencies["@types/vscode"].split(".").slice(0, 2).join(".");
  return node === nodeTypes && vscode === vscodeTypes;
}

assert.ok(toolchainMatches(packageJson), "Node/VS Code declarations must match their selected runtime lines");
for (const name of ["@types/node", "@types/vscode"]) {
  const drifted = structuredClone(packageJson);
  drifted.devDependencies[name] = "0.0.0";
  assert.equal(toolchainMatches(drifted), false, `${name} runtime drift must be rejected`);
}

console.log("extension smoke tests: PASS");
