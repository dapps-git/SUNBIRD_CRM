const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    documentType: {
      type: String,
      enum: [
        'Electricity Bill',
        'KYC Document',
        'Site Photo',
        'Installation Photo',
        'Completion Certificate',
        'Other',
      ],
      required: [true, 'Document type is required'],
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or path is required'],
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    cloudinaryId: {
      type: String,
      default: '',
    },
    kycStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'N/A'],
      default: 'Pending',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
