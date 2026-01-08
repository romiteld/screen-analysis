'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, Quote, Users, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Operations Manager',
    company: 'TechCorp',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    content: 'Workflow Analyzer identified 3 hours of repetitive tasks in my weekly routine. The automation recommendations were spot-on and easy to implement.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Product Designer',
    company: 'DesignStudio',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    content: "The AI analysis was incredibly detailed. It found inefficiencies I didn't even know existed. Now I save 5+ hours every week!",
    rating: 5,
  },
  {
    name: 'Emily Johnson',
    role: 'Marketing Director',
    company: 'GrowthCo',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    content: "The PDF reports are professional and easy to share with my team. We've implemented several recommendations and seen immediate improvements.",
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Software Engineer',
    company: 'DevTools Inc',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    content: 'As a developer, I was skeptical, but the tool identified several manual processes I could script. The ROI was immediate.',
    rating: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'CEO',
    company: 'StartupXYZ',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop',
    content: "We've rolled this out across our entire team. The time savings and efficiency gains have been transformative for our startup.",
    rating: 5,
  },
  {
    name: 'James Wilson',
    role: 'Data Analyst',
    company: 'Analytics Pro',
    image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop',
    content: 'The integration with Loom is seamless. I just share my recordings and get actionable insights within minutes.',
    rating: 5,
  },
]

const stats = [
  { icon: Users, value: '10,000+', label: 'Happy Users' },
  { icon: Clock, value: '50,000+', label: 'Hours Saved' },
  { icon: Award, value: '4.9/5', label: 'Average Rating' },
]

// Animated counter for stats
function AnimatedStat({ value }: { value: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    if (isInView) {
      const numMatch = value.match(/[\d,]+/)
      if (numMatch) {
        const targetNum = parseInt(numMatch[0].replace(',', ''))
        const duration = 1500
        const steps = 60
        let current = 0
        const increment = targetNum / steps

        const timer = setInterval(() => {
          current += increment
          if (current >= targetNum) {
            setDisplayValue(value)
            clearInterval(timer)
          } else {
            const formatted = value.replace(numMatch[0], Math.floor(current).toLocaleString())
            setDisplayValue(formatted)
          }
        }, duration / steps)

        return () => clearInterval(timer)
      } else {
        setDisplayValue(value)
      }
    }
  }, [isInView, value])

  return <span ref={ref}>{displayValue}</span>
}

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', checkScroll)
      checkScroll()
      return () => ref.removeEventListener('scroll', checkScroll)
    }
  }, [])

  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">Customer Stories</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4"
          >
            Loved by Professionals Worldwide
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Join thousands who are saving hours every week with AI-powered workflow analysis
          </motion.p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative mb-16">
          {/* Navigation Buttons */}
          <div className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10">
            <motion.button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-3 rounded-full bg-card border border-border shadow-lg transition-all ${
                canScrollLeft ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
              whileHover={canScrollLeft ? { scale: 1.1 } : {}}
              whileTap={canScrollLeft ? { scale: 0.95 } : {}}
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </motion.button>
          </div>
          <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
            <motion.button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-3 rounded-full bg-card border border-border shadow-lg transition-all ${
                canScrollRight ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
              whileHover={canScrollRight ? { scale: 1.1 } : {}}
              whileTap={canScrollRight ? { scale: 0.95 } : {}}
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </motion.button>
          </div>

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-shrink-0 w-[320px] snap-start"
              >
                <div className="h-full bg-card rounded-2xl border border-border p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
                  {/* Quote Icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Quote className="w-5 h-5 text-primary" />
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-4">
                    &quot;{testimonial.content}&quot;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile Scroll Indicator */}
          <div className="flex justify-center gap-2 mt-6 lg:hidden">
            {testimonials.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-border"
              />
            ))}
          </div>
        </div>

        {/* Stats Section - Fixed Responsive Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-3xl border border-primary/20 p-8 lg:p-12">
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-4xl lg:text-5xl font-display font-bold gradient-text">
                      <AnimatedStat value={stat.value} />
                    </span>
                  </div>
                  <p className="text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
