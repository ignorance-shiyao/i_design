import {
  computePosition, createId, cx, rectOf, usePopupBehavior,
  type Placement,
} from '@i-design/core';
import { cloneElement, isValidElement, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

export interface TooltipProps {
  content: ReactNode;
  placement?: Placement;
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  open?: boolean;
  disabled?: boolean;
  offset?: number;
  /** `panel` renders a light popover surface instead of the dark tooltip bubble. */
  appearance?: 'tooltip' | 'panel';
  children: ReactElement;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip(props: TooltipProps) {
  const { content, placement = 'top', trigger = 'hover', open: controlled, disabled, offset = 8, appearance = 'tooltip', children, onOpenChange } = props;
  const { mode, density, dir } = useConfig();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ?? internalOpen;
  const id = useMemo(() => createId('i-popup'), []);
  const anchorRef = useRef<HTMLElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const behavior = usePopupBehavior({
    open, id, trigger, disabled,
    onOpenChange: (next) => {
      if (controlled === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !floatingRef.current) return;
    const update = () => {
      const next = computePosition(rectOf(anchorRef.current!), rectOf(floatingRef.current!), { placement, offset });
      setPos({ x: next.x, y: next.y });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, placement, offset]);

  const anchorProps = toProps(behavior.anchor);
  const trigger_ = isValidElement(children)
    ? cloneElement(children as never, { ...anchorProps, ref: anchorRef, className: cx((children.props as { className?: string }).className, 'i-popup__anchor') })
    : children;

  return (
    <>
      {trigger_}
      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={floatingRef}
            {...toProps(behavior.content)}
            className={cx(behavior.content.class, appearance === 'panel' && 'i-popup--panel')}
            data-i-theme={mode}
            data-i-density={density}
            dir={dir}
            style={{ insetInlineStart: pos.x, insetBlockStart: pos.y }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
