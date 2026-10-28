import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [deleteDialogQuotation, setDeleteDialogQuotation] = useState(null);

  // Form
  const initialForm = {
    client: '',
    lead: '',
    customerName: '',
    systemCapacity: '',
    quotationAmount: 0,
    discount: 0,
    finalPrice: 0,
    materialsDetails: '',
    negotiationDetails: '',
    status: 'Draft',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations', {
        params: { search, status: statusFilter },
      });
      setQuotations(res.data.data || []);
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsAndLeads = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        api.get('/clients'),
        api.get('/leads?status=Work Approved'),
      ]);
      setClients(cRes.data.data || []);
      setLeads(lRes.data.data || []);
    } catch (err) {
      console.error('Failed to load clients or leads', err);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchClientsAndLeads();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (qt) => {
    setSelectedQuotation(qt);
    setFormData({
      client: qt.client?._id || qt.client || '',
      lead: qt.lead?._id || qt.lead || '',
      customerName: qt.customerName || '',
      systemCapacity: qt.systemCapacity || '',
      quotationAmount: qt.quotationAmount || 0,
      discount: qt.discount || 0,
      finalPrice: qt.finalPrice || 0,
      materialsDetails: qt.materialsDetails || '',
      negotiationDetails: qt.negotiationDetails || '',
      status: qt.status || 'Draft',
      validUntil: qt.validUntil ? new Date(qt.validUntil).toISOString().slice(0, 10) : '',
      notes: qt.notes || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenView = (qt) => {
    setSelectedQuotation(qt);
    setIsViewModalOpen(true);
  };

  const calculateFinal = (amount, discount) => {
    const finalVal = Math.max(0, (Number(amount) || 0) - (Number(discount) || 0));
    return finalVal;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.finalPrice) {
      setFormError('Please provide Customer Name and Final Price.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      if (isEditModalOpen && selectedQuotation) {
        await api.put(`/quotations/${selectedQuotation._id}`, formData);
        setIsEditModalOpen(false);
      } else {
        await api.post('/quotations', formData);
        setIsAddModalOpen(false);
      }
      fetchQuotations();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save quotation.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteQuotation = async () => {
    if (!deleteDialogQuotation) return;
    try {
      await api.delete(`/quotations/${deleteDialogQuotation._id}`);
      setDeleteDialogQuotation(null);
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete quotation');
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const handleExportExcel = () => {
    const data = quotations.map((q) => ({
      'Quotation No': q.quotationNumber,
      'Customer Name': q.customerName,
      Capacity: q.systemCapacity,
      'Quotation Amount (INR)': q.quotationAmount,
      'Discount (INR)': q.discount,
      'Final Price (INR)': q.finalPrice,
      Status: q.status,
      'Valid Until': q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : '',
      Date: new Date(q.createdAt).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotations');
    XLSX.writeFile(wb, `Sunbird_Solar_Quotations_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={handleExportExcel}
          className="btn-secondary text-xs sm:text-sm px-3.5 py-2"
          disabled={quotations.length === 0}
        >
          <Download size={16} />
          Export Excel
        </button>
        <button onClick={handleOpenAdd} className="btn-brand text-xs sm:text-sm px-4 py-2">
          <Plus size={16} />
          Create Quotation
        </button>
      </div>

      {/* Filter and Search */}
      <div className="crm-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by quotation number, customer name..."
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
              <option value="All">All Quotation Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent to Customer</option>
              <option value="Accepted">Accepted & Finalized</option>
              <option value="Revised">Revised</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Quotation No</th>
              <th>Customer</th>
              <th>System Capacity</th>
              <th>Quotation Amount</th>
              <th>Discount</th>
              <th>Final Price</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading quotations...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400">
                  No quotations created yet. Click "Create Quotation" to generate your first quote.
                </td>
              </tr>
            ) : (
              quotations.map((qt) => (
                <tr key={qt._id}>
                  <td>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {qt.quotationNumber}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold text-slate-800">{qt.customerName}</div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(qt.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-700">
                      {qt.systemCapacity || 'Standard'}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-600">
                      {formatCurrency(qt.quotationAmount)}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-amber-600">
                      {qt.discount > 0 ? `-${formatCurrency(qt.discount)}` : '₹0'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(qt.finalPrice)}
                    </span>
                  </td>
                  <td>
                    <Badge variant={qt.status}>{qt.status}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenView(qt)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View & Print Quote"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(qt)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Edit Quote"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteDialogQuotation(qt)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Quote"
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

      {/* Add / Edit Quotation Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Quotation: ${selectedQuotation?.quotationNumber}` : 'Create Solar Installation Quotation'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Select Client / Lead (Optional Auto-fill)
            </label>
            <select
              value={formData.client}
              onChange={(e) => {
                const clientId = e.target.value;
                const cl = clients.find((c) => c._id === clientId);
                if (cl) {
                  setFormData({
                    ...formData,
                    client: clientId,
                    customerName: cl.fullName,
                    systemCapacity: cl.systemCapacity || formData.systemCapacity,
                    quotationAmount: cl.quotationAmount || formData.quotationAmount,
                    finalPrice: cl.finalProjectPrice || formData.finalPrice,
                  });
                } else {
                  setFormData({ ...formData, client: clientId });
                }
              }}
              className="crm-select"
            >
              <option value="">-- Or enter custom customer name below --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  Client: {c.clientNumber} - {c.fullName} ({c.place})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="e.g. Anand Varma"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Proposed Solar Capacity (kW)
              </label>
              <input
                type="text"
                className="crm-input"
                placeholder="e.g. 5 kW On-Grid / 10 kW Commercial"
                value={formData.systemCapacity}
                onChange={(e) => setFormData({ ...formData, systemCapacity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Quotation Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                className="crm-input"
                value={formData.quotationAmount}
                onChange={(e) => {
                  const amt = Number(e.target.value);
                  setFormData({
                    ...formData,
                    quotationAmount: amt,
                    finalPrice: calculateFinal(amt, formData.discount),
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                className="crm-input"
                value={formData.discount}
                onChange={(e) => {
                  const disc = Number(e.target.value);
                  setFormData({
                    ...formData,
                    discount: disc,
                    finalPrice: calculateFinal(formData.quotationAmount, disc),
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Final Project Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                className="crm-input font-bold text-emerald-700"
                value={formData.finalPrice}
                onChange={(e) => setFormData({ ...formData, finalPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Quotation Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="crm-select"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent to Customer</option>
                <option value="Accepted">Accepted by Customer</option>
                <option value="Revised">Revised</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                className="crm-input"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Materials & Equipment Specification
            </label>
            <textarea
              rows={2}
              className="crm-textarea"
              placeholder="e.g. Tier-1 Mono PERC Bi-facial panels (550W), 3-phase Solar Inverter, GI Structure..."
              value={formData.materialsDetails}
              onChange={(e) => setFormData({ ...formData, materialsDetails: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Negotiation & Special Terms
            </label>
            <textarea
              rows={2}
              className="crm-textarea"
              placeholder="e.g. Includes net-metering application fee, 5 years free annual maintenance..."
              value={formData.negotiationDetails}
              onChange={(e) => setFormData({ ...formData, negotiationDetails: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={formSubmitting} className="btn-brand">
              {formSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Generate Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View & Print Quotation Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Quotation Invoice: ${selectedQuotation?.quotationNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedQuotation && (
          <div className="space-y-6">
            <div id="printable-quotation" className="p-6 bg-white border border-slate-200 rounded-xl space-y-5">
              {/* Quotation Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <img src="/logo.webp" alt="Sunbird Solar" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">SUNBIRD SOLAR</h2>
                    <p className="text-xs text-blue-600 font-semibold uppercase">Clean Energy Solutions</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase">OFFICIAL QUOTE</span>
                  <div className="text-base font-mono font-bold text-blue-700">{selectedQuotation.quotationNumber}</div>
                  <div className="text-xs text-slate-400">Date: {new Date(selectedQuotation.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              {/* Customer & System Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Quoted To:</span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">{selectedQuotation.customerName}</span>
                  {selectedQuotation.client?.place && (
                    <span className="text-slate-500">{selectedQuotation.client.place}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold uppercase">Proposed System:</span>
                  <span className="text-sm font-bold text-blue-700 block mt-0.5">
                    {selectedQuotation.systemCapacity || 'Solar PV Rooftop'}
                  </span>
                  <span className="text-slate-400">
                    Validity: {selectedQuotation.validUntil ? new Date(selectedQuotation.validUntil).toLocaleDateString('en-IN') : '30 Days'}
                  </span>
                </div>
              </div>

              {/* Pricing Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Quotation Amount:</span>
                  <span className="font-semibold">{formatCurrency(selectedQuotation.quotationAmount)}</span>
                </div>
                {selectedQuotation.discount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Approved Commercial Discount:</span>
                    <span className="font-semibold">-{formatCurrency(selectedQuotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-800 pt-2 border-t border-slate-200">
                  <span>Net Project Price:</span>
                  <span className="text-blue-700 text-base">{formatCurrency(selectedQuotation.finalPrice)}</span>
                </div>
              </div>

              {/* Equipment & Terms */}
              {selectedQuotation.materialsDetails && (
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Equipment Scope:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {selectedQuotation.materialsDetails}
                  </p>
                </div>
              )}

              {selectedQuotation.negotiationDetails && (
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Terms & Guarantee:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {selectedQuotation.negotiationDetails}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 text-center pt-2">
                * Prices inclusive of supply, installation, testing, and assistance with Net-metering application.
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="btn-brand text-xs px-3.5 py-2"
              >
                <Printer size={16} />
                Print / Save PDF
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
        isOpen={!!deleteDialogQuotation}
        onClose={() => setDeleteDialogQuotation(null)}
        onConfirm={handleDeleteQuotation}
        title="Delete Quotation?"
        message={`Are you sure you want to delete quotation ${deleteDialogQuotation?.quotationNumber}?`}
        confirmText="Delete Quote"
        confirmVariant="danger"
      />
    </div>
  );
};

export default QuotationList;
