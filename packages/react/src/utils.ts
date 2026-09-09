import type { ElementSpec, EventName } from '@i-design/core';
import { useCallback, useRef, useState } from 'react';

const EVENT_PROP: Record<EventName, string> = {
  click: 'onClick',
  keydown: 'onKeyDown',
  keyup: 'onKeyUp',
  input: 'onInput',
  change: 'onChange',
  focus: 'onFocus',
  blur: 'onBlur',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  pointerdown: 'onPointerDown',
};

const ATTR_PROP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  maxlength: 'maxLength',
  readonly: 'readOnly',
  autocomplete: 'autoComplete',
  inputmode: 'inputMode',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
};

/**
 * Translates a framework-neutral `ElementSpec` from @i-design/core into React props.
 * This ~15-line function is the entire React "binding layer" — every behaviour,
 * class name and ARIA attribute is decided in core and shared with Vue.
 */
export function toProps(el: ElementSpec): Record<string, unknown> {
  const props: Record<string, unknown> = { className: el.class };
  for (const [key, value] of Object.entries(el.attrs)) {
    if (value === undefined) continue;
    props[ATTR_PROP[key] ?? key] = value;
  }
  for (const [name, handler] of Object.entries(el.on)) {
    if (handler) props[EVENT_PROP[name as EventName]] = handler;
  }
  return props;
}

/**
 * Controlled/uncontrolled value plumbing, matching the convention used by
 * Element Plus and Ant Design: pass `value` to control, `defaultValue` to not.
 */
export function useControlled<T>(
  controlled: T | undefined,
  defaultValue: T,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  const ref = useRef(isControlled);
  ref.current = isControlled;
  const set = useCallback((next: T) => {
    if (!ref.current) setInternal(next);
  }, []);
  return [isControlled ? (controlled as T) : internal, set];
}
