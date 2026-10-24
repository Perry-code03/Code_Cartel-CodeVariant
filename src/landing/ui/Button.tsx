import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'outline' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ className = '', variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={['landing-button', `landing-button-${variant}`, `landing-button-${size}`, className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
