import type { ReactNode } from 'react';

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  desc: string;
}

export interface Demo {
  caption: string;
  render: () => ReactNode;
  /** Usage in each framework — the only place the two APIs are shown apart. */
  react: string;
  vue: string;
}

export interface DocEntry {
  id: string;
  name: string;
  cn: string;
  category: string;
  description: string;
  demos: Demo[];
  props?: PropRow[];
}
