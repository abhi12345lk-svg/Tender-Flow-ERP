import mongoose from 'mongoose';

const subdivisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subdivision name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    inCharge: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

export const Subdivision = mongoose.model('Subdivision', subdivisionSchema);
