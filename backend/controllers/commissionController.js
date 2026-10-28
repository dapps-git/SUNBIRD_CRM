const Commission = require('../models/Commission');
const Client = require('../models/Client');

// @desc    Get all commissions
// @route   GET /api/commissions
// @access  Private
exports.getCommissions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.paymentStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { referredPersonName: searchRegex },
        { referredPersonPhone: searchRegex },
        { assignedHandlingPerson: searchRegex },
      ];
    }

    const commissions = await Commission.find(query)
      .populate('client', 'clientNumber fullName phoneNumber place finalProjectPrice remainingBalance')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalCommissions = commissions.reduce((sum, c) => sum + (c.calculatedAmount || 0), 0);
    const paidCommissions = commissions
      .filter((c) => c.paymentStatus === 'Paid')
      .reduce((sum, c) => sum + (c.calculatedAmount || 0), 0);
    const pendingCommissions = totalCommissions - paidCommissions;

    res.status(200).json({
      success: true,
      summary: {
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        totalCount: commissions.length,
      },
      data: commissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new commission record
// @route   POST /api/commissions
// @access  Private
exports.createCommission = async (req, res) => {
  try {
    const { client, referredPersonName, referredPersonPhone, leadSource, assignedHandlingPerson, commissionType, commissionRate, projectPrice, paymentStatus, notes } = req.body;

    const rate = Number(commissionRate) || 0;
    const price = Number(projectPrice) || 0;
    let calculatedAmount = 0;

    if (commissionType === 'percentage') {
      calculatedAmount = Math.round((price * rate) / 100);
    } else {
      calculatedAmount = rate;
    }

    const commission = await Commission.create({
      client,
      referredPersonName,
      referredPersonPhone,
      leadSource,
      assignedHandlingPerson,
      commissionType: commissionType || 'fixed',
      commissionRate: rate,
      projectPrice: price,
      calculatedAmount,
      paymentStatus: paymentStatus || 'Pending',
      notes,
    });

    // Sync back to client record
    await Client.findByIdAndUpdate(client, {
      referredPersonName,
      referredPersonPhone,
      commissionType,
      commissionRate: rate,
      calculatedCommission: calculatedAmount,
      commissionStatus: paymentStatus || 'Pending',
    });

    res.status(201).json({ success: true, data: commission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update commission payment status (e.g. mark Paid)
// @route   PATCH /api/commissions/:id/status
// @access  Private
exports.updateCommissionStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentReference, notes } = req.body;
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission record not found' });
    }

    commission.paymentStatus = paymentStatus;
    if (paymentStatus === 'Paid') {
      commission.paidDate = new Date();
      if (paymentReference) commission.paymentReference = paymentReference;
    } else {
      commission.paidDate = null;
    }
    if (notes) commission.notes = notes;

    await commission.save();

    // Sync client
    await Client.findByIdAndUpdate(commission.client, {
      commissionStatus: paymentStatus,
      commissionPaidDate: commission.paidDate,
    });

    res.status(200).json({ success: true, data: commission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete commission
// @route   DELETE /api/commissions/:id
// @access  Private (Admin)
exports.deleteCommission = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission not found' });
    }

    await commission.deleteOne();
    res.status(200).json({ success: true, message: 'Commission deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
