import { createId, useRadioGroup, type RadioGroupOptions, type RadioOption } from '@i-design/core';
import { useMemo } from 'react';
import { toProps, useControlled } from '../utils.js';

export interface RadioGroupProps<T extends string | number = string>
  extends Omit<RadioGroupOptions<T>, 'value' | 'name' | 'onChange' | 'extraClass'> {
  value?: T;
  defaultValue?: T;
  name?: string;
  className?: string;
  onChange?: (value: T) => void;
}

export function RadioGroup<T extends string | number = string>(props: RadioGroupProps<T>) {
  const { options, value: controlled, defaultValue, name, className, onChange, ...rest } = props;
  const groupName = useMemo(() => name ?? createId('i-radio-group'), [name]);
  const [value, setValue] = useControlled<T | null>(controlled, defaultValue ?? null);

  const behavior = useRadioGroup<T>({
    ...rest, options, value, name: groupName,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      {options.map((option: RadioOption<T>, index: number) => (
        <label key={String(option.value)} {...toProps(behavior.item(option, index))}>
          <input {...toProps(behavior.input(option, index))} />
          <span {...toProps(behavior.control)} />
          <span {...toProps(behavior.label)}>{option.label ?? String(option.value)}</span>
        </label>
      ))}
    </div>
  );
}
