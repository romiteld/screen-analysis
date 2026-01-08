import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId
        const videoSeconds = parseInt(session.metadata?.videoSeconds || '0')
        
        // Create upload record
        const { data: upload, error } = await supabase
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

        if (error) {
          console.error('Failed to create upload record:', error)
          return NextResponse.json(
            { error: 'Failed to create upload record' },
            { status: 500 }
          )
        }

        console.log('Upload record created:', upload.id)
      }
      break
    }

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}