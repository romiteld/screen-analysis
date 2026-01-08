'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Upload, Brain, FileText, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Recording',
    description: 'Simply drag and drop your screen recording or paste a Loom link. We support MP4, MOV, and other common formats.',
    details: ['Drag & drop interface', 'Loom integration', 'All major formats'],
    color: 'primary',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Analyzes Your Workflow',
    description: 'Our advanced AI watches your recording, identifying repetitive tasks, inefficiencies, and automation opportunities.',
    details: ['Pattern recognition', 'Task identification', 'Efficiency scoring'],
    color: 'accent',
  },
  {
    number: '03',
    icon: FileText,
    title: 'Get Detailed Report',
    description: 'Receive a comprehensive PDF report with timeline analysis, task breakdown, and specific automation recommendations.',
    details: ['Timeline analysis', 'Task breakdown', 'PDF export'],
    color: 'success',
  },
  {
    number: '04',
    icon: Rocket,
    title: 'Implement & Save Time',
    description: 'Follow our actionable recommendations to automate your workflows and save hours every week.',
    details: ['Tool suggestions', 'Script templates', 'Integration guides'],
    color: 'warning',
  }
]

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-primary', text: 'text-primary', border: 'border-primary' },
  accent: { bg: 'bg-accent', text: 'text-accent', border: 'border-accent' },
  success: { bg: 'bg-success', text: 'text-success', border: 'border-success' },
  warning: { bg: 'bg-warning', text: 'text-warning', border: 'border-warning' },
}

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="relative py-20 lg:py-32 bg-card overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-slate dark:bg-grid-white opacity-[0.02]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm font-medium text-accent mb-6"
            >
              <Rocket className="w-4 h-4" />
              Simple Process
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6"
            >
              How It Works
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
            >
              Four simple steps to transform your manual workflows into automated processes
            </motion.p>
          </div>

          {/* Steps */}
          <div ref={ref} className="relative">
            {/* Connection Line - Desktop */}
            <div className="hidden lg:block absolute top-32 left-[12.5%] right-[12.5%] h-0.5">
              <div className="w-full h-full bg-gradient-to-r from-primary via-accent to-success rounded-full opacity-20" />
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-accent to-success rounded-full"
                initial={{ width: '0%' }}
                animate={isInView ? { width: '100%' } : {}}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>

            {/* Connection Line - Mobile */}
            <div className="lg:hidden absolute top-0 bottom-0 left-8 w-0.5">
              <div className="w-full h-full bg-gradient-to-b from-primary via-accent to-success rounded-full opacity-20" />
              <motion.div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-accent to-success rounded-full"
                initial={{ height: '0%' }}
                animate={isInView ? { height: '100%' } : {}}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6">
              {steps.map((step, index) => {
                const colors = colorMap[step.color]
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: 0.3 + index * 0.2,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    className="relative pl-16 lg:pl-0"
                  >
                    {/* Mobile Step Number */}
                    <div className={`lg:hidden absolute left-0 top-0 w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center z-10`}>
                      <span className="text-2xl font-display font-bold text-white">{step.number}</span>
                    </div>

                    {/* Card */}
                    <div className="relative bg-background rounded-2xl p-6 lg:p-8 border border-border hover:border-primary/30 transition-all duration-300 group">
                      {/* Desktop Step Number */}
                      <div className={`hidden lg:flex absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl ${colors.bg} items-center justify-center shadow-lg z-10`}>
                        <span className="text-2xl font-display font-bold text-white">{step.number}</span>
                      </div>

                      {/* Content */}
                      <div className="lg:pt-8">
                        {/* Icon */}
                        <div className={`inline-flex p-3 rounded-xl bg-${step.color}/10 mb-4`}>
                          <step.icon className={`h-6 w-6 ${colors.text}`} />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                          {step.title}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {step.description}
                        </p>

                        {/* Details */}
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Hover Glow */}
                      <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 relative overflow-hidden"
          >
            <div className="relative gradient-primary rounded-3xl p-8 lg:p-12">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-white opacity-5" />

              {/* Floating Shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl lg:text-3xl font-display font-bold text-white mb-3">
                    Ready to Start Automating?
                  </h3>
                  <p className="text-lg text-white/80 max-w-xl">
                    Join thousands of professionals who are saving hours every week with AI-powered workflow analysis.
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center px-8 py-4 bg-white text-primary font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
