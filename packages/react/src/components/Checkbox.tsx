import { createId, useToggleBehavior, type ToggleBehaviorOptions } from '@i-design/core';
import { useMemo, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';

export interface CheckboxProps
  extends Omit<ToggleBehaviorOptions, 'kind' | 'checked' | 'onChange' | 'extraClass'> {
  checked?: boolean;
  defaultChecked?: boolean;
  className?: string;
  children?: ReactNode;
  onChange?: (checked: boolean, event: unknown) => void;
}

export function Checkbox(props: CheckboxProps) {
  const { checked: controlled, defaultChecked = false, className, children, onChange, id, ...rest } = props;
  const [checked, setChecked] = useControlled(controlled, defaultChecked);
  const autoId = useMemo(() => id ?? createId('i-checkbox'), [id]);

  const behavior = useToggleBehavior({
    ...rest,
    kind: 'checkbox',
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
      {children != null && <span {...toProps(behavior.label)}>{children}</span>}
    </label>
  );
}
