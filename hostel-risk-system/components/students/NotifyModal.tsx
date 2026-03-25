'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { StudentRow } from './StudentTable'

interface NotifyModalProps {
  isOpen: boolean
  onClose: () => void
  student: StudentRow | null
}

export default function NotifyModal({ isOpen, onClose, student }: NotifyModalProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSendNotification = async () => {
    if (!student || !message.trim()) return
    
    setIsSending(true)
    try {
      // TODO: Implement actual notification logic here
      // This could be an API call to send email/SMS to parents
      console.log('Sending notification to parent of:', student.full_name)
      console.log('Message:', message)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Notification sent successfully!')
      setMessage('')
      onClose()
    } catch (error) {
      console.error('Failed to send notification:', error)
      alert('Failed to send notification. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setMessage('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Notify Parent">
      <div className="space-y-4">
        {student && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-warning-800">Student Information</div>
              <div className="text-warning-700 mt-1">
                <div><strong>Name:</strong> {student.full_name}</div>
                <div><strong>Roll Number:</strong> {student.roll_number}</div>
                <div><strong>Risk Level:</strong> 
                  <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-700">
                    Critical
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message to Parent
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your message to the parent about the student's critical condition..."
          />
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendNotification}
            disabled={!message.trim() || isSending}
          >
            {isSending ? 'Sending...' : 'Send Notification'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
