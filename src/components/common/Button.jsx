import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow border border-blue-600 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm hover:border-slate-400 active:bg-slate-100 focus-visible:ring-slate-400',
  navy: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-900 active:bg-black focus-visible:ring-slate-700',
  outline: 'bg-transparent hover:bg-blue-50 text-blue-700 border border-blue-300 active:bg-blue-100 focus-visible:ring-blue-500',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-600 active:bg-rose-800 focus-visible:ring-rose-500',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent focus-visible:ring-slate-400',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs font-medium rounded-md gap-1.5',
  md: 'px-3.5 py-2 text-sm font-medium rounded-md gap-2',
  lg: 'px-4 py-2.5 text-base font-medium rounded-lg gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  title,
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    return <Icon className="w-4 h-4 shrink-0" />;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none ${
        isDisabled ? 'opacity-55 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        iconPosition === 'left' && renderIcon()
      )}
      <span>{children}</span>
      {!loading && iconPosition === 'right' && renderIcon()}
    </button>
  );
}
