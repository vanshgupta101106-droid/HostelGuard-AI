'use client'

import { Database } from '@/lib/supabase/database'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type RiskTicket = Database['public']['Tables']['risk_ticket']['Row'] & {
  student: {
    full_name: string
    roll_number: string
  }
}

interface RiskTicketTableProps {
  data: RiskTicket[]
  students: Database['public']['Tables']['student']['Row'][]
}

export default function RiskTicketTable({ data, students }: RiskTicketTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    { key: 'ticket_id', label: 'Ticket ID' },
    { key: 'student.full_name', label: 'Student' },
    { key: 'student.roll_number', label: 'Roll Number' },
    { key: 'risk_score', label: 'Risk Score' },
    { key: 'reason_summary', label: 'Reason' },
    { key: 'status', label: 'Status' },
    { key: 'created_on', label: 'Created' },
    { key: 'actions', label: 'Actions' }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const rows = data.map(ticket => ({
    ...ticket,
    'student.full_name': ticket.student?.full_name || 'N/A',
    'student.roll_number': ticket.student?.roll_number || 'N/A',
    risk_score: (
      <Badge variant={ticket.risk_score >= 50 ? 'destructive' : ticket.risk_score >= 30 ? 'secondary' : 'default'}>
        {ticket.risk_score}
      </Badge>
    ),
    reason_summary: ticket.reason_summary?.substring(0, 50) + (ticket.reason_summary?.length > 50 ? '...' : ''),
    status: (
      <Badge variant={ticket.status === 'open' ? 'destructive' : ticket.status === 'resolved' ? 'default' : 'secondary'}>
        {ticket.status.replace('_', ' ').toUpperCase()}
      </Badge>
    ),
    created_on: formatDate(ticket.created_on),
    actions: (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          View Details
        </Button>
        {ticket.status === 'open' && (
          <Button size="sm">
            Assign
          </Button>
        )}
      </div>
    )
  }))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Risk Tickets</h3>
        <div className="text-sm text-gray-500">
          Total: {data.length} tickets
        </div>
      </div>
      <Table columns={columns} data={rows} />
    </div>
  )
}
