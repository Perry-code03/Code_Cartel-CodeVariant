import React from 'react';
import { useMotionSafe } from '@/lib/motion';

interface MatrixLoaderProps {
  className?: string;
}

/* Original Matrix Dot Loader effect (4x4 pulsing grid) */
export const MatrixLoader: React.FC<MatrixLoaderProps> = ({ className = '' }) => {
  const { shouldReduceMotion } = useMotionSafe();

  return (
    <div
      className={`inline-grid grid-cols-4 gap-1 p-1 bg-surface-2 border border-border rounded ${className}`}
      aria-label="Loading matrix computation"
      role="status"
    >
      {[...Array(16)].map((_, i) => {
        // Compute rhythmic wave delays across rows and diagonals
        const row = Math.floor(i / 4);
        const col = i % 4;
        const delay = ((row + col) * 0.12).toFixed(2);

        return (
          <span
            key={i}
            className="t-matrix-dot"
            style={
              shouldReduceMotion
                ? undefined
                : { animationDelay: `${delay}s` }
            }
          />
        );
      })}
    </div>
  );
};
