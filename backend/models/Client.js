const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema(
  {
    clientNumber: {
      type: String,
      unique: true,
    },
    // Transferred / Basic Customer Information
    fullName: {
      type: String,
      required: [true, 'Please provide customer full name'],
      trim: true,
    },
    place: {
      type: String,
      required: [true, 'Please provide place/city'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    fullAddress: {
      type: String,
      required: [true, 'Please provide full address'],
      trim: true,
    },
    gpsLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      locationUrl: { type: String, default: '' },
      rawText: { type: String, default: '' },
    },
    originalLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },

    // Referral & Lead Details
    leadSource: {
      type: String,
      default: 'Organic enquiries',
    },
    referredPersonName: {
      type: String,
      trim: true,
      default: '',
    },
    referredPersonPhone: {
      type: String,
      trim: true,
      default: '',
    },
    referralSourceDetails: {
      type: String,
      default: '',
    },
    assignedHandlingPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Quotation & Project Pricing
    quotationAmount: {
      type: Number,
      default: 0,
    },
    finalProjectPrice: {
      type: Number,
      default: 0,
    },
    systemCapacity: {
      type: String,
      default: '', // e.g. "5 kW On-Grid"
    },
    materialsEquipmentDetails: {
      type: String,
      default: '',
    },
    warrantyDetails: {
      type: String,
      default: '',
    },
    servicePeriodStartDate: {
      type: Date,
      default: null,
    },
    servicePeriodEndDate: {
      type: Date,
      default: null,
    },

    // Financial & Payment Tracking
    advancePaymentAmount: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Fully Paid'],
      default: 'Pending',
    },

    // Commission Tracking
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed',
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    calculatedCommission: {
      type: Number,
      default: 0,
    },
    commissionStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    commissionPaidDate: {
      type: Date,
      default: null,
    },

    // KYC Verification Status
    kycStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    kycNotes: {
      type: String,
      default: '',
    },

    // Project State
    projectStatus: {
      type: String,
      enum: ['Approved', 'Planning', 'Installation in Progress', 'Completed', 'On Hold'],
      default: 'Approved',
    },

    // History and Notes
    history: [
      {
        action: String,
        details: String,
        performedBy: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate client number & recalculate remaining balance
ClientSchema.pre('save', async function (next) {
  if (!this.clientNumber) {
    const count = await mongoose.model('Client').countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.clientNumber = `SB-CL-${seq}`;
  }

  // Calculate remaining balance: Final Price - Total Paid
  const finalPrice = Number(this.finalProjectPrice) || 0;
  const paid = Number(this.totalPaid) || 0;
  this.remainingBalance = Math.max(0, finalPrice - paid);

  if (paid === 0 && finalPrice > 0) {
    this.paymentStatus = 'Pending';
  } else if (paid > 0 && paid < finalPrice) {
    this.paymentStatus = 'Partially Paid';
  } else if (paid >= finalPrice && finalPrice > 0) {
    this.paymentStatus = 'Fully Paid';
  }

  // Calculate commission if percentage
  if (this.commissionType === 'percentage' && this.commissionRate > 0) {
    this.calculatedCommission = Math.round((finalPrice * this.commissionRate) / 100);
  } else if (this.commissionType === 'fixed') {
    this.calculatedCommission = Number(this.commissionRate) || 0;
  }

  next();
});

module.exports = mongoose.model('Client', ClientSchema);
