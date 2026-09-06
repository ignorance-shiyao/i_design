import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size } from './types.js';

const bem = createBem('cascader');

export interface CascaderNode {
  value: string;
  label: string;
  disabled?: boolean;
  children?: CascaderNode[];
}

export interface CascaderOptions {
  options: CascaderNode[];
  /** The full path, e.g. ['zhejiang', 'hangzhou', 'xihu']. */
  value: string[];
  open?: boolean;
  /** Which column each level is showing; derived from `value` when browsing. */
  activePath?: string[];
  size?: Size;
  status?: 'default' | 'success' | 'warning' | 'danger';
  placeholder?: string;
  separator?: string;
  disabled?: boolean;
  clearable?: boolean;
  /** Allow picking a non-leaf node. */
  changeOnSelect?: boolean;
  id: string;
  onChange?: (value: string[], labels: string[]) => void;
  onActivePathChange?: (path: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  extraClass?: string;
}

export interface CascaderBehavior {
  root: ElementSpec;
  trigger: ElementSpec;
  panel: ElementSpec;
  /** One array per visible column. */
  columns: CascaderNode[][];
  column: (index: number) => ElementSpec;
  option: (node: CascaderNode, depth: number) => ElementSpec;
  clear: ElementSpec | null;
  displayValue: string;
  placeholder: string;
}

/** Walks `path` through the tree, returning the node at each level. */
export function resolvePath(options: CascaderNode[], path: string[]): CascaderNode[] {
  const out: CascaderNode[] = [];
  let level = options;
  for (const key of path) {
    const node = level.find((item) => item.value === key);
    if (!node) break;
    out.push(node);
    level = node.children ?? [];
  }
  return out;
}

export function useCascader(options: CascaderOptions): CascaderBehavior {
  const {
    options: tree, value, open = false, activePath, size = 'm', status = 'default',
    placeholder = '请选择', separator = ' / ', disabled, clearable, changeOnSelect,
    id, onChange, onActivePathChange, onOpenChange, extraClass,
  } = options;

  const browsing = activePath ?? value;
  const resolved = resolvePath(tree, value);

  // Columns: the root, then the children of each browsed node that has any.
  const columns: CascaderNode[][] = [tree];
  let level = tree;
  for (const key of browsing) {
    const node = level.find((item) => item.value === key);
    if (!node?.children?.length) break;
    columns.push(node.children);
    level = node.children;
  }

  const pick = (node: CascaderNode, depth: number): void => {
    if (node.disabled) return;
    const nextPath = [...browsing.slice(0, depth), node.value];
    const isLeaf = !node.children?.length;
    onActivePathChange?.(nextPath);

    if (isLeaf || changeOnSelect) {
      const labels = resolvePath(tree, nextPath).map((item) => item.label);
      onChange?.(nextPath, labels);
      if (isLeaf) onOpenChange?.(false);
    }
  };

  return {
    columns,
    placeholder,
    displayValue: resolved.map((node) => node.label).join(separator),
    root: spec(
      cx(bem(), bem(null, `size-${size}`), bem(null, `status-${status}`), {
        [bem(null, 'open')]: open,
        [bem(null, 'disabled')]: disabled,
      }, extraClass),
    ),
    trigger: spec(
      bem('trigger'),
      {
        type: 'button',
        role: 'combobox',
        'aria-haspopup': 'tree',
        'aria-expanded': open,
        'aria-controls': `${id}-panel`,
        disabled: disabled || undefined,
      },
      {
        click: () => !disabled && onOpenChange?.(!open),
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          if (key === 'Escape') onOpenChange?.(false);
          else if ((key === 'ArrowDown' || key === 'Enter') && !open) {
            event.preventDefault?.();
            onOpenChange?.(true);
          }
        },
      },
    ),
    panel: spec(bem('panel'), { id: `${id}-panel`, role: 'tree' }),
    column: (index) => spec(bem('column'), { role: 'group', 'data-depth': index }),
    option: (node, depth) => {
      const active = browsing[depth] === node.value;
      const selected = value[depth] === node.value && depth === value.length - 1;
      return spec(
        cx(bem('option'), {
          [bem('option', 'active')]: active,
          [bem('option', 'selected')]: selected,
          [bem('option', 'disabled')]: node.disabled,
        }),
        {
          type: 'button',
          role: 'treeitem',
          'aria-expanded': node.children?.length ? active : undefined,
          'aria-selected': selected,
          'aria-disabled': node.disabled || undefined,
        },
        { click: () => pick(node, depth) },
      );
    },
    clear:
      clearable && value.length > 0 && !disabled
        ? spec(
            bem('clear'),
            { type: 'button', tabindex: -1, 'aria-label': 'clear' },
            {
              pointerdown: (event: any) => {
                event.preventDefault?.();
                event.stopPropagation?.();
                onChange?.([], []);
                onActivePathChange?.([]);
              },
            },
          )
        : null,
  };
}
