import { createId, useToggleBehavior, type ToggleBehaviorOptions } from '@i-design/core';
import { useMemo, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';

export interface SwitchProps
  extends Omit<ToggleBehaviorOptions, 'kind' | 'checked' | 'onChange' | 'extraClass' | 'indeterminate'> {
  checked?: boolean;
  defaultChecked?: boolean;
  className?: string;
  label?: ReactNode;
  onChange?: (checked: boolean, event: unknown) => void;
}

export function Switch(props: SwitchProps) {
  const { checked: controlled, defaultChecked = false, className, label, onChange, id, ...rest } = props;
  const [checked, setChecked] = useControlled(controlled, defaultChecked);
  const autoId = useMemo(() => id ?? createId('i-switch'), [id]);

  const behavior = useToggleBehavior({
    ...rest,
    kind: 'switch',
    id: autoId,
    checked,
    extraClass: className,
    onChange: (next, event) => {
      setChecked(next);
      onChange?.(next, event);
    },
  });

  return (
    <label {...toProps(behavior.root)} htmlFor={autoId}>
      <input {...toProps(behavior.input)} />
      <span {...toProps(behavior.control)} />
      {label != null && <span {...toProps(behavior.label)}>{label}</span>}
    </label>
  );
}
