import { createBem, createId, lockScroll, trapFocus, useDrawerBehavior, type DrawerBehaviorOptions } from '@i-design/core';
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Icon } from './Icon.js';

const bem = createBem('drawer');

export interface DrawerProps extends Omit<DrawerBehaviorOptions, 'titleId' | 'bodyId' | 'onClose' | 'extraClass'> {
  title?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
  onClose?: (reason: 'mask' | 'escape' | 'close-button') => void;
}

export function Drawer(props: DrawerProps) {
  const { title, footer, className, children, onClose, open, ...rest } = props;
  const { mode, density, dir } = useConfig();
  const panelRef = useRef<HTMLDivElement>(null);
  const ids = useMemo(() => {
    const base = createId('i-drawer');
    return { title: `${base}-title`, body: `${base}-body` };
  }, []);

  const behavior = useDrawerBehavior({ ...rest, open, titleId: ids.title, bodyId: ids.body, onClose, extraClass: className });

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const release = panelRef.current ? trapFocus(panelRef.current) : () => {};
    const onKey = behavior.onDocumentKeydown;
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      release();
      unlock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div {...toProps(behavior.mask)} data-i-theme={mode} data-i-density={density} dir={dir}>
      <div ref={panelRef} {...toProps(behavior.panel)} style={behavior.panelStyle as CSSProperties}>
        <div className={bem('header')}>
          <span id={ids.title}>{title}</span>
          <button {...toProps(behavior.closeButton)}><Icon name="close" size={16} /></button>
        </div>
        <div className={bem('body')} id={ids.body}>{children}</div>
        {footer != null && <div className={bem('footer')}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
