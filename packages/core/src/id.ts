let counter = 0;

/**
 * Deterministic-per-mount id generator used for `aria-labelledby` / `aria-describedby`.
 * Adapters call this once per component instance (React: `useId` fallback, Vue: setup).
 */
export function createId(scope = 'i'): string {
  counter += 1;
  return `${scope}-${counter.toString(36)}`;
}

/** Test helper — resets the counter so snapshots stay stable. */
export function __resetIdCounter(): void {
  counter = 0;
}
