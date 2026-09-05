import '@i-design/core/styles';
import './demo.css';

import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { createApp, h, reactive } from 'vue';
import { applyTheme, type Density, type LocaleName, type ThemeMode } from '@i-design/core';
import { ReactApp } from './ReactApp.js';
import { VueApp } from './VueApp.js';

/** One store, two frameworks: the toolbar drives both trees at once. */
const state = reactive({ mode: 'light' as ThemeMode, density: 'default' as Density, locale: 'zh-CN' as LocaleName });

const reactRoot = createRoot(document.getElementById('react-root')!);
const renderReact = (): void => {
  reactRoot.render(createElement(ReactApp, { ...state }));
};

createApp({
  render: () => h(VueApp, { mode: state.mode, density: state.density, locale: state.locale }),
}).mount('#vue-root');

/* --- toolbar ------------------------------------------------------------ */
const controls = document.getElementById('controls')!;
const select = <T extends string>(label: string, options: T[], onPick: (value: T) => void): HTMLElement => {
  const wrap = document.createElement('label');
  wrap.className = 'i-space i-space--horizontal i-space--gap-s i-space--align-center';
  wrap.append(label);
  const el = document.createElement('select');
  el.className = 'i-input';
  for (const option of options) el.append(new Option(option, option));
  el.addEventListener('change', () => onPick(el.value as T));
  wrap.append(el);
  return wrap;
};

const bar = document.createElement('div');
bar.className = 'i-space i-space--horizontal i-space--gap-l i-space--wrap i-space--align-center';
bar.append(
  select('主题', ['light', 'dark', 'auto'] as ThemeMode[], (mode) => {
    state.mode = mode;
    applyTheme({ mode });           // keeps portalled dialogs/toasts in sync
    renderReact();
  }),
  select('密度', ['default', 'compact', 'loose'] as Density[], (density) => {
    state.density = density;
    applyTheme({ density });
    renderReact();
  }),
  select('语言', ['zh-CN', 'en-US', 'ar-EG'] as LocaleName[], (locale) => {
    state.locale = locale;
    renderReact();
  }),
  select('品牌色', ['#3778f5', '#7c3aed', '#e97817', '#1ea45f'], (color) => {
    document.documentElement.style.setProperty('--i-color-brand', color);
  }),
);
controls.append(bar);

renderReact();
