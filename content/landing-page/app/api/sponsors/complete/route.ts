import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Sponsor } from '@/lib/models/Sponsor'
import { SponsorCheckout } from '@/lib/models/SponsorCheckout'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const name = formData.get('name') as string
    const websiteUrl = formData.get('websiteUrl') as string | null
    const logoFile = formData.get('logo') as File | null

    if (!sessionId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the checkout session
    const checkout = await SponsorCheckout.findOne({ sessionId })

    if (!checkout || checkout.status !== 'completed') {
      return NextResponse.json(
        { error: 'Invalid or incomplete checkout session' },
        { status: 400 }
      )
    }

    // Find the sponsor record
    const sponsor = await Sponsor.findOne({ gridPosition: checkout.gridPosition })

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor record not found' },
        { status: 404 }
      )
    }

    let logoUrl: string | null = null

    // Handle logo upload if provided
    if (logoFile && logoFile.size > 0) {
      // Validate file type
      if (!logoFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Invalid file type' },
          { status: 400 }
        )
      }

      // Validate file size (2MB max)
      if (logoFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large (max 2MB)' },
          { status: 400 }
        )
      }

      // Upload to Vercel Blob
      const blob = await put(`sponsors/${logoFile.name}`, logoFile, {
        access: 'public',
        addRandomSuffix: true, // Adds random suffix to prevent collisions
      })

      logoUrl = blob.url
    }

    // Update sponsor with details
    await Sponsor.findByIdAndUpdate(sponsor._id, {
      name,
      websiteUrl: websiteUrl || null,
      logoUrl,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete sponsor error:', error)
    return NextResponse.json(
      { error: 'Failed to save sponsor details' },
      { status: 500 }
    )
  }
}
