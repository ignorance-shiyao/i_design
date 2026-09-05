import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size } from './types.js';

const bem = createBem('select');

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectOptions<T extends string | number = string> {
  options: SelectOption<T>[];
  value: T | null;
  open: boolean;
  /** Index of the visually highlighted option (keyboard cursor), not the selection. */
  activeIndex: number;
  id: string;
  size?: Size;
  status?: 'default' | 'success' | 'warning' | 'danger';
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChange?: (value: T | null) => void;
  onActiveIndexChange?: (index: number) => void;
  extraClass?: string;
}

export interface SelectBehavior<T extends string | number = string> {
  root: ElementSpec;
  trigger: ElementSpec;
  listbox: ElementSpec;
  option: (option: SelectOption<T>, index: number) => ElementSpec;
  clear: ElementSpec | null;
  selectedLabel: string | null;
  /** Text shown when nothing is selected. */
  placeholder: string;
}

/**
 * Combobox behaviour per WAI-ARIA: the trigger owns the listbox, keeps focus, and
 * points at the highlighted option with `aria-activedescendant`. Typing a printable
 * character jumps to the first option starting with it, like a native `<select>`.
 */
export function useSelect<T extends string | number = string>(
  options: SelectOptions<T>,
): SelectBehavior<T> {
  const {
    options: items, value, open, activeIndex, id, size = 'm', status = 'default',
    placeholder = '', disabled, clearable, onOpenChange, onChange, onActiveIndexChange, extraClass,
  } = options;

  const selected = items.find((item) => item.value === value) ?? null;
  const enabledIndexes = items.map((item, index) => (item.disabled ? -1 : index)).filter((index) => index >= 0);

  const moveTo = (index: number): void => {
    if (index >= 0) onActiveIndexChange?.(index);
  };

  const step = (delta: number): void => {
    if (enabledIndexes.length === 0) return;
    const position = enabledIndexes.indexOf(activeIndex);
    const next = position === -1 ? 0 : (position + delta + enabledIndexes.length) % enabledIndexes.length;
    moveTo(enabledIndexes[next]!);
  };

  const commit = (index: number): void => {
    const item = items[index];
    if (!item || item.disabled) return;
    onChange?.(item.value);
    onOpenChange?.(false);
  };

  const onKeydown = (event: any): void => {
    if (disabled) return;
    const key = String(event?.key ?? '');

    if (!open && (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ')) {
      event.preventDefault?.();
      onOpenChange?.(true);
      moveTo(items.findIndex((item) => item.value === value) >= 0
        ? items.findIndex((item) => item.value === value)
        : (enabledIndexes[0] ?? -1));
      return;
    }
    if (!open) return;

    if (key === 'ArrowDown') { event.preventDefault?.(); step(1); return; }
    if (key === 'ArrowUp') { event.preventDefault?.(); step(-1); return; }
    if (key === 'Home') { event.preventDefault?.(); moveTo(enabledIndexes[0] ?? -1); return; }
    if (key === 'End') { event.preventDefault?.(); moveTo(enabledIndexes[enabledIndexes.length - 1] ?? -1); return; }
    if (key === 'Enter' || key === ' ') { event.preventDefault?.(); commit(activeIndex); return; }
    if (key === 'Escape' || key === 'Tab') { onOpenChange?.(false); return; }

    if (key.length === 1) {
      const needle = key.toLowerCase();
      const match = items.findIndex((item) => !item.disabled && item.label.toLowerCase().startsWith(needle));
      if (match >= 0) moveTo(match);
    }
  };

  return {
    selectedLabel: selected?.label ?? null,
    placeholder,
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
        'aria-haspopup': 'listbox',
        'aria-expanded': open,
        'aria-controls': `${id}-listbox`,
        'aria-activedescendant': open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined,
        'aria-invalid': status === 'danger' || undefined,
        disabled: disabled || undefined,
      },
      {
        click: () => !disabled && onOpenChange?.(!open),
        keydown: onKeydown,
        blur: () => open && onOpenChange?.(false),
      },
    ),
    listbox: spec(bem('listbox'), { id: `${id}-listbox`, role: 'listbox', tabindex: -1 }),
    option: (option, index) =>
      spec(
        cx(bem('option'), {
          [bem('option', 'selected')]: option.value === value,
          [bem('option', 'active')]: index === activeIndex,
          [bem('option', 'disabled')]: option.disabled,
        }),
        {
          id: `${id}-option-${index}`,
          role: 'option',
          'aria-selected': option.value === value,
          'aria-disabled': option.disabled || undefined,
        },
        {
          // `pointerdown` rather than `click`: the trigger's blur would close the
          // list before a click ever lands.
          pointerdown: (event: any) => {
            event.preventDefault?.();
            commit(index);
          },
          mouseenter: () => !option.disabled && moveTo(index),
        },
      ),
    clear:
      clearable && selected && !disabled
        ? spec(
            bem('clear'),
            { type: 'button', tabindex: -1, 'aria-label': 'clear' },
            {
              pointerdown: (event: any) => {
                event.preventDefault?.();
                event.stopPropagation?.();
                onChange?.(null);
              },
            },
          )
        : null,
  };
}
