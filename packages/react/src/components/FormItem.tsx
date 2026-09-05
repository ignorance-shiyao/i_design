import { createBem, createId, cx } from '@i-design/core';
import { Children, cloneElement, isValidElement, useMemo, type ReactElement, type ReactNode } from 'react';

const bem = createBem('form-item');

export interface FormItemProps {
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Wires `label -> control -> help/error` with real `for`/`aria-describedby`,
 * so validation messages are announced instead of just being coloured red.
 */
export function FormItem(props: FormItemProps) {
  const { label, help, error, required, htmlFor, className, children } = props;
  const generated = useMemo(() => createId('i-field'), []);
  const controlId = htmlFor ?? generated;
  const helpId = `${controlId}-help`;
  const message = error ?? help;

  const child = Children.only(children) as ReactElement<{ id?: string; describedBy?: string }>;
  const enhanced = isValidElement(child)
    ? cloneElement(child, {
        id: child.props.id ?? controlId,
        describedBy: message ? helpId : undefined,
      })
    : child;

  return (
    <div className={cx(bem(), { [bem(null, 'error')]: !!error }, className)}>
      {label != null && (
        <label className={cx(bem('label'), { [bem('label', 'required')]: required })} htmlFor={controlId}>
          {label}
        </label>
      )}
      {enhanced}
      {message != null && (
        <div className={bem('help')} id={helpId} role={error ? 'alert' : undefined}>
          {message}
        </div>
      )}
    </div>
  );
}
