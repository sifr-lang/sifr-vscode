import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as vscode from "vscode";

export async function run(): Promise<void> {
  const root = path.resolve(__dirname, "..", "..");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(vscode.version, manifest.engines.vscode.replace(/^\^/, ""),
    "application qualification must use the exact declared minimum VS Code release");
  const extension = vscode.extensions.getExtension(`${manifest.publisher}.${manifest.name}`);
  assert.ok(extension, "VS Code must discover the extension");
  await extension.activate();
  assert.ok(extension.isActive, "extension must activate in the actual VS Code host");
  const commands = new Set(await vscode.commands.getCommands(true));
  for (const { command } of manifest.contributes.commands) {
    assert.ok(commands.has(command), `activation must register ${command}`);
  }
  await vscode.commands.executeCommand("sifr.showLanguageServerLogs");
  console.log(`VS Code ${vscode.version} application activation: PASS`);
}
