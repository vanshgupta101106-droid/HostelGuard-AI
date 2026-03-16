import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: string
  trendUp?: boolean
  iconColor?: string
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend,
  trendUp,
  iconColor = "text-primary-600"
}: StatsCardProps) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted mb-1">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-success-600' : 'text-danger-600'}`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-primary-50 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}