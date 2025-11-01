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
import { Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface SponsorDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
}

export function SponsorDetailsModal({
  isOpen,
  onClose,
  sessionId,
}: SponsorDetailsModalProps) {
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB')
        return
      }

      setLogoFile(file)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a sponsor name')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('sessionId', sessionId)
      formData.append('name', name.trim())
      if (websiteUrl.trim()) {
        formData.append('websiteUrl', websiteUrl.trim())
      }
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const response = await fetch('/api/sponsors/complete', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save sponsor details')
      }

      // Success! Close modal and refresh page
      onClose()
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Sponsorship</DialogTitle>
          <DialogDescription>
            Add your details to display on the sponsor grid. You can update these later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sponsor Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name or Company"
              disabled={isLoading}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed on the grid
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website URL (Optional)</Label>
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Your grid cell will link to this URL
            </p>
          </div>

          <div className="space-y-2">
            <Label>Logo / Image (Optional)</Label>
            {logoPreview ? (
              <div className="relative">
                <div className="relative w-full h-40 border-2 border-border rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveLogo}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="logo"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload logo
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, SVG (max 2MB)
                </span>
                <input
                  id="logo"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              Square images work best (recommended 200x200px)
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Skip for Now
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Display'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
