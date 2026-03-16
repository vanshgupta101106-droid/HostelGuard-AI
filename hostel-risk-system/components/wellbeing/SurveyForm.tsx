'use client'

import React, { useState } from 'react'
import { Database } from '@/lib/supabase/database'
import Button from '@/components/ui/Button'

type WellbeingSurvey = Database['public']['Tables']['wellbeing_survey']['Insert']

interface SurveyFormProps {
  action: (data: WellbeingSurvey) => Promise<{ success: boolean; error?: string }>
  students: Database['public']['Tables']['student']['Row'][]
}

export default function SurveyForm({ action, students }: SurveyFormProps) {
  const [formData, setFormData] = useState<WellbeingSurvey>({
    student_id: '',
    stress_level: 5,
    mood: 'neutral',
    submitted_week: Math.ceil(new Date().getDate() / 7)
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const result = await action(formData)
    
    if (result.success) {
      setMessage('Survey submitted successfully!')
      setFormData({
        student_id: 0,
        stress_level: 5,
        mood: 'neutral',
        submitted_week: Math.ceil(new Date().getDate() / 7)
      })
    } else {
      setMessage(result.error || 'Failed to submit survey')
    }
    
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Student</label>
        <select
          value={formData.student_id}
          onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Student</option>
          {students.map(student => (
            <option key={student.student_id} value={student.student_id}>
              {student.full_name} ({student.roll_number})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stress Level (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.stress_level}
          onChange={(e) => setFormData({ ...formData, stress_level: Number(e.target.value) })}
          className="w-full"
        />
        <div className="text-center text-lg font-semibold">{formData.stress_level}</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mood</label>
        <select
          value={formData.mood}
          onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="very-happy">Very Happy</option>
          <option value="happy">Happy</option>
          <option value="neutral">Neutral</option>
          <option value="sad">Sad</option>
          <option value="very-sad">Very Sad</option>
          <option value="anxious">Anxious</option>
          <option value="stressed">Stressed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Week</label>
        <input
          type="number"
          min="1"
          max="52"
          value={formData.submitted_week}
          onChange={(e) => setFormData({ ...formData, submitted_week: Number(e.target.value) })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Survey'}
        </Button>
      </div>
      
      {message && (
        <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </form>
  )
}
