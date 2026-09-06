import {
  formatBytes, uploadDragHandlers, useInputNumber, useRate, useSlider, useUpload,
  type NumberBehaviorOptions, type RateOptions, type SliderOptions, type UploadFile, type UploadOptions,
} from '@i-design/core';
import { useRef, useState, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';
import { Progress } from './Display.js';
import { Icon } from './Icon.js';

/* --- InputNumber -------------------------------------------------------- */
export interface InputNumberProps extends Omit<NumberBehaviorOptions, 'value' | 'onChange' | 'extraClass'> {
  value?: number | null;
  defaultValue?: number | null;
  className?: string;
  onChange?: (value: number | null) => void;
}

export function InputNumber(props: InputNumberProps) {
  const { value: controlled, defaultValue = null, className, onChange, controls = 'stack', ...rest } = props;
  const [value, setValue] = useControlled<number | null>(controlled, defaultValue);

  const behavior = useInputNumber({
    ...rest, controls, value,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      {controls === 'side' && <button {...toProps(behavior.decrease)}><Icon name="minus" size={14} /></button>}
      <input {...toProps(behavior.input)} />
      {controls === 'stack' && (
        <span className="i-input-number__steps">
          <button {...toProps(behavior.increase)}><Icon name="caret-up" size={9} /></button>
          <button {...toProps(behavior.decrease)}><Icon name="caret-down" size={9} /></button>
        </span>
      )}
      {controls === 'side' && <button {...toProps(behavior.increase)}><Icon name="plus" size={14} /></button>}
    </div>
  );
}

/* --- Slider ------------------------------------------------------------- */
export interface SliderProps extends Omit<SliderOptions, 'value' | 'onChange' | 'extraClass'> {
  value?: number;
  defaultValue?: number;
  className?: string;
  onChange?: (value: number) => void;
}

export function Slider(props: SliderProps) {
  const { value: controlled, defaultValue = 0, className, onChange, marks, ...rest } = props;
  const [value, setValue] = useControlled(controlled, defaultValue);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const behavior = useSlider({
    ...rest, marks, value,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  const seek = (clientX: number, clientY: number): void => {
    const node = track.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const ratio = rest.orientation === 'vertical'
      ? 1 - (clientY - rect.top) / rect.height
      : (clientX - rect.left) / rect.width;
    const next = behavior.valueAt(ratio);
    setValue(next);
    onChange?.(next);
  };

  return (
    <div {...toProps(behavior.root)}>
      <div
        ref={track}
        {...toProps(behavior.track)}
        onPointerDown={(event) => {
          dragging.current = true;
          (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
          seek(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => dragging.current && seek(event.clientX, event.clientY)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div {...toProps(behavior.fill)} style={{ inlineSize: `${behavior.percent}%` }} />
        <div
          {...toProps(behavior.handle)}
          style={{ insetInlineStart: `${behavior.percent}%` }}
          title={behavior.text}
        />
      </div>
      {marks && marks.length > 0 && (
        <div className="i-slider__marks">
          {marks.map((mark) => (
            <button
              key={mark.value}
              {...toProps(behavior.mark(mark))}
              style={{ insetInlineStart: `${behavior.percentOf(mark.value)}%` }}
            >
              {mark.label ?? mark.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Rate --------------------------------------------------------------- */
export interface RateProps extends Omit<RateOptions, 'value' | 'onChange' | 'extraClass'> {
  value?: number;
  defaultValue?: number;
  className?: string;
  character?: ReactNode;
  onChange?: (value: number) => void;
}

export function Rate(props: RateProps) {
  const { value: controlled, defaultValue = 0, className, character = '★', onChange, count = 5, ...rest } = props;
  const [value, setValue] = useControlled(controlled, defaultValue);

  const behavior = useRate({
    ...rest, count, value,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} {...toProps(behavior.item(index + 1))}>
          {character}
        </span>
      ))}
    </div>
  );
}

/* --- Upload ------------------------------------------------------------- */
export interface UploadProps extends Omit<UploadOptions, 'files' | 'dragging' | 'onDraggingChange' | 'extraClass'> {
  files: UploadFile[];
  className?: string;
  hint?: ReactNode;
  children?: ReactNode;
}

export function Upload(props: UploadProps) {
  const { files, className, hint, children, variant = 'button', onSelect, ...rest } = props;
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const behavior = useUpload({
    ...rest, files, variant, dragging, onSelect,
    extraClass: className,
  });

  const drop = uploadDragHandlers(setDragging, (incoming) => {
    const { accepted, rejected } = behavior.accept(incoming);
    for (const item of rejected) rest.onReject?.(item.file, item.reason);
    if (accepted.length > 0) onSelect?.(accepted);
  });

  return (
    <div className="i-upload">
      <div
        {...toProps(behavior.root)}
        onDragOver={drop.dragover}
        onDragLeave={drop.dragleave}
        onDrop={drop.drop}
        onClick={variant === 'drag' ? () => input.current?.click() : undefined}
      >
        <input ref={input} {...toProps(behavior.input)} />
        {variant === 'drag' ? (
          <>
            <div>{children ?? '点击或拖拽文件到此处'}</div>
            {hint && <div className="i-upload__hint">{hint}</div>}
          </>
        ) : (
          <button {...toProps(behavior.trigger)} onClick={() => input.current?.click()}>
            {children ?? '选择文件'}
          </button>
        )}
      </div>

      {files.length > 0 && (
        <ul {...toProps(behavior.list)}>
          {files.map((file) => (
            <li key={file.uid} {...toProps(behavior.item(file))}>
              <span className="i-upload__name">{file.name}</span>
              {file.status === 'uploading' ? (
                <span className="i-upload__progress">
                  <Progress value={file.percent ?? 0} size="s" showLabel={false} />
                </span>
              ) : (
                <span className="i-upload__size">{file.size ? formatBytes(file.size) : ''}</span>
              )}
              <span className="i-upload__status">
                {file.status === 'success' ? <Icon name="check" size={13} /> : file.status === 'error' ? <Icon name="warning-triangle" size={13} /> : null}
              </span>
              <button {...toProps(behavior.remove(file))}><Icon name="close" size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

