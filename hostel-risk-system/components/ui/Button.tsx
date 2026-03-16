import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md', 
  className = '',
  type = 'button',
  disabled = false
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:translate-y-[0.5px]'
  
  const variantClasses = {
    default: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
    outline: 'border border-border bg-card text-foreground/90 shadow-sm hover:bg-primary-50',
    secondary: 'bg-primary-50 text-foreground shadow-sm hover:bg-primary-100',
    ghost: 'text-foreground/80 hover:bg-primary-50',
    destructive: 'bg-danger-600 text-white shadow-sm hover:brightness-95'
  }
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}