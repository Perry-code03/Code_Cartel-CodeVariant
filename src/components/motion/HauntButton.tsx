import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost } from 'lucide-react';
import { useMotionSafe } from '@/lib/motion';

interface HauntButtonProps {
  isHaunted: boolean;
  onToggle: () => void;
  className?: string;
  count?: number;
}

/* Based on transitions.dev (like-button - cyberpunk ghost variant) */
export const HauntButton: React.FC<HauntButtonProps> = ({
  isHaunted,
  onToggle,
  className = '',
  count,
}) => {
  const { shouldReduceMotion } = useMotionSafe();
  const [popping, setPopping] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
    if (!shouldReduceMotion) {
      setPopping(true);
      setTimeout(() => setPopping(false), 500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isHaunted ? 'Un-haunt project' : 'Haunt project (pin to top)'}
      title={isHaunted ? 'Haunted (pinned)' : 'Haunt this project'}
      className={`relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-violet ${
        isHaunted
          ? 'bg-violet/20 text-violet-soft border border-violet/40 hover:bg-violet/30'
          : 'bg-surface text-muted border border-border hover:text-text hover:border-muted'
      } ${className}`}
    >
      <motion.span
        animate={popping ? { scale: [1, 1.45, 0.9, 1], rotate: [0, -12, 12, 0] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className="inline-flex"
      >
        <Ghost
          size={14}
          className={isHaunted ? 'fill-violet-soft text-violet-soft filter drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]' : 'text-muted'}
        />
      </motion.span>
      {count !== undefined && <span>{count}</span>}

      {/* Floating spectral particles */}
      <AnimatePresence>
        {popping && !shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              const x = Math.cos(angle) * 20;
              const y = Math.sin(angle) * 20;
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, scale: 0.6, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 0, x, y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-violet-soft shadow-[0_0_8px_#A78BFA]"
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </button>
  );
};
