import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * GlassCard
 * A glassmorphism container that adapts between dark and light modes.
 * - Dark mode: .glass-panel-dark  (stone-900/60, backdrop-blur-xl, white/10 border, shadow-xl)
 * - Light mode: .glass-panel-light (white/60, backdrop-blur-xl, stone-200/50 border, shadow-lg)
 *
 * Usage:
 *   <GlassCard className="p-6 rounded-2xl">...</GlassCard>
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  const interactiveClasses = onClick
    ? 'cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`glass tone-glow rounded-2xl p-5 ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
