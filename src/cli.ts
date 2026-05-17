import { spawn } from "node:child_process";
import * as vscode from "vscode";
import { readSettings } from "./config";

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export function activeSifrFile(): vscode.Uri | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor?.document.languageId === "sifr") {
    return editor.document.uri;
  }
  return undefined;
}

export function workspaceCwd(uri?: vscode.Uri): string | undefined {
  const folder = uri ? vscode.workspace.getWorkspaceFolder(uri) : undefined;
  return folder?.uri.fsPath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function runSifr(args: string[], cwd?: string): Promise<CliResult> {
  const { binaryPath } = readSettings();
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { cwd, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => {
      stdout += String(chunk);
    });
    child.stderr.on("data", chunk => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", code => {
      resolve({ code, stdout, stderr });
    });
  });
}

export async function showCliResult(title: string, result: CliResult, output: vscode.OutputChannel): Promise<void> {
  output.appendLine(`$ ${title}`);
  if (result.stdout.trim().length > 0) {
    output.appendLine(result.stdout.trimEnd());
  }
  if (result.stderr.trim().length > 0) {
    output.appendLine(result.stderr.trimEnd());
  }
  output.appendLine(`exit=${result.code ?? "signal"}`);
  output.show(true);
}
