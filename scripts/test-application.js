#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const executable = process.env.VSCODE_EXECUTABLE_PATH;
if (!executable || !path.isAbsolute(executable) || !fs.existsSync(executable) || !fs.statSync(executable).isFile()) {
  throw new Error("Set VSCODE_EXECUTABLE_PATH to the absolute VS Code application executable");
}

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = manifest.engines.vscode.replace(/^\^/, "");
const marker = `VS Code ${version} application activation: PASS`;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "sifr-vscode-test-"));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
let status;
try {
  const result = spawnSync(executable, [
    `--extensionDevelopmentPath=${root}`,
    `--extensionTestsPath=${path.join(root, "out/test/applicationSmoke.test.js")}`,
    `--user-data-dir=${path.join(temporary, "user")}`,
    `--extensions-dir=${path.join(temporary, "extensions")}`,
    "--disable-extensions",
    "--disable-workspace-trust",
    "--skip-welcome",
    "--skip-release-notes",
  ], { env, encoding: "utf8", timeout: 180_000, maxBuffer: 8 * 1024 * 1024 });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.error) {
    throw result.error;
  }
  status = result.status ?? 1;
  if (status === 0 && !result.stdout.split(/\r?\n/).includes(marker)) {
    throw new Error("VS Code exited without completing the application activation test");
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
process.exitCode = status;
