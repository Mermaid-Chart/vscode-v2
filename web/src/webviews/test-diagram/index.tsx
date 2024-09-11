import React from 'react';
import ReactDOM from 'react-dom/client';
import TestDiagram from './test-diagram';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <TestDiagram />
  </React.StrictMode>,
);
