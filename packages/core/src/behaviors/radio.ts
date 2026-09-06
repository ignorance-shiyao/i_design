import { createBem, cx } from '../classnames.js';
import { useRoving, type Orientation } from './roving.js';
import { spec, type ElementSpec, type Size } from './types.js';

const bem = createBem('radio');

export interface RadioOption<T extends string | number = string> {
  value: T;
  label?: string;
  disabled?: boolean;
}

export interface RadioGroupOptions<T extends string | number = string> {
  options: RadioOption<T>[];
  value: T | null;
  name: string;
  orientation?: Orientation;
  size?: Size;
  disabled?: boolean;
  /** `button` renders a segmented control instead of circles. */
  variant?: 'default' | 'button';
  onChange?: (value: T) => void;
  extraClass?: string;
}

export interface RadioGroupBehavior<T extends string | number = string> {
  root: ElementSpec;
  item: (option: RadioOption<T>, index: number) => ElementSpec;
  input: (option: RadioOption<T>, index: number) => ElementSpec;
  control: ElementSpec;
  label: ElementSpec;
}

/**
 * A radio group is one tab stop with arrow-key selection — not N tab stops.
 * That behaviour comes from the shared `useRoving` engine, so Radio, Tabs and
 * Select cannot disagree about what ArrowDown does.
 */
export function useRadioGroup<T extends string | number = string>(
  options: RadioGroupOptions<T>,
): RadioGroupBehavior<T> {
  const { options: items, value, name, orientation = 'horizontal', size = 'm', disabled, variant = 'default', onChange, extraClass } = options;

  const roving = useRoving<T>({
    items: items.map((item) => ({ value: item.value, disabled: disabled || item.disabled })),
    value,
    orientation,
    mode: 'select',
    onChange: (next) => onChange?.(next),
  });

  return {
    root: spec(
      cx(bem('group'), bem('group', orientation), bem('group', variant), extraClass),
      { role: 'radiogroup' },
      { keydown: roving.onKeydown },
    ),
    item: (option, index) => {
      const inert = disabled || option.disabled;
      const checked = option.value === value;
      const base = roving.itemProps({ value: option.value, disabled: inert }, index);
      return {
        class: cx(bem(), bem(null, `size-${size}`), bem(null, variant), {
          [bem(null, 'checked')]: checked,
          [bem(null, 'disabled')]: inert,
        }),
        attrs: {},
        on: base.on,
      };
    },
    input: (option, index) => {
      const inert = disabled || option.disabled;
      const checked = option.value === value;
      const base = roving.itemProps({ value: option.value, disabled: inert }, index);
      return spec(
        bem('input'),
        {
          type: 'radio',
          name,
          value: option.value,
          checked,
          disabled: inert || undefined,
          tabindex: base.attrs.tabindex,
        },
        { change: () => !inert && onChange?.(option.value) },
      );
    },
    control: spec(bem('control'), { 'aria-hidden': true }),
    label: spec(bem('label')),
  };
}
