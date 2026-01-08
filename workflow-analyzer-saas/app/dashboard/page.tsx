'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Plus,
  ArrowRight,
  BarChart3,
  Zap,
  Filter,
  Search,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Calendar,
  Timer,
} from 'lucide-react'
import { format } from 'date-fns'

interface Upload {
  id: string
  video_filename: string
  seconds: number
  status: string
  analysis_status: string
  created_at: string
  analyses?: {
    id: string
    status: string
    completed_at: string | null
  }[]
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    label: 'Analysis Complete',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    pulse: false,
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/20',
    pulse: true,
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    pulse: false,
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    pulse: true,
  },
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-muted" />
        <div className="w-20 h-6 rounded-full bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="h-3 bg-muted rounded w-24" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    </div>
  )
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-full flex flex-col items-center justify-center py-16 px-8 bg-card rounded-2xl border border-dashed border-border"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
        <Video className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-display font-semibold text-foreground mb-2">
        No analyses yet
      </h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Upload your first screen recording and let our AI identify automation opportunities in your workflow
      </p>
      <motion.button
        onClick={onUpload}
        className="flex items-center gap-2 px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-5 h-5" />
        Upload Your First Video
      </motion.button>
    </motion.div>
  )
}

function AnalysisCard({ upload, onView }: { upload: Upload; onView: () => void }) {
  const status = upload.analyses?.[0]?.status || upload.analysis_status || 'pending'
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = config.icon
  const isCompleted = status === 'completed'

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group bg-card rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
            {config.pulse && (
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.bgColor.replace('/10', '')}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${config.bgColor.replace('/10', '')}`} />
              </span>
            )}
            <StatusIcon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
            {config.label}
          </div>
        </div>

        {/* Title & Details */}
        <h3 className="font-display font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
          {upload.video_filename || 'Untitled Video'}
        </h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Timer className="w-4 h-4" />
            {formatDuration(upload.seconds)}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {format(new Date(upload.created_at), 'MMM dd')}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
        {upload.status === 'paid' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        )}

        {!upload.status && <div />}

        {isCompleted ? (
          <motion.button
            onClick={onView}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            View Report
          </motion.button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {status === 'processing' ? 'Analyzing...' : 'Awaiting analysis'}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    } else {
      setUser(user)
      await loadUploads(user.id)
    }
  }

  const loadUploads = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          analyses (
            id,
            status,
            completed_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading uploads:', error)
      } else {
        setUploads(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAnalysis = (uploadId: string) => {
    router.push(`/dashboard/analysis/${uploadId}`)
  }

  const filteredUploads = uploads.filter((upload) => {
    const matchesSearch = upload.video_filename
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
    const status = upload.analyses?.[0]?.status || upload.analysis_status || 'pending'
    const matchesFilter = filterStatus === 'all' || status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: uploads.length,
    completed: uploads.filter((u) => (u.analyses?.[0]?.status || u.analysis_status) === 'completed').length,
    processing: uploads.filter((u) => (u.analyses?.[0]?.status || u.analysis_status) === 'processing').length,
    totalDuration: uploads.reduce((acc, u) => acc + (u.seconds || 0), 0),
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your workflow analyses
          </p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Total Analyses', value: stats.total, icon: BarChart3, color: 'primary' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'success' },
          { label: 'In Progress', value: stats.processing, icon: Loader2, color: 'info' },
          { label: 'Total Duration', value: `${Math.round(stats.totalDuration / 60)}m`, icon: Clock, color: 'warning' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-12 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
          </select>
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        </div>

        {/* New Analysis Button */}
        <motion.button
          onClick={() => router.push('/dashboard/new')}
          className="flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>New Analysis</span>
        </motion.button>
      </motion.div>

      {/* Analyses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredUploads.length === 0 ? (
          searchQuery || filterStatus !== 'all' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No analyses match your search criteria</p>
            </motion.div>
          ) : (
            <EmptyState onUpload={() => router.push('/dashboard/new')} />
          )
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredUploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <AnalysisCard
                  upload={upload}
                  onView={() => handleViewAnalysis(upload.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-2">
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                Upload clear screen recordings showing your complete workflow
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                Longer videos provide more detailed automation insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                Download PDF reports to share with your team
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
