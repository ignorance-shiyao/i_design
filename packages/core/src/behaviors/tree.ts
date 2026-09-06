import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

const bem = createBem('tree');

export interface TreeNode {
  key: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface TreeOptions {
  nodes: TreeNode[];
  expanded: string[];
  selected?: string[];
  checked?: string[];
  /** Checkboxes with parent/child propagation, the way file pickers behave. */
  checkable?: boolean;
  multiple?: boolean;
  onExpandedChange?: (keys: string[]) => void;
  onSelect?: (key: string, node: TreeNode) => void;
  onCheckedChange?: (keys: string[]) => void;
  extraClass?: string;
}

export interface FlatNode {
  node: TreeNode;
  depth: number;
  parents: string[];
  expandable: boolean;
}

export interface TreeBehavior {
  root: ElementSpec;
  /** Visible nodes in render order — the tree is drawn flat, not recursively. */
  rows: FlatNode[];
  row: (entry: FlatNode) => ElementSpec;
  toggle: (entry: FlatNode) => ElementSpec;
  checkbox: (entry: FlatNode) => { checked: boolean; indeterminate: boolean; toggle: () => void };
  isSelected: (node: TreeNode) => boolean;
}

const collectKeys = (node: TreeNode, out: string[] = []): string[] => {
  out.push(node.key);
  for (const child of node.children ?? []) collectKeys(child, out);
  return out;
};

export function useTree(options: TreeOptions): TreeBehavior {
  const {
    nodes, expanded, selected = [], checked = [], checkable, multiple,
    onExpandedChange, onSelect, onCheckedChange, extraClass,
  } = options;

  const checkedSet = new Set(checked);

  const rows: FlatNode[] = [];
  const walk = (list: TreeNode[], depth: number, parents: string[]): void => {
    for (const node of list) {
      const expandable = Boolean(node.children?.length);
      rows.push({ node, depth, parents, expandable });
      if (expandable && expanded.includes(node.key)) walk(node.children!, depth + 1, [...parents, node.key]);
    }
  };
  walk(nodes, 0, []);

  const toggleExpanded = (key: string): void => {
    onExpandedChange?.(expanded.includes(key) ? expanded.filter((item) => item !== key) : [...expanded, key]);
  };

  return {
    rows,
    isSelected: (node) => selected.includes(node.key),
    root: spec(cx(bem(), extraClass), { role: 'tree', 'aria-multiselectable': multiple || undefined }),
    row: (entry) =>
      spec(
        cx(bem('row'), {
          [bem('row', 'selected')]: selected.includes(entry.node.key),
          [bem('row', 'disabled')]: entry.node.disabled,
        }),
        {
          role: 'treeitem',
          tabindex: entry.node.disabled ? -1 : 0,
          // Depth is 1-based in ARIA, and only expandable rows carry aria-expanded.
          'aria-level': entry.depth + 1,
          'aria-expanded': entry.expandable ? expanded.includes(entry.node.key) : undefined,
          'aria-selected': selected.includes(entry.node.key),
          'aria-disabled': entry.node.disabled || undefined,
          'data-depth': entry.depth,
        },
        {
          click: () => !entry.node.disabled && onSelect?.(entry.node.key, entry.node),
          keydown: (event: any) => {
            const key = String(event?.key ?? '');
            if (key === 'ArrowRight' && entry.expandable && !expanded.includes(entry.node.key)) {
              event.preventDefault?.();
              toggleExpanded(entry.node.key);
            } else if (key === 'ArrowLeft' && entry.expandable && expanded.includes(entry.node.key)) {
              event.preventDefault?.();
              toggleExpanded(entry.node.key);
            } else if (key === 'Enter' || key === ' ') {
              event.preventDefault?.();
              if (!entry.node.disabled) onSelect?.(entry.node.key, entry.node);
            }
          },
        },
      ),
    toggle: (entry) =>
      spec(
        cx(bem('toggle'), { [bem('toggle', 'open')]: expanded.includes(entry.node.key) }),
        { type: 'button', tabindex: -1, 'aria-hidden': true },
        {
          click: (event: any) => {
            event.stopPropagation?.();
            toggleExpanded(entry.node.key);
          },
        },
      ),
    checkbox: (entry) => {
      const descendants = collectKeys(entry.node).slice(1);
      const checkedChildren = descendants.filter((key) => checkedSet.has(key));
      const self = checkedSet.has(entry.node.key);
      return {
        checked: self || (descendants.length > 0 && checkedChildren.length === descendants.length),
        indeterminate: !self && checkedChildren.length > 0 && checkedChildren.length < descendants.length,
        toggle: () => {
          if (!checkable || entry.node.disabled) return;
          const family = collectKeys(entry.node);
          const next = new Set(checkedSet);
          // Checking a branch checks everything under it, and vice versa.
          if (self || family.every((key) => next.has(key))) family.forEach((key) => next.delete(key));
          else family.forEach((key) => next.add(key));
          onCheckedChange?.([...next]);
        },
      };
    },
  };
}
