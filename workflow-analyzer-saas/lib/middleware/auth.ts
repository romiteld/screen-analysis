import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/utils/logger'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email?: string
    role?: string
  }
}

// List of public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/webhooks/stripe',
  '/api/webhooks/analysis',
  '/api/auth/callback'
]

// List of service-only routes
const SERVICE_ROUTES = [
  '/api/webhooks/analysis'
]

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const pathname = new URL(req.url).pathname
    
    // Check if route is public
    if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
      return handler(req as AuthenticatedRequest)
    }
    
    try {
      // Check for service token for service routes
      if (SERVICE_ROUTES.includes(pathname)) {
        const authHeader = req.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')
        
        if (token === process.env.SERVICE_SECRET_TOKEN) {
          return handler(req as AuthenticatedRequest)
        }
      }
      
      // Regular user authentication
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      // Add user to request
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role
      }
      
      return handler(req as AuthenticatedRequest)
      
    } catch (error) {
      logError('Authentication middleware error', error as Error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

// Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const identifier = req.headers.get('x-forwarded-for') || 
                        req.headers.get('x-real-ip') || 
                        'anonymous'
      
      const now = Date.now()
      const userLimit = rateLimitStore.get(identifier)
      
      if (!userLimit || now > userLimit.resetTime) {
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + windowMs
        })
      } else if (userLimit.count >= maxRequests) {
        const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000)
        
        return NextResponse.json(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
            }
          }
        )
      } else {
        userLimit.count++
      }
      
      const response = await handler(req)
      
      // Add rate limit headers
      if (userLimit) {
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', (maxRequests - userLimit.count).toString())
        response.headers.set('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString())
      }
      
      return response
    }
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  })
}, 60000) // Clean up every minute