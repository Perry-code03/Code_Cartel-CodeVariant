import { useReducedMotion } from 'motion/react';

export const MOTION = {
  duration: {
    instant: 0.05,
    fast: 0.15,
    normal: 0.25,
    page: 0.35,
    reveal: 0.5,
  },
  ease: {
    out: [0.16, 1, 0.3, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
    spring: { type: 'spring', damping: 25, stiffness: 300 } as const,
  },
};

export function useMotionSafe() {
  const shouldReduceMotion = useReducedMotion();
  return {
    shouldReduceMotion: !!shouldReduceMotion,
    transition: (type: 'fast' | 'normal' | 'page' = 'normal') => {
      if (shouldReduceMotion) {
        return { duration: 0.01 };
      }
      return {
        duration: MOTION.duration[type],
        ease: MOTION.ease.out,
      };
    },
  };
}
