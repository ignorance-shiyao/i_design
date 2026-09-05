import { useInputBehavior, type InputBehaviorOptions } from '@i-design/core';
import { forwardRef, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

export interface InputProps
  extends Omit<InputBehaviorOptions, 'value' | 'onInput' | 'onClear' | 'extraClass'> {
  value?: string;
  defaultValue?: string;
  className?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  showCount?: boolean;
  onChange?: (value: string, event: unknown) => void;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    value: controlled, defaultValue = '', className, prefix, suffix, showCount,
    onChange, onClear, placeholder, ...rest
  } = props;
  const { locale } = useConfig();
  const [value, setValue] = useControlled(controlled, defaultValue);

  const behavior = useInputBehavior({
    ...rest,
    value,
    placeholder: placeholder ?? locale.input.placeholder,
    extraClass: className,
    onInput: (next, event) => {
      setValue(next);
      onChange?.(next, event);
    },
    onClear: (event) => {
      setValue('');
      onChange?.('', event);
      onClear?.();
    },
  });

  return (
    <div {...toProps(behavior.root)}>
      {prefix && <span className="i-input__prefix">{prefix}</span>}
      <input ref={ref} {...toProps(behavior.input)} />
      {showCount && behavior.count && (
        <span className="i-input__count">
          {behavior.count.current}/{behavior.count.max}
        </span>
      )}
      {behavior.clear && <button {...toProps(behavior.clear)}>×</button>}
      {suffix && <span className="i-input__suffix">{suffix}</span>}
    </div>
  );
});
