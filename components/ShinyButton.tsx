import React from 'react';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  color?: 'purple' | 'blue' | 'orange';
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({ children, className = '', color = 'purple', ...props }) => {
  const colorClasses = {
    purple: 'bg-gradient-to-br from-dpa-purple to-purple-800 hover:from-purple-800 hover:to-dpa-purple',
    blue: 'bg-gradient-to-br from-accent-blue to-blue-700 hover:from-blue-700 hover:to-accent-blue',
    orange: 'bg-gradient-to-br from-accent-orange to-orange-700 hover:from-orange-700 hover:to-accent-orange',
  };

  return (
    <button
      className={`
        px-6 py-3 rounded-xl text-white font-bold flex items-center justify-center
        shadow-plastic hover:shadow-plastic-hover transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${colorClasses[color]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
