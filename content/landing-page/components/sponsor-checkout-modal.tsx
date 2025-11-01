'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface SponsorCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  gridPosition: number
}

export function SponsorCheckoutModal({
  isOpen,
  onClose,
  gridPosition,
}: SponsorCheckoutModalProps) {
  const [amount, setAmount] = useState('5')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    const amountNum = parseFloat(amount)

    if (isNaN(amountNum) || amountNum < 5) {
      setError('Minimum sponsorship amount is $5/month')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sponsors/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridPosition,
          amount: Math.round(amountNum * 100), // Convert to cents
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sponsor Grid Position #{gridPosition + 1}</DialogTitle>
          <DialogDescription>
            Choose your monthly sponsorship amount (minimum $5). You'll be able to add your logo and details after checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                min="5"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                placeholder="5.00"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: $5/month
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-muted/50 p-4 rounded-md space-y-2">
            <h4 className="font-medium text-sm">What you'll get:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your logo/image displayed on the hero grid</li>
              <li>• Link to your website (optional)</li>
              <li>• Prominent placement on the homepage</li>
              <li>• Support an open-source project</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Continue to Checkout'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
