import { createId, useSelect, type SelectOption, type SelectOptions } from '@i-design/core';
import { useMemo, useState } from 'react';
import { toProps, useControlled } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Icon } from './Icon.js';

export interface SelectProps<T extends string | number = string>
  extends Omit<SelectOptions<T>, 'value' | 'open' | 'activeIndex' | 'id' | 'onChange' | 'onOpenChange' | 'onActiveIndexChange' | 'extraClass'> {
  value?: T | null;
  defaultValue?: T | null;
  className?: string;
  onChange?: (value: T | null) => void;
}

export function Select<T extends string | number = string>(props: SelectProps<T>) {
  const { options, value: controlled, defaultValue = null, className, onChange, placeholder, ...rest } = props;
  const { locale } = useConfig();
  const id = useMemo(() => createId('i-select'), []);
  const [value, setValue] = useControlled<T | null>(controlled, defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const behavior = useSelect<T>({
    ...rest, options, id, value, open, activeIndex,
    placeholder: placeholder ?? locale.select.placeholder,
    onOpenChange: setOpen,
    onActiveIndexChange: setActiveIndex,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      <button {...toProps(behavior.trigger)}>
        <span className={`i-select__value${behavior.selectedLabel ? '' : ' i-select__value--placeholder'}`}>
          {behavior.selectedLabel ?? behavior.placeholder}
        </span>
        {behavior.clear && (
          <span {...toProps(behavior.clear)} role="button">
            <Icon name="close" size={11} />
          </span>
        )}
        <span className="i-select__arrow"><Icon name="chevron-down" size={14} /></span>
      </button>
      {open && (
        <ul {...toProps(behavior.listbox)}>
          {options.length === 0 && <li className="i-select__empty">{locale.select.empty}</li>}
          {options.map((option: SelectOption<T>, index: number) => (
            <li key={String(option.value)} {...toProps(behavior.option(option, index))}>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
