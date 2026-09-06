import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

/**
 * Colour maths for the picker — and, more usefully, for generating a whole
 * ten-step ramp from one brand hex. That is what turns "pick a colour" into
 * "retheme the library", because the token layer is built on ramps, not on
 * individual hexes.
 */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

export const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')).join('')}`;

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rn ? ((gn - bn) / d + (gn < bn ? 6 : 0))
    : max === gn ? (bn - rn) / d + 2
    : (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  if (s === 0) {
    const value = l * 255;
    return [value, value, value];
  }
  const hue = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };
  return [channel(hue + 1 / 3) * 255, channel(hue) * 255, channel(hue - 1 / 3) * 255];
}

/**
 * Ten steps from one hex, keeping its hue.
 *
 * Lightness follows a fixed curve rather than a linear ramp — evenly spaced
 * lightness reads as a muddy middle, which is why generated palettes usually
 * look worse than hand-tuned ones. Saturation dips slightly at the light end
 * and rises at the dark end, the shape hand-built ramps tend to have.
 */
const LIGHTNESS = [0.965, 0.915, 0.83, 0.72, 0.62, 0.53, 0.44, 0.36, 0.28, 0.2];
const SATURATION = [0.9, 0.95, 1, 1, 1, 1, 1.02, 1.02, 0.98, 0.9];

export function generateRamp(hex: string): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const base = rgbToHsl(...rgb);
  // Anchor on step 5, the base step the token layer uses in light mode.
  const anchor = LIGHTNESS[5]!;
  const shift = base.l - anchor;

  return LIGHTNESS.map((lightness, index) => {
    const l = Math.min(0.98, Math.max(0.06, lightness + shift * (1 - Math.abs(index - 5) / 9)));
    const s = Math.min(1, base.s * SATURATION[index]!);
    return rgbToHex(...hslToRgb({ h: base.h, s, l }));
  });
}

/** `"65, 105, 239"` for the primitive layer. */
export function hexToTriplet(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb ? rgb.join(', ') : '';
}

/* --- Picker ------------------------------------------------------------- */
const bem = createBem('color-picker');

export interface ColorPickerOptions {
  value: string;
  open?: boolean;
  presets?: string[];
  disabled?: boolean;
  /** Show the generated ten-step ramp under the picker. */
  showRamp?: boolean;
  id: string;
  onChange?: (hex: string) => void;
  onOpenChange?: (open: boolean) => void;
  extraClass?: string;
}

export function useColorPicker(options: ColorPickerOptions) {
  const { value, open = false, presets = [], disabled, showRamp, id, onChange, onOpenChange, extraClass } = options;
  const valid = hexToRgb(value) !== null;

  return {
    valid,
    ramp: showRamp && valid ? generateRamp(value) : [],
    root: spec(cx(bem(), { [bem(null, 'open')]: open, [bem(null, 'disabled')]: disabled }, extraClass)),
    trigger: spec(
      bem('trigger'),
      {
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': `${id}-panel`,
        'aria-label': `颜色 ${value}`,
        disabled: disabled || undefined,
      },
      { click: () => !disabled && onOpenChange?.(!open) },
    ),
    swatch: spec(bem('swatch'), { 'aria-hidden': true }),
    panel: spec(bem('panel'), { id: `${id}-panel`, role: 'dialog', 'aria-label': '选择颜色' }),
    /** Native colour input: the OS picker is better than anything hand-rolled. */
    native: spec(
      bem('native'),
      { type: 'color', value: valid ? value : '#000000', 'aria-label': '取色器' },
      { input: (event: any) => onChange?.(String(event?.target?.value ?? '')) },
    ),
    hex: spec(
      bem('hex'),
      { type: 'text', value, spellcheck: false, 'aria-label': '十六进制色值', 'aria-invalid': !valid || undefined },
      { input: (event: any) => onChange?.(String(event?.target?.value ?? '')) },
    ),
    preset: (hex: string): ElementSpec =>
      spec(
        cx(bem('preset'), { [bem('preset', 'active')]: hex.toLowerCase() === value.toLowerCase() }),
        { type: 'button', 'aria-label': hex, title: hex },
        { click: () => onChange?.(hex) },
      ),
    rampStep: (index: number): ElementSpec =>
      spec(bem('ramp-step'), { title: `step ${index}`, 'aria-hidden': true }),
    presets,
  };
}
