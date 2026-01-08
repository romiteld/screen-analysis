import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { logError, logWebhook, logPayment } from '@/lib/utils/logger'
import { errorResponse } from '@/lib/utils/api-helpers'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    logError('Stripe webhook signature verification failed', err as Error, {
      context: 'stripe-webhook'
    })
    return errorResponse('Webhook signature verification failed', 400)
  }

  logWebhook('stripe', event.type, { eventId: event.id })
  
  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid') {
          const userId = session.metadata?.userId
          const videoSeconds = parseInt(session.metadata?.videoSeconds || '0')
          const uploadId = session.metadata?.uploadId
          
          logPayment('checkout.session.completed', userId, {
            videoSeconds,
            uploadId,
            paymentIntent: session.payment_intent,
            amount: session.amount_total
          })
          
          // Update existing upload record if uploadId is provided
          if (uploadId) {
            const { error: updateError } = await supabase
              .from('uploads')
              .update({
                status: 'paid',
                stripe_payment_intent: session.payment_intent as string,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                updated_at: new Date().toISOString()
              })
              .eq('id', uploadId)
              .eq('user_id', userId)

            if (updateError) {
              console.error('Failed to update upload record:', updateError)
              throw new Error('Failed to update upload record')
            }
          } else {
            // Create new upload record if no uploadId
            const { data: upload, error: createError } = await supabase
              .from('uploads')
              .insert({
                user_id: userId,
                seconds: videoSeconds,
                stripe_payment_intent: session.payment_intent as string,
                status: 'paid',
                amount: session.amount_total ? session.amount_total / 100 : 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (createError) {
              console.error('Failed to create upload record:', createError)
              throw new Error('Failed to create upload record')
            }

            console.log('Upload record created:', upload.id)
          }

          // Update user's stripe_customer_id if not set
          if (session.customer) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                stripe_customer_id: session.customer as string,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
              .is('stripe_customer_id', null)

            if (profileError) {
              console.error('Failed to update user profile with Stripe customer ID:', profileError)
            }
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment intent succeeded:', paymentIntent.id)
        
        // Update upload status if needed
        const { error } = await supabase
          .from('uploads')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent', paymentIntent.id)
          .eq('status', 'pending')

        if (error) {
          console.error('Failed to update upload status:', error)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        
        // Update upload status to failed
        const { error } = await supabase
          .from('uploads')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent', paymentIntent.id)

        if (error) {
          console.error('Failed to update upload status:', error)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('Charge refunded:', charge.id)
        
        // Update upload status to refunded
        if (charge.payment_intent) {
          const { error } = await supabase
            .from('uploads')
            .update({
              status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_payment_intent', charge.payment_intent as string)

          if (error) {
            console.error('Failed to update upload status to refunded:', error)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}