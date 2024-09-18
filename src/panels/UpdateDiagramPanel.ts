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
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class UpdateDiagramPanel {
  public static currentPanel: UpdateDiagramPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private _diagram: MCDocument;
  private _mcAPI: MermaidChartVSCode;

  /**
   * The UpdateDiagramPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(
    panel: WebviewPanel,
    extensionUri: Uri,
    diagram: MCDocument,
    mcAPI: MermaidChartVSCode,
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
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(
    extensionUri: Uri,
    diagram: MCDocument,
    mcAPI: MermaidChartVSCode,
  ) {
    if (UpdateDiagramPanel.currentPanel) {
      // If the webview panel already exists reveal it
      UpdateDiagramPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        'updated-diagram',
        // Panel title
        diagram.documentID,
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, 'out'),
            Uri.joinPath(extensionUri, 'web/dist/update-diagram'),
          ],
        },
      );

      UpdateDiagramPanel.currentPanel = new UpdateDiagramPanel(
        panel,
        extensionUri,
        diagram,
        mcAPI,
      );
    }
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
      console.log('document', document);
      await this._panel.webview.postMessage({
        command: 'diagramData',
        data: JSON.stringify({
          code: document.code,
          diagramImage: getImageDataURL(document.svgCodeDark!),
          title: document.title,
        }),
      });
      await window.showInformationMessage('Diagram updated');
    } catch (error) {
      console.log(error);
      window.showErrorMessage('Failed to update diagram');
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    UpdateDiagramPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
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
                diagramImage: getImageDataURL(this._diagram.svgCodeDark!),
              }),
            });
            break;
          case 'updateDiagram':
            await this.updateDiagram(message.data.code, message.data.title);
            break;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables,
    );
  }
}
