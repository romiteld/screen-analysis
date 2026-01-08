'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Zap, BarChart3, Clock } from 'lucide-react'
import { useRef } from 'react'

const stats = [
  { label: 'Hours Saved Weekly', value: '15+', icon: Clock },
  { label: 'Workflows Analyzed', value: '10K+', icon: BarChart3 },
  { label: 'Automation Rate', value: '87%', icon: Zap },
]

const floatingShapes = [
  { size: 'w-64 h-64', position: 'top-20 -left-32', delay: 0, color: 'from-primary/20 to-accent/20' },
  { size: 'w-96 h-96', position: 'top-40 -right-48', delay: 0.2, color: 'from-accent/15 to-primary/15' },
  { size: 'w-48 h-48', position: 'bottom-20 left-1/4', delay: 0.4, color: 'from-info/20 to-primary/20' },
  { size: 'w-72 h-72', position: '-bottom-36 right-1/3', delay: 0.6, color: 'from-primary/10 to-accent/10' },
]

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden gradient-hero"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-white opacity-[0.02]" />

        {/* Floating Shapes */}
        {floatingShapes.map((shape, index) => (
          <motion.div
            key={index}
            className={`absolute ${shape.size} ${shape.position} rounded-full bg-gradient-to-br ${shape.color} blur-3xl`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: shape.delay }}
          />
        ))}

        {/* Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary"
          animate={{
            y: [0, -20, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-accent"
          animate={{
            y: [0, 20, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-info"
          animate={{
            y: [0, -15, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-32"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary-foreground dark:text-primary mb-6">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Workflow Analysis
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-white mb-6"
              >
                Transform Your{' '}
                <span className="relative">
                  <span className="gradient-text">Workflows</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 w-full h-1 gradient-primary rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </span>
                <br />
                Into Automation
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-gray-300 mb-10 max-w-xl mx-auto lg:mx-0"
              >
                Upload your screen recordings and let our AI identify repetitive tasks,
                inefficiencies, and automation opportunities. Get actionable insights
                to save hours every week.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-foreground gradient-primary rounded-xl shadow-glow hover:shadow-xl transition-all duration-300 group"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                  >
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Watch Demo
                  </Link>
                </motion.div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-3 gap-4 sm:gap-8"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="text-center lg:text-left"
                  >
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                      <stat.icon className="w-4 h-4 text-primary hidden sm:block" />
                      <span className="text-2xl sm:text-3xl font-display font-bold text-white font-mono">
                        {stat.value}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              {/* Main Visual Container */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-3xl" />

                {/* Dashboard Preview Card */}
                <motion.div
                  className="relative glass rounded-2xl p-6 border border-white/10 shadow-2xl"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <div className="w-3 h-3 rounded-full bg-success" />
                    </div>
                    <div className="text-xs text-gray-400 font-mono">workflow_analysis.ai</div>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-4">
                    {/* Analysis Progress */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Analyzing workflow...</span>
                        <span className="text-sm font-mono text-primary">87%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full gradient-primary rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: '87%' }}
                          transition={{ duration: 2, delay: 1 }}
                        />
                      </div>
                    </div>

                    {/* Found Items */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Repetitive Tasks', value: '12', color: 'text-warning' },
                        { label: 'Automation Ops', value: '8', color: 'text-success' },
                        { label: 'Time Saved', value: '4.5h', color: 'text-info' },
                        { label: 'Efficiency', value: '+35%', color: 'text-primary' },
                      ].map((item, idx) => (
                        <motion.div
                          key={item.label}
                          className="bg-white/5 rounded-lg p-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 1.2 + idx * 0.1 }}
                        >
                          <div className={`text-xl font-bold font-mono ${item.color}`}>
                            {item.value}
                          </div>
                          <div className="text-xs text-gray-400">{item.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-8 -right-8 glass rounded-xl p-4 border border-white/10 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">New Automation</div>
                      <div className="text-xs text-gray-400">Email sorting detected</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-8 glass rounded-xl p-4 border border-white/10 shadow-xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Report Ready</div>
                      <div className="text-xs text-gray-400">15 recommendations</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
