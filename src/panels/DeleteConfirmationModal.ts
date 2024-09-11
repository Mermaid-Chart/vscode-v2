import vscode from 'vscode';
import { MermaidChartVSCode } from '../mermaidChartVSCode';

export async function deleteConfirmationModal(
  mcAPI: MermaidChartVSCode,
  uuid: string,
  title: string,
) {
  const selection = await vscode.window.showWarningMessage(
    `Are you sure you want to delete the item: ${title}?`,
    { modal: true },
    'Yes',
    'No',
  );
  if (selection === 'Yes') {
    try {
      await mcAPI.deleteDiagram(uuid);
      await vscode.commands.executeCommand('extension.refreshTreeView');
      await vscode.window.showInformationMessage('Item deleted successfully.');
    } catch (error) {
      console.log(error);
      vscode.window.showErrorMessage('Failed to delete item, please try again');
    }
  }
}
