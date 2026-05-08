// src/components/Button.tsx
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

const Button = ({
  variant = 'primary',
  icon = null,
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/80 focus:ring-primary shadow-sm',
    outline: 'border border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 focus:ring-white/50',
    ghost: 'bg-transparent text-white hover:bg-white/10'
  };
  
  // Check if className includes rounded-full
  const isRoundedFull = className.includes('rounded-full');
  const roundedClass = isRoundedFull ? 'rounded-full' : 'rounded-md';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${roundedClass} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;