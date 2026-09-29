import type { ButtonHTMLAttributes } from 'react';

export type GameButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'filter';
export type GameButtonSize = 'small' | 'medium' | 'large' | 'icon';

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  active?: boolean;
}

export function GameButton({ variant = 'secondary', size = 'medium', active = false, className = '', type = 'button', ...props }: GameButtonProps) {
  return <button
    {...props}
    type={type}
    className={`game-button game-button-${variant} game-button-${size} ${active ? 'active' : ''} ${className}`.trim()}
  />;
}
