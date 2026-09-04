import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email or Phone is required'],
      trim: true,
      maxlength: [200, 'Contact field cannot exceed 200 characters'],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company cannot exceed 200 characters'],
      default: '',
    },
    service: {
      type: String,
      trim: true,
      maxlength: [200, 'Service cannot exceed 200 characters'],
      default: '',
    },
    budget: {
      type: String,
      trim: true,
      maxlength: [200, 'Budget cannot exceed 200 characters'],
      default: '',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
      default: '',
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
      default: 'connect-with-us',
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'contacted', 'archived', 'closed'],
      default: 'new',
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

// Index for fast search and listing by creation date and status
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ email: 1 });

export const Lead = mongoose.model('Lead', leadSchema);
