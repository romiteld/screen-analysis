import { createClient } from '@/lib/supabase/server'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  userId?: string
  metadata?: Record<string, any>
  error?: {
    message: string
    stack?: string
    code?: string
  }
  timestamp: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logToSupabase = process.env.ENABLE_SUPABASE_LOGGING === 'true'

  private formatMessage(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    const context = entry.context ? ` [${entry.context}]` : ''
    return `${prefix}${context} ${entry.message}`
  }

  private async logToDatabase(entry: LogEntry) {
    if (!this.logToSupabase) return

    try {
      const supabase = await createClient()
      
      // Create a logs table if you want to persist logs
      // For now, we'll just skip database logging
      // You can implement this based on your needs
    } catch (error) {
      // Don't throw errors from logging
      console.error('Failed to log to database:', error)
    }
  }

  private log(level: LogLevel, message: string, options?: {
    context?: string
    userId?: string
    metadata?: Record<string, any>
    error?: Error | any
  }) {
    const entry: LogEntry = {
      level,
      message,
      context: options?.context,
      userId: options?.userId,
      metadata: options?.metadata,
      timestamp: new Date().toISOString()
    }

    if (options?.error) {
      entry.error = {
        message: options.error.message || String(options.error),
        stack: options.error.stack,
        code: options.error.code
      }
    }

    // Console output
    const formattedMessage = this.formatMessage(entry)
    
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) console.debug(formattedMessage, entry.metadata)
        break
      case LogLevel.INFO:
        console.info(formattedMessage, entry.metadata)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.metadata)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.error || entry.metadata)
        break
    }

    // Async database logging
    this.logToDatabase(entry).catch(() => {
      // Ignore logging errors
    })
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, { metadata })
  }

  info(message: string, options?: {
    context?: string
    userId?: string
    metadata?: Record<string, any>
  }) {
    this.log(LogLevel.INFO, message, options)
  }

  warn(message: string, options?: {
    context?: string
    userId?: string
    metadata?: Record<string, any>
  }) {
    this.log(LogLevel.WARN, message, options)
  }

  error(message: string, error?: Error | any, options?: {
    context?: string
    userId?: string
    metadata?: Record<string, any>
  }) {
    this.log(LogLevel.ERROR, message, {
      ...options,
      error
    })
  }

  // Specialized logging methods
  apiError(
    endpoint: string,
    error: Error | any,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.error(`API Error: ${endpoint}`, error, {
      context: 'api',
      userId,
      metadata: {
        ...metadata,
        endpoint
      }
    })
  }

  webhookReceived(
    source: string,
    eventType: string,
    metadata?: Record<string, any>
  ) {
    this.info(`Webhook received: ${eventType}`, {
      context: 'webhook',
      metadata: {
        ...metadata,
        source,
        eventType
      }
    })
  }

  analysisEvent(
    analysisId: string,
    event: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.info(`Analysis ${event}: ${analysisId}`, {
      context: 'analysis',
      userId,
      metadata: {
        ...metadata,
        analysisId,
        event
      }
    })
  }

  paymentEvent(
    event: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.info(`Payment ${event}`, {
      context: 'payment',
      userId,
      metadata
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const logDebug = logger.debug.bind(logger)
export const logInfo = logger.info.bind(logger)
export const logWarn = logger.warn.bind(logger)
export const logError = logger.error.bind(logger)
export const logApiError = logger.apiError.bind(logger)
export const logWebhook = logger.webhookReceived.bind(logger)
export const logAnalysis = logger.analysisEvent.bind(logger)
export const logPayment = logger.paymentEvent.bind(logger)