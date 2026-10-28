const Payment = require('../models/Payment');
const Client = require('../models/Client');

// Helper to recalculate and sync client balances
const syncClientPaymentTotals = async (clientId) => {
  const client = await Client.findById(clientId);
  if (!client) return;

  const payments = await Payment.find({ client: clientId, paymentStatus: 'Completed' });

  const totalPaid = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const advancePayment = payments
    .filter((p) => p.paymentType === 'Advance')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  client.totalPaid = totalPaid;
  client.advancePaymentAmount = advancePayment;
  client.remainingBalance = Math.max(0, (client.finalProjectPrice || 0) - totalPaid);

  if (totalPaid === 0 && (client.finalProjectPrice || 0) > 0) {
    client.paymentStatus = 'Pending';
  } else if (totalPaid > 0 && totalPaid < (client.finalProjectPrice || 0)) {
    client.paymentStatus = 'Partially Paid';
  } else if (totalPaid >= (client.finalProjectPrice || 0) && (client.finalProjectPrice || 0) > 0) {
    client.paymentStatus = 'Fully Paid';
  }

  await client.save();
};

// @desc    Get all payments with search & filters
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const { client, paymentType, paymentMethod, paymentStatus, page = 1, limit = 25 } = req.query;
    const query = {};

    if (client) query.client = client;
    if (paymentType && paymentType !== 'All') query.paymentType = paymentType;
    if (paymentMethod && paymentMethod !== 'All') query.paymentMethod = paymentMethod;
    if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('client', 'clientNumber fullName phoneNumber place finalProjectPrice remainingBalance')
      .populate('project', 'projectNumber projectName')
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record new payment (Advance or Additional)
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const { client, project, paymentType, amount, paymentDate, paymentMethod, referenceNumber, notes, receiptFileUrl } = req.body;

    if (!client || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Client and a valid payment amount (> 0) are required.',
      });
    }

    const payment = await Payment.create({
      client,
      project: project || null,
      paymentType: paymentType || 'Additional',
      amount: Number(amount),
      paymentDate: paymentDate || Date.now(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      referenceNumber: referenceNumber || '',
      paymentStatus: 'Completed',
      receiptFileUrl: receiptFileUrl || '',
      notes: notes || '',
      recordedBy: req.user?._id,
    });

    // Automatically recalculate client's remaining balance
    await syncClientPaymentTotals(client);

    // Update client history
    const targetClient = await Client.findById(client);
    if (targetClient) {
      targetClient.history.push({
        action: `Payment of ₹${Number(amount).toLocaleString()} Received`,
        performedBy: req.user?.name || 'Staff',
        details: `Type: ${payment.paymentType}, Method: ${payment.paymentMethod}, Ref: ${payment.referenceNumber || 'N/A'}`,
      });
      await targetClient.save();
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    Object.assign(payment, req.body);
    await payment.save();

    await syncClientPaymentTotals(payment.client);

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete payment record
// @route   DELETE /api/payments/:id
// @access  Private (Admin)
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const clientId = payment.client;
    await payment.deleteOne();

    await syncClientPaymentTotals(clientId);

    res.status(200).json({ success: true, message: 'Payment deleted and client balance recalculated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
