import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    lang: {
      type: String,
      trim: true,
      maxlength: [10, 'Language code cannot exceed 10 characters'],
      default: 'sv',
    },
    source: {
      type: String,
      trim: true,
      maxlength: [50, 'Source cannot exceed 50 characters'],
      default: 'footer-newsletter',
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Fast lookups and unique constraint on email
newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ createdAt: -1 });

export const Newsletter = mongoose.model('Newsletter', newsletterSchema);
