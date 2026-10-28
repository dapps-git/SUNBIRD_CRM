import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import GpsPicker from '../../components/ui/GpsPicker';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  Edit,
  ArrowRightCircle,
  Eye,
  MapPin,
  Calendar,
  Phone,
  RefreshCw,
} from 'lucide-react';

const LeadList = () => {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Status Change State
  const [statusModalLead, setStatusModalLead] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Conversion Confirmation Dialog State
  const [convertDialogLead, setConvertDialogLead] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  // 5-field basic lead form state
  const initialForm = {
    fullName: '',
    place: '',
    phoneNumber: '',
    fullAddress: '',
    gpsLocation: { latitude: null, longitude: null, locationUrl: '', rawText: '' },
    leadSource: 'Organic enquiries',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', {
        params: {
          search,
          status: statusFilter,
          page,
          limit: 15,
        },
      });
      setLeads(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('[Fetch Leads Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, page]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      fullName: lead.fullName,
      place: lead.place,
      phoneNumber: lead.phoneNumber,
      fullAddress: lead.fullAddress,
      gpsLocation: lead.gpsLocation || { latitude: null, longitude: null, locationUrl: '', rawText: '' },
      leadSource: lead.leadSource || 'Organic enquiries',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Submit Lead Form (Create or Edit)
  const handleSubmitLead = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation for the 5 basic fields
    if (!formData.fullName.trim() || !formData.place.trim() || !formData.phoneNumber.trim() || !formData.fullAddress.trim()) {
      setFormError('Please complete all required fields: Full Name, Place, Phone Number, and Full Address.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (selectedLead) {
        // Edit existing lead
        await api.put(`/leads/${selectedLead._id}`, formData);
        setIsEditModalOpen(false);
      } else {
        // Create new lead
        await api.post('/leads', formData);
        setIsAddModalOpen(false);
      }
      fetchLeads();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving basic lead details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Status Update
  const handleOpenStatusModal = (lead) => {
    setStatusModalLead(lead);
    setNewStatus(lead.status);
    setStatusNote('');
  };

  const handleUpdateStatus = async () => {
    if (!statusModalLead || !newStatus) return;
    try {
      await api.patch(`/leads/${statusModalLead._id}/status`, {
        status: newStatus,
        note: statusNote,
      });
      setStatusModalLead(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  // Convert to Real Client flow
  const handlePromptConvert = (lead) => {
    setConvertDialogLead(lead);
  };

  const handleConfirmConvert = async () => {
    if (!convertDialogLead) return;
    setIsConverting(true);
    try {
      const res = await api.post(`/leads/${convertDialogLead._id}/convert`);
      setConvertDialogLead(null);
      fetchLeads();

      // Automatically open the new real client record for completing project info
      if (res.data?.data?.client?._id) {
        navigate(`/clients/${res.data.data.client._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert lead to client');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex justify-end items-center">
        <button onClick={handleOpenAdd} className="btn-brand">
          <UserPlus size={16} /> + Register New Lead
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="crm-card p-4 flex flex-col md:flex-row items-center gap-3 bg-white">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, place, or address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="crm-input pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="crm-select text-xs font-semibold py-2 w-full md:w-48"
          >
            <option value="All">All Lead Statuses</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-Up">Follow-Up</option>
            <option value="Work Approved">Work Approved</option>
            <option value="Not Approved">Not Approved</option>
            <option value="Converted to Client">Converted to Client</option>
          </select>
          <button
            onClick={fetchLeads}
            title="Refresh Leads"
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50 shrink-0"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Lead ID & Date</th>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Place & Address</th>
              <th>GPS Location</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin text-blue-600 inline-block mr-2" size={20} />
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isWorkApproved = lead.status === 'Work Approved';
                const isConverted = lead.isConverted;

                return (
                  <tr key={lead._id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 font-mono text-xs">
                          {lead.leadNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="font-bold text-slate-800">{lead.fullName}</div>
                      <span className="text-[11px] text-slate-400">{lead.leadSource}</span>
                    </td>

                    <td>
                      <a
                        href={`tel:${lead.phoneNumber}`}
                        className="text-slate-700 hover:text-blue-600 font-medium inline-flex items-center gap-1"
                      >
                        <Phone size={12} className="text-slate-400" />
                        {lead.phoneNumber}
                      </a>
                    </td>

                    <td>
                      <div className="text-xs font-semibold text-slate-700">{lead.place}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs" title={lead.fullAddress}>
                        {lead.fullAddress}
                      </div>
                    </td>

                    <td>
                      {lead.gpsLocation?.locationUrl ? (
                        <a
                          href={lead.gpsLocation.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                        >
                          <MapPin size={13} /> View Map <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Not recorded</span>
                      )}
                    </td>

                    <td>
                      <button
                        onClick={() => handleOpenStatusModal(lead)}
                        title="Click to change status"
                        className="cursor-pointer group flex items-center gap-1"
                      >
                        <Badge status={lead.status} />
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-600 underline">
                          edit
                        </span>
                      </button>
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Work Approved & not converted, show prominent Convert button */}
                        {isWorkApproved && !isConverted && (
                          <button
                            onClick={() => handlePromptConvert(lead)}
                            className="btn-success text-xs py-1.5 px-2.5 font-bold animate-pulse hover:animate-none"
                            title="Convert to Real Client"
                          >
                            <ArrowRightCircle size={14} /> Convert to Real Client
                          </button>
                        )}

                        {isConverted && (
                          <button
                            onClick={() => navigate(`/clients/${lead.convertedClientId?._id || lead.convertedClientId}`)}
                            className="btn-outline-brand text-xs py-1.5 px-2.5"
                            title="View Converted Client Record"
                          >
                            <Eye size={13} /> View Client
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                          title="Edit Basic Details"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Total Records: {total}</span>
        <span>Page {page} of {Math.max(1, Math.ceil(total / 15))}</span>
      </div>

      {/* Add / Edit Basic Lead Modal (STRICTLY 5 FIELDS ONLY) */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={selectedLead && isEditModalOpen ? `Edit Lead Details: ${selectedLead.leadNumber}` : 'Register New Lead (Basic Enquiry Only)'}
      >
        <form onSubmit={handleSubmitLead} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
            <strong>Lead Collection Rule:</strong> Only collect the customer's 5 basic contact & location fields. Quotations, documents, and project details are unlocked exclusively in <em>Real Client Management</em> upon work approval.
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {formError}
            </div>
          )}

          {/* 1. Full Name */}
          <div>
            <label className="crm-label">1. Customer Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="crm-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. Place */}
            <div>
              <label className="crm-label">2. Place / City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kochi / Ernakulam"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                className="crm-input"
              />
            </div>

            {/* 3. Phone Number */}
            <div>
              <label className="crm-label">3. Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98470 12345"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="crm-input"
              />
            </div>
          </div>

          {/* 4. Full Address */}
          <div>
            <label className="crm-label">4. Full Installation Address *</label>
            <textarea
              required
              rows={2}
              placeholder="House/Building Name, Street, Landmark, PIN code"
              value={formData.fullAddress}
              onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
              className="crm-textarea"
            />
          </div>

          {/* 5. GPS Location */}
          <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
            <GpsPicker
              value={formData.gpsLocation}
              onChange={(val) => setFormData({ ...formData, gpsLocation: val })}
            />
          </div>

          {/* Enquiry Source Tag */}
          <div>
            <label className="crm-label">Enquiry Source (Optional)</label>
            <select
              value={formData.leadSource}
              onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              className="crm-select text-xs"
            >
              <option value="Instagram">Instagram</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Word of mouth">Word of mouth</option>
              <option value="Organic enquiries">Organic enquiries</option>
              <option value="Phone calls">Phone calls</option>
              <option value="Walk-ins">Walk-ins</option>
              <option value="Referral">Referral</option>
              <option value="Other">Other</option>
            </select>
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
              {formSubmitting ? 'Saving Lead...' : selectedLead && isEditModalOpen ? 'Update Basic Details' : 'Save Basic Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      {statusModalLead && (
        <Modal
          isOpen={!!statusModalLead}
          onClose={() => setStatusModalLead(null)}
          title={`Update Status: ${statusModalLead.leadNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Customer: <strong>{statusModalLead.fullName}</strong> ({statusModalLead.place})
            </p>

            <div>
              <label className="crm-label">Select Lifecycle Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="crm-select font-semibold"
              >
                <option value="New Lead">New Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Work Approved">Work Approved (Enables Client Conversion)</option>
                <option value="Not Approved">Not Approved (Did Not Proceed)</option>
              </select>
            </div>

            <div>
              <label className="crm-label">Status Note / Follow-up Details</label>
              <textarea
                rows={2}
                placeholder="Reason or notes regarding status update..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="crm-textarea text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalLead(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="btn-brand"
              >
                Save Status
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal: Convert to Real Client */}
      {convertDialogLead && (
        <ConfirmDialog
          isOpen={!!convertDialogLead}
          onClose={() => setConvertDialogLead(null)}
          onConfirm={handleConfirmConvert}
          isLoading={isConverting}
          title="Confirm Conversion to Real Client"
          message={`Are you sure you want to approve and convert lead ${convertDialogLead.leadNumber} (${convertDialogLead.fullName}) to a Real Client? All 5 basic contact fields will be transferred automatically, and the real client profile will open for completing project pricing, documents, and payments.`}
          confirmText="Yes, Convert to Real Client"
        />
      )}
    </div>
  );
};

export default LeadList;
