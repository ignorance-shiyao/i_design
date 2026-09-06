import {
  createTransitionController, motionClass, PRESET_DURATION, stagger,
  type MotionPreset, type TransitionPhase,
} from '@i-design/core';
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

export interface TransitionProps {
  visible: boolean;
  preset?: MotionPreset;
  duration?: number;
  appear?: boolean;
  /** Keep the element mounted while hidden (useful for tab panels). */
  keepMounted?: boolean;
  className?: string;
  children: ReactNode;
  onExited?: () => void;
}

/**
 * Mount/unmount driven by the core state machine, so the phases and timings are
 * the same ones Vue's `<ITransition>` uses.
 */
export function Transition(props: TransitionProps) {
  const { visible, preset = 'fade', duration, appear, keepMounted, className, children, onExited } = props;
  const resolvedDuration = duration ?? PRESET_DURATION[preset];

  const [phase, setPhase] = useState<TransitionPhase>(visible && !appear ? 'entered' : 'exited');
  const [mounted, setMounted] = useState(visible);
  const controller = useRef<ReturnType<typeof createTransitionController>>();
  const first = useRef(true);

  useEffect(() => {
    controller.current = createTransitionController({
      visible,
      preset,
      duration: resolvedDuration,
      appear,
      onChange: (nextPhase, nextMounted) => {
        setPhase(nextPhase);
        setMounted(nextMounted);
        if (nextPhase === 'exited') onExited?.();
      },
    });
    return () => controller.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!appear) return;
    }
    controller.current?.setVisible(visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted && !keepMounted) return null;

  return (
    <div
      className={[motionClass(preset, phase), className].filter(Boolean).join(' ')}
      style={{ transitionDuration: `${resolvedDuration}ms`, display: !mounted && keepMounted ? 'none' : undefined }}
      hidden={!mounted && keepMounted}
    >
      {children}
    </div>
  );
}

export interface StaggerProps {
  preset?: MotionPreset;
  step?: number;
  className?: string;
  children: ReactElement[];
}

/** Reveals children in sequence — the one place a list should animate at all. */
export function Stagger({ preset = 'slide-up', step = 40, className, children }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={motionClass(preset, 'entered')}
          style={{ animationDelay: `${stagger(index, step)}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
