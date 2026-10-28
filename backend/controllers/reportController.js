const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const Quotation = require('../models/Quotation');
const Commission = require('../models/Commission');
const XLSX = require('xlsx');

// @desc    Get live aggregated dashboard metrics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardMetrics = async (req, res) => {
  try {
    const [
      totalLeads,
      newLeads,
      followUpLeads,
      approvedLeads,
      convertedLeads,
      totalClients,
      projects,
      quotations,
      payments,
      commissions,
      recentLeads,
      recentProjects,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'New Lead' }),
      Lead.countDocuments({ status: 'Follow-Up' }),
      Lead.countDocuments({ status: 'Work Approved' }),
      Lead.countDocuments({ isConverted: true }),
      Client.countDocuments(),
      Project.find().select('status projectName client capacity createdAt').populate('client', 'fullName place'),
      Quotation.find().select('quotationAmount finalPrice status'),
      Payment.find().select('amount paymentType paymentStatus paymentDate'),
      Commission.find().select('calculatedAmount paymentStatus'),
      Lead.find().sort({ createdAt: -1 }).limit(5),
      Project.find().sort({ createdAt: -1 }).limit(5).populate('client', 'fullName place'),
    ]);

    // Project status breakdown
    const ongoingProjects = projects.filter((p) =>
      ['Approved', 'Planning', 'Installation in Progress'].includes(p.status)
    ).length;
    const completedProjects = projects.filter((p) => p.status === 'Completed').length;

    // Financial calculations
    const totalQuotationAmount = quotations.reduce((acc, q) => acc + (q.quotationAmount || 0), 0);
    const totalFinalProjectValues = quotations
      .filter((q) => q.status === 'Accepted')
      .reduce((acc, q) => acc + (q.finalPrice || 0), 0);

    const completedPayments = payments.filter((p) => p.paymentStatus === 'Completed');
    const totalPaymentsReceived = completedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalAdvancePayments = completedPayments
      .filter((p) => p.paymentType === 'Advance')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    // Sum client remaining balances
    const clients = await Client.find().select('finalProjectPrice totalPaid remainingBalance');
    const totalPendingBalance = clients.reduce((acc, c) => acc + (c.remainingBalance || 0), 0);
    const totalClientOrderValue = clients.reduce((acc, c) => acc + (c.finalProjectPrice || 0), 0);

    // Commission summary
    const totalCommissions = commissions.reduce((acc, c) => acc + (c.calculatedAmount || 0), 0);
    const paidCommissions = commissions
      .filter((c) => c.paymentStatus === 'Paid')
      .reduce((acc, c) => acc + (c.calculatedAmount || 0), 0);
    const pendingCommissions = totalCommissions - paidCommissions;

    // Conversion rate
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        leads: {
          total: totalLeads,
          new: newLeads,
          followUp: followUpLeads,
          approved: approvedLeads,
          converted: convertedLeads,
          conversionRate,
        },
        clients: {
          total: totalClients,
          totalOrderValue: totalClientOrderValue,
        },
        projects: {
          total: projects.length,
          ongoing: ongoingProjects,
          completed: completedProjects,
        },
        financials: {
          totalQuotationAmount,
          totalAdvancePayments,
          totalPaymentsReceived,
          pendingPaymentBalance: totalPendingBalance,
        },
        commissions: {
          total: totalCommissions,
          paid: paidCommissions,
          pending: pendingCommissions,
        },
        recentActivity: {
          leads: recentLeads,
          projects: recentProjects,
        },
      },
    });
  } catch (error) {
    console.error('[Dashboard Metrics Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate tabular reports with date range filtering and Excel export
// @route   GET /api/reports/export
// @access  Private
exports.generateReport = async (req, res) => {
  try {
    const { reportType = 'leads', startDate, endDate, format = 'json' } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    let rows = [];
    let fileName = `Sunbird_${reportType}_report`;

    if (reportType === 'leads') {
      const leads = await Lead.find(dateFilter).sort({ createdAt: -1 });
      rows = leads.map((l) => ({
        'Lead ID': l.leadNumber,
        'Full Name': l.fullName,
        Place: l.place,
        Phone: l.phoneNumber,
        Address: l.fullAddress,
        Source: l.leadSource,
        Status: l.status,
        Converted: l.isConverted ? 'Yes' : 'No',
        'Created Date': new Date(l.createdAt).toLocaleDateString(),
      }));
    } else if (reportType === 'clients') {
      const clients = await Client.find(dateFilter).sort({ createdAt: -1 });
      rows = clients.map((c) => ({
        'Client ID': c.clientNumber,
        'Full Name': c.fullName,
        Place: c.place,
        Phone: c.phoneNumber,
        'Project Status': c.projectStatus,
        'Final Price (INR)': c.finalProjectPrice,
        'Total Paid (INR)': c.totalPaid,
        'Remaining Balance (INR)': c.remainingBalance,
        'Payment Status': c.paymentStatus,
        'KYC Status': c.kycStatus,
        'Lead Source': c.leadSource,
        'Referred By': c.referredPersonName || 'N/A',
        'Created Date': new Date(c.createdAt).toLocaleDateString(),
      }));
    } else if (reportType === 'projects') {
      const projects = await Project.find(dateFilter).populate('client').sort({ createdAt: -1 });
      rows = projects.map((p) => ({
        'Project ID': p.projectNumber,
        'Project Name': p.projectName,
        Client: p.client?.fullName || 'N/A',
        Capacity: p.capacity || 'N/A',
        Status: p.status,
        'Start Date': p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A',
        'Completion Date': p.completionDate ? new Date(p.completionDate).toLocaleDateString() : 'N/A',
        'Site Address': p.siteAddress || p.client?.fullAddress || 'N/A',
      }));
    } else if (reportType === 'payments') {
      const payments = await Payment.find(dateFilter).populate('client').sort({ paymentDate: -1 });
      rows = payments.map((p) => ({
        'Receipt ID': p.receiptNumber,
        Client: p.client?.fullName || 'N/A',
        'Client ID': p.client?.clientNumber || 'N/A',
        Type: p.paymentType,
        'Amount (INR)': p.amount,
        Method: p.paymentMethod,
        'Reference No': p.referenceNumber || 'N/A',
        Status: p.paymentStatus,
        Date: new Date(p.paymentDate).toLocaleDateString(),
      }));
    } else if (reportType === 'commissions') {
      const commissions = await Commission.find(dateFilter).populate('client').sort({ createdAt: -1 });
      rows = commissions.map((c) => ({
        Client: c.client?.fullName || 'N/A',
        'Referred Person': c.referredPersonName,
        Phone: c.referredPersonPhone || 'N/A',
        'Commission Type': c.commissionType,
        Rate: c.commissionRate,
        'Project Price (INR)': c.projectPrice,
        'Calculated Amount (INR)': c.calculatedAmount,
        'Payment Status': c.paymentStatus,
        'Paid Date': c.paidDate ? new Date(c.paidDate).toLocaleDateString() : 'N/A',
      }));
    }

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    res.status(200).json({
      success: true,
      reportType,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
