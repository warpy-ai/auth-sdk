'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SponsorDetailsModal } from '@/components/sponsor-details-modal'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [showModal, setShowModal] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    if (sessionId) {
      // Give webhook a moment to process
      setTimeout(() => {
        setIsVerifying(false)
        setShowModal(true)
      }, 2000)
    } else {
      setIsVerifying(false)
    }
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid Session</h1>
          <p className="text-muted-foreground">
            No checkout session found.
          </p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {isVerifying ? (
          <>
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Processing Your Sponsorship</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Thank you for sponsoring! Add your details to display on the grid.
            </p>
            <div className="pt-4">
              <Button onClick={() => setShowModal(true)} size="lg">
                Add Your Details
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              You can also skip this and add details later
            </p>
          </>
        )}

        <SponsorDetailsModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            window.location.href = '/'
          }}
          sessionId={sessionId}
        />
      </div>
    </div>
  )
}

export default function SponsorSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
