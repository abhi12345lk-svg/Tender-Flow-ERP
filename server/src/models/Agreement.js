import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema(
  {
    workOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      required: [true, 'Related Work Order reference is required'],
      index: true,
    },
    workOrderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    tenderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    contractorName: {
      type: String,
      trim: true,
      default: '',
    },
    agreementNumber: {
      type: String,
      required: [true, 'Agreement Number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    templateType: {
      type: String,
      required: [true, 'Agreement template type is required'],
      trim: true,
      default: 'Standard PWD Contract Form F-2 (Lump Sum)',
    },
    agreementDate: {
      type: Date,
      required: [true, 'Agreement execution date is required'],
    },
    stampDutyNumber: {
      type: String,
      trim: true,
      default: '',
    },
    stampDutyAmount: {
      type: Number,
      min: [0, 'Stamp duty amount cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Executed', 'Closed'],
      default: 'Active',
      index: true,
    },
    clausesCount: {
      type: Number,
      min: [1, 'Must have at least 1 clause'],
      default: 36,
    },
    documentTitle: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    // File metadata array (Never store unbounded base64 file payloads directly in MongoDB)
    fileMetadata: [
      {
        fileName: { type: String, required: true },
        fileSize: { type: String },
        mimeType: { type: String },
        storageUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

agreementSchema.index({
  agreementNumber: 'text',
  workOrderNumber: 'text',
  contractorName: 'text',
});

export const Agreement = mongoose.model('Agreement', agreementSchema);
