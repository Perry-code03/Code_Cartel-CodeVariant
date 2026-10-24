import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useMotionSafe } from '@/lib/motion';

interface StreamingTextProps {
  text: string;
  speedMs?: number;
  className?: string;
  onComplete?: () => void;
}

/* Original Streaming Text effect (words resolve via soft blur crossfade) */
export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  speedMs = 35,
  className = '',
  onComplete,
}) => {
  const { shouldReduceMotion } = useMotionSafe();
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(shouldReduceMotion ? words.length : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleCount(words.length);
      onComplete?.();
      return;
    }

    setVisibleCount(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= words.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, speedMs, shouldReduceMotion, words.length, onComplete]);

  return (
    <div className={`leading-relaxed ${className}`} aria-live="polite">
      {words.map((word, idx) => {
        const isVisible = idx < visibleCount;

        if (shouldReduceMotion) {
          return (
            <span key={idx}>
              {word}{' '}
            </span>
          );
        }

        return (
          <motion.span
            key={idx}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={isVisible ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
            className="inline-block mr-1"
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
};
