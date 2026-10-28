const ServiceWarranty = require('../models/ServiceWarranty');
const Client = require('../models/Client');

// @desc    Get all warranty and service records
// @route   GET /api/services
// @access  Private
exports.getServices = async (req, res) => {
  try {
    const { client, search } = req.query;
    const query = {};

    if (client) query.client = client;

    const services = await ServiceWarranty.find(query)
      .populate('client', 'clientNumber fullName phoneNumber place fullAddress finalProjectPrice')
      .populate('project', 'projectNumber projectName status')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get warranty by client ID
// @route   GET /api/services/client/:clientId
// @access  Private
exports.getServiceByClientId = async (req, res) => {
  try {
    let service = await ServiceWarranty.findOne({ client: req.params.clientId })
      .populate('client')
      .populate('project');

    if (!service) {
      // Find client to prepopulate
      const client = await Client.findById(req.params.clientId);
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      // Create a default warranty record for the client
      service = await ServiceWarranty.create({
        client: client._id,
        serviceStartDate: client.servicePeriodStartDate || new Date(),
        serviceEndDate: client.servicePeriodEndDate || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      });
      service = await service.populate('client');
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update warranty information
// @route   POST /api/services
// @access  Private
exports.saveServiceWarranty = async (req, res) => {
  try {
    const { client, project, panelsWarrantyYears, inverterWarrantyYears, batteryWarrantyYears, workmanshipWarrantyYears, serviceStartDate, serviceEndDate, notes } = req.body;

    let service = await ServiceWarranty.findOne({ client });

    if (service) {
      Object.assign(service, {
        project: project || service.project,
        panelsWarrantyYears: panelsWarrantyYears !== undefined ? panelsWarrantyYears : service.panelsWarrantyYears,
        inverterWarrantyYears: inverterWarrantyYears !== undefined ? inverterWarrantyYears : service.inverterWarrantyYears,
        batteryWarrantyYears: batteryWarrantyYears !== undefined ? batteryWarrantyYears : service.batteryWarrantyYears,
        workmanshipWarrantyYears: workmanshipWarrantyYears !== undefined ? workmanshipWarrantyYears : service.workmanshipWarrantyYears,
        serviceStartDate: serviceStartDate || service.serviceStartDate,
        serviceEndDate: serviceEndDate || service.serviceEndDate,
        notes: notes !== undefined ? notes : service.notes,
      });
      await service.save();
    } else {
      service = await ServiceWarranty.create({
        client,
        project,
        panelsWarrantyYears: panelsWarrantyYears || 25,
        inverterWarrantyYears: inverterWarrantyYears || 5,
        batteryWarrantyYears: batteryWarrantyYears || 5,
        workmanshipWarrantyYears: workmanshipWarrantyYears || 2,
        serviceStartDate: serviceStartDate || new Date(),
        serviceEndDate: serviceEndDate || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        notes,
      });
    }

    // Sync dates to client profile
    await Client.findByIdAndUpdate(client, {
      servicePeriodStartDate: service.serviceStartDate,
      servicePeriodEndDate: service.serviceEndDate,
      warrantyDetails: `${service.panelsWarrantyYears}y Panels, ${service.inverterWarrantyYears}y Inverter`,
    });

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a service claim / maintenance issue
// @route   POST /api/services/:id/claims
// @access  Private
exports.addClaim = async (req, res) => {
  try {
    const { issueTitle, description, reportedDate } = req.body;
    const service = await ServiceWarranty.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Warranty record not found' });
    }

    const claimCount = service.claims.length + 1;
    const claimNumber = `CLM-${String(claimCount).padStart(3, '0')}`;

    service.claims.push({
      claimNumber,
      issueTitle,
      description,
      reportedDate: reportedDate || new Date(),
      status: 'Open',
    });

    await service.save();
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update claim status
// @route   PATCH /api/services/:id/claims/:claimId
// @access  Private
exports.updateClaim = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const service = await ServiceWarranty.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Warranty record not found' });
    }

    const claim = service.claims.id(req.params.claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (status) claim.status = status;
    if (resolutionNotes) claim.resolutionNotes = resolutionNotes;
    if (status === 'Resolved' || status === 'Closed') {
      claim.resolvedDate = new Date();
    }

    await service.save();
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
