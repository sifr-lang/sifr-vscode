import * as vscode from "vscode";
import { runSifr, workspaceCwd } from "./cli";

export function registerTests(context: vscode.ExtensionContext): void {
  const controller = vscode.tests.createTestController("sifrTests", "Sifr Tests");
  context.subscriptions.push(controller);

  controller.refreshHandler = async () => {
    await refreshTests(controller);
  };

  controller.createRunProfile("Run", vscode.TestRunProfileKind.Run, async request => {
    const run = controller.createTestRun(request);
    const items = collectRequestedTests(controller, request);
    for (const item of items) {
      run.started(item);
      try {
        const args = item.uri ? ["test", item.uri.fsPath] : ["test"];
        const result = await runSifr(args, workspaceCwd(item.uri));
        if (result.code === 0) {
          run.passed(item);
        } else {
          const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
          run.failed(item, new vscode.TestMessage(output || `sifr ${args.join(" ")} failed`));
        }
      } catch (error) {
        run.errored(item, new vscode.TestMessage(error instanceof Error ? error.message : String(error)));
      }
    }
    run.end();
  }, true);

  void refreshTests(controller);
}

async function refreshTests(controller: vscode.TestController): Promise<void> {
  controller.items.replace([]);
  const files = await vscode.workspace.findFiles("**/*.sifr", "**/{target,node_modules,.git}/**");
  for (const uri of files.sort((left, right) => left.toString().localeCompare(right.toString()))) {
    const item = controller.createTestItem(uri.toString(), uri.fsPath.split(/[\\/]/).pop() ?? uri.fsPath, uri);
    controller.items.add(item);
  }
}

function collectRequestedTests(controller: vscode.TestController, request: vscode.TestRunRequest): vscode.TestItem[] {
  const selected: vscode.TestItem[] = [];
  if (request.include) {
    request.include.forEach(item => selected.push(item));
    return selected;
  }
  controller.items.forEach(item => selected.push(item));
  return selected;
}
