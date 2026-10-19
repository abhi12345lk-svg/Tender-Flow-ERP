import mongoose from 'mongoose';

const financialYearSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Financial year label is required (e.g. 2024-2025)'],
      unique: true,
      trim: true,
      match: [/^\d{4}-\d{4}$/, 'Financial year format must be YYYY-YYYY (e.g. 2024-2025)'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          return !this.startDate || value > this.startDate;
        },
        message: 'End date must be strictly after Start date',
      },
    },
    status: {
      type: String,
      enum: ['Active', 'Upcoming', 'Closed'],
      default: 'Upcoming',
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent overlapping dates if business rule requires it
financialYearSchema.pre('save', async function (next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    const overlapping = await mongoose.models.FinancialYear.findOne({
      _id: { $ne: this._id },
      $or: [
        { startDate: { $lte: this.endDate }, endDate: { $gte: this.startDate } },
      ],
    });
    if (overlapping) {
      return next(new Error(`Financial Year date range overlaps with existing fiscal year "${overlapping.label}"`));
    }
  }
  next();
});

export const FinancialYear = mongoose.model('FinancialYear', financialYearSchema);
