import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-display/800';
import '@fontsource/big-shoulders-text/500';
import '@fontsource/big-shoulders-text/700';
import '@fontsource/martian-mono/400';
import './styles/tokens.css';
import './styles/main.css';
import './styles/board.css';
import './styles/chart.css';
import './styles/pages.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
