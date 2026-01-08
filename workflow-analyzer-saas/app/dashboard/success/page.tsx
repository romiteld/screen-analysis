'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, Zap } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setStatus('error')
      return
    }

    checkPaymentAndRedirect()
  }, [sessionId])

  const checkPaymentAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Poll for the upload record created by webhook
      let attempts = 0
      const maxAttempts = 30 // 30 seconds max wait

      const pollInterval = setInterval(async () => {
        attempts++
        setProgress(Math.min((attempts / maxAttempts) * 100, 95))

        const { data: upload } = await supabase
          .from('uploads')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (upload) {
          clearInterval(pollInterval)
          setProgress(100)
          setStatus('success')
          // Short delay to show success state before redirecting
          setTimeout(() => {
            router.push(`/dashboard/upload?upload_id=${upload.id}`)
          }, 1500)
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setError('Payment processing is taking longer than expected. Please check your dashboard.')
          setStatus('error')
        }
      }, 1000)

    } catch (err) {
      console.error('Error checking payment:', err)
      setError('Failed to verify payment status')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {status === 'loading' && (
          <div className="text-center">
            {/* Animated Success Icon */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-12 h-12 text-primary" />
                </motion.div>
              </div>
            </div>

            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground mb-8">
              Verifying your payment and preparing your upload...
            </p>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              This should only take a few seconds...
            </p>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Success Animation */}
            <motion.div
              className="w-24 h-24 mx-auto mb-8 rounded-full bg-success/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-12 h-12 text-success" />
              </motion.div>
            </motion.div>

            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              You're All Set!
            </h1>
            <p className="text-muted-foreground mb-6">
              Redirecting you to upload your video...
            </p>

            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Redirecting...</span>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-2xl border border-border p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-warning" />
            </div>

            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Processing Delayed
            </h1>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>

            <motion.button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>AI-Powered</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
