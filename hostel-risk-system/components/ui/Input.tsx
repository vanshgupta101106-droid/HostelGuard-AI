import React from 'react'

interface InputProps {
  id?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
  disabled?: boolean
  required?: boolean
  maxLength?: number
}

export default function Input({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyPress,
  className = '',
  disabled = false,
  required = false,
  maxLength
}: InputProps) {
  const baseClasses = 'flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      className={`${baseClasses} ${className}`}
    />
  )
}
