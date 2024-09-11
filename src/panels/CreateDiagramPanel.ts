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
export class CreateDiagramPanel {
  public static currentPanel: CreateDiagramPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private _diagram: MCDocument;
  private _mcAPI: MermaidChartVSCode;
  private diagramData: any;

  /**
   * The CreateDiagramPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(
    panel: WebviewPanel,
    extensionUri: Uri,
    diagram: MCDocument,
    diagramData: any,
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
    this.diagramData = diagramData;
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
    diagramData: any,
    mcAPI: MermaidChartVSCode,
  ) {
    if (CreateDiagramPanel.currentPanel) {
      // If the webview panel already exists reveal it
      CreateDiagramPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        'new-diagram',
        // Panel title
        'Untitled diagram',
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, 'out'),
            Uri.joinPath(extensionUri, 'web/dist/create-diagram'),
          ],
        },
      );

      CreateDiagramPanel.currentPanel = new CreateDiagramPanel(
        panel,
        extensionUri,
        diagram,
        diagramData,
        mcAPI,
      );
    }
  }

  private async getDiagramRawData() {
    try {
      const svgContent = await this._mcAPI.getRawDocument(
        this._diagram,
        'dark',
      );
      return svgContent;
    } catch (error) {
      console.log(error);
    }
  }

  private async updateDiagram(code: string) {
    const updatedDiagram: MCDocument = {
      id: this._diagram.id,
      documentID: this._diagram.documentID,
      projectID: this._diagram.projectID,
      major: this._diagram.major,
      minor: this._diagram.minor,
      title: this._diagram.title,
      code: code,
    };

    try {
      await this._mcAPI.updateDiagram(updatedDiagram);
      await commands.executeCommand('package-diagrams.refresh');
      const document = await this._mcAPI.getDocument(this._diagram.documentID);
      // const svgContent = await this.getDiagramRawData();
      // await this._panel.webview.postMessage({
      //   command: 'diagramRawData',
      //   data: JSON.stringify(getImageDataURL(svgContent!)),
      // });
      this._panel.webview.postMessage({
        command: 'diagramData',
        data: JSON.stringify({
          code: document.code,
          diagramImage: getImageDataURL(document.svgCodeDark!),
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
    CreateDiagramPanel.currentPanel = undefined;

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
      'create-diagram',
      'index.css',
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      'web',
      'dist',
      'create-diagram',
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
      (message: any) => {
        const command = message.command;

        switch (command) {
          case 'getDiagramData':
            this._panel.webview.postMessage({
              command: 'diagramData',
              data: JSON.stringify({
                code: this._diagram.code,
                diagramImage: getImageDataURL(this.diagramData),
              }),
            });
            return;
          case 'updateDiagram':
            this.updateDiagram(message.data);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables,
    );
  }
}
