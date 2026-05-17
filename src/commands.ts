import * as vscode from "vscode";
import { activeSifrFile, runSifr, showCliResult, workspaceCwd } from "./cli";
import { SifrLanguageClient } from "./lsp";

export function registerCommands(
  context: vscode.ExtensionContext,
  lsp: SifrLanguageClient,
  output: vscode.OutputChannel,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("sifr.restartLanguageServer", async () => {
      await lsp.restart();
      void vscode.window.showInformationMessage("Sifr language server restarted.");
    }),
    vscode.commands.registerCommand("sifr.showLanguageServerLogs", () => {
      output.show(true);
    }),
    vscode.commands.registerCommand("sifr.locateBinary", async () => {
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        title: "Locate Sifr executable",
      });
      if (selected?.[0]) {
        await vscode.workspace.getConfiguration("sifr").update("lsp.path", selected[0].fsPath, vscode.ConfigurationTarget.Global);
      }
    }),
    vscode.commands.registerCommand("sifr.runCheck", async () => {
      await runCliForActiveFile(["check"], output);
    }),
    vscode.commands.registerCommand("sifr.runTests", async () => {
      await runCliForWorkspace(["test"], output);
    }),
    vscode.commands.registerCommand("sifr.runLint", async () => {
      await runCliForWorkspace(["lint"], output);
    }),
    vscode.commands.registerCommand("sifr.checkFormat", async () => {
      await runCliForWorkspace(["fmt", "--check"], output);
    }),
    vscode.commands.registerCommand("sifr.formatDocument", async () => {
      await vscode.commands.executeCommand("editor.action.formatDocument");
    }),
    vscode.commands.registerCommand("sifr.showGeneratedRust", async () => {
      await showGeneratedRust(lsp);
    }),
    vscode.commands.registerCommand("sifr.explainDiagnostic", async () => {
      await explainDiagnostic(lsp);
    }),
  );
}

async function runCliForActiveFile(prefix: string[], output: vscode.OutputChannel): Promise<void> {
  const uri = activeSifrFile();
  if (!uri) {
    void vscode.window.showWarningMessage("Open a Sifr file first.");
    return;
  }
  const args = [...prefix, uri.fsPath];
  const result = await runSifr(args, workspaceCwd(uri));
  await showCliResult(`sifr ${args.join(" ")}`, result, output);
}

async function runCliForWorkspace(args: string[], output: vscode.OutputChannel): Promise<void> {
  const result = await runSifr(args, workspaceCwd(activeSifrFile()));
  await showCliResult(`sifr ${args.join(" ")}`, result, output);
}

async function showGeneratedRust(lsp: SifrLanguageClient): Promise<void> {
  const uri = activeSifrFile();
  const client = lsp.current();
  if (!uri || !client) {
    void vscode.window.showWarningMessage("Open a Sifr file with an active language server first.");
    return;
  }
  const result = await client.sendRequest<unknown>("workspace/executeCommand", {
    command: "sifr.showGeneratedRust",
    arguments: [{
      uri: uri.toString(),
      range: editorSelectionRange(),
    }],
  });
  const content = typeof result === "string" ? result : JSON.stringify(result, null, 2);
  const doc = await vscode.workspace.openTextDocument({ language: "rust", content });
  await vscode.window.showTextDocument(doc, { preview: true });
}

function editorSelectionRange(): unknown {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    return undefined;
  }
  return {
    start: {
      line: editor.selection.start.line,
      character: editor.selection.start.character,
    },
    end: {
      line: editor.selection.end.line,
      character: editor.selection.end.character,
    },
  };
}

async function explainDiagnostic(lsp: SifrLanguageClient): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const client = lsp.current();
  if (!editor || editor.document.languageId !== "sifr" || !client) {
    void vscode.window.showWarningMessage("Open a Sifr file with an active language server first.");
    return;
  }
  const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
  const diagnostic = diagnostics.find(item => item.range.contains(editor.selection.active)) ?? diagnostics[0];
  if (!diagnostic) {
    void vscode.window.showInformationMessage("No Sifr diagnostic is available for this file.");
    return;
  }
  const result = await client.sendRequest<unknown>("workspace/executeCommand", {
    command: "sifr.explainDiagnostic",
    arguments: [{ uri: editor.document.uri.toString(), diagnostic }],
  });
  const content = typeof result === "string" ? result : JSON.stringify(result, null, 2);
  const doc = await vscode.workspace.openTextDocument({ language: "markdown", content });
  await vscode.window.showTextDocument(doc, { preview: true });
}
