import { useEffect, useState } from 'react';
import styles from './create-diagram.module.css';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { Editor, loader } from '@monaco-editor/react';
import { mermaidLanguage } from '../../utilities/mermaid-language';
import { vscode } from '../../utilities/vscode';

const CreateDiagram = () => {
  const [editorValue, setEditorValue] = useState<string | undefined>('');
  const [iframeData, setIframeData] = useState<any>(null);

  const handleDiagramData = (data: string) => {
    const parsedData = JSON.parse(data);
    console.log('got updated data', parsedData);
    setIframeData(parsedData.diagramImage);
    setEditorValue(parsedData.code);
  };

  const handleDiagramUpdate = () => {
    vscode.postMessage({
      command: 'updateDiagram',
      data: editorValue,
    });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'diagramData':
          handleDiagramData(message.data);
          break;
        case 'diagramRawData':
          setIframeData(message.data);
          break;
        default:
          console.warn(`Unhandled message: ${message.command}`);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    vscode.postMessage({
      command: 'getDiagramData',
    });
  }, []);

  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.languages.register({ id: 'mermaid' });
      monaco.languages.setMonarchTokensProvider('mermaid', mermaidLanguage);

      // Define custom theme
      monaco.editor.defineTheme('mermaidCustomTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '#569CD6', fontStyle: 'bold' },
          { token: 'type', foreground: '#4EC9B0' },
          { token: 'string', foreground: '#CE9178' },
          { token: 'number', foreground: '#B5CEA8' },
          { token: 'delimiter', foreground: '#CCCCCC' },
          { token: 'operator', foreground: '#D4D4D4' },
          { token: 'variable', foreground: '#9CDCFE' },
          { token: 'comment', foreground: '#6A9955' },
          { token: 'graphname', foreground: '#4EC9B0' },
          { token: 'node', foreground: '#DCDCAA' },
        ],
        colors: {
          'editor.foreground': '#D4D4D4',
          'editor.background': '#1E1E1E',
        },
      });
      monaco.languages.setLanguageConfiguration('mermaid', {
        comments: {
          lineComment: '%%',
        },
        brackets: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
        ],
        surroundingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
        ],
      });
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.textAreaContainer}>
          <Editor
            height="85vh"
            theme="vs-dark"
            defaultLanguage="mermaid"
            value={editorValue}
            options={{
              minimap: { enabled: false },
            }}
            onChange={(value) => setEditorValue(value)}
          />
        </div>
        <VSCodeButton
          type="button"
          className={styles.button}
          onClick={handleDiagramUpdate}
        >
          Update diagram
        </VSCodeButton>
      </div>
      <iframe
        sandbox="allow-same-origin allow-forms allow-popups allow-pointer-lock allow-top-navigation-by-user-activation"
        src={iframeData ? iframeData : 'about:blank'}
        className={styles.iframe}
      />
    </div>
  );
};

export default CreateDiagram;
