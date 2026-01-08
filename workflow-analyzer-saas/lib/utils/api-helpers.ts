import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface ApiError {
  error: string
  details?: any
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  details?: any
}

// Centralized error logging
export function logError(context: string, error: any) {
  console.error(`[${context}] Error:`, {
    message: error?.message || 'Unknown error',
    code: error?.code,
    details: error?.details || error,
    timestamp: new Date().toISOString()
  })
}

// Standardized error responses
export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
): NextResponse<ApiError> {
  const response: ApiError = { error: message }
  if (details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status })
}

// Authentication check helper
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new AuthError('Unauthorized', 401)
  }
  
  return { user, supabase }
}

// Custom error classes
export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string = 'Resource not found',
    public status: number = 404
  ) {
    super(message)
    this.name = 'NotFoundError'
  }
}

// Request validation helpers
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => !data[field])
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      { missing_fields: missing }
    )
  }
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  return true
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implement HMAC signature verification
  // This is a placeholder - implement actual verification based on your webhook provider
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    logError('webhook-signature-verification', error)
    return false
  }
}

// Response caching helper
export function setCacheHeaders(
  response: NextResponse,
  maxAge: number = 60,
  sMaxAge: number = 120
): NextResponse {
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=60`
  )
  return response
}

// CORS headers helper
export function setCorsHeaders(
  response: NextResponse,
  origin: string = '*'
): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}