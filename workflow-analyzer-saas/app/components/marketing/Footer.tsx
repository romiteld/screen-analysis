'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Zap, Mail, Twitter, Linkedin, Github, ArrowRight } from 'lucide-react'

const navigation = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'GitHub', href: '#', icon: Github },
  ],
}

export default function Footer() {
  return (
    <footer className="relative bg-card border-t border-border" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern dark:bg-dot-pattern-dark opacity-30 pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 lg:py-16 border-b border-border">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                Stay in the loop
              </h3>
              <p className="text-muted-foreground max-w-md">
                Get the latest updates on workflow automation and AI-powered insights delivered to your inbox.
              </p>
            </div>
            <form className="flex w-full max-w-md gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>
              <motion.button
                type="submit"
                className="px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-lg shadow-glow hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl text-foreground">
                  Workflow<span className="gradient-text">Analyzer</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Transform your manual workflows into efficient automated processes with AI-powered analysis.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {navigation.social.map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={item.name}
                  >
                    <item.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/cloudelipute-logo.svg"
                alt="Cloudelipute LLC"
                width={120}
                height={40}
                className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity duration-200"
              />
              <div className="h-4 w-px bg-border hidden md:block" />
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Cloudelipute LLC. All rights reserved.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Workflow Analyzer is a premium product of Cloudelipute LLC
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
