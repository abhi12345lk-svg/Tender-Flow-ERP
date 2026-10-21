import mongoose from 'mongoose';

const workOrderSchema = new mongoose.Schema(
  {
    tenderNumber: {
      type: String,
      required: [true, 'Tender Number is required'],
      trim: true,
      index: true,
    },
    workOrderNumber: {
      type: String,
      required: [true, 'Work Order Number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    workOrderDate: {
      type: Date,
      required: [true, 'Work Order Date is required'],
    },
    // Preserve TD exactly without inventing meaning
    td: {
      type: String,
      trim: true,
      default: '',
    },
    emdNumber: {
      type: String,
      trim: true,
      default: '',
    },
    estimateNumber: {
      type: String,
      trim: true,
      default: '',
    },
    workOrderAmount: {
      type: Number,
      required: [true, 'Work Order Amount is required'],
      min: [0, 'Work Order Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Issued', 'In Progress', 'Completed', 'Terminated'],
      default: 'Issued',
      index: true,
    },
    emdAmount: {
      type: Number,
      min: [0, 'EMD Amount cannot be negative'],
      default: 0,
    },
    sdAmount: {
      type: Number,
      min: [0, 'SD Amount cannot be negative'],
      default: 0,
    },
    financialYear: {
      type: String,
      required: [true, 'Financial Year association is required'],
      trim: true,
      index: true,
    },
    subdivision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subdivision',
      default: null,
    },
    subdivisionName: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    contractorName: {
      type: String,
      trim: true,
      default: '',
    },
    stipulatedDateOfCompletion: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search across tender, work order, contractor, title, td
workOrderSchema.index({
  tenderNumber: 'text',
  workOrderNumber: 'text',
  contractorName: 'text',
  title: 'text',
  td: 'text',
});

export const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
