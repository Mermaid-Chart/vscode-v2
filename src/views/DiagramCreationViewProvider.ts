import vscode from 'vscode';

export class DiagramCreationViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'new-diagram';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'createNewDiagram':
          vscode.commands.executeCommand('extension.createMermaidChart');
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Diagram</title>
        <style>
          body {
            padding: 10px;
          }
          button {
            width: 100%;
            padding: 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
        </style>
      </head>
      <body>
        <button id="createNewDiagramButton">New Diagram</button>
        
        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById('createNewDiagramButton').addEventListener('click', () => {
            vscode.postMessage({ type: 'createNewDiagram' });
          });
        </script>
      </body>
      </html>
    `;
  }
}
