import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import GpsPicker from '../../components/ui/GpsPicker';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Sun,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Plus,
  RefreshCw,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [kycStatusFilter, setKycStatusFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // KYC modal state
  const [kycModalClient, setKycModalClient] = useState(null);
  const [newKycStatus, setNewKycStatus] = useState('Verified');
  const [kycNotes, setKycNotes] = useState('');

  // Delete dialog
  const [deleteDialogClient, setDeleteDialogClient] = useState(null);

  // Form state
  const initialForm = {
    fullName: '',
    place: '',
    phoneNumber: '',
    fullAddress: '',
    gpsLocation: { latitude: null, longitude: null, locationUrl: '', rawText: '' },
    leadSource: 'Organic enquiries',
    referredPersonName: '',
    referredPersonPhone: '',
    quotationAmount: 0,
    finalProjectPrice: 0,
    systemCapacity: '',
    materialsEquipmentDetails: '',
    warrantyDetails: '',
    advancePaymentAmount: 0,
    commissionType: 'fixed',
    commissionRate: 0,
    kycStatus: 'Pending',
    kycNotes: '',
    projectStatus: 'Approved',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients', {
        params: {
          search,
          paymentStatus: paymentStatusFilter,
          kycStatus: kycStatusFilter,
        },
      });
      setClients(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, paymentStatusFilter, kycStatusFilter]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setFormData({
      fullName: client.fullName || '',
      place: client.place || '',
      phoneNumber: client.phoneNumber || '',
      fullAddress: client.fullAddress || '',
      gpsLocation: client.gpsLocation || { latitude: null, longitude: null, locationUrl: '', rawText: '' },
      leadSource: client.leadSource || 'Organic enquiries',
      referredPersonName: client.referredPersonName || '',
      referredPersonPhone: client.referredPersonPhone || '',
      quotationAmount: client.quotationAmount || 0,
      finalProjectPrice: client.finalProjectPrice || 0,
      systemCapacity: client.systemCapacity || '',
      materialsEquipmentDetails: client.materialsEquipmentDetails || '',
      warrantyDetails: client.warrantyDetails || '',
      advancePaymentAmount: client.advancePaymentAmount || 0,
      commissionType: client.commissionType || 'fixed',
      commissionRate: client.commissionRate || 0,
      kycStatus: client.kycStatus || 'Pending',
      kycNotes: client.kycNotes || '',
      projectStatus: client.projectStatus || 'Approved',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenView = (client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.place || !formData.phoneNumber || !formData.fullAddress) {
      setFormError('Please fill in all required customer details (Name, Place, Phone, Address).');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      if (selectedClient && isEditModalOpen) {
        await api.put(`/clients/${selectedClient._id}`, formData);
        setIsEditModalOpen(false);
      } else {
        await api.post('/clients', formData);
        setIsAddModalOpen(false);
      }
      fetchClients();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save customer data.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateKyc = async (e) => {
    e.preventDefault();
    if (!kycModalClient) return;
    try {
      await api.patch(`/clients/${kycModalClient._id}/kyc`, {
        kycStatus: newKycStatus,
        kycNotes,
      });
      setKycModalClient(null);
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update KYC status');
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteDialogClient) return;
    try {
      await api.delete(`/clients/${deleteDialogClient._id}`);
      setDeleteDialogClient(null);
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete client');
    }
  };

  const handleExportExcel = () => {
    const exportData = clients.map((c) => ({
      'Client ID': c.clientNumber,
      'Full Name': c.fullName,
      Place: c.place,
      Phone: c.phoneNumber,
      Address: c.fullAddress,
      'System Capacity': c.systemCapacity,
      'Final Price (INR)': c.finalProjectPrice,
      'Total Paid (INR)': c.totalPaid,
      'Remaining Balance (INR)': c.remainingBalance,
      'Payment Status': c.paymentStatus,
      'KYC Status': c.kycStatus,
      'Lead Source': c.leadSource,
      'Referred By': c.referredPersonName || 'N/A',
      'Created Date': new Date(c.createdAt).toLocaleDateString('en-IN'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Real Clients');
    XLSX.writeFile(workbook, `Sunbird_Solar_Clients_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={handleExportExcel}
          className="btn-secondary text-xs sm:text-sm px-3.5 py-2"
          disabled={clients.length === 0}
        >
          <Download size={16} />
          Export Excel
        </button>
        <button onClick={handleOpenAdd} className="btn-brand text-xs sm:text-sm px-4 py-2">
          <Plus size={16} />
          Add Real Client
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="crm-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 pointer-events-none z-10">
              <Search size={17} />
            </span>
            <input
              type="text"
              placeholder="Search by client ID, name, place, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input crm-input-has-icon-left text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Pending">Payment Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Fully Paid">Fully Paid</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-slate-400 shrink-0" />
            <select
              value={kycStatusFilter}
              onChange={(e) => setKycStatusFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All KYC Statuses</option>
              <option value="Pending">KYC Pending</option>
              <option value="Verified">KYC Verified</option>
              <option value="Rejected">KYC Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Client Info</th>
              <th>Place & Contact</th>
              <th>System Capacity</th>
              <th>Project Price</th>
              <th>Paid / Balance</th>
              <th>Payment Status</th>
              <th>KYC Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading client records...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400">
                  No real clients found. Convert work-approved leads or click "Add Real Client".
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client._id}>
                  <td>
                    <div className="font-bold text-slate-800">{client.fullName}</div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {client.clientNumber || 'SB-CL-NEW'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      {client.place}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      {client.phoneNumber}
                    </div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-800">
                      {client.systemCapacity || 'Standard Rooftop'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Source: {client.leadSource || 'Organic'}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm font-bold text-slate-800">
                      {formatCurrency(client.finalProjectPrice)}
                    </div>
                    {client.quotationAmount > 0 && (
                      <div className="text-[11px] text-slate-400 line-through">
                        {formatCurrency(client.quotationAmount)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-emerald-600">
                      Paid: {formatCurrency(client.totalPaid)}
                    </div>
                    <div className="text-xs font-semibold text-rose-600">
                      Bal: {formatCurrency(client.remainingBalance)}
                    </div>
                  </td>
                  <td>
                    <Badge variant={client.paymentStatus}>{client.paymentStatus}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={client.kycStatus}>{client.kycStatus}</Badge>
                      <button
                        onClick={() => {
                          setKycModalClient(client);
                          setNewKycStatus(client.kycStatus === 'Verified' ? 'Pending' : 'Verified');
                          setKycNotes(client.kycNotes || '');
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                        title="Update KYC"
                      >
                        <ShieldCheck size={15} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenView(client)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Edit Client"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteDialogClient(client)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Client"
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

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Customer: ${selectedClient?.clientNumber}` : 'Register New Real Client'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium">
              {formError}
            </div>
          )}

          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Identification & Address
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="e.g. Ramesh Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                className="crm-input"
                placeholder="e.g. 9876543210"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Place / City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="e.g. Ernakulam, Kerala"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                System Capacity (kW)
              </label>
              <input
                type="text"
                className="crm-input"
                placeholder="e.g. 5 kW On-Grid / 3 kW Hybrid"
                value={formData.systemCapacity}
                onChange={(e) => setFormData({ ...formData, systemCapacity: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Full Address <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              className="crm-textarea"
              placeholder="House/Building name, street, post office, pincode"
              value={formData.fullAddress}
              onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              GPS Location & Map Coordinates
            </label>
            <GpsPicker
              value={formData.gpsLocation}
              onChange={(loc) => setFormData({ ...formData, gpsLocation: loc })}
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Quotation & Financial Agreement
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
                  placeholder="300000"
                  value={formData.quotationAmount}
                  onChange={(e) => setFormData({ ...formData, quotationAmount: Number(e.target.value) })}
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
                  className="crm-input"
                  placeholder="280000"
                  value={formData.finalProjectPrice}
                  onChange={(e) => setFormData({ ...formData, finalProjectPrice: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Advance Paid at Booking (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  className="crm-input"
                  placeholder="25000"
                  value={formData.advancePaymentAmount}
                  onChange={(e) => setFormData({ ...formData, advancePaymentAmount: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Referral & Commission Tracking
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Lead Source
                </label>
                <select
                  value={formData.leadSource}
                  onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                  className="crm-select"
                >
                  <option value="Organic enquiries">Organic enquiries</option>
                  <option value="Reference">Reference</option>
                  <option value="Direct sales agent">Direct sales agent</option>
                  <option value="Digital Ads">Digital Ads</option>
                  <option value="Exhibition/Event">Exhibition/Event</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Referred Person Name
                </label>
                <input
                  type="text"
                  className="crm-input"
                  placeholder="Name of referrer/agent"
                  value={formData.referredPersonName}
                  onChange={(e) => setFormData({ ...formData, referredPersonName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Commission Rate ({formData.commissionType === 'percentage' ? '%' : '₹'})
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                    className="crm-select w-28 shrink-0"
                  >
                    <option value="fixed">Fixed ₹</option>
                    <option value="percentage">% of Price</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    className="crm-input"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              {formSubmitting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Saving...
                </>
              ) : isEditModalOpen ? (
                'Save Changes'
              ) : (
                'Register Client'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Client Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Customer File: ${selectedClient?.fullName} (${selectedClient?.clientNumber})`}
        maxWidth="max-w-2xl"
      >
        {selectedClient && (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Project Price</span>
                <span className="text-base font-bold text-slate-800">{formatCurrency(selectedClient.finalProjectPrice)}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Paid</span>
                <span className="text-base font-bold text-emerald-600">{formatCurrency(selectedClient.totalPaid)}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Remaining</span>
                <span className="text-base font-bold text-rose-600">{formatCurrency(selectedClient.remainingBalance)}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">KYC Status</span>
                <Badge variant={selectedClient.kycStatus}>{selectedClient.kycStatus}</Badge>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Customer Phone</span>
                <span className="font-semibold text-slate-800">{selectedClient.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Place / City</span>
                <span className="font-semibold text-slate-800">{selectedClient.place}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Full Address</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{selectedClient.fullAddress}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">System Capacity</span>
                <span className="font-semibold text-slate-800">{selectedClient.systemCapacity || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">GPS Location</span>
                <span className="font-semibold text-slate-800">
                  {selectedClient.gpsLocation?.latitude
                    ? `${selectedClient.gpsLocation.latitude}, ${selectedClient.gpsLocation.longitude}`
                    : selectedClient.gpsLocation?.rawText || 'Not pinned'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Referred By</span>
                <span className="font-semibold text-slate-800">{selectedClient.referredPersonName || 'Direct / Organic'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Commission Status</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(selectedClient.calculatedCommission)} ({selectedClient.commissionStatus})
                </span>
              </div>
            </div>

            {selectedClient.history && selectedClient.history.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Customer Lifecycle Timeline
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedClient.history.map((h, i) => (
                    <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>{h.action}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {new Date(h.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-0.5">{h.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* KYC Status Modal */}
      <Modal
        isOpen={!!kycModalClient}
        onClose={() => setKycModalClient(null)}
        title={`Update KYC: ${kycModalClient?.fullName}`}
      >
        <form onSubmit={handleUpdateKyc} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              KYC Verification Decision
            </label>
            <select
              value={newKycStatus}
              onChange={(e) => setNewKycStatus(e.target.value)}
              className="crm-select"
            >
              <option value="Verified">Verified (Documents & Aadhaar Valid)</option>
              <option value="Pending">Pending Verification</option>
              <option value="Rejected">Rejected (Incomplete / Inaccurate Docs)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Verification Notes / Remarks
            </label>
            <textarea
              rows={3}
              value={kycNotes}
              onChange={(e) => setKycNotes(e.target.value)}
              placeholder="e.g. Electricity bill & Aadhaar verified against consumer number..."
              className="crm-textarea"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setKycModalClient(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-brand">
              Save KYC Status
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialogClient}
        onClose={() => setDeleteDialogClient(null)}
        onConfirm={handleDeleteClient}
        title="Delete Real Client Record?"
        message={`Are you sure you want to delete ${deleteDialogClient?.fullName} (${deleteDialogClient?.clientNumber})? This will remove related financial balances.`}
        confirmText="Delete Client"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ClientList;
