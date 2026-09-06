import { createBem, cx } from '../classnames.js';
import { pageRange, useRoving, type Orientation } from './roving.js';
import { spec, type ElementSpec, type Size } from './types.js';

/* --- Tabs --------------------------------------------------------------- */
const tabsBem = createBem('tabs');

export interface TabItem {
  value: string;
  label?: string;
  disabled?: boolean;
}

export interface TabsOptions {
  items: TabItem[];
  value: string | null;
  orientation?: Orientation;
  variant?: 'line' | 'card' | 'segment';
  size?: Size;
  /** Base id for the `tab`/`tabpanel` `aria-controls` pairing. */
  id: string;
  onChange?: (value: string) => void;
  onFocusChange?: (index: number) => void;
  extraClass?: string;
}

export function useTabs(options: TabsOptions) {
  const { items, value, orientation = 'horizontal', variant = 'line', size = 'm', id, onChange, onFocusChange, extraClass } = options;
  const roving = useRoving({ items, value, orientation, mode: 'select', onChange, onFocusChange });

  return {
    activeIndex: roving.activeIndex,
    root: spec(cx(tabsBem(), tabsBem(null, variant), tabsBem(null, orientation), tabsBem(null, `size-${size}`), extraClass)),
    list: spec(tabsBem('list'), { role: 'tablist', 'aria-orientation': orientation }, { keydown: roving.onKeydown }),
    tab: (item: TabItem, index: number): ElementSpec => {
      const base = roving.itemProps(item, index);
      const selected = item.value === value;
      return {
        class: cx(tabsBem('tab'), { [tabsBem('tab', 'active')]: selected, [tabsBem('tab', 'disabled')]: item.disabled }),
        attrs: {
          ...base.attrs,
          role: 'tab',
          type: 'button',
          id: `${id}-tab-${item.value}`,
          'aria-selected': selected,
          'aria-controls': `${id}-panel-${item.value}`,
          disabled: item.disabled || undefined,
        },
        on: base.on,
      };
    },
    panel: (itemValue: string): ElementSpec =>
      spec(tabsBem('panel'), {
        role: 'tabpanel',
        id: `${id}-panel-${itemValue}`,
        'aria-labelledby': `${id}-tab-${itemValue}`,
        tabindex: 0,
      }),
  };
}

/* --- Collapse ----------------------------------------------------------- */
const collapseBem = createBem('collapse');

export interface CollapseItem {
  value: string;
  header?: string;
  disabled?: boolean;
}

export interface CollapseOptions {
  items: CollapseItem[];
  /** Open panel values. Pass one value with `accordion` to get exclusive opening. */
  value: string[];
  accordion?: boolean;
  id: string;
  onChange?: (value: string[]) => void;
  extraClass?: string;
}

export function useCollapse(options: CollapseOptions) {
  const { value, accordion, id, onChange, extraClass } = options;

  const toggle = (item: CollapseItem): void => {
    if (item.disabled) return;
    const isOpen = value.includes(item.value);
    if (accordion) {
      onChange?.(isOpen ? [] : [item.value]);
      return;
    }
    onChange?.(isOpen ? value.filter((v) => v !== item.value) : [...value, item.value]);
  };

  return {
    root: spec(cx(collapseBem(), extraClass)),
    isOpen: (item: CollapseItem) => value.includes(item.value),
    item: (item: CollapseItem): ElementSpec =>
      spec(cx(collapseBem('item'), { [collapseBem('item', 'open')]: value.includes(item.value) })),
    trigger: (item: CollapseItem): ElementSpec =>
      spec(
        cx(collapseBem('trigger'), { [collapseBem('trigger', 'disabled')]: item.disabled }),
        {
          type: 'button',
          id: `${id}-trigger-${item.value}`,
          'aria-expanded': value.includes(item.value),
          'aria-controls': `${id}-panel-${item.value}`,
          disabled: item.disabled || undefined,
        },
        { click: () => toggle(item) },
      ),
    panel: (item: CollapseItem): ElementSpec =>
      spec(collapseBem('panel'), {
        id: `${id}-panel-${item.value}`,
        role: 'region',
        'aria-labelledby': `${id}-trigger-${item.value}`,
        hidden: !value.includes(item.value) || undefined,
      }),
    arrow: spec(collapseBem('arrow'), { 'aria-hidden': true }),
  };
}

