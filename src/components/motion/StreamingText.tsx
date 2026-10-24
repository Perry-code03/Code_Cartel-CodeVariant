import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useMotionSafe } from '@/lib/motion';

interface StreamingTextProps {
  text: string;
  speedMs?: number;
  className?: string;
  onComplete?: () => void;
}

/* Based on transitions.dev (free core set) */
export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  speedMs = 25,
  className = '',
  onComplete,
}) => {
  const { shouldReduceMotion } = useMotionSafe();

  // Split tokens preserving words and whitespace (including newlines and spaces)
  const tokens = useMemo(() => {
    return text.split(/(\s+)/);
  }, [text]);

  const [visibleCount, setVisibleCount] = useState(shouldReduceMotion ? tokens.length : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleCount(tokens.length);
      onComplete?.();
      return;
    }

    setVisibleCount(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= tokens.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [tokens, speedMs, shouldReduceMotion, onComplete]);

  return (
    <div className={`leading-relaxed whitespace-pre-wrap ${className}`} aria-live="polite">
      {tokens.map((token, idx) => {
        const isVisible = idx < visibleCount;

        if (shouldReduceMotion) {
          return <span key={idx}>{token}</span>;
        }

        // Whitespace tokens (newlines, spaces) are rendered directly without blurring
        if (/^\s+$/.test(token)) {
          return <span key={idx}>{token}</span>;
        }

        return (
          <motion.span
            key={idx}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={isVisible ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.15 }}
            className="inline"
          >
            {token}
          </motion.span>
        );
      })}
    </div>
  );
};
