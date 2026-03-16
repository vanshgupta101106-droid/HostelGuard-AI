"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from '@/lib/supabase/client'
import LogoutButton from '@/components/auth/LogoutButton'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquareWarning,
  AlertTriangle,
  TrendingUp,
  Heart,
  Shield,
  Calculator,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/hostel", label: "Hostel Structure", icon: Building2 },
  { href: "/dashboard/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/dashboard/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/dashboard/behavior", label: "Behavior Logs", icon: Shield },
  { href: "/dashboard/wellbeing", label: "Wellbeing", icon: Heart },
  { href: "/dashboard/risk", label: "Risk Management", icon: TrendingUp },
  { href: "/dashboard/calculation", label: "Calculation", icon: Calculator },
]

export default function Sidebar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.user || null
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' && event.session?.user) {
          setUser(event.session.user)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(true)
        }
      }
    )

    // Initial load
    const loadUser = async () => {
      setLoading(true)
      const currentUser = await getSession()
      setUser(currentUser)
      setLoading(false)
    }

    loadUser()

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <aside className="hidden lg:block w-72 border-r border-border bg-card">
      <div className="sticky top-0 h-screen flex flex-col">
        <div className="px-6 py-5">
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Hostel Risk System
          </h1>
          <p className="text-sm text-muted mt-1">
            Admin Dashboard
          </p>
        </div>

        <nav className="px-3 pb-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + '/'))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
                  ${isActive
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-[1.02] border border-primary-400"
                    : "text-foreground/80 hover:bg-primary-50/70 hover:text-foreground hover:scale-[1.01] hover:shadow-sm"
                  }
                `}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full ml-[-4px]"></div>
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-muted group-hover:text-foreground'}`} />
                <span className={`${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Push user info and logout to bottom */}
        <div className="mt-auto border-t border-border">
          {/* User Info Section - Dynamic Authentication */}
          <div className="px-3 pt-6">
            {loading ? (
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-sm text-foreground/80 max-w-[220px] truncate">
                  {user.email}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-muted text-sm font-medium">
                    No User
                  </span>
                </div>
                <div className="hidden sm:block text-sm text-foreground/80 max-w-[220px] truncate">
                  Not logged in
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="px-3 pt-6 pb-6">
            <LogoutButton onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </aside>
  )
}