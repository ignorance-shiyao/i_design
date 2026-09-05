import { createBem, createId, lockScroll, trapFocus, useDialogBehavior, type DialogBehaviorOptions } from '@i-design/core';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Button } from './Button.js';

const bem = createBem('dialog');

export interface DialogProps extends Omit<DialogBehaviorOptions, 'titleId' | 'bodyId' | 'onClose' | 'extraClass'> {
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode | false;
  className?: string;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  onClose?: (reason: 'mask' | 'escape' | 'close-button' | 'cancel') => void;
  onConfirm?: () => void;
}

export function Dialog(props: DialogProps) {
  const { title, children, footer, className, confirmText, cancelText, confirmLoading, onClose, onConfirm, open, ...rest } = props;
  const { locale, mode, density, dir } = useConfig();
  const panelRef = useRef<HTMLDivElement>(null);
  const ids = useMemo(() => {
    const base = createId('i-dialog');
    return { title: `${base}-title`, body: `${base}-body` };
  }, []);

  const behavior = useDialogBehavior({ ...rest, open, titleId: ids.title, bodyId: ids.body, onClose, extraClass: className });

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

  const defaultFooter = (
    <>
      <Button variant="outline" onClick={() => onClose?.('cancel')}>
        {cancelText ?? locale.dialog.cancel}
      </Button>
      <Button status="brand" loading={confirmLoading} onClick={onConfirm}>
        {confirmText ?? locale.dialog.confirm}
      </Button>
    </>
  );

  return createPortal(
    // The portal escapes the provider's DOM sub-tree, so the theme attributes
    // are re-applied here — otherwise a dark app would render a light dialog.
    <div {...toProps(behavior.mask)} data-i-theme={mode} data-i-density={density} dir={dir}>
      <div ref={panelRef} {...toProps(behavior.panel)}>
        <div className={bem('header')}>
          <span id={ids.title}>{title}</span>
          <button {...toProps(behavior.closeButton)}>×</button>
        </div>
        <div className={bem('body')} id={ids.body}>
          {children}
        </div>
        {footer !== false && <div className={bem('footer')}>{footer ?? defaultFooter}</div>}
      </div>
    </div>,
    document.body,
  );
}
