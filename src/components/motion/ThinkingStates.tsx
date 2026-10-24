import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMotionSafe } from '@/lib/motion';

interface ThinkingStatesProps {
  states?: string[];
  intervalMs?: number;
  className?: string;
}

const DEFAULT_STATES = [
  'Querying the necropolis crypt...',
  'Extracting autopsy post-mortems...',
  'Evaluating resurrection probabilities...',
  'Formulating strategic revival plan...',
];

/* Original Thinking States effect */
export const ThinkingStates: React.FC<ThinkingStatesProps> = ({
  states = DEFAULT_STATES,
  intervalMs = 1800,
  className = '',
}) => {
  const [index, setIndex] = useState(0);
  const { shouldReduceMotion } = useMotionSafe();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % states.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [states.length, intervalMs, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return <span className={`text-muted font-mono text-xs ${className}`}>{states[0]}</span>;
  }

  return (
    <div className={`relative inline-block overflow-hidden py-0.5 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
          transition={{ duration: 0.3 }}
          className="t-shimmer-text font-mono text-xs block"
        >
          {states[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
