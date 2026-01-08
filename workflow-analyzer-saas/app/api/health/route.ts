import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { setCacheHeaders } from '@/lib/utils/api-helpers'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    api: ServiceStatus
    database: ServiceStatus
    storage: ServiceStatus
    stripe: ServiceStatus
    cloudRun?: ServiceStatus
  }
  version: string
  environment: string
}

interface ServiceStatus {
  status: 'up' | 'down' | 'unknown'
  responseTime?: number
  error?: string
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    
    // Simple query to check database connectivity
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) throw error
    
    return {
      status: 'up',
      responseTime: Date.now() - start
    }
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message
    }
  }
}

async function checkStorage(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    
    // Check if we can list storage buckets
    const { error } = await supabase.storage.listBuckets()
    
    if (error) throw error
    
    return {
      status: 'up',
      responseTime: Date.now() - start
    }
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message
    }
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    // Simple check to see if we can retrieve account info
    await stripe.accounts.retrieve()
    
    return {
      status: 'up',
      responseTime: Date.now() - start
    }
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message
    }
  }
}

async function checkCloudRun(): Promise<ServiceStatus> {
  if (!process.env.CLOUD_RUN_SERVICE_URL) {
    return {
      status: 'unknown',
      error: 'Cloud Run URL not configured'
    }
  }
  
  const start = Date.now()
  try {
    const response = await fetch(`${process.env.CLOUD_RUN_SERVICE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUD_RUN_SERVICE_TOKEN || ''}`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return {
      status: 'up',
      responseTime: Date.now() - start
    }
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message
    }
  }
}

export async function GET(request: NextRequest) {
  // Check if this is a simple health check (for load balancers)
  const { searchParams } = new URL(request.url)
  const simple = searchParams.get('simple') === 'true'
  
  if (simple) {
    // Quick response for load balancer health checks
    return NextResponse.json({ status: 'ok' })
  }
  
  // Detailed health check
  const [database, storage, stripeStatus, cloudRun] = await Promise.allSettled([
    checkDatabase(),
    checkStorage(),
    checkStripe(),
    checkCloudRun()
  ])
  
  const services: HealthStatus['services'] = {
    api: { status: 'up' },
    database: database.status === 'fulfilled' ? database.value : { status: 'down', error: 'Check failed' },
    storage: storage.status === 'fulfilled' ? storage.value : { status: 'down', error: 'Check failed' },
    stripe: stripeStatus.status === 'fulfilled' ? stripeStatus.value : { status: 'down', error: 'Check failed' }
  }
  
  if (cloudRun.status === 'fulfilled') {
    services.cloudRun = cloudRun.value
  }
  
  // Determine overall health status
  const criticalServices = [services.database, services.stripe]
  const hasDownService = criticalServices.some(s => s.status === 'down')
  const hasDegradedService = Object.values(services).some(s => s.status === 'unknown')
  
  const health: HealthStatus = {
    status: hasDownService ? 'unhealthy' : hasDegradedService ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    services,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  }
  
  const response = NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503
  })
  
  // Cache for 30 seconds
  return setCacheHeaders(response, 30, 30)
}

// Readiness check for Kubernetes
export async function HEAD() {
  try {
    // Quick database check
    const supabase = await createClient()
    await supabase.from('profiles').select('id').limit(1)
    
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}