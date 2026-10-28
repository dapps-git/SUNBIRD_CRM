const Quotation = require('../models/Quotation');
const Client = require('../models/Client');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
exports.getQuotations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { customerName: searchRegex },
        { quotationNumber: searchRegex },
        { systemCapacity: searchRegex },
      ];
    }

    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .populate('client', 'clientNumber fullName phoneNumber place')
      .populate('lead', 'leadNumber fullName phoneNumber')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: quotations.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('client')
      .populate('lead')
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
exports.createQuotation = async (req, res) => {
  try {
    const quotationData = {
      ...req.body,
      createdBy: req.user?._id,
    };

    const quotation = await Quotation.create(quotationData);

    // If linked to client, update client's quotation amount and final price if empty or accepted
    if (quotation.client) {
      const client = await Client.findById(quotation.client);
      if (client) {
        client.quotationAmount = quotation.quotationAmount;
        if (!client.finalProjectPrice || client.finalProjectPrice === 0) {
          client.finalProjectPrice = quotation.finalPrice;
        }
        await client.save();
      }
    }

    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    Object.assign(quotation, req.body);
    await quotation.save();

    // If status became Accepted and client is linked, sync final price to client
    if (quotation.status === 'Accepted' && quotation.client) {
      const client = await Client.findById(quotation.client);
      if (client) {
        client.quotationAmount = quotation.quotationAmount;
        client.finalProjectPrice = quotation.finalPrice;
        await client.save();
      }
    }

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private (Admin)
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    await quotation.deleteOne();
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
