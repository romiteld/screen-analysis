'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Loader2,
  Download,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Film,
  Brain,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Mail,
  Link2,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Play,
  Layers,
  Settings,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { format } from 'date-fns'

interface AnalysisResult {
  analysis: string
  metadata: {
    frames_analyzed: number
    timestamps: number[]
    model: string
    analysis_date: string
  }
  workflow_summary: {
    total_steps: number
    has_errors: boolean
    tools_mentioned: string[]
    key_sections: string[]
  }
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 1500
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="font-mono font-bold">
      {count}{suffix}
    </span>
  )
}

// Expandable Section Component
function ExpandableSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-6 border-t border-border pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const uploadId = params.id as string

  const [loading, setLoading] = useState(true)
  const [upload, setUpload] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (uploadId) {
      loadAnalysisData()
    }
  }, [uploadId])

  const loadAnalysisData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: uploadData, error: uploadError } = await supabase
        .from('uploads')
        .select('*, analyses(*)')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .single()

      if (uploadError || !uploadData) {
        setError('Analysis not found')
        setLoading(false)
        return
      }

      setUpload(uploadData)

      const latestAnalysis = uploadData.analyses?.[uploadData.analyses.length - 1]
      if (latestAnalysis) {
        setAnalysis(latestAnalysis)

        if (latestAnalysis.status === 'completed' && latestAnalysis.result_data) {
          try {
            const resultData = typeof latestAnalysis.result_data === 'string'
              ? JSON.parse(latestAnalysis.result_data)
              : latestAnalysis.result_data
            setResult(resultData)
          } catch (e) {
            console.error('Error parsing result data:', e)
            setError('Failed to parse analysis results')
          }
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading analysis:', err)
      setError('Failed to load analysis data')
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!analysis || analysis.status !== 'completed') return

    setGeneratingReport(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisId: analysis.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      window.open(data.reportUrl, '_blank')
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setGeneratingReport(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          </div>
          <p className="text-muted-foreground">Loading analysis results...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">
            Error Loading Analysis
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Dashboard
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </motion.button>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                Analysis Results
              </h1>
            </div>
            <p className="text-muted-foreground ml-11">
              {upload?.video_filename || 'Video Analysis'}
            </p>
          </div>

          {analysis?.status === 'completed' && (
            <div className="flex items-center gap-3 ml-11 lg:ml-0">
              {/* Share Button */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl font-medium text-foreground hover:bg-muted transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </motion.button>

                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-2">
                        <button
                          onClick={copyLink}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          {copied ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <Link2 className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm text-foreground">
                            {copied ? 'Copied!' : 'Copy Link'}
                          </span>
                        </button>
                        <button
                          onClick={() => window.open(`mailto:?subject=Workflow Analysis&body=Check out this workflow analysis: ${window.location.href}`)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Email</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Download PDF Button */}
              <motion.button
                onClick={generateReport}
                disabled={generatingReport}
                className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: generatingReport ? 1 : 1.02 }}
                whileTap={{ scale: generatingReport ? 1 : 0.98 }}
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`mb-8 rounded-2xl border p-6 ${
          analysis?.status === 'completed'
            ? 'bg-success/10 border-success/20'
            : analysis?.status === 'processing'
            ? 'bg-info/10 border-info/20'
            : 'bg-destructive/10 border-destructive/20'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            analysis?.status === 'completed'
              ? 'bg-success/20'
              : analysis?.status === 'processing'
              ? 'bg-info/20'
              : 'bg-destructive/20'
          }`}>
            {analysis?.status === 'completed' && (
              <CheckCircle className="w-7 h-7 text-success" />
            )}
            {analysis?.status === 'processing' && (
              <Loader2 className="w-7 h-7 text-info animate-spin" />
            )}
            {analysis?.status === 'failed' && (
              <AlertCircle className="w-7 h-7 text-destructive" />
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-display font-semibold text-foreground">
              {analysis?.status === 'completed' && 'Analysis Complete'}
              {analysis?.status === 'processing' && 'Analysis in Progress'}
              {analysis?.status === 'failed' && 'Analysis Failed'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {analysis?.status === 'completed' && analysis?.completed_at && (
                <>Completed on {format(new Date(analysis.completed_at), 'PPpp')}</>
              )}
              {analysis?.status === 'processing' && (
                <>Processing typically takes 5-15 minutes depending on video length</>
              )}
              {analysis?.status === 'failed' && (
                <>{analysis.error_message || 'An error occurred during analysis'}</>
              )}
            </p>
          </div>

          {analysis?.status === 'processing' && (
            <div className="hidden sm:block">
              <motion.div
                className="px-4 py-2 bg-info/20 rounded-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-xs font-medium text-info">Processing...</p>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Analysis Results */}
      {result && (
        <>
          {/* Executive Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-2xl border border-primary/20 p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="font-display font-bold text-foreground text-lg">
                Executive Summary
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Your workflow contains <span className="font-semibold text-foreground">{result.workflow_summary.total_steps} distinct steps</span> across{' '}
              <span className="font-semibold text-foreground">{result.workflow_summary.key_sections.length} key sections</span>.
              {result.workflow_summary.tools_mentioned.length > 0 && (
                <> Tools and applications identified include <span className="font-semibold text-foreground">{result.workflow_summary.tools_mentioned.slice(0, 3).join(', ')}</span>
                {result.workflow_summary.tools_mentioned.length > 3 && ` and ${result.workflow_summary.tools_mentioned.length - 3} more`}.</>
              )}
              {result.workflow_summary.has_errors && (
                <span className="text-warning"> Potential issues were detected that may require attention.</span>
              )}
            </p>
          </motion.div>

          {/* Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Film className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-display gradient-text">
                <AnimatedCounter value={result.metadata.frames_analyzed} />
              </p>
              <p className="text-sm text-muted-foreground mt-1">Frames Analyzed</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-display gradient-text">
                <AnimatedCounter value={result.workflow_summary.total_steps} />
              </p>
              <p className="text-sm text-muted-foreground mt-1">Workflow Steps</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-display gradient-text">
                <AnimatedCounter value={result.workflow_summary.key_sections.length} />
              </p>
              <p className="text-sm text-muted-foreground mt-1">Key Sections</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-display gradient-text">
                <AnimatedCounter value={result.workflow_summary.tools_mentioned.length} />
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tools Identified</p>
            </div>
          </motion.div>

          {/* Timeline Visualization */}
          {result.metadata.timestamps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-card rounded-2xl border border-border p-6 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  Key Timestamps
                </h3>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-4 left-0 right-0 h-1 bg-border rounded-full" />
                <div className="absolute top-4 left-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: '100%' }} />

                {/* Timeline points */}
                <div className="relative flex justify-between">
                  {result.metadata.timestamps.map((timestamp, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center mb-2 shadow-glow">
                        <Play className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <p className="text-sm font-mono font-medium text-foreground">
                        {formatTimestamp(timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Frame {index + 1}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Expandable Sections */}
          <div className="space-y-4 mb-8">
            {/* Detailed Analysis */}
            <ExpandableSection title="Detailed Analysis" icon={FileText} defaultOpen={true}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {result.analysis}
                </div>
              </div>
            </ExpandableSection>

            {/* Key Sections */}
            {result.workflow_summary.key_sections.length > 0 && (
              <ExpandableSection title="Key Sections Identified" icon={Target}>
                <ul className="space-y-2">
                  {result.workflow_summary.key_sections.map((section, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-mono font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm text-foreground">{section}</span>
                    </motion.li>
                  ))}
                </ul>
              </ExpandableSection>
            )}

            {/* Tools & Applications */}
            {result.workflow_summary.tools_mentioned.length > 0 && (
              <ExpandableSection title="Tools & Applications" icon={Settings}>
                <div className="flex flex-wrap gap-2">
                  {result.workflow_summary.tools_mentioned.map((tool, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg"
                    >
                      {tool}
                    </motion.span>
                  ))}
                </div>
              </ExpandableSection>
            )}

            {/* AI Model Info */}
            <ExpandableSection title="Analysis Metadata" icon={Brain}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    AI Model
                  </p>
                  <p className="text-sm font-medium text-foreground font-mono">
                    {result.metadata.model}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Analysis Date
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {result.metadata.analysis_date
                      ? format(new Date(result.metadata.analysis_date), 'PPpp')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </ExpandableSection>
          </div>

          {/* Issues Alert */}
          {result.workflow_summary.has_errors && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-warning/10 border border-warning/20 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    Potential Issues Detected
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The analysis has identified potential issues or inefficiencies in your workflow that may benefit from optimization or automation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Processing State */}
      {analysis?.status === 'processing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-12 text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-info/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-12 h-12 text-info" />
          </motion.div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">
            AI Analysis in Progress
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our AI is carefully analyzing your workflow video. This typically takes 5-15 minutes depending on video length.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span>Detailed Insights</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Failed State */}
      {analysis?.status === 'failed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">
            Analysis Failed
          </h3>
          <p className="text-muted-foreground mb-6">
            {analysis.error_message || 'An unexpected error occurred. Please contact support for assistance.'}
          </p>
          <motion.button
            onClick={() => router.push('/dashboard/new')}
            className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      )}

      {/* Actions Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <motion.button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </motion.button>

        {analysis?.status === 'completed' && (
          <motion.button
            onClick={() => router.push('/dashboard/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl font-medium text-foreground hover:bg-muted transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Analyze Another Video
            <Sparkles className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  )
}
