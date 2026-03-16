import React from 'react'

interface TableColumn {
  key: string
  label: string
}

interface TableProps {
  columns: TableColumn[]
  data: any[]
  className?: string
  onRowClick?: (row: any, index: number) => void
}

export default function Table({ columns, data, className = '', onRowClick }: TableProps) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {data.map((row, index) => (
              <tr 
                key={index} 
                className={`transition-colors hover:bg-primary-50/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row, index)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 align-middle text-sm text-foreground whitespace-nowrap">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 text-sm text-muted">
          No data available
        </div>
      )}
    </div>
  )
}