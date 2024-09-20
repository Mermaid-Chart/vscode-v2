import * as vscode from 'vscode';

export function getBaseUrl() {
  const config = vscode.workspace.getConfiguration('mermaidChart');
  const baseURL = config.get<string>('baseUrl');
  if (!baseURL) {
    vscode.window.showErrorMessage(
      'MermaidChart: Base URL is not set. Please set the base URL in the settings.',
    );
    return '';
  }
  return baseURL;
}

export function getClientID() {
  const config = vscode.workspace.getConfiguration('mermaidChart');
  const clientId = config.get<string>('clientId');
  if (!clientId) {
    vscode.window.showErrorMessage(
      'MermaidChart: Client ID is not set. Please set the client ID in the settings.',
    );
    return '';
  }
  return clientId;
}
