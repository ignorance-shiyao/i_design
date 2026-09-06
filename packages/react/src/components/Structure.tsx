import {
  activeSection, createId, useAnchor, useBackTop, useMenu, useTree,
  type AnchorItem, type MenuItem, type MenuOptions, type TreeOptions,
} from '@i-design/core';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';
import { Checkbox } from './Checkbox.js';

/* --- Layout ------------------------------------------------------------- */
export interface LayoutProps {
  direction?: 'column' | 'row';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Layout({ direction = 'column', className, style, children }: LayoutProps) {
  return (
    <div className={['i-layout', direction === 'row' ? 'i-layout--row' : '', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}

const part = (name: string) =>
  function LayoutPart({ className, style, children }: { className?: string; style?: CSSProperties; children?: ReactNode }) {
    return (
      <div className={[`i-layout__${name}`, className].filter(Boolean).join(' ')} style={style}>
        {children}
      </div>
    );
  };

export const LayoutHeader = part('header');
export const LayoutContent = part('content');
export const LayoutFooter = part('footer');

export interface LayoutSiderProps {
  collapsed?: boolean;
  width?: number | string;
  collapsedWidth?: number | string;
  className?: string;
  children?: ReactNode;
}

export function LayoutSider({ collapsed, width = 220, collapsedWidth = 56, className, children }: LayoutSiderProps) {
  return (
    <aside
      className={['i-layout__sider', collapsed ? 'i-layout__sider--collapsed' : '', className].filter(Boolean).join(' ')}
      style={{
        '--i-layout-sider-width': typeof width === 'number' ? `${width}px` : width,
        '--i-layout-sider-collapsed': typeof collapsedWidth === 'number' ? `${collapsedWidth}px` : collapsedWidth,
      } as CSSProperties}
    >
      {children}
    </aside>
  );
}

/* --- Menu --------------------------------------------------------------- */
export interface MenuProps extends Omit<MenuOptions, 'id' | 'expanded' | 'onExpandedChange' | 'extraClass'> {
  expanded?: string[];
  defaultExpanded?: string[];
  className?: string;
  onExpandedChange?: (keys: string[]) => void;
}

export function Menu(props: MenuProps) {
  const { items, expanded: controlled, defaultExpanded = [], className, onExpandedChange, ...rest } = props;
  const id = useMemo(() => createId('i-menu'), []);
  const [expanded, setExpanded] = useControlled(controlled, defaultExpanded);

  const behavior = useMenu({
    ...rest, items, id, expanded,
    onExpandedChange: (keys) => {
      setExpanded(keys);
      onExpandedChange?.(keys);
    },
    extraClass: className,
  });

  const renderItems = (list: MenuItem[], depth: number): ReactNode =>
    list.map((item) =>
      item.children?.length ? (
        <div key={item.value}>
          <button {...toProps(behavior.submenuTrigger(item, depth))}>
            <span className="i-menu__label">{item.label ?? item.value}</span>
            <span className="i-menu__arrow" aria-hidden="true">›</span>
          </button>
          <div {...toProps(behavior.submenu(item))}>{renderItems(item.children, depth + 1)}</div>
        </div>
      ) : (
        <button key={item.value} {...toProps(behavior.item(item, depth))}>
          <span className="i-menu__label">{item.label ?? item.value}</span>
        </button>
      ),
    );

  return <nav {...toProps(behavior.root)}>{renderItems(items, 0)}</nav>;
}

/* --- Tree --------------------------------------------------------------- */
export interface TreeProps extends Omit<TreeOptions, 'expanded' | 'checked' | 'onExpandedChange' | 'onCheckedChange' | 'extraClass'> {
  expanded?: string[];
  defaultExpanded?: string[];
  checked?: string[];
  defaultChecked?: string[];
  className?: string;
  onExpandedChange?: (keys: string[]) => void;
  onCheckedChange?: (keys: string[]) => void;
}

export function Tree(props: TreeProps) {
  const {
    nodes, expanded: controlledExpanded, defaultExpanded = [], checked: controlledChecked,
    defaultChecked = [], className, onExpandedChange, onCheckedChange, checkable, ...rest
  } = props;
  const [expanded, setExpanded] = useControlled(controlledExpanded, defaultExpanded);
  const [checked, setChecked] = useControlled(controlledChecked, defaultChecked);

  const behavior = useTree({
    ...rest, nodes, checkable, expanded, checked,
    onExpandedChange: (keys) => {
      setExpanded(keys);
      onExpandedChange?.(keys);
    },
    onCheckedChange: (keys) => {
      setChecked(keys);
      onCheckedChange?.(keys);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      {behavior.rows.map((entry) => {
        const box = behavior.checkbox(entry);
        return (
          <div key={entry.node.key} {...toProps(behavior.row(entry))}>
            {entry.expandable ? (
              <button {...toProps(behavior.toggle(entry))}>›</button>
            ) : (
              <span className="i-tree__spacer" />
            )}
            {checkable && (
              <Checkbox
                size="s"
                checked={box.checked}
                indeterminate={box.indeterminate}
                disabled={entry.node.disabled}
                onChange={() => box.toggle()}
              />
            )}
            <span className="i-tree__label">{entry.node.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* --- Anchor ------------------------------------------------------------- */
export interface AnchorProps {
  items: AnchorItem[];
  offset?: number;
  className?: string;
}

export function Anchor({ items, offset = 80, className }: AnchorProps) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  // Scroll position, not IntersectionObserver: sections of wildly different
  // heights make observer thresholds jumpy.
  useEffect(() => {
    const update = (): void => {
      const positions = items
        .map((item) => {
          const node = document.getElementById(item.id);
          return node ? { id: item.id, top: node.getBoundingClientRect().top + window.scrollY } : null;
        })
        .filter((item): item is { id: string; top: number } => item !== null);
      setActive(activeSection(positions, window.scrollY, offset));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items, offset]);

  const behavior = useAnchor({ items, active, offset, onChange: setActive, extraClass: className });

  return (
    <nav {...toProps(behavior.root)}>
      {items.map((item) => (
        <a key={item.id} {...toProps(behavior.link(item))}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/* --- BackTop ------------------------------------------------------------ */
export function BackTop({ threshold = 240, label }: { threshold?: number; label?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = (): void => setVisible(window.scrollY > threshold);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [threshold]);

  return <button {...toProps(useBackTop({ visible, label }))}>↑</button>;
}
