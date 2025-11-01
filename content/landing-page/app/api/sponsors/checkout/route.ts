import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/mongodb'
import { Sponsor } from '@/lib/models/Sponsor'
import { SponsorCheckout } from '@/lib/models/SponsorCheckout'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { gridPosition, amount } = body

    // Validate inputs
    if (typeof gridPosition !== 'number' || gridPosition < 0) {
      return NextResponse.json(
        { error: 'Invalid grid position' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount < 500) {
      return NextResponse.json(
        { error: 'Minimum amount is $5.00 (500 cents)' },
        { status: 400 }
      )
    }

    // Check if position is already taken
    const existingSponsor = await Sponsor.findOne({ gridPosition })

    if (existingSponsor) {
      return NextResponse.json(
        { error: 'This position is already sponsored' },
        { status: 409 }
      )
    }

    // Check if there's a pending checkout for this position
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const pendingCheckout = await SponsorCheckout.findOne({
      gridPosition,
      status: 'pending',
      createdAt: { $gte: thirtyMinutesAgo },
    })

    if (pendingCheckout) {
      return NextResponse.json(
        { error: 'This position is currently being reserved' },
        { status: 409 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Sponsor Grid Position #${gridPosition + 1}`,
              description: 'Monthly sponsorship on the hero grid',
            },
            unit_amount: amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?canceled=true`,
      metadata: {
        gridPosition: gridPosition.toString(),
        amount: amount.toString(),
      },
    })

    // Create pending checkout record
    await SponsorCheckout.create({
      gridPosition,
      sessionId: session.id,
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
