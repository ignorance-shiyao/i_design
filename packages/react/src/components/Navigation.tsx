import {
  createId, useBreadcrumb, useCollapse, usePagination, useSteps, useTabs,
  type BreadcrumbItem, type CollapseItem, type PaginationOptions, type StepItem, type TabItem, type TabsOptions,
} from '@i-design/core';
import { useMemo, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';

export interface TabsProps extends Omit<TabsOptions, 'value' | 'id' | 'onChange' | 'onFocusChange' | 'extraClass'> {
  value?: string;
  defaultValue?: string;
  className?: string;
  onChange?: (value: string) => void;
  /** Panel content per tab value. Tabs render only the active panel. */
  children?: (item: TabItem) => ReactNode;
}

export function Tabs({ items, value: controlled, defaultValue, className, onChange, children, ...rest }: TabsProps) {
  const id = useMemo(() => createId('i-tabs'), []);
  const [value, setValue] = useControlled(controlled, defaultValue ?? items[0]?.value ?? '');
  const behavior = useTabs({
    ...rest, items, id, value,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });
  const active = items.find((item) => item.value === value);
  // A tab strip used purely as a control (a toolbar switch) has no panel at all;
  // rendering an empty one would add a stray tab stop.
  const panel = active ? children?.(active) : null;

  return (
    <div {...toProps(behavior.root)}>
      <div {...toProps(behavior.list)}>
        {items.map((item, index) => (
          <button key={item.value} {...toProps(behavior.tab(item, index))}>
            {item.label ?? item.value}
          </button>
        ))}
      </div>
      {active && panel != null && <div {...toProps(behavior.panel(active.value))}>{panel}</div>}
    </div>
  );
}

export interface CollapseProps {
  items: CollapseItem[];
  value?: string[];
  defaultValue?: string[];
  accordion?: boolean;
  className?: string;
  onChange?: (value: string[]) => void;
  children?: (item: CollapseItem) => ReactNode;
}

export function Collapse({ items, value: controlled, defaultValue = [], accordion, className, onChange, children }: CollapseProps) {
  const id = useMemo(() => createId('i-collapse'), []);
  const [value, setValue] = useControlled(controlled, defaultValue);
  const behavior = useCollapse({
    items, value, accordion, id,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      {items.map((item) => (
        <div key={item.value} {...toProps(behavior.item(item))}>
          <button {...toProps(behavior.trigger(item))}>
            <span>{item.header ?? item.value}</span>
            <span {...toProps(behavior.arrow)}>▶</span>
          </button>
          <div {...toProps(behavior.panel(item))}>{children?.(item)}</div>
        </div>
      ))}
    </div>
  );
}

export interface PaginationProps extends Omit<PaginationOptions, 'current' | 'onChange' | 'extraClass'> {
  current?: number;
  defaultCurrent?: number;
  className?: string;
  onChange?: (page: number) => void;
}

export function Pagination({ current: controlled, defaultCurrent = 1, className, onChange, ...rest }: PaginationProps) {
  const [current, setCurrent] = useControlled(controlled, defaultCurrent);
  const behavior = usePagination({
    ...rest, current,
    onChange: (page) => {
      setCurrent(page);
      onChange?.(page);
    },
    extraClass: className,
  });

  return (
    <nav {...toProps(behavior.root)}>
      <button {...toProps(behavior.prev)}>‹</button>
      {behavior.pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span key={`gap-${index}`} {...toProps(behavior.ellipsis)}>···</span>
        ) : (
          <button key={page} {...toProps(behavior.page(page))}>{page}</button>
        ),
      )}
      <button {...toProps(behavior.next)}>›</button>
    </nav>
  );
}

export interface StepsProps {
  items: StepItem[];
  current: number;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function Steps({ items, current, direction, className }: StepsProps) {
  const behavior = useSteps({ items, current, direction, extraClass: className });
  return (
    <div {...toProps(behavior.root)}>
      {items.map((item, index) => {
        const status = behavior.statusOf(item, index);
        return (
          <div key={item.title} {...toProps(behavior.item(item, index))}>
            <span {...toProps(behavior.indicator)}>
              {status === 'finish' ? '✓' : status === 'error' ? '!' : index + 1}
            </span>
            <div className="i-steps__content">
              <div {...toProps(behavior.title)}>{item.title}</div>
              {item.description && <div {...toProps(behavior.description)}>{item.description}</div>}
            </div>
            {index < items.length - 1 && <span {...toProps(behavior.tail)} />}
          </div>
        );
      })}
    </div>
  );
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

export function Breadcrumb({ items, separator = '/', className }: BreadcrumbProps) {
  const behavior = useBreadcrumb({ items, extraClass: className });
  return (
    <nav {...toProps(behavior.root)}>
      <ol {...toProps(behavior.list)}>
        {items.map((item, index) => (
          <li key={item.label} {...toProps(behavior.item(item, index))}>
            <a {...toProps(behavior.link(item, index))}>{item.label}</a>
            {index < items.length - 1 && <span {...toProps(behavior.separator)}>{separator}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

