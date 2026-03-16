'use client'

import BehaviorForm from './BehaviorForm'
import { Database } from '@/lib/supabase/database'

interface BehaviorFormWrapperProps {
  students: Database['public']['Tables']['student']['Row'][]
  wardens: Database['public']['Tables']['warden']['Row'][]
}

export default function BehaviorFormWrapper({ students, wardens }: BehaviorFormWrapperProps) {
  const handleSubmit = async (data: Database['public']['Tables']['behavior_log']['Insert']) => {
    try {
      const response = await fetch('/api/behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create behavior log')
      }

      window.location.reload()
    } catch (error) {
      console.error('Error creating behavior log:', error)
    }
  }

  const handleCancel = () => {
    // Handle cancel logic here
  }

  return (
    <BehaviorForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      students={students}
      wardens={wardens}
    />
  )
}
