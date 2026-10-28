const Client = require('../models/Client');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Document = require('../models/Document');
const Commission = require('../models/Commission');
const ServiceWarranty = require('../models/ServiceWarranty');

// @desc    Get all real clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    const { search, paymentStatus, projectStatus, kycStatus, page = 1, limit = 25 } = req.query;

    const query = {};

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }
    if (projectStatus && projectStatus !== 'All') {
      query.projectStatus = projectStatus;
    }
    if (kycStatus && kycStatus !== 'All') {
      query.kycStatus = kycStatus;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { clientNumber: searchRegex },
        { place: searchRegex },
        { fullAddress: searchRegex },
      ];
    }

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('originalLeadId', 'leadNumber status leadSource createdAt')
      .populate('assignedHandlingPerson', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: clients.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: clients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single real client with all related modules (payments, documents, project, commission, warranty)
// @route   GET /api/clients/:id
// @access  Private
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('originalLeadId')
      .populate('assignedHandlingPerson', 'name email phone');

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Fetch associated data in parallel
    const [payments, documents, projects, warranty, commissions] = await Promise.all([
      Payment.find({ client: client._id }).sort({ paymentDate: -1 }),
      Document.find({ client: client._id }).sort({ createdAt: -1 }),
      Project.find({ client: client._id }).sort({ createdAt: -1 }),
      ServiceWarranty.findOne({ client: client._id }),
      Commission.find({ client: client._id }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...client.toObject(),
        payments,
        documents,
        projects,
        warranty,
        commissions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new real client manually (if not converted from lead)
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    const clientData = req.body;
    const client = await Client.create({
      ...clientData,
      history: [
        {
          action: 'Client Created',
          performedBy: req.user?.name || 'Staff',
          details: 'Direct real client profile created',
        },
      ],
    });

    // Also auto-create a project record
    await Project.create({
      client: client._id,
      projectName: `${client.fullName} - Solar Project`,
      siteAddress: client.fullAddress,
      gpsLocation: client.gpsLocation,
      status: client.projectStatus || 'Approved',
      notes: [
        {
          text: 'Project initialized along with client profile.',
          author: req.user?.name || 'Staff',
        },
      ],
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update real client information
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'clientNumber') {
        client[key] = updates[key];
      }
    });

    // Auto recalculate balance
    const payments = await Payment.find({ client: client._id, paymentStatus: 'Completed' });
    const totalPaymentsReceived = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    client.totalPaid = totalPaymentsReceived;

    client.history.push({
      action: 'Client Profile Updated',
      performedBy: req.user?.name || 'Staff',
      details: 'Updated customer, project, or financial information',
    });

    await client.save();

    // Also sync Commission record if referral exists
    if (client.referredPersonName && (client.calculatedCommission > 0 || client.commissionRate > 0)) {
      let comm = await Commission.findOne({ client: client._id });
      if (!comm) {
        comm = new Commission({ client: client._id });
      }
      comm.referredPersonName = client.referredPersonName;
      comm.referredPersonPhone = client.referredPersonPhone || '';
      comm.leadSource = client.leadSource;
      comm.commissionType = client.commissionType;
      comm.commissionRate = client.commissionRate;
      comm.projectPrice = client.finalProjectPrice;
      comm.calculatedAmount = client.calculatedCommission;
      comm.paymentStatus = client.commissionStatus;
      comm.paidDate = client.commissionPaidDate;
      await comm.save();
    }

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update KYC status specifically
// @route   PATCH /api/clients/:id/kyc
// @access  Private
exports.updateKycStatus = async (req, res) => {
  try {
    const { kycStatus, kycNotes } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.kycStatus = kycStatus;
    if (kycNotes) client.kycNotes = kycNotes;

    client.history.push({
      action: `KYC Status Updated to ${kycStatus}`,
      performedBy: req.user?.name || 'Staff',
      details: kycNotes || `KYC verification status changed to ${kycStatus}`,
    });

    await client.save();

    // Also update any KYC documents for this client
    await Document.updateMany(
      { client: client._id, documentType: 'KYC Document' },
      { $set: { kycStatus } }
    );

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client (Admin only)
// @route   DELETE /api/clients/:id
// @access  Private (Admin)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Clean up related sub-records
    await Promise.all([
      Payment.deleteMany({ client: client._id }),
      Project.deleteMany({ client: client._id }),
      Document.deleteMany({ client: client._id }),
      Commission.deleteMany({ client: client._id }),
      ServiceWarranty.deleteMany({ client: client._id }),
    ]);

    await client.deleteOne();
    res.status(200).json({ success: true, message: 'Client and all associated records deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
