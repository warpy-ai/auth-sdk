import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/mongodb'
import { Sponsor } from '@/lib/models/Sponsor'
import { SponsorCheckout } from '@/lib/models/SponsorCheckout'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Update checkout record
        await SponsorCheckout.findOneAndUpdate(
          { sessionId: session.id },
          {
            status: 'completed',
            email: session.customer_email || null,
          }
        )

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Create sponsor record (without details yet)
        const gridPosition = parseInt(session.metadata?.gridPosition || '0')
        const amount = parseInt(session.metadata?.amount || '0')

        await Sponsor.create({
          gridPosition,
          name: 'Pending Setup',
          monthlyAmount: amount,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Update sponsor status
        await Sponsor.updateMany(
          { stripeSubscriptionId: subscription.id },
          {
            stripeStatus: subscription.status,
            expiresAt:
              subscription.status === 'canceled' && subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000)
                : null,
          }
        )

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Mark sponsor as expired
        await Sponsor.updateMany(
          { stripeSubscriptionId: subscription.id },
          {
            stripeStatus: 'canceled',
            expiresAt: new Date(),
          }
        )

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
