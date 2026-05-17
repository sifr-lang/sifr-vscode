import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Trace,
} from "vscode-languageclient/node";
import { languageId, outputName, readSettings, serverCommand } from "./config";

export class SifrLanguageClient {
  private client: LanguageClient | undefined;

  public constructor(
    private readonly output: vscode.OutputChannel,
    private readonly traceOutput: vscode.OutputChannel,
  ) {}

  public current(): LanguageClient | undefined {
    return this.client;
  }

  public async start(): Promise<void> {
    if (this.client) {
      return;
    }
    const settings = readSettings();
    const command = serverCommand(settings.binaryPath);
    const serverOptions: ServerOptions = {
      command: command.command,
      args: command.args,
      options: {
        env: { ...process.env },
      },
    };
    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: languageId }],
      outputChannel: this.output,
      traceOutputChannel: this.traceOutput,
      synchronize: {
        configurationSection: "sifr",
        fileEvents: vscode.workspace.createFileSystemWatcher("**/*.sifr"),
      },
      initializationOptions: {
        diagnosticsMode: settings.diagnosticsMode,
        formatEnable: settings.formatEnable,
        lintEnable: settings.lintEnable,
      },
    };
    this.client = new LanguageClient("sifr", outputName, serverOptions, clientOptions);
    this.client.setTrace(traceMode(settings.traceServer));
    try {
      await this.client.start();
    } catch (error) {
      this.client = undefined;
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(
        `Failed to start Sifr language server with '${command.command} ${command.args.join(" ")}': ${message}. Configure sifr.lsp.path if needed.`,
      );
      throw error;
    }
  }

  public async stop(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    if (client) {
      await client.stop();
    }
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }
}

function traceMode(value: string): Trace {
  if (value === "verbose") {
    return Trace.Verbose;
  }
  if (value === "messages") {
    return Trace.Messages;
  }
  return Trace.Off;
}
