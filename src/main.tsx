import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './styles/components.css';
import './styles/menu.css';
import './styles/map.css';
import './styles/armory.css';
import './styles/progression.css';
import './styles/battle.css';
import './styles/responsive.css';
import { setupLanguage } from './shared/i18n/i18n';

setupLanguage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
