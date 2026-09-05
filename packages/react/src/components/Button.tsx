import { useButtonBehavior, type ButtonBehaviorOptions } from '@i-design/core';
import { forwardRef, type ReactNode } from 'react';
import { toProps } from '../utils.js';

export interface ButtonProps
  extends Omit<ButtonBehaviorOptions, 'onClick' | 'extraClass'>,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'className'> {
  className?: string;
  icon?: ReactNode;
  suffixIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    variant, status, size, block, disabled, loading, shape, href, type,
    className, icon, suffixIcon, children, onClick, ...rest
  } = props;

  const behavior = useButtonBehavior({
    variant, status, size, block, disabled, loading, shape, href, type,
    onClick: onClick as ButtonBehaviorOptions['onClick'],
    extraClass: className,
  });

  const Tag = behavior.tag as 'button';
  return (
    <Tag ref={ref as never} {...rest} {...toProps(behavior.root)}>
      {behavior.showSpinner ? <span className="i-button__spinner" /> : icon}
      {children != null && <span className="i-button__content">{children}</span>}
      {suffixIcon}
    </Tag>
  );
});
