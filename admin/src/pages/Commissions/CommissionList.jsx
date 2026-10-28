import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  Award,
  Search,
  Filter,
  Plus,
  CheckCircle,
  Download,
  Wallet,
  Phone,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CommissionList = () => {
  const [commissions, setCommissions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payoutModalComm, setPayoutModalComm] = useState(null);

  // Form State
  const initialForm = {
    client: '',
    referredPersonName: '',
    referredPersonPhone: '',
    leadSource: 'Reference',
    commissionType: 'fixed',
    commissionRate: '',
    projectPrice: 0,
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [payoutRef, setPayoutRef] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/commissions', {
        params: { search, paymentStatus: statusFilter },
      });
      setCommissions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load commissions', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (err) {
      console.error('Failed to load clients', err);
    }
  };

  useEffect(() => {
    fetchCommissions();
    fetchClients();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.client || !formData.referredPersonName || !formData.commissionRate) {
      setFormError('Please select a customer, enter referrer name and commission rate.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      await api.post('/commissions', formData);
      setIsAddModalOpen(false);
      fetchCommissions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record commission.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutModalComm) return;
    try {
      await api.patch(`/commissions/${payoutModalComm._id}/pay`, {
        paymentReference: payoutRef,
      });
      setPayoutModalComm(null);
      setPayoutRef('');
      fetchCommissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record commission payout');
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const handleExportExcel = () => {
    const data = commissions.map((c) => ({
      'Referral Agent': c.referredPersonName,
      Phone: c.referredPersonPhone || 'N/A',
      'Client Name': c.client?.fullName || 'N/A',
      'Project Price (INR)': c.projectPrice,
      'Commission Type': c.commissionType,
      'Rate (% / INR)': c.commissionRate,
      'Calculated Commission (INR)': c.calculatedAmount,
      Status: c.paymentStatus,
      'Payout Date': c.paidDate ? new Date(c.paidDate).toLocaleDateString('en-IN') : 'N/A',
      'Payment Ref / UTR': c.paymentReference || 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commissions');
    XLSX.writeFile(wb, `Sunbird_Solar_Commissions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={handleExportExcel}
          className="btn-secondary text-xs sm:text-sm px-3.5 py-2"
          disabled={commissions.length === 0}
        >
          <Download size={16} />
          Export Excel
        </button>
        <button onClick={handleOpenAdd} className="btn-brand text-xs sm:text-sm px-4 py-2">
          <Plus size={16} />
          Add Referral Commission
        </button>
      </div>

      {/* Filter and Search */}
      <div className="crm-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by agent name, phone, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Payout Statuses</option>
              <option value="Pending">Pending Payout</option>
              <option value="Paid">Disbursed / Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Referral Agent</th>
              <th>Customer</th>
              <th>Project Value</th>
              <th>Commission Model</th>
              <th>Commission Due</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading commissions...
                </td>
              </tr>
            ) : commissions.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400">
                  No commissions recorded. Add a referral or convert a lead with referral source.
                </td>
              </tr>
            ) : (
              commissions.map((comm) => (
                <tr key={comm._id}>
                  <td>
                    <div className="font-bold text-slate-800">{comm.referredPersonName}</div>
                    {comm.referredPersonPhone && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-slate-400" />
                        {comm.referredPersonPhone}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-800">
                      {comm.client?.fullName || 'Client'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {comm.client?.clientNumber} • {comm.client?.place}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-700">
                      {formatCurrency(comm.projectPrice)}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-600">
                      {comm.commissionType === 'percentage'
                        ? `${comm.commissionRate}% of project`
                        : `Fixed ${formatCurrency(comm.commissionRate)}`}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-black text-emerald-600">
                      {formatCurrency(comm.calculatedAmount)}
                    </span>
                  </td>
                  <td>
                    <Badge variant={comm.paymentStatus}>{comm.paymentStatus}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end">
                      {comm.paymentStatus === 'Pending' ? (
                        <button
                          onClick={() => setPayoutModalComm(comm)}
                          className="btn-brand text-xs px-2.5 py-1"
                        >
                          <Wallet size={14} />
                          Disburse
                        </button>
                      ) : (
                        <div className="text-right text-[11px] text-slate-400">
                          <div>Paid: {new Date(comm.paidDate).toLocaleDateString('en-IN')}</div>
                          {comm.paymentReference && <div>Ref: {comm.paymentReference}</div>}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Commission Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Referral Commission Record"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Select Client <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.client}
              onChange={(e) => {
                const clientId = e.target.value;
                const cl = clients.find((c) => c._id === clientId);
                setFormData({
                  ...formData,
                  client: clientId,
                  projectPrice: cl?.finalProjectPrice || 0,
                  referredPersonName: cl?.referredPersonName || formData.referredPersonName,
                  referredPersonPhone: cl?.referredPersonPhone || formData.referredPersonPhone,
                });
              }}
              className="crm-select"
            >
              <option value="">-- Choose client --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientNumber} - {c.fullName} (Price: {formatCurrency(c.finalProjectPrice)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Referral Person / Agent Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="Agent or referrer name"
                value={formData.referredPersonName}
                onChange={(e) => setFormData({ ...formData, referredPersonName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Referrer Phone Number
              </label>
              <input
                type="tel"
                className="crm-input"
                placeholder="e.g. 9876543210"
                value={formData.referredPersonPhone}
                onChange={(e) => setFormData({ ...formData, referredPersonPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Commission Structure
              </label>
              <select
                value={formData.commissionType}
                onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                className="crm-select"
              >
                <option value="fixed">Fixed Lump-Sum (₹)</option>
                <option value="percentage">Percentage (%) of Project Price</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Commission Rate ({formData.commissionType === 'percentage' ? '%' : '₹'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                className="crm-input"
                placeholder={formData.commissionType === 'percentage' ? 'e.g. 3' : 'e.g. 10000'}
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              className="crm-textarea"
              placeholder="e.g. Payout promised after 50% milestone collection..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={formSubmitting} className="btn-brand">
              {formSubmitting ? 'Recording...' : 'Save Commission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Disburse Modal */}
      <Modal
        isOpen={!!payoutModalComm}
        onClose={() => setPayoutModalComm(null)}
        title={`Disburse Commission: ${payoutModalComm?.referredPersonName}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePayoutSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-xs text-emerald-800 font-semibold block uppercase">Amount Payable</span>
            <span className="text-2xl font-black text-emerald-700">
              {formatCurrency(payoutModalComm?.calculatedAmount)}
            </span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Payment Reference / Bank UTR / UPI ID
            </label>
            <input
              type="text"
              required
              className="crm-input"
              placeholder="e.g. UTR198273648 / GPay Ref"
              value={payoutRef}
              onChange={(e) => setPayoutRef(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setPayoutModalComm(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-brand">
              Confirm Disbursal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CommissionList;
