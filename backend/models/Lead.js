const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    leadNumber: {
      type: String,
      unique: true,
    },
    // The 5 Mandatory Basic Fields
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
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
    // Lead Lifecycle Status
    status: {
      type: String,
      enum: ['New Lead', 'Contacted', 'Follow-Up', 'Work Approved', 'Not Approved', 'Converted to Client'],
      default: 'New Lead',
    },
    // Source & Handling
    leadSource: {
      type: String,
      enum: [
        'Instagram',
        'Meta Ads',
        'Google Ads',
        'Word of mouth',
        'Organic enquiries',
        'Phone calls',
        'Walk-ins',
        'Referral',
        'Other',
      ],
      default: 'Organic enquiries',
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Conversion tracking
    isConverted: {
      type: Boolean,
      default: false,
    },
    convertedClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    convertedAt: {
      type: Date,
      default: null,
    },
    // Notes & Activity history
    history: [
      {
        action: String,
        performedBy: String,
        details: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate sequential-style lead number before save
LeadSchema.pre('save', async function (next) {
  if (!this.leadNumber) {
    const count = await mongoose.model('Lead').countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.leadNumber = `SB-LD-${seq}`;
  }
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
