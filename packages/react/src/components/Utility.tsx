import {
  useAffix, useButtonGroup, useFloatButton, useImage, useLink, usePageHeader,
  useSplitter, useTour, type IconName, type TourStep,
} from '@i-design/core';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toProps } from '../utils.js';
import { Icon } from './Icon.js';

/* --- Image -------------------------------------------------------------- */
export interface ImageProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  ratio?: string;
  preview?: boolean;
  className?: string;
}

export function Image(props: ImageProps) {
  const { src, alt, width, height, className, preview, ...rest } = props;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const behavior = useImage({
    ...rest, src, alt, preview, loaded, failed, zoom, rotation,
    previewOpen: open,
    onPreviewChange: (next) => {
      setOpen(next);
      if (!next) {
        setZoom(1);
        setRotation(0);
      }
    },
    onZoom: setZoom,
    onRotate: setRotation,
    extraClass: className,
  });

  // The overlay owns the keyboard while open, so Escape and zoom keys work
  // without the trigger having to keep focus.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => behavior.mask.on.keydown?.(event);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, behavior]);

  return (
    <>
      <span
        {...toProps(behavior.root)}
        style={{ ...(behavior.rootStyle as CSSProperties), width, height }}
      >
        <img
          {...toProps(behavior.img)}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </span>

      {open && typeof document !== 'undefined' &&
        createPortal(
          <div {...toProps(behavior.mask)}>
            <img src={src} alt={alt ?? ''} className="i-image__preview" style={behavior.previewStyle as CSSProperties} />
            <div className="i-image__tools">
              <button {...toProps(behavior.zoomOut)}><Icon name="minus" size={16} /></button>
              <button {...toProps(behavior.zoomIn)}><Icon name="plus" size={16} /></button>
              <button {...toProps(behavior.rotate)}><Icon name="refresh" size={16} /></button>
              <button {...toProps(behavior.close)}><Icon name="close" size={16} /></button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* --- Affix -------------------------------------------------------------- */
export function Affix({ offset = 0, children, className }: { offset?: number; children?: ReactNode; className?: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const [affixed, setAffixed] = useState(false);
  const [size, setSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    const update = (): void => {
      const node = holder.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (!affixed) setSize({ height: rect.height, width: rect.width });
      setAffixed(rect.top <= offset && !affixed ? true : node.getBoundingClientRect().top <= offset);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [offset, affixed]);

  const behavior = useAffix({ affixed, offset, height: size.height, extraClass: className });

  return (
    <div ref={holder} {...toProps(behavior.root)} style={behavior.placeholderStyle as CSSProperties}>
      <div style={{ ...(behavior.contentStyle as CSSProperties), width: affixed ? size.width : undefined }}>
        {children}
      </div>
    </div>
  );
}

/* --- Splitter ----------------------------------------------------------- */
export interface SplitterProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: [ReactNode, ReactNode];
  onChange?: (value: number) => void;
}

export function Splitter(props: SplitterProps) {
  const { value: controlled, defaultValue = 50, className, style, children, onChange, ...rest } = props;
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled ?? internal;
  const root = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const set = (next: number): void => {
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
  };

  const behavior = useSplitter({ ...rest, value, onChange: set, extraClass: className });

  const seek = (clientX: number, clientY: number): void => {
    const node = root.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const ratio = rest.orientation === 'vertical'
      ? (clientY - rect.top) / rect.height
      : (clientX - rect.left) / rect.width;
    set(behavior.ratioAt(ratio));
  };

  return (
    <div ref={root} {...toProps(behavior.root)} style={style}>
      <div {...toProps(behavior.first)} style={behavior.firstStyle as CSSProperties}>{children[0]}</div>
      <div
        {...toProps(behavior.handle)}
        onPointerDown={(event) => {
          dragging.current = true;
          (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => dragging.current && seek(event.clientX, event.clientY)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      />
      <div {...toProps(behavior.second)} style={behavior.secondStyle as CSSProperties}>{children[1]}</div>
    </div>
  );
}

/* --- Tour --------------------------------------------------------------- */
export interface TourProps {
  steps: TourStep[];
  open: boolean;
  current?: number;
  onChange?: (index: number) => void;
  onClose?: () => void;
}

export function Tour({ steps, open, current: controlled, onChange, onClose }: TourProps) {
  const [internal, setInternal] = useState(0);
  const current = controlled ?? internal;
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const setCurrent = (next: number): void => {
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
  };

  const behavior = useTour({ steps, current, open, onChange: setCurrent, onClose });

  useLayoutEffect(() => {
    if (!open || !behavior.step) return;
    const target = document.querySelector(behavior.step.target);
    if (!target) return setRect(null);
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const measure = (): void => {
      const box = target.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    measure();
    const timer = setTimeout(measure, 320);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [open, current, behavior.step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => behavior.panel.on.keydown?.(event);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, behavior]);

  if (!open || !behavior.step || typeof document === 'undefined') return null;

  const panelTop = rect ? Math.min(rect.top + rect.height + 12, window.innerHeight - 200) : 120;
  const panelLeft = rect ? Math.min(Math.max(12, rect.left), window.innerWidth - 300) : 24;

  return createPortal(
    <>
      {rect ? (
        <div {...toProps(behavior.spotlight)} style={behavior.spotlightStyle(rect) as CSSProperties} />
      ) : (
        <div {...toProps(behavior.mask)} />
      )}
      <div {...toProps(behavior.panel)} style={{ insetBlockStart: panelTop, insetInlineStart: panelLeft }}>
        <div className="i-tour__title">{behavior.step.title}</div>
        {behavior.step.description && <div className="i-tour__desc">{behavior.step.description}</div>}
        <div className="i-tour__footer">
          <span className="i-tour__progress">{behavior.progress}</span>
          <span style={{ display: 'inline-flex', gap: 4 }}>
            <button {...toProps(behavior.skip)}>跳过</button>
            <button {...toProps(behavior.prev)}>上一步</button>
            <button {...toProps(behavior.next)}>{behavior.isLast ? '完成' : '下一步'}</button>
          </span>
        </div>
      </div>
    </>,
    document.body,
  );
}

/* --- Small parts -------------------------------------------------------- */
export interface LinkProps {
  href?: string;
  status?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  underline?: 'always' | 'hover' | 'never';
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function Link({ className, children, onClick, ...rest }: LinkProps) {
  return (
    <a {...toProps(useLink({ ...rest, extraClass: className }))} onClick={onClick}>
      {children}
    </a>
  );
}

export function ButtonGroup({ orientation, className, children }: { orientation?: 'horizontal' | 'vertical'; className?: string; children?: ReactNode }) {
  return <div {...toProps(useButtonGroup({ orientation, extraClass: className }))}>{children}</div>;
}

export interface PageHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  onBack?: () => void;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, extra, onBack, className, children }: PageHeaderProps) {
  const behavior = usePageHeader({ extraClass: className });
  return (
    <div {...toProps(behavior.root)}>
      <div className="i-page-header__row">
        {onBack && (
          <button {...toProps(behavior.back)} onClick={onBack}>
            <Icon name="arrow-left" size={16} />
          </button>
        )}
        <span {...toProps(behavior.title)}>{title}</span>
        {subtitle && <span {...toProps(behavior.subtitle)}>{subtitle}</span>}
        {extra && <span {...toProps(behavior.extra)}>{extra}</span>}
      </div>
      {children && <div {...toProps(behavior.content)}>{children}</div>}
    </div>
  );
}

export interface FloatButtonProps {
  icon?: IconName;
  items?: Array<{ icon: IconName; label: string; onClick?: () => void }>;
  onClick?: () => void;
}

export function FloatButton({ icon = 'plus', items, onClick }: FloatButtonProps) {
  const [open, setOpen] = useState(false);
  const behavior = useFloatButton({ open });

  if (!items?.length) {
    return (
      <div {...toProps(behavior.root)}>
        <button {...toProps(behavior.trigger)} onClick={onClick}>
          <Icon name={icon} size={18} />
        </button>
      </div>
    );
  }

  return (
    <div {...toProps(behavior.root)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {items.map((item) => (
        <button key={item.label} {...toProps(behavior.item(item.label))} onClick={item.onClick}>
          <Icon name={item.icon} size={16} />
        </button>
      ))}
      <button {...toProps(behavior.trigger)} onClick={() => setOpen((value) => !value)}>
        <Icon name={icon} size={18} />
      </button>
    </div>
  );
}
