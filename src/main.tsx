import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { TenantBrandingProvider } from './contexts/TenantBrandingContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TenantBrandingProvider>
      <App />
    </TenantBrandingProvider>
  </React.StrictMode>,
);
