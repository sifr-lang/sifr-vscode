#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const executable = process.env.VSCODE_EXECUTABLE_PATH;
if (!executable || !path.isAbsolute(executable) || !fs.statSync(executable).isFile()) {
  throw new Error("Set VSCODE_EXECUTABLE_PATH to the absolute VS Code application executable");
}

const root = path.resolve(__dirname, "..");
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
  ], { env, stdio: "inherit", timeout: 180_000 });
  if (result.error) {
    throw result.error;
  }
  status = result.status ?? 1;
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
process.exitCode = status;
