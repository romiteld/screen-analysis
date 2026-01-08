import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const getStripeJs = async () => {
  const { loadStripe } = await import('@stripe/stripe-js')
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// Calculate price based on video length
export function calculatePrice(videoSeconds: number): number {
  const minutes = Math.ceil(videoSeconds / 60)
  if (minutes <= 5) {
    return 100 // $1.00 base price
  }
  return 100 + (minutes - 5) * 15 // $0.15 per minute after 5 minutes
}