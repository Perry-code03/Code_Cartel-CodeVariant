import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMotionSafe } from '@/lib/motion';

interface TextSwapProps {
  text: string | React.ReactNode;
  className?: string;
}

/* Based on transitions.dev (text-states-swap) */
export const TextSwap: React.FC<TextSwapProps> = ({ text, className = '' }) => {
  const { shouldReduceMotion } = useMotionSafe();

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const key = typeof text === 'string' ? text : undefined;

  return (
    <div className={`relative inline-block overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={key}
          initial={{ y: -16, opacity: 0, filter: 'blur(2px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: 16, opacity: 0, filter: 'blur(2px)' }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
