import React from 'react';
import ReactDOM from 'react-dom/client';
import UpdateDiagram from './update-diagram';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <UpdateDiagram />
  </React.StrictMode>,
);
