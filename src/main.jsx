import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/source-serif-4/opsz';
import '@fontsource-variable/hanken-grotesk';
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
