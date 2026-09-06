import { CLASS_PREFIX } from './classnames.js';

/**
 * Motion in i-design is a *state machine plus class names*, not a framework
 * feature: core decides which phase an element is in and what class it carries,
 * and each adapter only mounts/unmounts. That is why a Vue `<ITransition>` and a
 * React `<Transition>` animate identically, and why neither ships a tween loop.
 */
export type TransitionPhase = 'exited' | 'enter' | 'entered' | 'exit';

export type MotionPreset =
  | 'fade'
  | 'scale'
  | 'slide-up'
  | 'slide-down'
  | 'slide-start'
  | 'slide-end'
  | 'collapse';

export interface TransitionOptions {
  preset?: MotionPreset;
  /** ms; should match the CSS duration for the preset. */
  duration?: number;
  /** Animate the first appearance too. Off by default, like Vue's `appear`. */
  appear?: boolean;
}

/** The class an element carries in a given phase, e.g. `i-motion-fade--enter`. */
export function motionClass(preset: MotionPreset, phase: TransitionPhase): string {
  const base = `${CLASS_PREFIX}-motion-${preset}`;
  return phase === 'entered' ? base : `${base} ${base}--${phase}`;
}

export interface TransitionController {
  phase: TransitionPhase;
  /** True while the element must stay in the DOM (including during exit). */
  mounted: boolean;
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}

/**
 * Drives the phase sequence with real timers so both adapters get identical
 * timing. `enter` is applied for one frame before `entered`, which is what makes
 * the CSS transition run instead of snapping.
 */
export function createTransitionController(
  options: TransitionOptions & { visible: boolean; onChange: (phase: TransitionPhase, mounted: boolean) => void },
): TransitionController {
  const { duration = 220, appear = false, visible, onChange } = options;

  let phase: TransitionPhase = visible && !appear ? 'entered' : 'exited';
  let mounted = visible;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame: ReturnType<typeof setTimeout> | undefined;

  const set = (nextPhase: TransitionPhase, nextMounted: boolean): void => {
    phase = nextPhase;
    mounted = nextMounted;
    controller.phase = nextPhase;
    controller.mounted = nextMounted;
    onChange(nextPhase, nextMounted);
  };

  const clear = (): void => {
    if (timer) clearTimeout(timer);
    if (frame) clearTimeout(frame);
    timer = frame = undefined;
  };

  const controller: TransitionController = {
    phase,
    mounted,
    setVisible(next: boolean) {
      clear();
      if (next) {
        set('enter', true);
        // One frame in the `enter` state, so the browser has a "from" to animate.
        frame = setTimeout(() => set('entered', true), 16);
        return;
      }
      if (!mounted) return;
      set('exit', true);
      timer = setTimeout(() => set('exited', false), duration);
    },
    destroy: clear,
  };

  if (visible && appear) controller.setVisible(true);
  return controller;
}

/** Delay for the nth item of a staggered group, capped so long lists stay snappy. */
export function stagger(index: number, step = 40, max = 240): number {
  return Math.min(index * step, max);
}

export const PRESET_DURATION: Record<MotionPreset, number> = {
  fade: 220,
  scale: 220,
  'slide-up': 260,
  'slide-down': 260,
  'slide-start': 260,
  'slide-end': 260,
  collapse: 260,
};
