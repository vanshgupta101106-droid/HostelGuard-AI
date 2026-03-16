"use client"

import { LogOut } from "lucide-react"

export default function LogoutButton() {
  return (
    <form action="/api/logout" method="post">
      <button
        type="submit"
        className="flex items-center gap-2 text-gray-700 hover:text-danger-600 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </form>
  )
}