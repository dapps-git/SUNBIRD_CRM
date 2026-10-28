const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    productName: {
      type: String,
      required: [true, 'Product or equipment name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Solar Panels',
        'Inverter',
        'Mounting Structure',
        'Battery',
        'Cables & Wiring',
        'Safety & Breakers',
        'Other',
      ],
      default: 'Solar Panels',
    },
    specification: {
      type: String,
      default: '',
    },
    brand: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 1,
    },
    unit: {
      type: String,
      default: 'Nos',
    },
    serialNumbers: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Allocated', 'Dispatched', 'Installed'],
      default: 'Allocated',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', MaterialSchema);
