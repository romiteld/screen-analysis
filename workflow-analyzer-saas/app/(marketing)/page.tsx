import type { Metadata } from 'next'
import Navigation from '@/app/components/marketing/Navigation'
import Hero from '@/app/components/marketing/Hero'
import Features from '@/app/components/marketing/Features'
import Pricing from '@/app/components/marketing/Pricing'
import CTA from '@/app/components/marketing/CTA'
import Footer from '@/app/components/marketing/Footer'
import SmoothScroll from '@/app/components/marketing/SmoothScroll'

export const metadata: Metadata = {
  title: 'Workflow Analyzer - AI-Powered Workflow Automation Analysis',
  description: 'Transform your manual workflows into automated processes. Upload screen recordings and get AI-powered analysis with actionable automation recommendations.',
  keywords: 'workflow automation, screen recording analysis, AI workflow analysis, process automation, productivity tools, workflow optimization',
  openGraph: {
    title: 'Workflow Analyzer - AI-Powered Workflow Automation Analysis',
    description: 'Transform your manual workflows into automated processes with AI-powered analysis.',
    type: 'website',
    url: 'https://workflowanalyzer.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Workflow Analyzer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Workflow Analyzer - AI-Powered Workflow Automation Analysis',
    description: 'Transform your manual workflows into automated processes with AI-powered analysis.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function MarketingPage() {
  return (
    <>
      <SmoothScroll />
      <Navigation />
      <main className="min-h-screen">
        <Hero />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}