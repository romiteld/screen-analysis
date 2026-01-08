'use client'

import { useState } from 'react'
import { VideoLengthPicker } from '@/components/VideoLengthPicker'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  CreditCard,
  Brain,
  FileText,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Loader2,
  Video,
  Clock,
  Zap,
  Shield,
  Info,
} from 'lucide-react'
import { calculatePrice } from '@/lib/stripe/config'

const steps = [
  { id: 1, name: 'Upload Video', icon: Upload, description: 'Select your recording' },
  { id: 2, name: 'Payment', icon: CreditCard, description: 'Secure checkout' },
  { id: 3, name: 'Analysis', icon: Brain, description: 'AI processing' },
  { id: 4, name: 'Report', icon: FileText, description: 'Get insights' },
]

export default function NewAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  const handleVideoSelect = (file: File, durationSeconds: number) => {
    setSelectedFile(file)
    setDuration(durationSeconds)
    setError(null)
  }

  const handleCheckout = async () => {
    if (!duration) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoLengthSeconds: duration,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()

      // Store file info in sessionStorage for after payment
      if (selectedFile) {
        sessionStorage.setItem('pendingUpload', JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          duration: duration,
        }))
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) return `${seconds} seconds`
    if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
    return `${minutes}m ${remainingSeconds}s`
  }

  const price = duration ? calculatePrice(duration) : null

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
          New Workflow Analysis
        </h1>
        <p className="text-muted-foreground">
          Upload your screen recording and let AI identify automation opportunities
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
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    step.id < currentStep
                      ? 'bg-success text-white'
                      : step.id === currentStep
                      ? 'gradient-primary text-white shadow-glow'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <div className="mt-2 text-center hidden sm:block">
                  <p className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 bg-border hidden sm:block">
                  <div
                    className={`h-full transition-all duration-500 ${
                      step.id < currentStep ? 'bg-success w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Select Your Video
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upload a screen recording or paste a Loom link
                </p>
              </div>
            </div>

            <VideoLengthPicker onVideoSelect={handleVideoSelect} />
          </motion.div>

          {/* Video Selected Info */}
          <AnimatePresence>
            {selectedFile && duration && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-foreground">
                      Video Ready
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Your video has been prepared for analysis
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      <Video className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {formatDuration(duration)}
                        </span>
                        <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Section */}
          <AnimatePresence>
            {duration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-foreground">
                      Proceed to Payment
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Secure checkout powered by Stripe
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  You&apos;ll be redirected to our secure payment page. After payment, your video will be automatically analyzed by our AI.
                </p>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 mb-6"
                    >
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={handleCheckout}
                  disabled={loading || !duration}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment with 256-bit SSL encryption</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">
              Price Breakdown
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Video Duration</span>
                <span className="font-mono font-medium text-foreground">
                  {duration ? formatDuration(duration) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base Price</span>
                <span className="font-mono font-medium text-foreground">$1.00</span>
              </div>
              {duration && duration > 300 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Additional Minutes</span>
                  <span className="font-mono font-medium text-foreground">
                    ${((Math.ceil(duration / 60) - 5) * 0.15).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-display font-bold gradient-text">
                    {price ? `$${(price / 100).toFixed(2)}` : '$1.00'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What's Included */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">
              What&apos;s Included
            </h3>
            <ul className="space-y-3">
              {[
                'AI-powered workflow analysis',
                'Task identification & timing',
                'Automation recommendations',
                'Tool suggestions',
                'Professional PDF report',
                'Time savings estimate',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-info" />
              <h3 className="font-display font-semibold text-foreground">Tips</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Record your full workflow from start to finish</li>
              <li>• Include any repetitive tasks you perform</li>
              <li>• Use clear, well-lit screen recordings</li>
              <li>• Supported formats: MP4, MOV, WebM</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
