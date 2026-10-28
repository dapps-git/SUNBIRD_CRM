const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    systemCapacity: {
      type: String,
      default: '',
    },
    quotationAmount: {
      type: Number,
      required: [true, 'Quotation amount is required'],
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: [true, 'Final project price is required'],
      default: 0,
    },
    materialsDetails: {
      type: String,
      default: '',
    },
    negotiationDetails: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Revised', 'Rejected'],
      default: 'Draft',
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

QuotationSchema.pre('save', async function (next) {
  if (!this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.quotationNumber = `SB-QT-${seq}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', QuotationSchema);
