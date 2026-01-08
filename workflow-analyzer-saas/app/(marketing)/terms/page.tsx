'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, Clock, ChevronRight, Printer, ArrowUp } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/app/components/marketing/Navigation'
import Footer from '@/app/components/marketing/Footer'

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing and using Workflow Analyzer ("the Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.

These Terms apply to all visitors, users, and others who access or use the Service. By using the Service, you also agree to our Privacy Policy, which describes how we collect, use, and protect your information.`,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: `You must be at least 18 years old or the age of majority in your jurisdiction to use this Service. By using the Service, you represent and warrant that you meet this eligibility requirement.

If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.`,
  },
  {
    id: 'account',
    title: '3. Account Registration',
    content: `To access certain features of the Service, you must register for an account. When you register, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

You must notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    id: 'use',
    title: '4. Acceptable Use',
    content: `You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:

• Upload, transmit, or distribute any content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable
• Use the Service to infringe upon the intellectual property rights of others
• Attempt to gain unauthorized access to the Service or its related systems
• Use automated means to access the Service without our express permission
• Interfere with or disrupt the integrity or performance of the Service
• Collect or harvest any personally identifiable information from other users`,
  },
  {
    id: 'content',
    title: '5. User Content',
    content: `You retain ownership of any content you upload to the Service ("User Content"). By uploading User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and process your User Content solely for the purpose of providing the Service.

You are solely responsible for your User Content and the consequences of uploading it. You represent and warrant that you own or have the necessary rights to your User Content and that it does not violate any third-party rights.`,
  },
  {
    id: 'intellectual-property',
    title: '6. Intellectual Property',
    content: `The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Workflow Analyzer and its licensors. The Service is protected by copyright, trademark, and other intellectual property laws.

Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.`,
  },
  {
    id: 'payment',
    title: '7. Payment Terms',
    content: `The Service operates on a pay-per-use model. Prices are displayed before you complete any transaction. All payments are processed securely through our third-party payment processor (Stripe).

All fees are non-refundable except as expressly set forth in these Terms or as required by applicable law. We reserve the right to change our pricing at any time with notice to users.`,
  },
  {
    id: 'termination',
    title: '8. Termination',
    content: `We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.

Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.`,
  },
  {
    id: 'disclaimer',
    title: '9. Disclaimer of Warranties',
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that the Service will be uninterrupted, secure, or error-free, or that any defects will be corrected.`,
  },
  {
    id: 'liability',
    title: '10. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, WORKFLOW ANALYZER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.

Our total liability for any claims arising from or related to these Terms or the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.`,
  },
  {
    id: 'changes',
    title: '11. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on this page and updating the "Last updated" date.

Your continued use of the Service after any changes constitutes your acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using the Service.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: `If you have any questions about these Terms of Service, please contact us at:

Email: legal@workflowanalyzer.com

Workflow Analyzer
123 Tech Street
San Francisco, CA 94105
United States`,
  },
]

const lastUpdated = 'January 8, 2026'
const readingTime = '8 min read'

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('')
  const [progress, setProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate reading progress
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollProgress = (scrollTop / docHeight) * 100
      setProgress(scrollProgress)
      setShowBackToTop(scrollTop > 500)

      // Determine active section
      const sectionElements = sections.map((s) => document.getElementById(s.id))
      const scrollPosition = scrollTop + 200

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Navigation />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <motion.div
          className="h-full gradient-primary"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
        />
      </div>

      <main className="min-h-screen pt-32 pb-20 bg-background print:pt-8 print:pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mb-12 print:mb-6"
            >
              <div className="flex items-center gap-2 text-primary mb-4 print:hidden">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Legal</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-6">
                Terms of Service
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Last updated: {lastUpdated}</span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <Clock className="w-4 h-4" />
                  <span>{readingTime}</span>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-12">
              {/* Table of Contents - Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:w-72 flex-shrink-0 print:hidden"
              >
                <div className="lg:sticky lg:top-24">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                    Table of Contents
                  </h2>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg transition-all duration-200 ${
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            activeSection === section.id ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </nav>

                  {/* Quick Links */}
                  <div className="mt-8 pt-8 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                      Related
                    </h3>
                    <div className="space-y-2">
                      <Link
                        href="/privacy"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      <a
                        href="mailto:legal@workflowanalyzer.com"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Contact Legal Team
                      </a>
                    </div>
                  </div>
                </div>
              </motion.aside>

              {/* Main Content */}
              <motion.div
                ref={contentRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 max-w-3xl"
              >
                <div className="bg-card rounded-2xl border border-border p-8 lg:p-12 print:p-0 print:border-0 print:bg-transparent">
                  {sections.map((section, index) => (
                    <motion.section
                      key={section.id}
                      id={section.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.5 }}
                      className={`${index > 0 ? 'mt-12 pt-12 border-t border-border print:border-gray-200' : ''}`}
                    >
                      <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-4 print:text-black">
                        {section.title}
                      </h2>
                      <div className="prose prose-lg max-w-none">
                        {section.content.split('\n\n').map((paragraph, pIndex) => (
                          <p
                            key={pIndex}
                            className="text-muted-foreground leading-relaxed mb-4 whitespace-pre-line print:text-gray-700"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: showBackToTop ? 1 : 0, scale: showBackToTop ? 1 : 0.8 }}
          className="fixed bottom-8 right-8 p-3 rounded-full gradient-primary text-primary-foreground shadow-glow hover:shadow-xl transition-all duration-300 print:hidden"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      </main>

      <Footer />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          nav, footer, button, aside {
            display: none !important;
          }
          body {
            font-size: 12pt;
            line-height: 1.5;
            color: black;
            background: white;
          }
          h1 {
            font-size: 24pt;
            page-break-after: avoid;
          }
          h2 {
            font-size: 16pt;
            page-break-after: avoid;
          }
          section {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  )
}
