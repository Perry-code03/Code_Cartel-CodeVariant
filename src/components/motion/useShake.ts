import { useState, useCallback } from 'react';
import { useMotionSafe } from '@/lib/motion';

/* Based on transitions.dev (error-state-shake) */
export function useShake(durationMs: number = 400) {
  const [isShaking, setIsShaking] = useState(false);
  const { shouldReduceMotion } = useMotionSafe();

  const triggerShake = useCallback(() => {
    if (shouldReduceMotion) return;
    setIsShaking(true);
    const timer = setTimeout(() => {
      setIsShaking(false);
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, shouldReduceMotion]);

  return {
    isShaking,
    shakeClass: isShaking ? 't-error-shake ring-2 ring-danger' : '',
    triggerShake,
  };
}
