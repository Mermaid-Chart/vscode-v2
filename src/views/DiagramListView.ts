import * as vscode from 'vscode';
import { MermaidChartVSCode } from '../mermaidChartVSCode';
import { getNonce } from '../utilities/getNonce';
import { getUri } from '../utilities/getUri';

export class DiagramListView implements vscode.WebviewViewProvider {
  public static readonly viewType = 'list-diagrams';
  private diagramData: unknown[] = [];
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _mcAPI: MermaidChartVSCode,
  ) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      const documentID = data.data;
      switch (data.command) {
        case 'getProjectsData':
          await this.getProjectsData();
          break;
        case 'viewDiagram':
          await vscode.commands.executeCommand(
            'extension.viewMermaidChart',
            documentID,
          );
          break;
        case 'deleteDiagram':
          await vscode.commands.executeCommand(
            'mermaidChart.deleteDiagram',
            documentID,
            data.title,
          );
          break;
        case 'updateDiagram':
          await vscode.commands.executeCommand(
            'mermaidChart.editDiagram',
            documentID,
          );
          break;
        case 'addDiagram':
          await vscode.commands.executeCommand(
            'mermaidChart.addDiagram',
            documentID,
          );
          break;
        case 'createNewDiagram':
          await vscode.commands.executeCommand('extension.createMermaidChart');
          break;
      }
    });
  }

  async getProjectsData() {
    this.diagramData = [];
    const mermaidChartProjects = await this._mcAPI.getProjects();
    for (const project of mermaidChartProjects) {
      const mermaidChartDocuments = await this._mcAPI.getDocuments(project.id);
      this.diagramData.push({
        id: project.id,
        title: project.title,
        documents: mermaidChartDocuments,
      });
    }
    await this?._view?.webview.postMessage({
      command: 'projectsData',
      data: this.diagramData,
    });
  }

  public async refresh() {
    await this.getProjectsData();
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const stylesUri = getUri(webview, this._extensionUri, [
      'web',
      'dist',
      'list-diagrams',
      'index.css',
    ]);

    // The JS file from the React build output
    const scriptUri = getUri(webview, this._extensionUri, [
      'web',
      'dist',
      'list-diagrams',
      'index.js',
    ]);

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return /*html*/ `
    <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src * data: blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
  `;
  }
}
