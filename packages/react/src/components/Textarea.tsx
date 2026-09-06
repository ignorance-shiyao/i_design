import { useTextareaBehavior, type TextareaBehaviorOptions } from '@i-design/core';
import { useEffect, useRef } from 'react';
import { toProps, useControlled } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

export interface TextareaProps
  extends Omit<TextareaBehaviorOptions, 'value' | 'onInput' | 'extraClass'> {
  value?: string;
  defaultValue?: string;
  showCount?: boolean;
  className?: string;
  onChange?: (value: string, event: unknown) => void;
  onFocus?: (event: unknown) => void;
  onBlur?: (event: unknown) => void;
}

export function Textarea(props: TextareaProps) {
  const { value: controlled, defaultValue = '', showCount, className, onChange, placeholder, autosize, ...rest } = props;
  const { locale } = useConfig();
  const [value, setValue] = useControlled(controlled, defaultValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  const behavior = useTextareaBehavior({
    ...rest, value, autosize,
    placeholder: placeholder ?? locale.input.placeholder,
    extraClass: className,
    onInput: (next, event) => {
      setValue(next);
      onChange?.(next, event);
    },
  });

  useEffect(() => {
    const el = ref.current;
    if (!autosize || !el) return;
    // Reset first: scrollHeight only shrinks once the element is allowed to.
    el.style.height = 'auto';
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.style.height = `${behavior.autosizeHeight(el.scrollHeight, lineHeight)}px`;
  }, [value, autosize, behavior]);

  return (
    <div {...toProps(behavior.root)}>
      <textarea ref={ref} {...toProps(behavior.textarea)} />
      {showCount && behavior.count && (
        <span className="i-textarea__count">
          {behavior.count.current}/{behavior.count.max}
        </span>
      )}
    </div>
  );
}

