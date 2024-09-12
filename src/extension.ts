import * as vscode from 'vscode';
import { MermaidChartProvider, MCTreeItem } from './mermaidChartProvider';
import { MermaidChartVSCode } from './mermaidChartVSCode';
import {
  applyMermaidChartTokenHighlighting,
  createMermaidChart,
  editMermaidChart,
  findComments,
  findMermaidChartTokens,
  insertMermaidChartToken,
  updateMermaidChart,
  viewMermaidChart,
} from './util';
import { MermaidChartCodeLensProvider } from './mermaidChartCodeLensProvider';
import { deleteConfirmationModal } from './panels/DeleteConfirmationModal';
import { DiagramCreationViewProvider } from './views/DiagramCreationViewProvider';

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
    updateMermaidChartTokenHighlighting,
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidChangeTextDocument(
    updateMermaidChartTokenHighlighting,
    null,
    context.subscriptions,
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.viewMermaidChart',
      async (uuid: string) => await viewMermaidChart(mcAPI, uuid),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.createMermaidChart',
      async () => await createMermaidChart(mcAPI, context),
    ),
  );

  const treeView = vscode.window.createTreeView('package-diagrams', {
    treeDataProvider: mermaidChartProvider,
  });

  vscode.window.registerTreeDataProvider(
    'package-diagrams',
    mermaidChartProvider,
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.editMermaidChart',
      (uuid: string) => {
        return editMermaidChart(mcAPI, uuid, mermaidChartProvider);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'mermaidChart.editDiagram',
      async (document) =>
        await updateMermaidChart(mcAPI, context, document.uuid),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'mermaidChart.deleteDiagram',
      async (document) =>
        await deleteConfirmationModal(mcAPI, document.uuid, document.title),
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

  context.subscriptions.push(
    vscode.commands.registerCommand('package-diagrams.outline', () => {
      vscode.window.registerTreeDataProvider(
        'package-diagrams',
        mermaidChartProvider,
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'package-diagrams.insertUuidIntoEditor',
      (uuid: string) => {
        return insertMermaidChartToken(uuid, mermaidChartProvider);
      },
    ),
  );

  const provider = new DiagramCreationViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DiagramCreationViewProvider.viewType,
      provider,
    ),
  );

  mermaidChartProvider.refresh();
  // Add a console.log() statement to ensure the view is registered
  console.log('Mermaid Charts view registered');
}

// This method is called when your extension is deactivated
export function deactivate() {}
