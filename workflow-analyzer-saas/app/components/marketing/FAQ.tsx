'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  {
    question: 'How does the AI analyze my workflow?',
    answer:
      "Our AI uses advanced computer vision and pattern recognition to watch your screen recording. It identifies repetitive actions, frequent application switches, manual data entry, and other inefficiencies. The AI then cross-references these patterns with our database of automation solutions to provide specific recommendations.",
  },
  {
    question: 'What video formats are supported?',
    answer:
      "We support all major video formats including MP4, MOV, AVI, and WebM. You can also directly paste Loom links, and we'll automatically import and analyze the video. Maximum file size is 2GB for direct uploads.",
  },
  {
    question: 'How long does the analysis take?',
    answer:
      "Analysis time depends on the video length. Most videos are processed within 5-15 minutes. You'll receive an email notification when your report is ready, so you can continue with your work while we analyze.",
  },
  {
    question: 'Is my data secure?',
    answer:
      "Absolutely. We use enterprise-grade encryption for all data transfers and storage. Your videos are processed in isolated environments and automatically deleted after 30 days. We're SOC 2 Type II certified and GDPR compliant.",
  },
  {
    question: 'Can I share reports with my team?',
    answer:
      'Yes! You can share reports via secure links, export to PDF, or invite team members to view analyses directly in the platform. Reports can be branded with your company logo for professional presentations.',
  },
  {
    question: 'What kind of automation recommendations do you provide?',
    answer:
      'Our recommendations range from simple browser extensions and keyboard shortcuts to complex automation workflows using tools like Zapier, Make, or custom scripts. We provide step-by-step implementation guides and estimate time savings for each recommendation.',
  },
  {
    question: 'Do you offer integrations with other tools?',
    answer:
      'Yes, we integrate with popular tools like Slack, Microsoft Teams, Jira, and more. Our API allows you to build custom integrations for your specific workflow needs.',
  },
  {
    question: 'What if I need help implementing the recommendations?',
    answer:
      'All users have access to our knowledge base and community forum. Our support team is available via email to help with any questions or implementation challenges you encounter.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          setOpenIndex(openIndex === index ? null : index)
          break
        case 'ArrowDown':
          e.preventDefault()
          const nextIndex = index < faqs.length - 1 ? index + 1 : 0
          document.getElementById(`faq-button-${nextIndex}`)?.focus()
          break
        case 'ArrowUp':
          e.preventDefault()
          const prevIndex = index > 0 ? index - 1 : faqs.length - 1
          document.getElementById(`faq-button-${prevIndex}`)?.focus()
          break
        case 'Home':
          e.preventDefault()
          document.getElementById('faq-button-0')?.focus()
          break
        case 'End':
          e.preventDefault()
          document.getElementById(`faq-button-${faqs.length - 1}`)?.focus()
          break
      }
    },
    [openIndex]
  )

  return (
    <section id="faq" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">FAQ</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground"
            >
              Everything you need to know about Workflow Analyzer
            </motion.p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4" role="list">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 transition-all duration-300"
                role="listitem"
              >
                <button
                  id={`faq-button-${index}`}
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-content-${index}`}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset"
                >
                  <h3 className="text-lg font-semibold text-foreground pr-8">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      openIndex === index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {openIndex === index ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      id={`faq-content-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                      role="region"
                      aria-labelledby={`faq-button-${index}`}
                    >
                      <div className="px-6 pb-5 border-t border-border">
                        <p className="text-muted-foreground leading-relaxed pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16"
          >
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-3xl border border-primary/20 p-8 lg:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-7 h-7 text-primary-foreground" />
              </div>

              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Can&apos;t find what you&apos;re looking for? Our friendly support team is here to help you with any questions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="mailto:support@workflowanalyzer.com">
                  <motion.button
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Contact Support
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/auth/signup">
                  <motion.button
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started Free
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
