'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Shield, Calendar, Clock, ChevronRight, Printer, ArrowUp, Lock, Eye, Database, Globe } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/app/components/marketing/Navigation'
import Footer from '@/app/components/marketing/Footer'

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    icon: Shield,
    content: `This Privacy Policy describes how Workflow Analyzer ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our website and services (collectively, the "Service").

We are committed to protecting your privacy and ensuring the security of your personal information. By using our Service, you agree to the collection and use of information in accordance with this policy.`,
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    icon: Database,
    content: `We collect several types of information to provide and improve our Service:

**Account Information**: When you create an account, we collect your name, email address, and password. You may also provide optional profile information.

**Video Content**: When you upload videos for analysis, we temporarily store and process them to provide our workflow analysis service.

**Payment Information**: When you make a purchase, our payment processor (Stripe) collects your payment card details. We do not store your full payment card information on our servers.

**Usage Data**: We automatically collect information about how you interact with our Service, including pages visited, features used, and time spent on the platform.

**Device Information**: We collect information about the device you use to access our Service, including device type, operating system, browser type, and IP address.

**Cookies and Tracking Technologies**: We use cookies and similar technologies to track activity on our Service and hold certain information.`,
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    icon: Eye,
    content: `We use the information we collect for the following purposes:

• **Service Delivery**: To provide, maintain, and improve our workflow analysis service
• **Account Management**: To create and manage your user account
• **Payment Processing**: To process transactions and send related information
• **Communication**: To send you service updates, security alerts, and support messages
• **Analytics**: To understand how users interact with our Service and improve user experience
• **Legal Compliance**: To comply with applicable laws, regulations, and legal processes
• **Security**: To detect, prevent, and address technical issues and security threats

We do not sell your personal information to third parties.`,
  },
  {
    id: 'data-sharing',
    title: '4. Information Sharing',
    icon: Globe,
    content: `We may share your information in the following circumstances:

**Service Providers**: We share information with third-party vendors who assist us in operating our Service, including:
• Cloud hosting providers (for data storage and processing)
• Payment processors (for transaction processing)
• Analytics providers (for usage analysis)
• Email service providers (for communications)

**Legal Requirements**: We may disclose information if required by law or in response to valid legal requests.

**Business Transfers**: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.

**With Your Consent**: We may share information for other purposes with your explicit consent.

All service providers are contractually obligated to protect your information and use it only for the purposes we specify.`,
  },
  {
    id: 'data-security',
    title: '5. Data Security',
    icon: Lock,
    content: `We implement robust security measures to protect your personal information:

**Encryption**: All data transmitted between your device and our servers is encrypted using TLS/SSL technology. Sensitive data is encrypted at rest.

**Access Controls**: We limit access to personal information to employees and contractors who need it to perform their jobs.

**Infrastructure Security**: Our servers are hosted in secure, SOC 2 compliant data centers with 24/7 monitoring.

**Regular Audits**: We conduct regular security assessments and penetration testing to identify and address vulnerabilities.

**Incident Response**: We have procedures in place to detect, respond to, and notify you of data breaches as required by law.

While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure.`,
  },
  {
    id: 'data-retention',
    title: '6. Data Retention',
    content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy:

• **Account Data**: Retained while your account is active and for a reasonable period afterward
• **Video Content**: Automatically deleted 30 days after processing is complete
• **Payment Records**: Retained for 7 years as required for tax and legal purposes
• **Usage Data**: Retained in anonymized form for analytics purposes
• **Communication Records**: Retained for customer support and legal compliance

You can request deletion of your personal data at any time by contacting us or through your account settings.`,
  },
  {
    id: 'your-rights',
    title: '7. Your Rights',
    content: `Depending on your location, you may have the following rights regarding your personal information:

**Access**: You can request a copy of the personal information we hold about you.

**Correction**: You can request that we correct inaccurate or incomplete information.

**Deletion**: You can request that we delete your personal information, subject to certain exceptions.

**Portability**: You can request a copy of your data in a structured, machine-readable format.

**Objection**: You can object to certain types of processing, including direct marketing.

**Restriction**: You can request that we limit how we use your information.

**Withdraw Consent**: Where processing is based on consent, you can withdraw it at any time.

To exercise these rights, please contact us at privacy@workflowanalyzer.com.`,
  },
  {
    id: 'cookies',
    title: '8. Cookies and Tracking',
    content: `We use cookies and similar tracking technologies to enhance your experience:

**Essential Cookies**: Required for the Service to function properly (authentication, security).

**Analytics Cookies**: Help us understand how visitors interact with our Service.

**Preference Cookies**: Remember your settings and preferences.

You can control cookies through your browser settings. Blocking certain cookies may affect your ability to use some features of our Service.

We also use analytics services like Google Analytics to collect usage information. You can opt out of Google Analytics by installing the browser add-on available at tools.google.com/dlpage/gaoptout.`,
  },
  {
    id: 'international',
    title: '9. International Transfers',
    content: `Your information may be transferred to and processed in countries other than your own. We take steps to ensure that your information receives adequate protection in accordance with this Privacy Policy and applicable law.

For transfers from the European Economic Area (EEA), we rely on:
• Standard Contractual Clauses approved by the European Commission
• Adequacy decisions where applicable
• Your explicit consent for specific transfers

If you have questions about international data transfers, please contact us.`,
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    content: `Our Service is not intended for children under the age of 16. We do not knowingly collect personal information from children under 16.

If we become aware that we have collected personal information from a child under 16, we will take steps to delete that information promptly. If you believe we have collected information from a child under 16, please contact us immediately.`,
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by:
• Posting the new Privacy Policy on this page
• Updating the "Last updated" date at the top
• Sending you an email notification for significant changes

We encourage you to review this Privacy Policy periodically. Your continued use of the Service after changes constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:

**Data Protection Officer**
Email: privacy@workflowanalyzer.com

**Mailing Address**
Workflow Analyzer
123 Tech Street
San Francisco, CA 94105
United States

For EU residents, you also have the right to lodge a complaint with your local data protection authority.`,
  },
]

const lastUpdated = 'January 8, 2026'
const readingTime = '10 min read'

export default function PrivacyPage() {
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

  // Parse markdown-style formatting in content
  const formatContent = (content: string) => {
    return content.split('\n\n').map((paragraph, pIndex) => {
      // Handle bold text with **
      const formattedText = paragraph.split(/(\*\*[^*]+\*\*)/).map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIndex} className="text-foreground font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })

      return (
        <p
          key={pIndex}
          className="text-muted-foreground leading-relaxed mb-4 whitespace-pre-line print:text-gray-700"
        >
          {formattedText}
        </p>
      )
    })
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
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Legal</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-6">
                Privacy Policy
              </h1>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 mb-6 print:hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success text-sm rounded-full">
                  <Lock className="w-4 h-4" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full">
                  <Globe className="w-4 h-4" />
                  <span>GDPR Ready</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent text-sm rounded-full">
                  <Shield className="w-4 h-4" />
                  <span>Data Encrypted</span>
                </div>
              </div>

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
                        href="/terms"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Terms of Service
                      </Link>
                      <a
                        href="mailto:privacy@workflowanalyzer.com"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Contact Privacy Team
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
                      <div className="flex items-center gap-3 mb-4">
                        {section.icon && (
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center print:hidden">
                            <section.icon className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground print:text-black">
                          {section.title}
                        </h2>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        {formatContent(section.content)}
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
