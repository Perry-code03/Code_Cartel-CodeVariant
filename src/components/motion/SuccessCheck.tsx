import React from 'react';
import { useMotionSafe } from '@/lib/motion';

interface SuccessCheckProps {
  size?: number;
  className?: string;
}

/* Based on transitions.dev (success-check) */
export const SuccessCheck: React.FC<SuccessCheckProps> = ({ size = 48, className = '' }) => {
  const { shouldReduceMotion } = useMotionSafe();

  if (shouldReduceMotion) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        className={`text-acid ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <circle cx="26" cy="26" r="25" />
        <path d="M14.1 27.2l7.1 7.2 16.7-16.8" />
      </svg>
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        className="t-success-pop"
        fill="none"
      >
        <circle
          cx="26"
          cy="26"
          r="25"
          className="t-check-circle stroke-acid"
          strokeWidth="3"
        />
        <path
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
          className="t-check-check stroke-acid"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
