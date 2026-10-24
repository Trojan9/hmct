import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { createQueryClient } from './lib/queryClient';
import './styles/main.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App queryClient={createQueryClient()} />
    </BrowserRouter>
  </StrictMode>,
);
