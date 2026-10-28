import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  Printer,
  Download,
  Calendar,
  Wallet,
  CheckCircle2,
  RefreshCw,
  ArrowDownCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [deleteDialogPayment, setDeleteDialogPayment] = useState(null);

  // Form State
  const initialForm = {
    client: '',
    paymentType: 'Advance',
    amount: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'Completed',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: {
          search,
          paymentType: paymentTypeFilter,
          paymentMethod: methodFilter,
        },
      });
      setPayments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load payments', err);
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
    fetchPayments();
    fetchClients();
  }, [search, paymentTypeFilter, methodFilter]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setSelectedClientData(null);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleClientSelect = (clientId) => {
    const cl = clients.find((c) => c._id === clientId);
    setSelectedClientData(cl || null);
    setFormData({
      ...formData,
      client: clientId,
      amount: cl?.remainingBalance && cl.remainingBalance > 0 ? cl.remainingBalance : '',
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.client || !formData.amount || Number(formData.amount) <= 0) {
      setFormError('Please select a client and enter a valid positive payment amount.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      await api.post('/payments', formData);
      setIsAddModalOpen(false);
      fetchPayments();
      fetchClients();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteDialogPayment) return;
    try {
      await api.delete(`/payments/${deleteDialogPayment._id}`);
      setDeleteDialogPayment(null);
      fetchPayments();
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const handleExportExcel = () => {
    const data = payments.map((p) => ({
      'Receipt No': p.receiptNumber,
      'Customer Name': p.client?.fullName || 'N/A',
      'Client ID': p.client?.clientNumber || 'N/A',
      'Payment Type': p.paymentType,
      'Amount (INR)': p.amount,
      Method: p.paymentMethod,
      'Reference / UTR': p.referenceNumber || 'N/A',
      Status: p.paymentStatus,
      Date: new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `Sunbird_Solar_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={handleExportExcel}
          className="btn-secondary text-xs sm:text-sm px-3.5 py-2"
          disabled={payments.length === 0}
        >
          <Download size={16} />
          Export Excel
        </button>
        <button onClick={handleOpenAdd} className="btn-brand text-xs sm:text-sm px-4 py-2">
          <Plus size={16} />
          Record Payment Receipt
        </button>
      </div>

      {/* Filter and Search */}
      <div className="crm-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by receipt no, customer name, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Payment Types</option>
              <option value="Advance">Advance Payment</option>
              <option value="Milestone">Milestone / Progress</option>
              <option value="Final">Final Settlement</option>
              <option value="Additional">Additional Equipment</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-slate-400 shrink-0" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Payment Methods</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Receipt No</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Method & UTR</th>
              <th>Date</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading payment receipts...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400">
                  No payment receipts recorded yet. Click "Record Payment Receipt".
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id}>
                  <td>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {p.receiptNumber}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold text-slate-800">{p.client?.fullName || 'N/A'}</div>
                    <span className="text-[11px] text-slate-400">
                      {p.client?.clientNumber} • {p.client?.place}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.paymentType}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-700">{p.paymentMethod}</div>
                    {p.referenceNumber && (
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        Ref: {p.referenceNumber}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-slate-600">
                      {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <Badge variant={p.paymentStatus}>{p.paymentStatus}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setIsViewModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View & Print Receipt"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteDialogPayment(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Receipt"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Solar Payment Receipt"
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
              onChange={(e) => handleClientSelect(e.target.value)}
              className="crm-select"
            >
              <option value="">-- Choose client to record payment --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientNumber} - {c.fullName} ({c.place}) - Bal: {formatCurrency(c.remainingBalance)}
                </option>
              ))}
            </select>
          </div>

          {selectedClientData && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-medium text-[10px]">Project Price</span>
                <span className="font-bold text-slate-800">{formatCurrency(selectedClientData.finalProjectPrice)}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-medium text-[10px]">Total Received</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedClientData.totalPaid)}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-medium text-[10px]">Pending Due</span>
                <span className="font-bold text-rose-600">{formatCurrency(selectedClientData.remainingBalance)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Payment Type
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                className="crm-select"
              >
                <option value="Advance">Advance / Booking Deposit</option>
                <option value="Milestone">Milestone / Dispatch Stage</option>
                <option value="Final">Final Payment / Net Metering</option>
                <option value="Additional">Additional Works</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                className="crm-input font-bold text-emerald-700"
                placeholder="Amount received"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="crm-select"
              >
                <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                <option value="UPI">UPI / Google Pay / PhonePe</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Reference / UTR / Cheque No
              </label>
              <input
                type="text"
                className="crm-input"
                placeholder="Transaction or Cheque No."
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                className="crm-input"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Receipt Notes
              </label>
              <input
                type="text"
                className="crm-input"
                placeholder="Optional notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={formSubmitting} className="btn-brand">
              {formSubmitting ? 'Recording...' : 'Save Payment Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View & Print Receipt Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Payment Receipt: ${selectedPayment?.receiptNumber}`}
        maxWidth="max-w-lg"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div id="payment-receipt" className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.webp" alt="Sunbird Solar" className="h-10 w-auto object-contain" />
                  <div>
                    <h3 className="font-black text-slate-800 text-sm tracking-tight">SUNBIRD SOLAR</h3>
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Official Payment Receipt</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-blue-700">{selectedPayment.receiptNumber}</div>
                  <div className="text-[10px] text-slate-400">
                    Date: {new Date(selectedPayment.paymentDate || selectedPayment.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Amount Received
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {formatCurrency(selectedPayment.amount)}
                </span>
                <div className="text-xs text-emerald-800 mt-1 font-medium">
                  Mode: {selectedPayment.paymentMethod} {selectedPayment.referenceNumber ? `• Ref: ${selectedPayment.referenceNumber}` : ''}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-800">{selectedPayment.client?.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Client ID / Place:</span>
                  <span className="font-medium text-slate-700">
                    {selectedPayment.client?.clientNumber} • {selectedPayment.client?.place}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Payment Nature:</span>
                  <span className="font-medium text-slate-700">{selectedPayment.paymentType} Payment</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Status:</span>
                  <Badge variant={selectedPayment.paymentStatus}>{selectedPayment.paymentStatus}</Badge>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-2">
                This is a computer-generated receipt issued by Sunbird Solar CRM.
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button onClick={() => window.print()} className="btn-brand text-xs px-3 py-1.5">
                <Printer size={15} />
                Print Receipt
              </button>
              <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialogPayment}
        onClose={() => setDeleteDialogPayment(null)}
        onConfirm={handleDeletePayment}
        title="Delete Payment Receipt?"
        message={`Are you sure you want to delete receipt ${deleteDialogPayment?.receiptNumber} of ${formatCurrency(deleteDialogPayment?.amount)}? Customer balance will be adjusted accordingly.`}
        confirmText="Delete Receipt"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PaymentList;
