import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

const bem = createBem('upload');

export type UploadStatus = 'ready' | 'uploading' | 'success' | 'error';

export interface UploadFile {
  uid: string;
  name: string;
  size?: number;
  status: UploadStatus;
  /** 0–100 while uploading. */
  percent?: number;
  error?: string;
}

export interface UploadOptions {
  files: UploadFile[];
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxCount?: number;
  /** Bytes; files over the limit are rejected before any request is made. */
  maxSize?: number;
  /** `drag` renders a drop zone instead of a button trigger. */
  variant?: 'button' | 'drag';
  dragging?: boolean;
  onSelect?: (files: File[]) => void;
  onRemove?: (file: UploadFile) => void;
  onReject?: (file: File, reason: 'size' | 'count' | 'accept') => void;
  onDraggingChange?: (dragging: boolean) => void;
  extraClass?: string;
}

export interface UploadBehavior {
  root: ElementSpec;
  input: ElementSpec;
  trigger: ElementSpec;
  list: ElementSpec;
  item: (file: UploadFile) => ElementSpec;
  remove: (file: UploadFile) => ElementSpec;
  /** Applies count/size/accept limits; the adapter never re-implements them. */
  accept: (files: File[]) => { accepted: File[]; rejected: Array<{ file: File; reason: 'size' | 'count' | 'accept' }> };
  full: boolean;
}

const matchesAccept = (file: File, accept?: string): boolean => {
  if (!accept) return true;
  const patterns = accept.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (patterns.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return name.endsWith(pattern);
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
};

export function useUpload(options: UploadOptions): UploadBehavior {
  const {
    files, accept, multiple, disabled, maxCount, maxSize, variant = 'button',
    dragging, onSelect, onRemove, onReject, extraClass,
  } = options;

  const full = maxCount !== undefined && files.length >= maxCount;

  const filter: UploadBehavior['accept'] = (incoming) => {
    const accepted: File[] = [];
    const rejected: Array<{ file: File; reason: 'size' | 'count' | 'accept' }> = [];
    let room = maxCount === undefined ? Infinity : maxCount - files.length;

    for (const file of incoming) {
      if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'accept' });
      else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' });
      else if (room <= 0) rejected.push({ file, reason: 'count' });
      else {
        accepted.push(file);
        room -= 1;
      }
    }
    return { accepted, rejected };
  };

  const handleFiles = (incoming: File[]): void => {
    const { accepted, rejected } = filter(incoming);
    for (const item of rejected) onReject?.(item.file, item.reason);
    if (accepted.length > 0) onSelect?.(accepted);
  };

  const dropHandlers = {
    // `dragover` must be prevented or the browser navigates to the file.
    keydown: (event: any) => {
      if (event?.key === 'Enter' || event?.key === ' ') {
        event.preventDefault?.();
        event.currentTarget?.querySelector?.('input[type=file]')?.click?.();
      }
    },
  };

  return {
    full,
    accept: filter,
    root: spec(
      cx(bem(), bem(null, variant), {
        [bem(null, 'disabled')]: disabled,
        [bem(null, 'dragging')]: dragging,
        [bem(null, 'full')]: full,
      }, extraClass),
      variant === 'drag' ? { role: 'button', tabindex: disabled ? -1 : 0 } : {},
      variant === 'drag' ? dropHandlers : {},
    ),
    input: spec(
      bem('input'),
      { type: 'file', accept, multiple, disabled: disabled || full || undefined, tabindex: -1 },
      {
        change: (event: any) => {
          const list: File[] = Array.from(event?.target?.files ?? []);
          handleFiles(list);
          // Reset so picking the same file twice still fires a change.
          if (event?.target) event.target.value = '';
        },
      },
    ),
    trigger: spec(
      bem('trigger'),
      { type: 'button', disabled: disabled || full || undefined },
      {},
    ),
    list: spec(bem('list'), { role: 'list' }),
    item: (file) =>
      spec(cx(bem('item'), bem('item', file.status)), { role: 'listitem', 'data-status': file.status }),
    remove: (file) =>
      spec(
        bem('remove'),
        { type: 'button', 'aria-label': `remove ${file.name}` },
        { click: () => onRemove?.(file) },
      ),
  };
}

/** `1.4 MB` — shared so both adapters print sizes identically. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export const uploadDragHandlers = (
  onDraggingChange?: (dragging: boolean) => void,
  onFiles?: (files: File[]) => void,
) => ({
  dragover: (event: any) => {
    event.preventDefault?.();
    onDraggingChange?.(true);
  },
  dragleave: () => onDraggingChange?.(false),
  drop: (event: any) => {
    event.preventDefault?.();
    onDraggingChange?.(false);
    onFiles?.(Array.from(event?.dataTransfer?.files ?? []));
  },
});
