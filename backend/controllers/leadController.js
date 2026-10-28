const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Project = require('../models/Project');

// @desc    Get all leads with search, filtering, and pagination
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 25 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { place: searchRegex },
        { leadNumber: searchRegex },
        { fullAddress: searchRegex },
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedStaff', 'name email phone')
      .populate('convertedClientId', 'clientNumber fullName')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: leads.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: leads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
// @access  Private
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedStaff', 'name email')
      .populate('convertedClientId');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new lead (Strictly the 5 basic fields)
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    const { fullName, place, phoneNumber, fullAddress, gpsLocation, leadSource, assignedStaff } = req.body;

    if (!fullName || !place || !phoneNumber || !fullAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all 4 required fields: Full Name, Place, Phone Number, and Full Address.',
      });
    }

    const lead = await Lead.create({
      fullName,
      place,
      phoneNumber,
      fullAddress,
      gpsLocation: gpsLocation || {},
      leadSource: leadSource || 'Organic enquiries',
      assignedStaff: assignedStaff || null,
      status: 'New Lead',
      history: [
        {
          action: 'Lead Created',
          performedBy: req.user?.name || 'Staff',
          details: `Lead created with initial contact number: ${phoneNumber}`,
        },
      ],
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update basic lead details
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    const { fullName, place, phoneNumber, fullAddress, gpsLocation, leadSource, assignedStaff } = req.body;

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (fullName) lead.fullName = fullName;
    if (place) lead.place = place;
    if (phoneNumber) lead.phoneNumber = phoneNumber;
    if (fullAddress) lead.fullAddress = fullAddress;
    if (gpsLocation) lead.gpsLocation = gpsLocation;
    if (leadSource) lead.leadSource = leadSource;
    if (assignedStaff !== undefined) lead.assignedStaff = assignedStaff;

    lead.history.push({
      action: 'Lead Details Updated',
      performedBy: req.user?.name || 'Staff',
      details: 'Updated contact / basic installation address details',
    });

    await lead.save();

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update lead status
// @route   PATCH /api/leads/:id/status
// @access  Private
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['New Lead', 'Contacted', 'Follow-Up', 'Work Approved', 'Not Approved'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (lead.isConverted && status !== 'Work Approved') {
      return res.status(400).json({
        success: false,
        message: 'This lead has already been converted to a Real Client.',
      });
    }

    const oldStatus = lead.status;
    lead.status = status;

    lead.history.push({
      action: `Status Changed from ${oldStatus} to ${status}`,
      performedBy: req.user?.name || 'Staff',
      details: note || `Status updated to ${status}`,
    });

    await lead.save();

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Convert Work Approved Lead to Real Client
// @route   POST /api/leads/:id/convert
// @access  Private
exports.convertLeadToClient = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Prevent duplicate conversions
    if (lead.isConverted || lead.convertedClientId) {
      return res.status(400).json({
        success: false,
        message: 'This lead has already been converted to a Real Client. Duplicate conversions are prevented.',
      });
    }

    if (lead.status !== 'Work Approved') {
      return res.status(400).json({
        success: false,
        message: 'Only leads with "Work Approved" status can be converted to Real Clients.',
      });
    }

    // Automatically transfer the 5 basic fields and enquiry metadata
    const newClient = await Client.create({
      fullName: lead.fullName,
      place: lead.place,
      phoneNumber: lead.phoneNumber,
      fullAddress: lead.fullAddress,
      gpsLocation: lead.gpsLocation,
      originalLeadId: lead._id,
      leadSource: lead.leadSource || 'Organic enquiries',
      assignedHandlingPerson: lead.assignedStaff,
      projectStatus: 'Approved',
      history: [
        {
          action: 'Converted from Lead',
          performedBy: req.user?.name || 'Staff',
          details: `Client successfully converted from Lead ${lead.leadNumber} (${lead.fullName})`,
        },
      ],
    });

    // Create an initial project record linked to the client
    const project = await Project.create({
      client: newClient._id,
      projectName: `${newClient.fullName} - Solar Project`,
      siteAddress: newClient.fullAddress,
      gpsLocation: newClient.gpsLocation,
      status: 'Approved',
      notes: [
        {
          text: `Project initialized upon client conversion from Lead ${lead.leadNumber}.`,
          author: req.user?.name || 'Staff',
        },
      ],
    });

    // Mark the lead as converted
    lead.isConverted = true;
    lead.status = 'Converted to Client';
    lead.convertedClientId = newClient._id;
    lead.convertedAt = new Date();
    lead.history.push({
      action: 'Converted to Real Client',
      performedBy: req.user?.name || 'Staff',
      details: `Lead converted to Real Client record ${newClient.clientNumber}`,
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: `Lead successfully converted to Client ${newClient.clientNumber}`,
      data: {
        lead,
        client: newClient,
        project,
      },
    });
  } catch (error) {
    console.error('[Convert Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete lead (Admin only)
// @route   DELETE /api/leads/:id
// @access  Private (Admin)
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (lead.isConverted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a lead that has already been converted to a client. History must be preserved.',
      });
    }

    await lead.deleteOne();
    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
