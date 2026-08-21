import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers';
import './shared/lib/testBridge';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
