import { computePosition, createId, rectOf, useMenu, type MenuItem, type Placement } from '@i-design/core';
import { cloneElement, isValidElement, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Icon } from './Icon.js';

export interface DropdownProps {
  items: MenuItem[];
  placement?: Placement;
  disabled?: boolean;
  /** `click` is the default; `hover` suits toolbar menus. */
  trigger?: 'click' | 'hover';
  children: ReactElement;
  onSelect?: (value: string, item: MenuItem) => void;
}

/**
 * The Menu model in `popup` mode, floated with the shared positioning engine —
 * so a Dropdown and a sidebar Menu agree on selection, disabled handling and
 * keyboard behaviour by construction.
 */
export function Dropdown({ items, placement = 'bottom-start', disabled, trigger = 'click', children, onSelect }: DropdownProps) {
  const { mode, density, dir } = useConfig();
  const id = useMemo(() => createId('i-dropdown'), []);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const anchor = useRef<HTMLElement>(null);
  const floating = useRef<HTMLDivElement>(null);

  const behavior = useMenu({
    items, id, mode: 'popup', expanded: [],
    onSelect: (value, item) => {
      onSelect?.(value, item);
      setOpen(false);
    },
  });

  useLayoutEffect(() => {
    if (!open || !anchor.current || !floating.current) return;
    const update = (): void => {
      const next = computePosition(rectOf(anchor.current!), rectOf(floating.current!), { placement, offset: 6 });
      setPos({ x: next.x, y: next.y });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (!anchor.current?.contains(target) && !floating.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerProps =
    trigger === 'hover'
      ? { onMouseEnter: () => !disabled && setOpen(true), onMouseLeave: () => setOpen(false) }
      : { onClick: () => !disabled && setOpen((value) => !value) };

  const anchorNode = isValidElement(children)
    ? cloneElement(children as never, {
        ref: anchor,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        ...triggerProps,
      })
    : children;

  return (
    <>
      {anchorNode}
      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={floating}
            {...toProps(behavior.root)}
            data-i-theme={mode}
            data-i-density={density}
            dir={dir}
            style={{ position: 'fixed', insetInlineStart: pos.x, insetBlockStart: pos.y, zIndex: 'var(--i-z-index-popup)' as never }}
            onMouseEnter={trigger === 'hover' ? () => setOpen(true) : undefined}
            onMouseLeave={trigger === 'hover' ? () => setOpen(false) : undefined}
          >
            {items.map((item) => (
              <button key={item.value} {...toProps(behavior.item(item, 0))}>
                <span className="i-menu__label">{item.label ?? item.value}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

export interface PopconfirmProps {
  title: ReactNode;
  status?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  placement?: Placement;
  children: ReactElement;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function Popconfirm(props: PopconfirmProps) {
  const { title, status = 'warning', confirmText = '确定', cancelText = '取消', placement = 'top', children, onConfirm, onCancel } = props;
  const { mode, density, dir } = useConfig();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const anchor = useRef<HTMLElement>(null);
  const floating = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchor.current || !floating.current) return;
    const next = computePosition(rectOf(anchor.current), rectOf(floating.current), { placement, offset: 8 });
    setPos({ x: next.x, y: next.y });
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (!anchor.current?.contains(target) && !floating.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const anchorNode = isValidElement(children)
    ? cloneElement(children as never, { ref: anchor, onClick: () => setOpen((value) => !value) })
    : children;

  return (
    <>
      {anchorNode}
      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={floating}
            className="i-popup i-popup--panel"
            role="alertdialog"
            data-i-theme={mode}
            data-i-density={density}
            dir={dir}
            style={{ insetInlineStart: pos.x, insetBlockStart: pos.y }}
          >
            <div className={`i-popconfirm i-popconfirm--${status}`}>
              <span className="i-popconfirm__icon">
                <Icon name={status === 'danger' ? 'close-circle' : status === 'info' ? 'info-circle' : 'warning-triangle'} size={16} />
              </span>
              <div className="i-popconfirm__body">
                <div>{title}</div>
                <div className="i-popconfirm__actions">
                  <button
                    className="i-button i-button--outline i-button--status-default i-button--size-s i-button--shape-rect"
                    onClick={() => { setOpen(false); onCancel?.(); }}
                  >
                    {cancelText}
                  </button>
                  <button
                    className={`i-button i-button--solid i-button--status-${status === 'danger' ? 'danger' : 'brand'} i-button--size-s i-button--shape-rect`}
                    onClick={() => { setOpen(false); onConfirm?.(); }}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
