import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size, type Status } from './types.js';

/* --- AutoComplete ------------------------------------------------------- */
const acBem = createBem('autocomplete');

export interface AutoCompleteOptions {
  value: string;
  suggestions: string[];
  open?: boolean;
  activeIndex?: number;
  size?: Size;
  placeholder?: string;
  disabled?: boolean;
  id: string;
  onInput?: (value: string) => void;
  onSelect?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onActiveIndexChange?: (index: number) => void;
  extraClass?: string;
}

/** A text input that suggests, never constrains — unlike Select, any text is valid. */
export function useAutoComplete(options: AutoCompleteOptions) {
  const {
    value, suggestions, open = false, activeIndex = -1, size = 'm', placeholder,
    disabled, id, onInput, onSelect, onOpenChange, onActiveIndexChange, extraClass,
  } = options;

  const commit = (index: number): void => {
    const item = suggestions[index];
    if (item === undefined) return;
    onSelect?.(item);
    onOpenChange?.(false);
  };

  return {
    root: spec(cx(acBem(), acBem(null, `size-${size}`), { [acBem(null, 'open')]: open }, extraClass)),
    input: spec(
      acBem('input'),
      {
        type: 'text',
        role: 'combobox',
        value,
        placeholder,
        disabled,
        autocomplete: 'off',
        'aria-expanded': open,
        'aria-controls': `${id}-listbox`,
        'aria-activedescendant': open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined,
      },
      {
        input: (event: any) => {
          onInput?.(String(event?.target?.value ?? ''));
          onOpenChange?.(true);
          onActiveIndexChange?.(-1);
        },
        focus: () => suggestions.length > 0 && onOpenChange?.(true),
        blur: () => onOpenChange?.(false),
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          if (key === 'ArrowDown') {
            event.preventDefault?.();
            if (!open) return onOpenChange?.(true);
            onActiveIndexChange?.((activeIndex + 1) % Math.max(suggestions.length, 1));
          } else if (key === 'ArrowUp') {
            event.preventDefault?.();
            onActiveIndexChange?.((activeIndex - 1 + suggestions.length) % Math.max(suggestions.length, 1));
          } else if (key === 'Enter' && open && activeIndex >= 0) {
            event.preventDefault?.();
            commit(activeIndex);
          } else if (key === 'Escape') {
            onOpenChange?.(false);
          }
        },
      },
    ),
    listbox: spec(acBem('listbox'), { id: `${id}-listbox`, role: 'listbox' }),
    option: (_item: string, index: number): ElementSpec =>
      spec(
        cx(acBem('option'), { [acBem('option', 'active')]: index === activeIndex }),
        { id: `${id}-option-${index}`, role: 'option', 'aria-selected': index === activeIndex },
        {
          pointerdown: (event: any) => {
            event.preventDefault?.();
            commit(index);
          },
          mouseenter: () => onActiveIndexChange?.(index),
        },
      ),
  };
}

/* --- InputTag ----------------------------------------------------------- */
const tagInputBem = createBem('input-tag');

export interface InputTagOptions {
  tags: string[];
  draft: string;
  max?: number;
  size?: Size;
  placeholder?: string;
  disabled?: boolean;
  onTagsChange?: (tags: string[]) => void;
  onDraftChange?: (draft: string) => void;
  extraClass?: string;
}

