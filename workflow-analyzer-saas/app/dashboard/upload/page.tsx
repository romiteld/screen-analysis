'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoUploader } from '@/app/components/upload/VideoUploader'
import { LoomImporter } from '@/app/components/integrations/loom/LoomImporter'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Upload,
  Link2,
  ArrowRight,
  Brain,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react'

const statusSteps = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'processing', label: 'Processing', icon: Brain },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
]

export default function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const uploadId = searchParams.get('upload_id')

  const [loading, setLoading] = useState(true)
  const [upload, setUpload] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<string>('pending')
  const [uploadMethod, setUploadMethod] = useState<'direct' | 'loom'>('direct')
  const [loomImportData, setLoomImportData] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!uploadId) {
      setError('No upload ID provided')
      setLoading(false)
      return
    }

    loadUpload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId])

  const loadUpload = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('uploads')
        .select('*')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !data) {
        setError('Invalid upload ID or unauthorized access')
        setLoading(false)
        return
      }

      if (data.status !== 'paid') {
        setError('Payment required before upload')
        setLoading(false)
        return
      }

      setUpload(data)
      setLoading(false)

      if (data.video_storage_path) {
        setUploadComplete(true)
        setAnalysisStatus(data.analysis_status || 'pending')
        startStatusPolling()
      }
    } catch (err) {
      console.error('Error loading upload:', err)
      setError('Failed to load upload details')
      setLoading(false)
    }
  }

  const startStatusPolling = () => {
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('uploads')
          .select('analysis_status, analysis_completed_at')
          .eq('id', uploadId)
          .single()

        if (data) {
          setAnalysisStatus(data.analysis_status)

          if (data.analysis_status === 'completed' || data.analysis_status === 'failed') {
            clearInterval(interval)
          }
        }
      } catch (err) {
        console.error('Error polling status:', err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }

  const handleUploadComplete = async (url: string) => {
    setUploadComplete(true)
    setAnalysisStatus('processing')
    startStatusPolling()
  }

  const handleUploadError = (error: string) => {
    setError(error)
  }

  const handleLoomImportComplete = (videoUrl: string, metadata: any) => {
    if (metadata?.requiresManualDownload) {
      setLoomImportData({ videoUrl, metadata })
      setError(null)
    }
  }

  const handleLoomImportError = (error: string) => {
    setError(error)
  }

  const getCurrentStep = () => {
    if (!uploadComplete) return 0
    if (analysisStatus === 'processing' || analysisStatus === 'pending') return 1
    if (analysisStatus === 'completed') return 2
    return 1
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading upload details...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-8"
      >
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">
                Something went wrong
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Return to Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Upload Your Video
        </h1>
        <p className="text-muted-foreground">
          Upload your screen recording to start the AI analysis
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => {
            const currentStep = getCurrentStep()
            const isComplete = index < currentStep
            const isCurrent = index === currentStep
            const StepIcon = step.icon

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isComplete
                        ? 'bg-success text-white'
                        : isCurrent
                        ? 'gradient-primary text-white shadow-glow'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : isCurrent && (analysisStatus === 'processing' || analysisStatus === 'pending') ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <p className={`mt-2 text-sm font-medium ${
                    isComplete || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {index < statusSteps.length - 1 && (
                  <div className="flex-1 mx-4 h-0.5 bg-border hidden sm:block">
                    <motion.div
                      className={`h-full ${isComplete ? 'bg-success' : 'bg-transparent'}`}
                      initial={{ width: 0 }}
                      animate={{ width: isComplete ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        <div className="p-6 lg:p-8">
          {!uploadComplete ? (
            <>
              {/* Success Badge */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-success/10 border border-success/20 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Payment Confirmed!</p>
                  <p className="text-sm text-muted-foreground">
                    You can now upload your video for analysis
                  </p>
                </div>
              </div>

              {/* Upload Method Selection */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Choose upload method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => {
                      setUploadMethod('direct')
                      setLoomImportData(null)
                      setError(null)
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-4 border-2 rounded-xl transition-all duration-200 ${
                      uploadMethod === 'direct'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Upload File</span>
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setUploadMethod('loom')
                      setError(null)
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-4 border-2 rounded-xl transition-all duration-200 ${
                      uploadMethod === 'loom'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link2 className="w-5 h-5" />
                    <span className="font-medium">Import from Loom</span>
                  </motion.button>
                </div>
              </div>

              {/* Uploader Components */}
              <AnimatePresence mode="wait">
                {uploadMethod === 'direct' && (
                  <motion.div
                    key="direct"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VideoUploader
                      uploadId={uploadId!}
                      onUploadComplete={handleUploadComplete}
                      onError={handleUploadError}
                    />

                    <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-info" />
                        <span className="text-sm font-medium text-foreground">Upload Guidelines</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Maximum file size: 500MB</li>
                        <li>• Supported formats: MP4, MOV, WebM, AVI</li>
                        <li>• Ensure the video clearly shows your workflow</li>
                        <li>• For best results, record in high quality</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {uploadMethod === 'loom' && (
                  <motion.div
                    key="loom"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LoomImporter
                      onImportComplete={handleLoomImportComplete}
                      onError={handleLoomImportError}
                    />

                    {loomImportData && (
                      <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-warning" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground mb-2">
                              Manual Download Required
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Due to Loom&apos;s security restrictions, you&apos;ll need to download the video manually.
                            </p>
                            <ol className="text-sm text-muted-foreground space-y-2 mb-4">
                              <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">1</span>
                                <a
                                  href={loomImportData.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  Open your Loom video
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">2</span>
                                Click &quot;Download&quot; in Loom
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">3</span>
                                Upload the downloaded video below
                              </li>
                            </ol>
                            <button
                              onClick={() => {
                                setUploadMethod('direct')
                                setLoomImportData(null)
                              }}
                              className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
                            >
                              Switch to Upload File
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              {/* Upload Complete Success */}
              <motion.div
                className="w-20 h-20 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle className="w-10 h-10 text-success" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Upload Complete!
              </h2>

              <div className="mt-8">
                <AnimatePresence mode="wait">
                  {analysisStatus === 'pending' && (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-full"
                    >
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Waiting in queue...</span>
                    </motion.div>
                  )}

                  {analysisStatus === 'processing' && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-full">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium">Analysis in progress...</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                        <span>AI is analyzing your workflow</span>
                      </div>
                    </motion.div>
                  )}

                  {analysisStatus === 'completed' && (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Analysis complete!</span>
                      </div>

                      <motion.button
                        onClick={() => router.push(`/dashboard/analysis/${uploadId}`)}
                        className="flex items-center gap-2 mx-auto px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FileText className="w-5 h-5" />
                        View Analysis Report
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </motion.div>
                  )}

                  {analysisStatus === 'failed' && (
                    <motion.div
                      key="failed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-full">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Analysis failed</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Please contact support for assistance.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  We&apos;ll send you an email when your analysis is ready. This typically takes 5-15 minutes.
                </p>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Return to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
