import '@i-design/core/styles';
import './docs/site.css';

import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { App } from './docs/App.js';

createRoot(document.getElementById('app')!).render(createElement(App));
