import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  readOnly = false,
  className = '',
  prefix,
  suffix,
  ...props
}) {
  const inputId = id || name || Math.random().toString(36).substring(7);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs font-medium">
            {prefix}
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-md border text-base sm:text-xs md:text-sm transition-colors duration-150 min-h-[40px] sm:min-h-[36px] py-2 ${
            Icon ? 'pl-9' : prefix ? 'pl-8' : 'pl-3'
          } ${suffix ? 'pr-8' : 'pr-3'} ${
            error
              ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white'
          } ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''} ${
            readOnly ? 'bg-slate-50 cursor-default' : ''
          }`}
          {...props}
        />

        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-xs font-medium">
            {suffix}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
          <span className="font-medium">{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