export function useInputTag(options: InputTagOptions) {
  const { tags, draft, max, size = 'm', placeholder, disabled, onTagsChange, onDraftChange, extraClass } = options;
  const full = max !== undefined && tags.length >= max;

  const commit = (): void => {
    const text = draft.trim();
    if (text === '' || full || tags.includes(text)) return;
    onTagsChange?.([...tags, text]);
    onDraftChange?.('');
  };

  return {
    full,
    root: spec(cx(tagInputBem(), tagInputBem(null, `size-${size}`), { [tagInputBem(null, 'disabled')]: disabled }, extraClass)),
    tag: (_tag: string, index: number): ElementSpec => spec(tagInputBem('tag'), { 'data-index': index }),
    remove: (tag: string): ElementSpec =>
      spec(
        tagInputBem('remove'),
        { type: 'button', tabindex: -1, 'aria-label': `移除 ${tag}` },
        { click: () => onTagsChange?.(tags.filter((item) => item !== tag)) },
      ),
    input: spec(
      tagInputBem('input'),
      { type: 'text', value: draft, placeholder: tags.length === 0 ? placeholder : '', disabled: disabled || full || undefined },
      {
        input: (event: any) => onDraftChange?.(String(event?.target?.value ?? '')),
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          if (key === 'Enter' || key === ',') {
            if (event?.isComposing || event?.keyCode === 229) return;
            event.preventDefault?.();
            commit();
          } else if (key === 'Backspace' && draft === '' && tags.length > 0) {
            // Backspace on an empty field removes the last tag, as everyone expects.
            onTagsChange?.(tags.slice(0, -1));
          }
        },
        blur: commit,
      },
    ),
  };
}

/* --- InputOtp ----------------------------------------------------------- */
const otpBem = createBem('input-otp');

export interface OtpOptions {
  value: string;
  length?: number;
  disabled?: boolean;
  mask?: boolean;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  extraClass?: string;
}

