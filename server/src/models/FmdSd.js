import mongoose from 'mongoose';

const fmdSdSchema = new mongoose.Schema(
  {
    tenderNumber: {
      type: String,
      required: [true, 'Tender Number is required'],
      trim: true,
      index: true,
    },
    tenderTitle: {
      type: String,
      required: [true, 'Tender Title is required'],
      trim: true,
    },
    workOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      default: null,
      index: true,
    },
    workOrderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    contractorName: {
      type: String,
      trim: true,
      default: '',
    },
    fmdStatus: {
      type: String,
      enum: [
        'Verified & Retained',
        'Under Scrutiny',
        'Pending Bank Confirmation',
        'Released',
        'Forfeited',
      ],
      default: 'Verified & Retained',
      index: true,
    },
    sdAmount: {
      type: Number,
      min: [0, 'SD Amount cannot be negative'],
      default: 0,
    },
    emdAmount: {
      type: Number,
      min: [0, 'EMD Amount cannot be negative'],
      default: 0,
    },
    instrumentType: {
      type: String,
      trim: true,
      default: 'Bank Guarantee (FDR / BG)',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    instrumentReference: {
      type: String,
      trim: true,
      default: '',
    },
    validityDate: {
      type: Date,
      default: null,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    // Uploaded document metadata only (no unbounded base64 strings)
    uploadedDocuments: [
      {
        name: { type: String, required: true },
        size: { type: String, default: '' },
        type: { type: String, default: 'application/pdf' },
        uploadedAt: { type: String, default: '' },
        storageUrl: { type: String, default: '' },
        path: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

fmdSdSchema.index({
  tenderNumber: 'text',
  tenderTitle: 'text',
  contractorName: 'text',
  workOrderNumber: 'text',
});

export const FmdSd = mongoose.model('FmdSd', fmdSdSchema);
