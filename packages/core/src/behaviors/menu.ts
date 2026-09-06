import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

const bem = createBem('menu');

export interface MenuItem {
  value: string;
  label?: string;
  disabled?: boolean;
  danger?: boolean;
  /** Presence makes this a submenu rather than a leaf. */
  children?: MenuItem[];
  /** Renders a separator line above this item. */
  divided?: boolean;
}

export interface MenuOptions {
  items: MenuItem[];
  value?: string | null;
  /** Open submenu keys. */
  expanded?: string[];
  orientation?: 'vertical' | 'horizontal';
  /** `inline` expands submenus in place; `popup` floats them (Dropdown). */
  mode?: 'inline' | 'popup';
  collapsed?: boolean;
  id: string;
  onSelect?: (value: string, item: MenuItem) => void;
  onExpandedChange?: (expanded: string[]) => void;
  extraClass?: string;
}

export interface MenuBehavior {
  root: ElementSpec;
  item: (item: MenuItem, depth: number) => ElementSpec;
  submenuTrigger: (item: MenuItem, depth: number) => ElementSpec;
  submenu: (item: MenuItem) => ElementSpec;
  isExpanded: (item: MenuItem) => boolean;
  /** Flattened, visible items — what the arrow keys walk through. */
  visible: Array<{ item: MenuItem; depth: number }>;
  onKeydown: (event: any) => void;
}

/**
 * One menu model serves the sidebar Menu and the floating Dropdown: they differ
 * in how submenus are presented (`inline` vs `popup`), never in selection,
 * expansion or keyboard handling.
 */
export function useMenu(options: MenuOptions): MenuBehavior {
  const {
    items, value = null, expanded = [], orientation = 'vertical', mode = 'inline',
    collapsed, id, onSelect, onExpandedChange, extraClass,
  } = options;

  const isExpanded = (item: MenuItem): boolean => expanded.includes(item.value);

  const toggle = (item: MenuItem): void => {
    onExpandedChange?.(isExpanded(item) ? expanded.filter((key) => key !== item.value) : [...expanded, item.value]);
  };

  const visible: Array<{ item: MenuItem; depth: number }> = [];
  const walk = (list: MenuItem[], depth: number): void => {
    for (const item of list) {
      visible.push({ item, depth });
      if (item.children && isExpanded(item) && mode === 'inline') walk(item.children, depth + 1);
    }
  };
  walk(items, 0);

  const step = (event: any, delta: number): void => {
    event.preventDefault?.();
    const nodes: HTMLElement[] = Array.from(
      event?.currentTarget?.querySelectorAll?.('[data-menu-item]:not([aria-disabled="true"])') ?? [],
    );
    if (nodes.length === 0) return;
    const active = nodes.indexOf(document.activeElement as HTMLElement);
    const next = active === -1 ? 0 : (active + delta + nodes.length) % nodes.length;
    nodes[next]?.focus();
  };

  return {
    visible,
    isExpanded,
    root: spec(
      cx(bem(), bem(null, orientation), bem(null, mode), { [bem(null, 'collapsed')]: collapsed }, extraClass),
      { role: 'menu', id, 'aria-orientation': orientation },
      {
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          const forward = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
          const back = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
          if (key === forward) step(event, 1);
          else if (key === back) step(event, -1);
          else if (key === 'Home') { event.preventDefault?.(); step(event, 0); }
        },
      },
    ),
    onKeydown: (event: any) => step(event, 1),
    item: (item, depth) =>
      spec(
        cx(bem('item'), {
          [bem('item', 'active')]: item.value === value,
          [bem('item', 'disabled')]: item.disabled,
          [bem('item', 'danger')]: item.danger,
          [bem('item', 'divided')]: item.divided,
        }),
        {
          role: 'menuitem',
          type: 'button',
          tabindex: item.disabled ? -1 : 0,
          'data-menu-item': '',
          'data-depth': depth,
          'aria-disabled': item.disabled || undefined,
          'aria-current': item.value === value || undefined,
        },
        { click: () => !item.disabled && onSelect?.(item.value, item) },
      ),
    submenuTrigger: (item, depth) =>
      spec(
        cx(bem('item'), bem('item', 'parent'), {
          [bem('item', 'expanded')]: isExpanded(item),
          [bem('item', 'disabled')]: item.disabled,
        }),
        {
          role: 'menuitem',
          type: 'button',
          tabindex: item.disabled ? -1 : 0,
          'data-menu-item': '',
          'data-depth': depth,
          'aria-haspopup': 'menu',
          'aria-expanded': isExpanded(item),
          'aria-controls': `${id}-${item.value}`,
          'aria-disabled': item.disabled || undefined,
        },
        { click: () => !item.disabled && toggle(item) },
      ),
    submenu: (item) =>
      spec(
        cx(bem('submenu'), { [bem('submenu', 'open')]: isExpanded(item) }),
        { id: `${id}-${item.value}`, role: 'menu', hidden: !isExpanded(item) || undefined },
      ),
  };
}
