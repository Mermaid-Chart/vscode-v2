import React from 'react';
import ReactDOM from 'react-dom/client';
import CreateDiagram from './create-diagram';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <CreateDiagram />
  </React.StrictMode>,
);
