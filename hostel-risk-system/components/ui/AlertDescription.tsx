import React from 'react'

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function AlertDescription({
  children,
  className = ''
}: AlertDescriptionProps) {
  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      {children}
    </div>
  )
}
