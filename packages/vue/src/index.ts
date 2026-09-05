import type { App, Component } from 'vue';
import { ConfigProvider } from './components/ConfigProvider.js';
import { Button } from './components/Button.js';
import { Input } from './components/Input.js';
import { Checkbox, Switch } from './components/Toggle.js';
import { Tag } from './components/Tag.js';
import { Space } from './components/Space.js';
import { FormItem } from './components/FormItem.js';
import { Dialog } from './components/Dialog.js';
import { Tooltip } from './components/Tooltip.js';

export { ConfigProvider, useConfig, type IConfig } from './components/ConfigProvider.js';
export { Button, Input, Checkbox, Switch, Tag, Space, FormItem, Dialog, Tooltip };
export { toProps, useControlled } from './utils.js';

/** The imperative toast API is framework-free, so Vue simply re-exports it. */
export { message, showMessage, type MessageOptions } from '@i-design/core';

export type { Density, Direction, Locale, LocaleName, Placement, Size, Status, ThemeMode, Variant } from '@i-design/core';
export { applyTheme, computedTokens, locales } from '@i-design/core';

const components: Record<string, Component> = {
  IConfigProvider: ConfigProvider,
  IButton: Button,
  IInput: Input,
  ICheckbox: Checkbox,
  ISwitch: Switch,
  ITag: Tag,
  ISpace: Space,
  IFormItem: FormItem,
  IDialog: Dialog,
  ITooltip: Tooltip,
};

/** `app.use(IDesign)` for the global-registration style Vue users expect. */
export default {
  install(app: App): void {
    for (const [name, component] of Object.entries(components)) app.component(name, component);
  },
};
