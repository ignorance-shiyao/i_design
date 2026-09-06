/** Canonical size scale. Every control accepts exactly these three. */
export type Size = 's' | 'm' | 'l';

/** Visual weight, shared by Button / Tag / Alert. */
export type Variant = 'solid' | 'outline' | 'soft' | 'text';

/** Semantic intent, mapped to the status tokens. */
export type Status = 'default' | 'brand' | 'success' | 'warning' | 'danger';

export type DomEvent = { preventDefault(): void; stopPropagation(): void; [key: string]: unknown };

export type EventName =
  | 'click' | 'keydown' | 'keyup' | 'input' | 'change'
  | 'focus' | 'blur' | 'mouseenter' | 'mouseleave' | 'pointerdown';

export type AttrValue = string | number | boolean | undefined;

/**
 * The framework-neutral description of one rendered element.
 *
 * A behaviour returns these; the React adapter spreads `attrs` and maps `on.click`
 * to `onClick`, the Vue adapter maps it to `onClick` in a `h()` call. All logic,
 * ARIA wiring and class names therefore live exactly once, in this package.
 */
export interface ElementSpec {
  class: string;
  attrs: Record<string, AttrValue>;
  on: Partial<Record<EventName, (event: any) => void>>;
}

export const spec = (
  className: string,
  attrs: Record<string, AttrValue> = {},
  on: ElementSpec['on'] = {},
): ElementSpec => {
  // A raw `style` string is the one attribute that is NOT portable: Vue accepts
  // it, React throws. Behaviours must return style as a separate object (see
  // `useRow`/`useCol`/`useTable`), so catch the mistake where it is made.
  if (typeof attrs.style === 'string') {
    throw new Error(
      `[i-design] ElementSpec "${className}" carries a raw style string. ` +
        'Return styles as a separate object instead — a style string is not portable to React.',
    );
  }
  return { class: className, attrs, on };
};
