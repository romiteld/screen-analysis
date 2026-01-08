'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  User,
  Settings,
  LogOut,
  CreditCard,
  HelpCircle,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DashboardHeaderProps {
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  onMenuToggle: () => void
  isSidebarCollapsed: boolean
}

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    breadcrumbs.push({ name, href: path })
  }

  return breadcrumbs
}

export default function DashboardHeader({ user, onMenuToggle, isSidebarCollapsed }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const breadcrumbs = getBreadcrumbs(pathname)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 transition-all duration-300 ${
        isSidebarCollapsed ? 'left-20' : 'left-[280px]'
      } lg:left-auto ${
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'
      }`}
      style={{ width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)' }}
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b border-border">
        {/* Left Section - Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-foreground">{crumb.name}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.button>
          )}

          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-popover rounded-xl shadow-xl border border-border overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Analysis Complete</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Your workflow analysis is ready</p>
                          <p className="text-xs text-muted-foreground mt-1">2 min ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Payment Successful</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Your payment was processed</p>
                          <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-border">
                    <button className="w-full text-center text-sm text-primary hover:underline">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</p>
              </div>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-popover rounded-xl shadow-xl border border-border overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-border">
                    <p className="font-medium text-foreground">{displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      Billing
                    </Link>
                    <Link
                      href="/dashboard/help"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      Help & Support
                    </Link>
                  </div>
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-destructive/10 transition-colors text-sm text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
