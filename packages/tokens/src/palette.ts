/**
 * Primitive palettes. Ten steps per hue, following the convention popularised by
 * TDesign / Ant Design: step 1 is the lightest tint, step 10 the darkest shade,
 * step 6 is the "brand" step used by default in light mode.
 *
 * Primitives are never referenced by components directly — semantic tokens
 * (see `semantic.ts`) map them to roles, which is what makes retheming safe.
 */
export type PaletteScale = readonly [
  string, string, string, string, string,
  string, string, string, string, string,
];

export const palettes = {
  blue: [
    '#f0f6ff', '#d9e8ff', '#b5d2ff', '#8cb8ff', '#5f99fb',
    '#3778f5', '#1c5ddb', '#0f45b0', '#092f80', '#051d52',
  ],
  green: [
    '#eefaf1', '#d0f2da', '#a4e5ba', '#6fd398', '#3cbd78',
    '#1ea45f', '#15854d', '#0f663c', '#0a482a', '#062b19',
  ],
  red: [
    '#fef1f1', '#fcdcdc', '#f8b9b9', '#f28e8e', '#e96262',
    '#dc3f3f', '#bb2a2a', '#951d1d', '#6b1414', '#420c0c',
  ],
  orange: [
    '#fff6ec', '#ffe7cc', '#ffcd99', '#ffb066', '#fb933a',
    '#e97817', '#c25d0c', '#994708', '#6d3105', '#431d03',
  ],
  gray: [
    '#f7f8fa', '#eef0f4', '#e0e3ea', '#c9cedb', '#a7afc2',
    '#8089a0', '#5d6579', '#434a5c', '#2c3140', '#181c26',
  ],
} as const satisfies Record<string, PaletteScale>;

export type PaletteName = keyof typeof palettes;

/** Neutral endpoints that are not part of a scale. */
export const constants = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;