export function useInputOtp(options: OtpOptions) {
  const { value, length = 6, disabled, mask, onChange, onComplete, extraClass } = options;

  const write = (next: string): void => {
    const digits = next.replace(/\D/g, '').slice(0, length);
    onChange?.(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return {
    root: spec(cx(otpBem(), { [otpBem(null, 'disabled')]: disabled }, extraClass), { role: 'group', 'aria-label': '验证码' }),
    cells: Array.from({ length }, (_, index) => value[index] ?? ''),
    cell: (index: number): ElementSpec =>
      spec(
        cx(otpBem('cell'), {
          [otpBem('cell', 'filled')]: Boolean(value[index]),
          [otpBem('cell', 'active')]: index === Math.min(value.length, length - 1),
        }),
        { 'aria-hidden': true, 'data-mask': mask || undefined },
      ),
    /** One real input behind the cells: paste, autofill and IME all keep working. */
    input: spec(
      otpBem('input'),
      {
        type: 'text',
        inputmode: 'numeric',
        autocomplete: 'one-time-code',
        value,
        maxlength: length,
        disabled,
        'aria-label': `${length} 位验证码`,
      },
      {
        input: (event: any) => write(String(event?.target?.value ?? '')),
        keydown: (event: any) => {
          if (event?.key === 'Backspace' && value.length > 0) {
            event.preventDefault?.();
            onChange?.(value.slice(0, -1));
          }
        },
      },
    ),
  };
}

/* --- Image with preview ------------------------------------------------- */
const imageBem = createBem('image');

export interface ImageOptions {
  src: string;
  alt?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  ratio?: string;
  preview?: boolean;
  previewOpen?: boolean;
  loaded?: boolean;
  failed?: boolean;
  zoom?: number;
  rotation?: number;
  onPreviewChange?: (open: boolean) => void;
  onZoom?: (zoom: number) => void;
  onRotate?: (rotation: number) => void;
  extraClass?: string;
}

export function useImage(options: ImageOptions) {
  const {
    src, alt = '', fit = 'cover', ratio, preview, previewOpen, loaded, failed,
    zoom = 1, rotation = 0, onPreviewChange, onZoom, onRotate, extraClass,
  } = options;

  return {
    root: spec(
      cx(imageBem(), imageBem(null, `fit-${fit}`), {
        [imageBem(null, 'loading')]: !loaded && !failed,
        [imageBem(null, 'failed')]: failed,
        [imageBem(null, 'preview')]: preview,
      }, extraClass),
    ),
    rootStyle: ratio ? { aspectRatio: ratio } : {},
    img: spec(
      imageBem('img'),
      { src, alt, loading: 'lazy', decoding: 'async' },
      preview ? { click: () => onPreviewChange?.(true) } : {},
    ),
    mask: spec(imageBem('mask'), { role: 'dialog', 'aria-modal': true, 'aria-label': alt || '图片预览' }, {
      click: (event: any) => {
        if (event?.target === event?.currentTarget) onPreviewChange?.(false);
      },
      keydown: (event: any) => {
        const key = String(event?.key ?? '');
        if (key === 'Escape') onPreviewChange?.(false);
        else if (key === '+' || key === '=') onZoom?.(Math.min(4, zoom + 0.25));
        else if (key === '-') onZoom?.(Math.max(0.25, zoom - 0.25));
        else if (key === 'r') onRotate?.((rotation + 90) % 360);
      },
    }),
    previewStyle: { transform: `scale(${zoom}) rotate(${rotation}deg)` },
    zoomIn: spec(imageBem('tool'), { type: 'button', 'aria-label': '放大' }, { click: () => onZoom?.(Math.min(4, zoom + 0.25)) }),
    zoomOut: spec(imageBem('tool'), { type: 'button', 'aria-label': '缩小' }, { click: () => onZoom?.(Math.max(0.25, zoom - 0.25)) }),
    rotate: spec(imageBem('tool'), { type: 'button', 'aria-label': '旋转' }, { click: () => onRotate?.((rotation + 90) % 360) }),
    close: spec(imageBem('tool'), { type: 'button', 'aria-label': '关闭' }, { click: () => onPreviewChange?.(false) }),
    previewOpen: Boolean(previewOpen),
  };
}

/* --- Affix -------------------------------------------------------------- */
const affixBem = createBem('affix');

export function useAffix(options: { affixed: boolean; offset?: number; height?: number; extraClass?: string }) {
  const { affixed, offset = 0, height, extraClass } = options;
  return {
    root: spec(cx(affixBem(), { [affixBem(null, 'affixed')]: affixed }, extraClass)),
    // A placeholder keeps the layout from jumping when the child goes fixed.
    placeholderStyle: affixed && height ? { height: `${height}px` } : {},
    contentStyle: affixed ? { position: 'fixed' as const, insetBlockStart: `${offset}px`, zIndex: 'var(--i-z-index-sticky)' } : {},
  };
}

/* --- Splitter ----------------------------------------------------------- */
const splitBem = createBem('splitter');

export interface SplitterOptions {
  /** Size of the first panel, as a percentage. */
  value: number;
  min?: number;
  max?: number;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  onChange?: (value: number) => void;
  extraClass?: string;
}

export function useSplitter(options: SplitterOptions) {
  const { value, min = 10, max = 90, orientation = 'horizontal', disabled, onChange, extraClass } = options;
  const clamp = (next: number): number => Math.min(max, Math.max(min, next));

  return {
    root: spec(cx(splitBem(), splitBem(null, orientation), { [splitBem(null, 'disabled')]: disabled }, extraClass)),
    first: spec(splitBem('panel')),
    firstStyle: { flexBasis: `${value}%` },
    second: spec(splitBem('panel')),
    secondStyle: { flexBasis: `${100 - value}%` },
    handle: spec(
      splitBem('handle'),
      {
        role: 'separator',
        tabindex: disabled ? -1 : 0,
        'aria-orientation': orientation === 'horizontal' ? 'vertical' : 'horizontal',
        'aria-valuenow': Math.round(value),
        'aria-valuemin': min,
        'aria-valuemax': max,
      },
      {
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          const back = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
          const forward = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
          if (key === back) { event.preventDefault?.(); onChange?.(clamp(value - 2)); }
          else if (key === forward) { event.preventDefault?.(); onChange?.(clamp(value + 2)); }
          else if (key === 'Home') { event.preventDefault?.(); onChange?.(min); }
          else if (key === 'End') { event.preventDefault?.(); onChange?.(max); }
        },
      },
    ),
    ratioAt: (ratio: number): number => clamp(ratio * 100),
  };
}

/* --- Tour --------------------------------------------------------------- */
const tourBem = createBem('tour');

export interface TourStep {
  target: string;
  title: string;
  description?: string;
}

export interface TourOptions {
  steps: TourStep[];
  current: number;
  open: boolean;
  onChange?: (index: number) => void;
  onClose?: () => void;
  extraClass?: string;
}

/** A guided walkthrough: spotlight one element at a time, with a popover beside it. */
export function useTour(options: TourOptions) {
  const { steps, current, open, onChange, onClose, extraClass } = options;
  const step = steps[current];
  const isLast = current >= steps.length - 1;

  return {
    step,
    isLast,
    progress: `${current + 1} / ${steps.length}`,
    mask: spec(cx(tourBem('mask'), { [tourBem('mask', 'open')]: open }, extraClass), { 'aria-hidden': true }),
    /** A hole punched over the target, so the highlighted element stays visible. */
    spotlightStyle: (rect: { top: number; left: number; width: number; height: number }) => ({
      insetBlockStart: `${rect.top - 6}px`,
      insetInlineStart: `${rect.left - 6}px`,
      inlineSize: `${rect.width + 12}px`,
      blockSize: `${rect.height + 12}px`,
    }),
    spotlight: spec(tourBem('spotlight'), { 'aria-hidden': true }),
    panel: spec(tourBem('panel'), { role: 'dialog', 'aria-modal': true, 'aria-label': step?.title ?? '引导' }, {
      keydown: (event: any) => {
        const key = String(event?.key ?? '');
        if (key === 'Escape') onClose?.();
        else if (key === 'ArrowRight' && !isLast) onChange?.(current + 1);
        else if (key === 'ArrowLeft' && current > 0) onChange?.(current - 1);
      },
    }),
    prev: spec(tourBem('prev'), { type: 'button', disabled: current === 0 || undefined }, { click: () => onChange?.(current - 1) }),
    next: spec(tourBem('next'), { type: 'button' }, { click: () => (isLast ? onClose?.() : onChange?.(current + 1)) }),
    skip: spec(tourBem('skip'), { type: 'button' }, { click: () => onClose?.() }),
  };
}

/* --- Small parts -------------------------------------------------------- */
const linkBem = createBem('link');

export function useLink(options: { status?: Status; underline?: 'always' | 'hover' | 'never'; disabled?: boolean; href?: string; extraClass?: string } = {}) {
  const { status = 'brand', underline = 'hover', disabled, href, extraClass } = options;
  return spec(
    cx(linkBem(), linkBem(null, `status-${status}`), linkBem(null, `underline-${underline}`), { [linkBem(null, 'disabled')]: disabled }, extraClass),
    { href: disabled ? undefined : href, 'aria-disabled': disabled || undefined, tabindex: disabled ? -1 : undefined },
  );
}

const groupBem = createBem('button-group');

export function useButtonGroup(options: { orientation?: 'horizontal' | 'vertical'; extraClass?: string } = {}) {
  const { orientation = 'horizontal', extraClass } = options;
  return spec(cx(groupBem(), groupBem(null, orientation), extraClass), { role: 'group' });
}

const pageHeaderBem = createBem('page-header');

export function usePageHeader(options: { extraClass?: string } = {}) {
  return {
    root: spec(cx(pageHeaderBem(), options.extraClass)),
    back: spec(pageHeaderBem('back'), { type: 'button', 'aria-label': '返回' }),
    title: spec(pageHeaderBem('title')),
    subtitle: spec(pageHeaderBem('subtitle')),
    extra: spec(pageHeaderBem('extra')),
    content: spec(pageHeaderBem('content')),
  };
}

const floatBem = createBem('float-button');

export function useFloatButton(options: { open?: boolean; extraClass?: string } = {}) {
  const { open, extraClass } = options;
  return {
    root: spec(cx(floatBem('group'), { [floatBem('group', 'open')]: open }, extraClass)),
    trigger: spec(floatBem(), { type: 'button', 'aria-expanded': open, 'aria-haspopup': 'menu' }),
    item: (label: string): ElementSpec =>
      spec(cx(floatBem(), floatBem(null, 'item')), { type: 'button', 'aria-label': label, title: label }),
  };
}
