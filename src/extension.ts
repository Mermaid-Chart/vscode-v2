import * as vscode from 'vscode';
import { MermaidChartProvider, MCTreeItem } from './mermaidChartProvider';
import { MermaidChartVSCode } from './mermaidChartVSCode';
import {
  applyMermaidChartTokenHighlighting,
  editMermaidChart,
  findComments,
  findMermaidChartTokens,
  insertMermaidChartToken,
  viewMermaidChart,
} from './util';
import { MermaidChartCodeLensProvider } from './mermaidChartCodeLensProvider';
import { CreateDiagramPanel } from './panels/CreateDiagramPanel';
import { deleteConfirmationModal } from './panels/DeleteConfirmationModal';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Activating Mermaid Chart extension');
  const mcAPI = new MermaidChartVSCode();
  await mcAPI.initialize(context);

  const mermaidChartProvider: MermaidChartProvider = new MermaidChartProvider(
    mcAPI,
  );

  const mermaidChartTokenDecoration =
    vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 71, 123, 0.3)', // Adjust the background color as desired
      color: 'rgb(255, 255, 255)', // Adjust the text color as desired
      gutterIconPath: vscode.Uri.file(
        context.asAbsolutePath('resources/icons/mermaid-icon-16.png'),
      ), // Add the icon file path
      gutterIconSize: '8x8', // Adjust the icon size as desired
    });
  let codeLensProvider: MermaidChartCodeLensProvider | undefined;

  function updateMermaidChartTokenHighlighting() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const comments = findComments(activeEditor.document);
      const mermaidChartTokens = findMermaidChartTokens(
        activeEditor.document,
        comments,
      );
      applyMermaidChartTokenHighlighting(
        activeEditor,
        mermaidChartTokens,
        mermaidChartTokenDecoration,
      );

      if (!codeLensProvider) {
        codeLensProvider = new MermaidChartCodeLensProvider(mermaidChartTokens);
        context.subscriptions.push(
          vscode.languages.registerCodeLensProvider('*', codeLensProvider),
        );
      } else {
        codeLensProvider.setMermaidChartTokens(mermaidChartTokens);
      }
    }
  }

  updateMermaidChartTokenHighlighting();

  vscode.window.onDidChangeActiveTextEditor(
    () => {
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidChangeTextDocument(
    () => {
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions,
  );

  const viewCommandDisposable = vscode.commands.registerCommand(
    'extension.viewMermaidChart',
    (uuid: string) => {
      return viewMermaidChart(mcAPI, uuid);
    },
  );

  context.subscriptions.push(viewCommandDisposable);

  // const createCommandDisposable = vscode.commands.registerCommand(
  //   'extension.createMermaidChart',
  //   () => createMermaidChart(mcAPI, context),
  // );

  // context.subscriptions.push(createCommandDisposable);

  // Create the show hello world command
  const showHelloWorldCommand = vscode.commands.registerCommand(
    'extension.createMermaidChart',
    async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Creating Mermaid Chart',
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: 'Creating diagram...' });
            const projects = await mcAPI.getProjects();
            const projectID = projects[0].id;
            const document = await mcAPI.createDiagram(projectID);

            if (document?.documentID) {
              const diagram = await mcAPI.getDocument(document.documentID);
              const svgContent = await mcAPI.getRawDocument(document, 'dark');

              console.log('diagram', diagram);

              CreateDiagramPanel.render(
                context.extensionUri,
                diagram,
                svgContent,
                mcAPI,
              );

              await vscode.commands.executeCommand('extension.refreshTreeView');
            } else {
              throw new Error('Failed to create diagram');
            }
          },
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to create Mermaid Chart: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    },
  );

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);

  const treeView = vscode.window.createTreeView('package-diagrams', {
    treeDataProvider: mermaidChartProvider,
  });

  vscode.window.registerTreeDataProvider(
    'package-diagrams',
    mermaidChartProvider,
  );

  const editCommandDisposable = vscode.commands.registerCommand(
    'extension.editMermaidChart',
    (uuid: string) => {
      return editMermaidChart(mcAPI, uuid, mermaidChartProvider);
    },
  );
  context.subscriptions.push(editCommandDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.editDiagram', () => {
      vscode.window.showInformationMessage('Edit Diagram command executed');
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'mermaidChart.deleteDiagram',
      async (document) => {
        await deleteConfirmationModal(mcAPI, document.uuid, document.title);
        vscode.window.showInformationMessage('Delete Diagram command executed');
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('package-diagrams.focus', () => {
      const emptyMermaidChartToken: MCTreeItem = {
        uuid: '',
        title: '',
        range: new vscode.Range(0, 0, 0, 0),
      };
      treeView.reveal(emptyMermaidChartToken, {
        select: false,
        focus: true,
        expand: false,
      });
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('package-diagrams.refresh', () => {
      mermaidChartProvider.refresh();
    }),
  );

  let disposable = vscode.commands.registerCommand(
    'package-diagrams.outline',
    () => {
      vscode.window.registerTreeDataProvider(
        'package-diagrams',
        mermaidChartProvider,
      );
    },
  );
  context.subscriptions.push(disposable);

  const insertUuidIntoEditorDisposable = vscode.commands.registerCommand(
    'package-diagrams.insertUuidIntoEditor',
    (uuid: string) => {
      return insertMermaidChartToken(uuid, mermaidChartProvider);
    },
  );
  context.subscriptions.push(insertUuidIntoEditorDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.refreshTreeView', () => {
      mermaidChartProvider.refresh();
    }),
  );

  const provider = new NewDiagramViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      NewDiagramViewProvider.viewType,
      provider,
    ),
  );

  mermaidChartProvider.refresh();
  // Add a console.log() statement to ensure the view is registered
  console.log('Mermaid Charts view registered');
}

class NewDiagramViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'new-diagram';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

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
    return `
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

// This method is called when your extension is deactivated
export function deactivate() {}
