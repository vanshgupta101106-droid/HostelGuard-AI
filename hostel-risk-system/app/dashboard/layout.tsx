import Sidebar from "@/components/dashboard/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 py-6">
            <div className="page-container">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}