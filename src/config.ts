export const outputName = "Sifr";
export const languageId = "sifr";
export const lspArgs = ["lsp", "--stdio"] as const;

export type DiagnosticsMode = "off" | "open-files" | "workspace";
export type TraceMode = "off" | "messages" | "verbose";

export interface SifrSettings {
  binaryPath: string;
  traceServer: TraceMode;
  diagnosticsMode: DiagnosticsMode;
  formatEnable: boolean;
  lintEnable: boolean;
}

export function normalizeBinaryPath(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "sifr";
}

export function normalizeTrace(value: unknown): TraceMode {
  return value === "messages" || value === "verbose" ? value : "off";
}

export function normalizeDiagnosticsMode(value: unknown): DiagnosticsMode {
  if (value === "off" || value === "workspace") {
    return value;
  }
  return "open-files";
}

export function readSettings(): SifrSettings {
  // Load VS Code only inside the extension host; pure helpers are unit-tested in Node.
  const vscode = require("vscode") as typeof import("vscode");
  const config = vscode.workspace.getConfiguration("sifr");
  return {
    binaryPath: normalizeBinaryPath(config.get("lsp.path")),
    traceServer: normalizeTrace(config.get("lsp.trace.server")),
    diagnosticsMode: normalizeDiagnosticsMode(config.get("diagnostics.mode")),
    formatEnable: config.get<boolean>("format.enable", true),
    lintEnable: config.get<boolean>("lint.enable", true),
  };
}

export function serverCommand(binaryPath: string): { command: string; args: string[] } {
  return {
    command: normalizeBinaryPath(binaryPath),
    args: [...lspArgs],
  };
}
