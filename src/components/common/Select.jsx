import React from 'react';

export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  error,
  helperText,
  disabled = false,
  className = '',
  ...props
}) {
  const selectId = id || name || Math.random().toString(36).substring(7);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-sm">
        <select
          id={selectId}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-md border text-base sm:text-xs md:text-sm transition-colors duration-150 min-h-[40px] sm:min-h-[36px] py-2 pl-3 pr-8 bg-white cursor-pointer ${
            error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 text-slate-900 hover:border-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
          } ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
