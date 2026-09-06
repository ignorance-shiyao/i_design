import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

const bem = createBem('transfer');

export interface TransferItem {
  key: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface TransferOptions {
  items: TransferItem[];
  /** Keys currently on the right-hand side. */
  value: string[];
  /** Keys ticked in either panel, awaiting a move. */
  checked?: string[];
  titles?: [string, string];
  searchable?: boolean;
  search?: [string, string];
  disabled?: boolean;
  onChange?: (value: string[]) => void;
  onCheckedChange?: (checked: string[]) => void;
  onSearch?: (side: 0 | 1, keyword: string) => void;
  extraClass?: string;
}

export interface TransferPanel {
  root: ElementSpec;
  header: ElementSpec;
  selectAll: { checked: boolean; indeterminate: boolean; toggle: () => void };
  search: ElementSpec | null;
  list: ElementSpec;
  item: (item: TransferItem) => ElementSpec;
  isChecked: (item: TransferItem) => boolean;
  toggle: (item: TransferItem) => void;
  items: TransferItem[];
  count: string;
}

export interface TransferBehavior {
  root: ElementSpec;
  source: TransferPanel;
  target: TransferPanel;
  toTarget: ElementSpec;
  toSource: ElementSpec;
}

/**
 * Two lists and two buttons — but the fiddly part is that "checked" and
 * "selected" are different states: ticking an item stages it, the arrow commits
 * it. Keeping both in core is what stops the two adapters disagreeing about
 * when a tick survives a move.
 */
export function useTransfer(options: TransferOptions): TransferBehavior {
  const {
    items, value, checked = [], titles = ['源列表', '目标列表'], searchable,
    search = ['', ''], disabled, onChange, onCheckedChange, onSearch, extraClass,
  } = options;

  const valueSet = new Set(value);
  const checkedSet = new Set(checked);

  const sideItems = (side: 0 | 1): TransferItem[] => {
    const keyword = (search[side] ?? '').trim().toLowerCase();
    return items.filter((item) => {
      const onRight = valueSet.has(item.key);
      if (side === 0 ? onRight : !onRight) return false;
      return keyword === '' || item.label.toLowerCase().includes(keyword);
    });
  };

  const buildPanel = (side: 0 | 1): TransferPanel => {
    const list = sideItems(side);
    const selectable = list.filter((item) => !item.disabled && !disabled);
    const checkedHere = selectable.filter((item) => checkedSet.has(item.key));

    return {
      items: list,
      count: `${checkedHere.length}/${list.length}`,
      root: spec(cx(bem('panel'), bem('panel', side === 0 ? 'source' : 'target'))),
      header: spec(bem('header'), { 'aria-label': titles[side] }),
      selectAll: {
        checked: selectable.length > 0 && checkedHere.length === selectable.length,
        indeterminate: checkedHere.length > 0 && checkedHere.length < selectable.length,
        toggle: () => {
          const next = new Set(checkedSet);
          const all = checkedHere.length === selectable.length;
          for (const item of selectable) {
            if (all) next.delete(item.key);
            else next.add(item.key);
          }
          onCheckedChange?.([...next]);
        },
      },
      search: searchable
        ? spec(
            bem('search'),
            { type: 'search', value: search[side], placeholder: '搜索', 'aria-label': `搜索${titles[side]}` },
            { input: (event: any) => onSearch?.(side, String(event?.target?.value ?? '')) },
          )
        : null,
      list: spec(bem('list'), { role: 'listbox', 'aria-multiselectable': true, 'aria-label': titles[side] }),
      item: (item) =>
        spec(
          cx(bem('item'), {
            [bem('item', 'checked')]: checkedSet.has(item.key),
            [bem('item', 'disabled')]: item.disabled || disabled,
          }),
          {
            role: 'option',
            'aria-selected': checkedSet.has(item.key),
            'aria-disabled': item.disabled || disabled || undefined,
          },
        ),
      isChecked: (item) => checkedSet.has(item.key),
      toggle: (item) => {
        if (item.disabled || disabled) return;
        const next = new Set(checkedSet);
        if (next.has(item.key)) next.delete(item.key);
        else next.add(item.key);
        onCheckedChange?.([...next]);
      },
    };
  };

  const move = (toTarget: boolean) => (): void => {
    const moving = items.filter(
      (item) => checkedSet.has(item.key) && !item.disabled && (toTarget ? !valueSet.has(item.key) : valueSet.has(item.key)),
    );
    if (moving.length === 0) return;
    const movingKeys = new Set(moving.map((item) => item.key));

    onChange?.(
      toTarget ? [...value, ...movingKeys] : value.filter((key) => !movingKeys.has(key)),
    );
    // Ticks do not survive the move: the item has changed sides.
    onCheckedChange?.(checked.filter((key) => !movingKeys.has(key)));
  };

  const canMove = (toTarget: boolean): boolean =>
    items.some((item) => checkedSet.has(item.key) && !item.disabled && (toTarget ? !valueSet.has(item.key) : valueSet.has(item.key)));

  return {
    root: spec(cx(bem(), { [bem(null, 'disabled')]: disabled }, extraClass)),
    source: buildPanel(0),
    target: buildPanel(1),
    toTarget: spec(
      cx(bem('move'), { [bem('move', 'disabled')]: !canMove(true) }),
      { type: 'button', 'aria-label': '移到右侧', disabled: !canMove(true) || undefined },
      { click: move(true) },
    ),
    toSource: spec(
      cx(bem('move'), { [bem('move', 'disabled')]: !canMove(false) }),
      { type: 'button', 'aria-label': '移到左侧', disabled: !canMove(false) || undefined },
      { click: move(false) },
    ),
  };
}
