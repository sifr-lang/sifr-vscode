#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const forbidden = [
  "pyright",
  "pylsp",
  "ruff server",
  "ruffServer",
  "tyServer",
  "parseSifr",
  "typeCheckSifr",
  "formatSifrInExtension",
  "lintSifrInExtension",
  "generateRustInExtension",
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules", "out", "dist"].includes(entry.name)) {
        return [];
      }
      return walk(full);
    }
    return [full];
  });
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const properties = packageJson.contributes.configuration.properties;
const language = packageJson.contributes.languages.find(item => item.id === "sifr");
const grammar = JSON.parse(fs.readFileSync(path.join(root, "syntaxes", "sifr.tmLanguage.json"), "utf8"));

const failures = [];
if (!language || !language.extensions.includes(".sifr")) {
  failures.push("package.json must register .sifr for language id sifr");
}
if (grammar.scopeName !== "source.sifr") {
  failures.push("TextMate grammar must use source.sifr");
}
for (const setting of [
  "sifr.lsp.path",
  "sifr.lsp.trace.server",
  "sifr.diagnostics.mode",
  "sifr.format.enable",
  "sifr.lint.enable",
]) {
  if (!properties[setting]) {
    failures.push(`missing setting ${setting}`);
  }
}
for (const file of walk(root)) {
  if (path.relative(root, file) === path.join("scripts", "lint.js")) {
    continue;
  }
  if (!/\.(ts|js|json|md|toml)$/.test(file)) {
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  for (const term of forbidden) {
    if (text.includes(term)) {
      failures.push(`${path.relative(root, file)} contains forbidden marker ${term}`);
    }
  }
}

if (failures.length > 0) {
  console.error("lint failed");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}
console.log("lint: PASS");
