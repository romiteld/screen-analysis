'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, Sparkles, Shield, Zap, FileText, Clock, Brain } from 'lucide-react'
import Link from 'next/link'
import { calculatePrice } from '@/lib/stripe/config'

const features = [
  { icon: Brain, text: 'AI-powered workflow analysis' },
  { icon: FileText, text: 'Detailed PDF report with recommendations' },
  { icon: Clock, text: 'Time and cost savings analysis' },
  { icon: Zap, text: 'Process visualization and timeline' },
  { icon: Shield, text: 'Secure processing and GDPR compliance' },
]

// Animated counter component
function AnimatedPrice({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false })
  const prevValue = useRef(value)

  useEffect(() => {
    if (isInView) {
      const start = prevValue.current
      const end = value
      const duration = 400
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const current = start + (end - start) * easeOut

        setDisplayValue(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          prevValue.current = value
        }
      }

      animate()
    }
  }, [value, isInView])

  return (
    <span ref={ref} className="font-mono">
      ${(displayValue / 100).toFixed(2)}
    </span>
  )
}

export default function Pricing() {
  const [minutes, setMinutes] = useState(10)
  const price = calculatePrice(minutes * 60)

  const basePrice = 100 // $1.00 in cents
  const additionalMinutes = Math.max(0, minutes - 5)
  const additionalPrice = additionalMinutes * 15

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Pay As You Go</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4"
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Only pay for what you analyze. No subscriptions, no hidden fees.
            </motion.p>
          </div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden"
          >
            {/* Card Header with Gradient */}
            <div className="relative p-8 lg:p-12 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b border-border">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative">
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                  Pricing Calculator
                </h3>
                <p className="text-muted-foreground">
                  Drag the slider to estimate your cost
                </p>
              </div>
            </div>

            <div className="p-8 lg:p-12">
              {/* Price Display */}
              <div className="text-center mb-10">
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-6xl lg:text-7xl font-display font-bold gradient-text">
                    <AnimatedPrice value={price} />
                  </span>
                  <span className="text-xl text-muted-foreground">USD</span>
                </div>
                <p className="text-muted-foreground mt-2">
                  for {minutes} minute{minutes !== 1 ? 's' : ''} of video
                </p>
              </div>

              {/* Slider */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Video Length</span>
                  <span className="text-sm font-mono font-bold text-foreground bg-muted px-3 py-1 rounded-lg">
                    {minutes} min
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="120"
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value))}
                    className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-6
                      [&::-webkit-slider-thumb]:h-6
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-primary
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:border-4
                      [&::-webkit-slider-thumb]:border-background
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-moz-range-thumb]:w-6
                      [&::-moz-range-thumb]:h-6
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-primary
                      [&::-moz-range-thumb]:shadow-lg
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:border-4
                      [&::-moz-range-thumb]:border-background"
                  />
                  {/* Progress Fill */}
                  <div
                    className="absolute top-0 left-0 h-3 gradient-primary rounded-full pointer-events-none"
                    style={{ width: `${((minutes - 1) / 119) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1 min</span>
                  <span>60 min</span>
                  <span>120 min</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-muted/50 rounded-2xl p-6 mb-10">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Price Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base price (first 5 min)</span>
                    <span className="font-mono font-medium text-foreground">$1.00</span>
                  </div>
                  {additionalMinutes > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Additional {additionalMinutes} min × $0.15
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        ${(additionalPrice / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-mono font-bold text-lg gradient-text">
                        ${(price / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-10">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  What&apos;s Included
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-success" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link href="/auth/signup">
                  <motion.button
                    className="inline-flex items-center justify-center gap-2 px-10 py-4 text-lg font-semibold gradient-primary text-primary-foreground rounded-xl shadow-glow hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started Now
                  </motion.button>
                </Link>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required to sign up
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bottom Note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-muted-foreground">
              Enterprise plans available for teams.{' '}
              <a href="mailto:enterprise@workflowanalyzer.com" className="text-primary hover:underline">
                Contact sales
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
