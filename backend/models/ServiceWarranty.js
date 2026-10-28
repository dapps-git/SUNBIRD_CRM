const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema(
  {
    claimNumber: {
      type: String,
      default: '',
    },
    issueTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    reportedDate: {
      type: Date,
      default: Date.now,
    },
    resolvedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const ServiceWarrantySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
      unique: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    panelsWarrantyYears: {
      type: Number,
      default: 25,
    },
    inverterWarrantyYears: {
      type: Number,
      default: 5,
    },
    batteryWarrantyYears: {
      type: Number,
      default: 5,
    },
    workmanshipWarrantyYears: {
      type: Number,
      default: 2,
    },
    serviceStartDate: {
      type: Date,
      default: null,
    },
    serviceEndDate: {
      type: Date,
      default: null,
    },
    claims: [ClaimSchema],
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceWarranty', ServiceWarrantySchema);
