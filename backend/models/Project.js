const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    projectNumber: {
      type: String,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    capacity: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Approved', 'Planning', 'Installation in Progress', 'Completed', 'On Hold'],
      default: 'Approved',
    },
    startDate: {
      type: Date,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    siteAddress: {
      type: String,
      default: '',
    },
    gpsLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      rawText: { type: String, default: '' },
    },
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    materialsSummary: {
      type: String,
      default: '',
    },
    notes: [
      {
        text: String,
        author: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ProjectSchema.pre('save', async function (next) {
  if (!this.projectNumber) {
    const count = await mongoose.model('Project').countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.projectNumber = `SB-PRJ-${seq}`;
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
