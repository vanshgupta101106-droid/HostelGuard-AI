import React, { useState } from 'react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface SelectValueProps {
  placeholder?: string
  className?: string
}

export function Select({ value, onValueChange, placeholder, children, className = '', disabled = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            value, 
            onValueChange, 
            isOpen, 
            setIsOpen,
            placeholder,
            disabled 
          } as any)
        }
        return child
      })}
    </div>
  )
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  return (
    <button className={`flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  return (
    <div className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card shadow-md ${className}`}>
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  return (
    <div className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-primary-50 focus:bg-primary-50 ${className}`}>
      {children}
    </div>
  )
}

export function SelectValue({ placeholder, className = '' }: SelectValueProps) {
  return (
    <span className={`block truncate ${className}`}>
      {placeholder}
    </span>
  )
}
