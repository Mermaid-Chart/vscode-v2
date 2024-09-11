import { languages } from 'monaco-editor';

export const mermaidLanguage: languages.IMonarchLanguage = {
  defaultToken: 'invalid',
  tokenPostfix: '.mermaid',

  keywords: [
    'graph',
    'digraph',
    'subgraph',
    'end',
    'classDef',
    'class',
    'linkStyle',
    'style',
    'flowchart',
    'sequenceDiagram',
    'stateDiagram',
    'erDiagram',
    'gantt',
    'pie',
  ],

  typeKeywords: ['TB', 'BT', 'RL', 'LR', 'TD'],

  operators: ['-->', '---', '==>', '===', '-.->', '-.->'],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  tokenizer: {
    root: [
      [/^[\t ]*[a-zA-Z_]\w*/, 'node'],
      [/^[\t ]*>>.*/, 'comment'],
      [
        /(graph|subgraph|end)(\s+)([A-Za-z_][A-Za-z0-9\-_]*)/,
        ['keyword', 'white', 'graphname'],
      ],
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@typeKeywords': 'type',
            '@default': 'variable',
          },
        },
      ],
      [/".*?"/, 'string'],
      [/\d+/, 'number'],
      [/[{}()\[\]]/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': 'symbol',
          },
        },
      ],
      [/[;,.]/, 'delimiter'],
      [/^[\t ]*%%.*$/, 'comment'],
      [/\s+/, 'white'],
    ],
  },
};
