import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

/**
 * GlassButton
 * A reusable button component with glassmorphism style.
 * Enforces 44x44px minimum touch target.
 * Includes focus ring and active state animations.
 */
const GlassButton: React.FC<GlassButtonProps> = ({
  icon,
  label,
  isActive = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`
        min-w-[44px] min-h-[44px] p-3
        rounded-2xl border shadow-xl backdrop-blur-md
        active:scale-95 transition-transform
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        flex items-center justify-center
        ${isActive
          ? 'bg-blue-500/20 border-blue-400/50'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
        }
        ${className}
      `}
      {...props}
    >
      <span className="text-white w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
        {icon}
      </span>
    </button>
  );
};

export default GlassButton;
