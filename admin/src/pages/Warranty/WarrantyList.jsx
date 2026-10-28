import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  ShieldCheck,
  Search,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wrench,
  Calendar,
  User,
  Phone,
} from 'lucide-react';

const WarrantyList = () => {
  const [warranties, setWarranties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Warranty Setup Form
  const [setupForm, setSetupForm] = useState({
    client: '',
    panelsWarrantyYears: 25,
    inverterWarrantyYears: 5,
    batteryWarrantyYears: 5,
    workmanshipWarrantyYears: 2,
    serviceStartDate: new Date().toISOString().slice(0, 10),
    serviceEndDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
  });

  // Log Claim Form
  const [claimForm, setClaimForm] = useState({
    issueTitle: '',
    description: '',
  });

  // Resolve Claim Form
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services', { params: { search } });
      setWarranties(res.data.data || []);
    } catch (err) {
      console.error('Failed to load warranties', err);
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
    fetchWarranties();
    fetchClients();
  }, [search]);

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!setupForm.client) {
      setFormError('Please select a customer for warranty coverage.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      await api.post('/services', setupForm);
      setIsSetupModalOpen(false);
      fetchWarranties();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to setup warranty profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimForm.issueTitle || !selectedWarranty) return;
    setFormSubmitting(true);
    try {
      await api.post(`/services/${selectedWarranty._id}/claims`, claimForm);
      setIsClaimModalOpen(false);
      setClaimForm({ issueTitle: '', description: '' });
      fetchWarranties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log service claim');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarranty || !selectedClaim) return;
    try {
      await api.patch(
        `/services/${selectedWarranty._id}/claims/${selectedClaim._id}/status`,
        {
          status: 'Resolved',
          resolutionNotes,
        }
      );
      setIsResolveModalOpen(false);
      setResolutionNotes('');
      fetchWarranties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve claim');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex justify-end items-center">
        <button
          onClick={() => {
            setFormError('');
            setIsSetupModalOpen(true);
          }}
          className="btn-brand text-xs sm:text-sm px-4 py-2"
        >
          <Plus size={16} />
          Register Warranty Profile
        </button>
      </div>

      {/* Search */}
      <div className="crm-card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search by customer name, phone, place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input pl-10 text-sm"
          />
        </div>
      </div>

      {/* Warranties Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw className="animate-spin inline-block mr-2" size={24} />
          Loading warranty records...
        </div>
      ) : warranties.length === 0 ? (
        <div className="crm-card p-12 text-center text-slate-400">
          No warranty records registered yet. Click "Register Warranty Profile" to setup customer solar guarantee.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {warranties.map((w) => {
            const openClaims = (w.claims || []).filter((c) => c.status !== 'Resolved' && c.status !== 'Closed');
            return (
              <div key={w._id} className="crm-card space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-800">{w.client?.fullName}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {w.client?.clientNumber} • {w.client?.place} • {w.client?.phoneNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWarranty(w);
                      setIsClaimModalOpen(true);
                    }}
                    className="btn-brand text-xs px-3 py-1.5"
                  >
                    <Wrench size={14} />
                    Log Ticket
                  </button>
                </div>

                {/* Warranty Breakdown Pills */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Panels</span>
                    <span className="text-sm font-extrabold text-blue-900">{w.panelsWarrantyYears} Yrs</span>
                  </div>
                  <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">Inverter</span>
                    <span className="text-sm font-extrabold text-indigo-900">{w.inverterWarrantyYears} Yrs</span>
                  </div>
                  <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">Battery</span>
                    <span className="text-sm font-extrabold text-purple-900">{w.batteryWarrantyYears} Yrs</span>
                  </div>
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Service</span>
                    <span className="text-sm font-extrabold text-emerald-900">{w.workmanshipWarrantyYears} Yrs</span>
                  </div>
                </div>

                {/* Service Period */}
                <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                  <span>
                    Service Start: {w.serviceStartDate ? new Date(w.serviceStartDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                  <span>
                    AMC Expiry: {w.serviceEndDate ? new Date(w.serviceEndDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>

                {/* Claims list */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Service Tickets ({w.claims?.length || 0})
                    </span>
                    {openClaims.length > 0 && (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {openClaims.length} Open Issue{openClaims.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {w.claims && w.claims.length > 0 ? (
                      w.claims.map((claim) => (
                        <div
                          key={claim._id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{claim.issueTitle}</div>
                            {claim.description && (
                              <div className="text-slate-500 text-[11px] mt-0.5">{claim.description}</div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              Reported: {new Date(claim.reportedDate).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge variant={claim.status}>{claim.status}</Badge>
                            {claim.status !== 'Resolved' && (
                              <button
                                onClick={() => {
                                  setSelectedWarranty(w);
                                  setSelectedClaim(claim);
                                  setIsResolveModalOpen(true);
                                }}
                                className="text-[11px] text-blue-600 hover:underline font-semibold"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic py-1">No service tickets logged. System healthy.</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup Warranty Modal */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        title="Register Solar Warranty Profile"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSetupSubmit} className="space-y-4">
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
              value={setupForm.client}
              onChange={(e) => setSetupForm({ ...setupForm, client: e.target.value })}
              className="crm-select"
            >
              <option value="">-- Choose customer --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientNumber} - {c.fullName} ({c.place})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Panels Warranty (Years)
              </label>
              <input
                type="number"
                min="1"
                className="crm-input"
                value={setupForm.panelsWarrantyYears}
                onChange={(e) => setSetupForm({ ...setupForm, panelsWarrantyYears: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Inverter Warranty (Years)
              </label>
              <input
                type="number"
                min="1"
                className="crm-input"
                value={setupForm.inverterWarrantyYears}
                onChange={(e) => setSetupForm({ ...setupForm, inverterWarrantyYears: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Battery Warranty (Years)
              </label>
              <input
                type="number"
                min="0"
                className="crm-input"
                value={setupForm.batteryWarrantyYears}
                onChange={(e) => setSetupForm({ ...setupForm, batteryWarrantyYears: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Workmanship / AMC (Years)
              </label>
              <input
                type="number"
                min="1"
                className="crm-input"
                value={setupForm.workmanshipWarrantyYears}
                onChange={(e) => setSetupForm({ ...setupForm, workmanshipWarrantyYears: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Service Start Date
              </label>
              <input
                type="date"
                className="crm-input"
                value={setupForm.serviceStartDate}
                onChange={(e) => setSetupForm({ ...setupForm, serviceStartDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Service End Date
              </label>
              <input
                type="date"
                className="crm-input"
                value={setupForm.serviceEndDate}
                onChange={(e) => setSetupForm({ ...setupForm, serviceEndDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsSetupModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={formSubmitting} className="btn-brand">
              {formSubmitting ? 'Registering...' : 'Register Warranty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Ticket Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title={`Log Service Ticket for: ${selectedWarranty?.client?.fullName}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="crm-input"
              placeholder="e.g. Inverter tripping / Low generation error"
              value={claimForm.issueTitle}
              onChange={(e) => setClaimForm({ ...claimForm, issueTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Issue Details / Description
            </label>
            <textarea
              rows={3}
              className="crm-textarea"
              placeholder="Detailed description of problem reported by customer..."
              value={claimForm.description}
              onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsClaimModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={formSubmitting} className="btn-brand">
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Ticket Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Ticket: ${selectedClaim?.issueTitle}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Resolution Notes
            </label>
            <textarea
              rows={3}
              required
              className="crm-textarea"
              placeholder="e.g. Technician visited site, replaced DC fuse, inverter operating normally."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsResolveModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-brand">
              Mark Resolved
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WarrantyList;
