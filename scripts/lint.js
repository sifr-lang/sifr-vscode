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
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
const properties = packageJson.contributes.configuration.properties;
const language = packageJson.contributes.languages.find(item => item.id === "sifr");
const grammar = JSON.parse(fs.readFileSync(path.join(root, "syntaxes", "sifr.tmLanguage.json"), "utf8"));

const failures = [];
failures.push(...releaseMetadataFailures(packageJson, readme, changelog));
if (!language || !language.extensions.includes(".sifr")) {
  failures.push("package.json must register .sifr for language id sifr");
}
if (
  !language?.icon ||
  language.icon.light !== "./assets/icon.png" ||
  language.icon.dark !== "./assets/icon.png"
) {
  failures.push("package.json must register the Sifr file icon for light and dark themes");
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

function releaseMetadataFailures(manifest, readmeText, changelogText) {
  const metadataFailures = [];
  const version = manifest.version;
  const compatibility = manifest.sifrCompilerCompatibility;
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    metadataFailures.push("package version must be exact SemVer");
  }
  if (
    typeof compatibility !== "string" ||
    !/^>=\d+\.\d+\.\d+,<\d+\.\d+\.\d+$/.test(compatibility)
  ) {
    metadataFailures.push(
      "sifrCompilerCompatibility must use >=X.Y.Z,<X.Y.Z",
    );
  }
  if (!readmeText.includes(`Version \`${version}\``)) {
    metadataFailures.push("README version must match package.json");
  }
  if (!readmeText.includes(`\`${compatibility}\``)) {
    metadataFailures.push("README compiler range must match package.json");
  }
  if (!changelogText.includes(`## ${version}`)) {
    metadataFailures.push("CHANGELOG version must match package.json");
  }
  if (!changelogText.includes(`\`${compatibility}\``)) {
    metadataFailures.push("CHANGELOG compiler range must match package.json");
  }
  return metadataFailures;
}

for (const [label, manifest, readmeText, changelogText] of [
  ["version drift", { ...packageJson, version: "0.2.1" }, readme, changelog],
  [
    "range syntax",
    { ...packageJson, sifrCompilerCompatibility: ">=0.1.0 <0.2.0" },
    readme,
    changelog,
  ],
  [
    "README range drift",
    packageJson,
    readme.replace(packageJson.sifrCompilerCompatibility, ">=0.1.1,<0.2.0"),
    changelog,
  ],
  [
    "CHANGELOG range drift",
    packageJson,
    readme,
    changelog.replace(
      packageJson.sifrCompilerCompatibility,
      ">=0.1.1,<0.2.0",
    ),
  ],
]) {
  if (releaseMetadataFailures(manifest, readmeText, changelogText).length === 0) {
    failures.push(`release metadata mutation unexpectedly passed: ${label}`);
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
