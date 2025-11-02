import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISponsorCheckout extends Document {
  gridPosition: number
  sessionId: string
  email?: string
  status: 'pending' | 'completed' | 'expired'
  createdAt: Date
  updatedAt: Date
}

const SponsorCheckoutSchema = new Schema<ISponsorCheckout>(
  {
    gridPosition: {
      type: Number,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation during hot reload
export const SponsorCheckout: Model<ISponsorCheckout> =
  mongoose.models.SponsorCheckout ||
  mongoose.model<ISponsorCheckout>('SponsorCheckout', SponsorCheckoutSchema)
