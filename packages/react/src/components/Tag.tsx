import { createBem, cx, type Size, type Status } from '@i-design/core';
import type { ReactNode } from 'react';

const bem = createBem('tag');

export interface TagProps {
  variant?: 'solid' | 'outline' | 'soft';
  status?: Status;
  size?: Extract<Size, 's' | 'm'>;
  round?: boolean;
  closable?: boolean;
  className?: string;
  children?: ReactNode;
  onClose?: (event: unknown) => void;
}

export function Tag(props: TagProps) {
  const { variant = 'soft', status = 'default', size = 's', round, closable, className, children, onClose } = props;
  return (
    <span
      className={cx(bem(), bem(null, variant), bem(null, `status-${status}`), bem(null, `size-${size}`), { [bem(null, 'round')]: round }, className)}
    >
      {children}
      {closable && (
        <button className={bem('close')} type="button" aria-label="close" onClick={onClose}>
          ×
        </button>
      )}
    </span>
  );
}
