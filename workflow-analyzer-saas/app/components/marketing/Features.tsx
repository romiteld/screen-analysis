'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Brain,
  FileText,
  Zap,
  Clock,
  BarChart3,
  Video,
  Download,
  Sparkles,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Video,
    title: 'Easy Upload',
    description: 'Upload screen recordings directly or paste Loom links. Support for all major video formats.',
    color: 'primary',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced AI identifies patterns, repetitive tasks, and workflow inefficiencies automatically.',
    color: 'accent',
  },
  {
    icon: BarChart3,
    title: 'Detailed Insights',
    description: 'Get comprehensive reports with time breakdowns, task frequency, and automation potential.',
    color: 'warning',
  },
  {
    icon: Zap,
    title: 'Automation Recommendations',
    description: 'Receive specific, actionable suggestions for tools and scripts to automate your workflows.',
    color: 'success',
  },
  {
    icon: Clock,
    title: 'Time Savings Calculator',
    description: 'See exactly how much time you could save by implementing our recommendations.',
    color: 'info',
  },
  {
    icon: Download,
    title: 'Export Reports',
    description: 'Download professional PDF reports to share with your team or stakeholders.',
    color: 'primary',
  }
]

const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', glow: 'shadow-glow' },
  accent: { bg: 'bg-accent/10', text: 'text-accent', glow: 'shadow-glow-accent' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', glow: 'shadow-warning/20' },
  success: { bg: 'bg-success/10', text: 'text-success', glow: 'shadow-success/20' },
  info: { bg: 'bg-info/10', text: 'text-info', glow: 'shadow-info/20' },
}

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="relative py-20 lg:py-32 bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-dot-pattern dark:bg-dot-pattern-dark opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Powerful Features
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6"
            >
              Everything You Need to{' '}
              <span className="gradient-text">Optimize Workflows</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
            >
              Our comprehensive suite of features helps you identify and eliminate
              inefficiencies in your daily work
            </motion.p>
          </div>

          {/* Features Grid */}
          <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const colors = colorMap[feature.color]
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="group relative"
                >
                  {/* Card */}
                  <div className="relative h-full p-6 lg:p-8 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden">
                    {/* Gradient Border Effect on Hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 rounded-2xl gradient-border" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`inline-flex p-3 lg:p-4 rounded-xl ${colors.bg} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className={`h-6 w-6 lg:h-7 lg:w-7 ${colors.text}`} />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-display font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Learn More Link */}
                      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Learn more</span>
                        <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Background Glow */}
                    <div className={`absolute -bottom-20 -right-20 w-40 h-40 ${colors.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <p className="text-muted-foreground mb-6">
              Ready to supercharge your workflow?
            </p>
            <motion.a
              href="/auth/signup"
              className="inline-flex items-center px-8 py-4 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Analyzing
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
