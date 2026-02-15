import mongoose, { Schema } from 'mongoose';
import { IDocument } from '../types';
import { nanoid } from 'nanoid';

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      default: 'Untitled Document',
    },
    content: {
      type: Schema.Types.Mixed,
      default: { ops: [] }, // Quill Delta format
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Document owner is required'],
      index: true,
    },
    shareableLink: {
      type: String,
      unique: true,
      index: true,
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate shareable link before saving
documentSchema.pre('save', function (next) {
  if (!this.shareableLink) {
    this.shareableLink = nanoid(12);
  }
  next();
});

// Create index for efficient queries
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ shareableLink: 1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);