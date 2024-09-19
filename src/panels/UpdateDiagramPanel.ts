import {
  commands,
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
} from 'vscode';
import { getUri } from '../utilities/getUri';
import { getNonce } from '../utilities/getNonce';
import { MermaidChartVSCode } from '../mermaidChartVSCode';
import { MCDocument } from '../mermaidAPI';
import { getImageDataURL } from '../util';

/**
 * This class manages the state and behavior of UpdateDiagram webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering UpdateDiagram webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class UpdateDiagramPanel {
  public static readonly viewType = 'update-diagram';
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private _diagram: MCDocument;
  private _mcAPI: MermaidChartVSCode;
  private _svgData: string = '';
  private static panels: Map<string, UpdateDiagramPanel> = new Map();

  private constructor(
    panel: WebviewPanel,
    extensionUri: Uri,
    diagram: MCDocument,
    mcAPI: MermaidChartVSCode,
    svgData: string,
  ) {
    this._panel = panel;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri,
    );

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
    this._diagram = diagram;
    this._mcAPI = mcAPI;
    this._svgData = svgData;
  }

  public static createOrShow(
    extensionUri: Uri,
    diagram: MCDocument,
    mcAPI: MermaidChartVSCode,
    svgData: string,
  ) {
    const column = window.activeTextEditor
      ? window.activeTextEditor.viewColumn
      : undefined;
    const id = diagram.documentID;

    // If we already have a panel, show it.
    if (UpdateDiagramPanel.panels.has(id)) {
      const existingPanel = UpdateDiagramPanel.panels.get(id)!;
      existingPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = window.createWebviewPanel(
      UpdateDiagramPanel.viewType,
      `Update diagram: ${id}`,
      column || ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          Uri.joinPath(extensionUri, 'out'),
          Uri.joinPath(extensionUri, 'web/dist/update-diagram'),
        ],
      },
    );

    const newPanel = new UpdateDiagramPanel(
      panel,
      extensionUri,
      diagram,
      mcAPI,
      svgData,
    );
    UpdateDiagramPanel.panels.set(id, newPanel);
  }

  private async updateDiagram(code: string, title?: string) {
    const updatedDiagram: MCDocument = {
      id: this._diagram.id,
      documentID: this._diagram.documentID,
      projectID: this._diagram.projectID,
      major: this._diagram.major,
      minor: this._diagram.minor,
      title: title || this._diagram.title,
      code: code,
    };

    try {
      await this._mcAPI.updateDiagram(updatedDiagram);
      // await commands.executeCommand('package-diagrams.refresh');
      await commands.executeCommand('mermaidChart.refreshDiagramList');
      const document = await this._mcAPI.getDocument(this._diagram.documentID);
      const svgContent = await this._mcAPI.getRawDocument(document, 'dark');
      await this._panel.webview.postMessage({
        command: 'diagramData',
        data: JSON.stringify({
          code: document.code,
          diagramImage: getImageDataURL(svgContent),
          title: document.title,
        }),
      });
      await window.showInformationMessage('Diagram updated');
    } catch (error) {
      console.log(error);
      window.showErrorMessage('Failed to update diagram');
    }
  }

  public dispose() {
    UpdateDiagramPanel.panels.delete(this._diagram.documentID);

    // Dispose of the panel
    this._panel.dispose();

    // Dispose of all disposables
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      'web',
      'dist',
      'update-diagram',
      'index.css',
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      'web',
      'dist',
      'update-diagram',
      'index.js',
    ]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;

        switch (command) {
          case 'getDiagramData':
            await this._panel.webview.postMessage({
              command: 'diagramData',
              data: JSON.stringify({
                code: this._diagram.code,
                title: this._diagram.title,
                diagramImage: getImageDataURL(this._svgData),
              }),
            });
            break;
          case 'updateDiagram':
            await this.updateDiagram(message.data.code, message.data.title);
            break;
        }
      },
      undefined,
      this._disposables,
    );
  }
}
