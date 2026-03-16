import React from 'react'

interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

export default function Label({
  children,
  htmlFor,
  className = ''
}: LabelProps) {
  const baseClasses =
    'text-sm font-medium text-foreground/90 leading-none peer-disabled:opacity-50 peer-disabled:cursor-not-allowed'

  return (
    <label
      htmlFor={htmlFor}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </label>
  )
}
