/**
 * Primitive palettes, stored as **RGB triplets** rather than hex.
 *
 * This is the single most useful idea to borrow from mature systems like Semi:
 * a triplet composes with alpha, so one hue definition drives text hierarchy,
 * borders, fills and hover states — `rgba(var(--i-grey-9), .62)` instead of a
 * separately maintained hex for every state. Dark mode then becomes a matter of
 * swapping the triplet and the alpha, not re-picking dozens of colours.
 *
 * Ten steps per hue, hand-tuned for even perceptual spacing. Step 5 is the base
 * in light mode, step 4 in dark (lighter, because it sits on a dark ground).
 */
export type PaletteScale = readonly [
  string, string, string, string, string,
  string, string, string, string, string,
];

/** `"65, 105, 239"` — usable directly inside `rgba()`. */
export type Triplet = string;

export const palettes = {
  /** Cobalt with a faint violet undertone at the deep end — the brand hue. */
  brand: [
    '240, 244, 255', '221, 231, 255', '192, 209, 255', '151, 179, 255', '107, 144, 251',
    '65, 105, 239', '47, 79, 208', '38, 62, 166', '34, 53, 130', '26, 40, 87',
  ],
  green: [
    '236, 253, 243', '209, 250, 223', '166, 244, 197', '108, 233, 166', '50, 213, 131',
    '18, 183, 106', '3, 152, 85', '2, 122, 72', '5, 96, 58', '5, 79, 49',
  ],
  red: [
    '254, 243, 242', '254, 228, 226', '254, 205, 202', '253, 162, 155', '249, 112, 102',
    '240, 68, 56', '217, 45, 32', '180, 35, 24', '145, 32, 24', '122, 39, 26',
  ],
  amber: [
    '255, 250, 235', '254, 240, 199', '254, 223, 137', '254, 200, 75', '253, 176, 34',
    '247, 144, 9', '220, 104, 3', '181, 71, 8', '147, 55, 13', '122, 46, 14',
  ],
  /** Neutrals carry a slight cool bias so they sit with the brand hue. */
  grey: [
    '246, 247, 249', '236, 238, 242', '223, 227, 233', '203, 209, 219', '164, 173, 189',
    '123, 133, 152', '90, 99, 118', '65, 73, 88', '42, 48, 60', '23, 27, 35',
  ],
} as const satisfies Record<string, PaletteScale>;

export type PaletteName = keyof typeof palettes;

/** Dark-mode surfaces are their own ramp: tinted charcoal, never pure black. */
export const darkSurfaces = {
  0: '13, 16, 21',
  1: '20, 24, 31',
  2: '27, 32, 42',
  3: '34, 40, 54',
} as const;

export const constants = {
  white: '255, 255, 255',
  black: '0, 0, 0',
} as const;

/** `rgba(var(--i-brand-5), 0.12)` */
export const alpha = (token: string, value: number): string =>
  value >= 1 ? `rgb(var(${token}))` : `rgba(var(${token}), ${value})`;

/** Emits the primitive layer: `--i-brand-5: 65, 105, 239;` etc. */
export function primitiveVars(): Record<string, string> {
  const out: Record<string, string> = {
    '--i-white': constants.white,
    '--i-black': constants.black,
  };
  for (const [name, scale] of Object.entries(palettes)) {
    scale.forEach((triplet, step) => {
      out[`--i-${name}-${step}`] = triplet;
    });
  }
  for (const [step, triplet] of Object.entries(darkSurfaces)) {
    out[`--i-surface-${step}`] = triplet;
  }
  return out;
}
