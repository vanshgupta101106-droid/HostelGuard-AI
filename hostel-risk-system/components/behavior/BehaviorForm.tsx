'use client'

import { useState } from 'react'
import { Database } from '@/lib/supabase/database'
import Button from '@/components/ui/Button'

type BehaviorLog = Database['public']['Tables']['behavior_log']['Insert']

interface BehaviorFormProps {
  onSubmit: (data: BehaviorLog) => void
  onCancel: () => void
  students: Database['public']['Tables']['student']['Row'][]
  wardens: Database['public']['Tables']['warden']['Row'][]
}

export default function BehaviorForm({ onSubmit, onCancel, students, wardens }: BehaviorFormProps) {
  const [formData, setFormData] = useState<BehaviorLog>({
    student_id: 0,
    behavior_type: '',
    severity: 'low',
    occurred_at: new Date().toISOString().split('T')[0],
    reported_by: 0,
    remarks: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Student</label>
        <select
          value={formData.student_id}
          onChange={(e) => setFormData({ ...formData, student_id: Number(e.target.value) })}
          className="input"
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
        <label className="label">Behavior Type</label>
        <input
          type="text"
          value={formData.behavior_type}
          onChange={(e) => setFormData({ ...formData, behavior_type: e.target.value })}
          className="input"
          placeholder="e.g., Late Night, Noise, Violation"
          required
        />
      </div>

      <div>
        <label className="label">Severity</label>
        <select
          value={formData.severity}
          onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'low' | 'medium' | 'high' })}
          className="input"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="label">Occurred At</label>
        <input
          type="date"
          value={formData.occurred_at}
          onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">Reported By</label>
        <select
          value={formData.reported_by}
          onChange={(e) => setFormData({ ...formData, reported_by: Number(e.target.value) })}
          className="input"
          required
        >
          <option value="">Select Warden</option>
          {wardens.map(warden => (
            <option key={warden.warden_id} value={warden.warden_id}>
              {warden.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Remarks</label>
        <textarea
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          className="input"
          rows={3}
          placeholder="Additional notes about the behavior..."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit">Log Behavior</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
