'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  X,
  LayoutDashboard,
  Plus,
  FileText,
  Settings,
  HelpCircle,
  Zap,
  Clock,
  BarChart3,
} from 'lucide-react'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Analysis', href: '/dashboard/new', icon: Plus },
  { name: 'My Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'History', href: '/dashboard/history', icon: Clock },
]

const secondaryNav = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help & Support', href: '/dashboard/help', icon: HelpCircle },
]

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-r border-border z-50 lg:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-lg text-foreground">
                  Workflow<span className="gradient-text">AI</span>
                </span>
              </Link>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Main Navigation */}
            <nav className="px-3 py-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-8 px-3">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Quick Stats</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Analyses</span>
                      <span className="font-mono font-medium text-foreground">12</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time Saved</span>
                      <span className="font-mono font-medium text-success">24h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Navigation */}
              <div className="mt-8 pt-4 border-t border-border">
                <div className="space-y-1">
                  {secondaryNav.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
