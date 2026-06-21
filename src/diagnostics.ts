export type DiagnosticCode = string | number | { value: string | number };

export function diagnosticCodeValue(code: DiagnosticCode | undefined | null): string | undefined {
  if (code === undefined || code === null) {
    return undefined;
  }
  if (typeof code === "object") {
    return String(code.value);
  }
  return String(code);
}
