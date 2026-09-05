/** Global class prefix. Kept in one place so a consumer can fork the library cleanly. */
export const CLASS_PREFIX = 'i';

export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, unknown>
  | ClassValue[];

/** Minimal `clsx`-compatible joiner (no dependency, ~20 lines). */
export function cx(...values: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue): void => {
    if (!value && value !== 0) return;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (typeof value === 'object') {
      for (const [key, on] of Object.entries(value)) if (on) out.push(key);
    }
  };
  values.forEach(walk);
  return out.join(' ');
}

/**
 * BEM-ish class factory shared by both adapters, so a React `<Button>` and a Vue
 * `<IButton>` always emit byte-identical class names — that is what lets the two
 * packages share one stylesheet.
 *
 *   const bem = createBem('button');
 *   bem()                 -> 'i-button'
 *   bem('icon')           -> 'i-button__icon'
 *   bem(null, 'primary')  -> 'i-button--primary'
 */
export function createBem(block: string) {
  const base = `${CLASS_PREFIX}-${block}`;
  return function bem(element?: string | null, modifier?: string | null): string {
    let name = base;
    if (element) name += `__${element}`;
    if (modifier) name += `--${modifier}`;
    return name;
  };
}