/* --- Pagination --------------------------------------------------------- */
const pagerBem = createBem('pagination');

export interface PaginationOptions {
  current: number;
  total: number;
  pageSize?: number;
  siblings?: number;
  size?: Size;
  disabled?: boolean;
  onChange?: (page: number) => void;
  extraClass?: string;
}

export function usePagination(options: PaginationOptions) {
  const { current, total, pageSize = 10, siblings = 1, size = 'm', disabled, onChange, extraClass } = options;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedCurrent = Math.min(Math.max(1, current), pageCount);
  const pages = pageRange({ current: clampedCurrent, total: pageCount, siblings });

  const goTo = (page: number) => () => {
    if (disabled) return;
    const next = Math.min(Math.max(1, page), pageCount);
    if (next !== clampedCurrent) onChange?.(next);
  };

  const navButton = (page: number, label: string, inert: boolean): ElementSpec =>
    spec(
      cx(pagerBem('item'), pagerBem('item', 'nav'), { [pagerBem('item', 'disabled')]: inert }),
      { type: 'button', 'aria-label': label, disabled: inert || undefined },
      { click: goTo(page) },
    );

  return {
    pages,
    pageCount,
    current: clampedCurrent,
    root: spec(cx(pagerBem(), pagerBem(null, `size-${size}`), extraClass), { role: 'navigation', 'aria-label': 'pagination' }),
    prev: navButton(clampedCurrent - 1, 'previous page', disabled || clampedCurrent <= 1),
    next: navButton(clampedCurrent + 1, 'next page', disabled || clampedCurrent >= pageCount),
    page: (page: number): ElementSpec =>
      spec(
        cx(pagerBem('item'), { [pagerBem('item', 'active')]: page === clampedCurrent }),
        {
          type: 'button',
          'aria-label': `page ${page}`,
          'aria-current': page === clampedCurrent ? 'page' : undefined,
          disabled: disabled || undefined,
        },
        { click: goTo(page) },
      ),
    ellipsis: spec(cx(pagerBem('item'), pagerBem('item', 'ellipsis')), { 'aria-hidden': true }),
  };
}

/* --- Steps -------------------------------------------------------------- */
const stepsBem = createBem('steps');

export interface StepItem {
  title: string;
  description?: string;
  status?: 'wait' | 'process' | 'finish' | 'error';
}

export function useSteps(options: { items: StepItem[]; current: number; direction?: Orientation; extraClass?: string }) {
  const { current, direction = 'horizontal', extraClass } = options;
  const statusOf = (item: StepItem, index: number): NonNullable<StepItem['status']> =>
    item.status ?? (index < current ? 'finish' : index === current ? 'process' : 'wait');

  return {
    statusOf,
    root: spec(cx(stepsBem(), stepsBem(null, direction), extraClass), { role: 'list' }),
    item: (item: StepItem, index: number): ElementSpec =>
      spec(cx(stepsBem('item'), stepsBem('item', statusOf(item, index))), {
        role: 'listitem',
        'aria-current': index === current ? 'step' : undefined,
      }),
    indicator: spec(stepsBem('indicator'), { 'aria-hidden': true }),
    title: spec(stepsBem('title')),
    description: spec(stepsBem('description')),
    tail: spec(stepsBem('tail'), { 'aria-hidden': true }),
  };
}

/* --- Breadcrumb --------------------------------------------------------- */
const crumbBem = createBem('breadcrumb');

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function useBreadcrumb(options: { items: BreadcrumbItem[]; extraClass?: string }) {
  const { items, extraClass } = options;
  return {
    root: spec(cx(crumbBem(), extraClass), { 'aria-label': 'breadcrumb' }),
    list: spec(crumbBem('list')),
    item: (_item: BreadcrumbItem, index: number): ElementSpec =>
      spec(crumbBem('item'), { 'aria-current': index === items.length - 1 ? 'page' : undefined }),
    link: (item: BreadcrumbItem, index: number): ElementSpec =>
      spec(cx(crumbBem('link'), { [crumbBem('link', 'current')]: index === items.length - 1 }), {
        href: index === items.length - 1 ? undefined : item.href,
      }),
    separator: spec(crumbBem('separator'), { 'aria-hidden': true }),
  };
}
