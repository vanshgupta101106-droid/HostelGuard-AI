'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { StudentFilters } from '@/lib/services/student.service'
import { getStudentFilterOptionsClient } from '@/lib/services/student.client.service'

interface StudentFiltersProps {
  filters: StudentFilters
  onFiltersChange: (filters: StudentFilters) => void
  onClearFilters: () => void
}

interface FilterOptions {
  departments: string[]
  years: number[]
  hostels: Array<{ hostel_id: number; hostel_name: string }>
}

export default function StudentFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: StudentFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    years: [],
    hostels: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const options = await getStudentFilterOptionsClient()
        setFilterOptions(options)
      } catch (error) {
        console.error('Failed to load filter options:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFilterOptions()
  }, [])

  const handleFilterChange = (key: keyof StudentFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  )

  if (isLoading) {
    return (
      <div className="card p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, roll number, or department..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Hostel Filter */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Hostel</label>
          <select
            value={filters.hostel_id || ''}
            onChange={(e) => handleFilterChange('hostel_id', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Hostels</option>
            {filterOptions.hostels.map((hostel) => (
              <option key={hostel.hostel_id} value={hostel.hostel_id}>
                {hostel.hostel_name}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Department</label>
          <select
            value={filters.department || ''}
            onChange={(e) => handleFilterChange('department', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {filterOptions.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Year</label>
          <select
            value={filters.year || ''}
            onChange={(e) => handleFilterChange('year', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Years</option>
            {filterOptions.years.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Risk Level</label>
          <select
            value={filters.risk_level || ''}
            onChange={(e) => handleFilterChange('risk_level', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              hasActiveFilters
                ? 'bg-danger-600 text-white hover:bg-danger-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <span className="text-sm text-muted">Active filters:</span>
          {filters.search && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
              Search: {filters.search}
            </span>
          )}
          {filters.hostel_id && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
              Hostel: {filterOptions.hostels.find(h => h.hostel_id === filters.hostel_id)?.hostel_name}
            </span>
          )}
          {filters.department && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
              Department: {filters.department}
            </span>
          )}
          {filters.year && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
              Year {filters.year}
            </span>
          )}
          {filters.status && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
              Status: {filters.status}
            </span>
          )}
          {filters.risk_level && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
              Risk: {filters.risk_level}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
