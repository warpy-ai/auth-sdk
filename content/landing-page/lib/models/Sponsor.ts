import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISponsor extends Document {
  gridPosition: number
  name: string
  logoUrl?: string
  websiteUrl?: string
  monthlyAmount: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripeStatus?: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SponsorSchema = new Schema<ISponsor>(
  {
    gridPosition: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    websiteUrl: {
      type: String,
      default: null,
    },
    monthlyAmount: {
      type: Number,
      required: true,
      min: 500, // $5.00 minimum in cents
    },
    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeStatus: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation during hot reload
export const Sponsor: Model<ISponsor> =
  mongoose.models.Sponsor || mongoose.model<ISponsor>('Sponsor', SponsorSchema)
