const mongoose = require('mongoose');

const CommissionSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
    },
    referredPersonName: {
      type: String,
      required: [true, 'Referred person name is required'],
      trim: true,
    },
    referredPersonPhone: {
      type: String,
      trim: true,
      default: '',
    },
    leadSource: {
      type: String,
      default: 'Organic enquiries',
    },
    assignedHandlingPerson: {
      type: String,
      default: '',
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed',
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    projectPrice: {
      type: Number,
      default: 0,
    },
    calculatedAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Commission', CommissionSchema);
