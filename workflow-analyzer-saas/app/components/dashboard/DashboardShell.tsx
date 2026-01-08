'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'
import MobileSidebar from './MobileSidebar'

interface DashboardShellProps {
  children: React.ReactNode
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState) {
      setIsSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Save collapsed state to localStorage
  const handleToggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Header */}
      <DashboardHeader
        user={user}
        onMenuToggle={() => setIsMobileSidebarOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isSidebarCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="pt-16 min-h-screen lg:ml-0"
        style={{
          marginLeft: 'var(--sidebar-width, 280px)',
        }}
      >
        <style jsx>{`
          @media (max-width: 1023px) {
            main {
              margin-left: 0 !important;
            }
          }
        `}</style>
        <div className="p-4 lg:p-6 xl:p-8">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
