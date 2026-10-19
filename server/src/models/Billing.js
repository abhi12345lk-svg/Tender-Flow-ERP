import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema(
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
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      required: [true, 'Invoice date is required'],
    },
    completionDate: {
      type: Date,
      default: null,
    },
    handoverDate: {
      type: Date,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Basic bill amount is required'],
      min: [0, 'Bill amount cannot be negative'],
    },
    // Configurable GST assumptions
    gstRate: {
      type: Number,
      min: [0, 'GST rate cannot be negative'],
      default: 18, // Configurable tax assumption (e.g. 18%)
    },
    gstAmount: {
      type: Number,
      min: [0, 'GST amount cannot be negative'],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Passed'],
      default: 'Submitted',
      index: true,
    },
    // Statutory Deductions Form
    deductions: {
      sdAmount: { type: Number, min: 0, default: 0 },
      tdsAmount: { type: Number, min: 0, default: 0 },
      labourCess: { type: Number, min: 0, default: 0 },
      royalty: { type: Number, min: 0, default: 0 },
      penalty: { type: Number, min: 0, default: 0 },
    },
    totalDeductions: {
      type: Number,
      min: [0, 'Total deductions cannot be negative'],
      default: 0,
    },
    netPayable: {
      type: Number,
      min: [0, 'Net payable cannot be negative'],
      default: 0,
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
    financialYear: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

billingSchema.index({
  invoiceNumber: 'text',
  workOrderNumber: 'text',
  contractorName: 'text',
});

export const Billing = mongoose.model('Billing', billingSchema);
