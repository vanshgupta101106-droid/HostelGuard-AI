import React from 'react'

interface AlertProps {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  className?: string
}

export default function Alert({
  children,
  variant = 'default',
  className = ''
}: AlertProps) {
  const baseClasses =
    'relative w-full rounded-lg border p-4 text-sm flex gap-3 items-start'

  const variantClasses = {
    default: 'bg-card border-border text-foreground',
    destructive: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700'
  }

  return (
    <div
      role="alert"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  )
}
