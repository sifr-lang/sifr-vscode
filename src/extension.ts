import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { SifrLanguageClient } from "./lsp";
import { registerTests } from "./tests";

let lsp: SifrLanguageClient | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel("Sifr");
  const traceOutput = vscode.window.createOutputChannel("Sifr Language Server Trace");
  context.subscriptions.push(output, traceOutput);

  lsp = new SifrLanguageClient(output, traceOutput);
  registerCommands(context, lsp, output);
  registerTests(context);

  if (vscode.workspace.textDocuments.some(document => document.languageId === "sifr")) {
    await lsp.start();
  } else {
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(async document => {
      if (document.languageId === "sifr") {
        await lsp?.start();
      }
    }));
  }
}

export async function deactivate(): Promise<void> {
  await lsp?.stop();
  lsp = undefined;
}
