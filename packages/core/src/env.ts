export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/** SSR-safe no-op scheduler. */
export const raf = (fn: () => void): number =>
  isBrowser ? window.requestAnimationFrame(fn) : (setTimeout(fn, 16) as unknown as number);

export const cancelRaf = (handle: number): void => {
  if (isBrowser) window.cancelAnimationFrame(handle);
  else clearTimeout(handle);
};
