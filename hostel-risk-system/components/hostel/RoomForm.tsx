'use client'

import { useState } from 'react'
import { Database } from '@/lib/supabase/database'
import Button from '@/components/ui/Button'

type Room = Database['public']['Tables']['room']['Insert']

interface RoomFormProps {
  onSubmit: (data: Room) => void
  onCancel: () => void
  floors: Database['public']['Tables']['floor']['Row'][]
  initialData?: Room
}

export default function RoomForm({ onSubmit, onCancel, floors, initialData }: RoomFormProps) {
  const [formData, setFormData] = useState<Room>({
    floor_id: initialData?.floor_id || 0,
    room_number: initialData?.room_number || '',
    capacity: initialData?.capacity || 1
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Floor</label>
        <select
          value={formData.floor_id}
          onChange={(e) => setFormData({ ...formData, floor_id: Number(e.target.value) })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Floor</option>
          {floors.map(floor => (
            <option key={floor.floor_id} value={floor.floor_id}>
              Floor {floor.floor_number} (Block {floor.block?.block_name})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Room Number</label>
        <input
          type="text"
          value={formData.room_number}
          onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="e.g., 101, 102A"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Capacity</label>
        <input
          type="number"
          min="1"
          max="10"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
          className="w-full p-2 border rounded"
          placeholder="Number of students that can be accommodated"
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {initialData ? 'Update Room' : 'Create Room'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
