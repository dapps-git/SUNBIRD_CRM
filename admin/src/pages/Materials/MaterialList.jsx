import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Sun,
  CheckCircle,
  Truck,
  Layers,
} from 'lucide-react';

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deleteDialogMaterial, setDeleteDialogMaterial] = useState(null);

  // Form State
  const initialForm = {
    project: '',
    productName: '',
    category: 'Solar Panels',
    brand: '',
    specification: '',
    quantity: 1,
    unit: 'Nos',
    serialNumbers: '',
    status: 'Allocated',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials', {
        params: { search, category: categoryFilter, status: statusFilter },
      });
      setMaterials(res.data.data || []);
    } catch (err) {
      console.error('Failed to load materials', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchProjects();
  }, [search, categoryFilter, statusFilter]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setSelectedMaterial(m);
    setFormData({
      project: m.project?._id || m.project || '',
      productName: m.productName || '',
      category: m.category || 'Solar Panels',
      brand: m.brand || '',
      specification: m.specification || '',
      quantity: m.quantity || 1,
      unit: m.unit || 'Nos',
      serialNumbers: m.serialNumbers ? m.serialNumbers.join(', ') : '',
      status: m.status || 'Allocated',
      notes: m.notes || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.project || !formData.productName || !formData.quantity) {
      setFormError('Please select a project and specify product name & quantity.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        serialNumbers: formData.serialNumbers
          ? formData.serialNumbers.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (isEditModalOpen && selectedMaterial) {
        await api.put(`/materials/${selectedMaterial._id}`, payload);
        setIsEditModalOpen(false);
      } else {
        await api.post('/materials', payload);
        setIsAddModalOpen(false);
      }
      fetchMaterials();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save material equipment.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteDialogMaterial) return;
    try {
      await api.delete(`/materials/${deleteDialogMaterial._id}`);
      setDeleteDialogMaterial(null);
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete material entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex justify-end items-center">
        <button onClick={handleOpenAdd} className="btn-brand text-xs sm:text-sm px-4 py-2">
          <Plus size={16} />
          Allocate Equipment
        </button>
      </div>

      {/* Filter and Search */}
      <div className="crm-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by equipment, brand, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Categories</option>
              <option value="Solar Panels">Solar Panels</option>
              <option value="Inverter">Solar Inverters</option>
              <option value="Mounting Structure">Mounting Structure</option>
              <option value="Battery">Batteries / Storage</option>
              <option value="Cables & Wiring">Cables & Wiring</option>
              <option value="Safety & Breakers">Safety, ACDB/DCDB, Breakers</option>
              <option value="Other">Other Equipment</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Allocated">Allocated</option>
              <option value="Dispatched">Dispatched to Site</option>
              <option value="Installed">Installed & Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Category</th>
              <th>Brand & Spec</th>
              <th>Quantity</th>
              <th>Assigned Project</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading equipment allocations...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400">
                  No materials recorded yet. Click "Allocate Equipment" to assign equipment to a solar project.
                </td>
              </tr>
            ) : (
              materials.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="font-bold text-slate-800">{m.productName}</div>
                    {m.serialNumbers && m.serialNumbers.length > 0 && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        S/N: {m.serialNumbers.join(', ')}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {m.category}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs font-medium text-slate-700">{m.brand || 'Standard'}</div>
                    <div className="text-[11px] text-slate-400">{m.specification || 'N/A'}</div>
                  </td>
                  <td>
                    <span className="text-sm font-bold text-slate-800">
                      {m.quantity} {m.unit}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-800">
                      {m.project?.projectName || 'Project'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {m.project?.projectNumber} • {m.client?.fullName}
                    </div>
                  </td>
                  <td>
                    <Badge variant={m.status}>{m.status}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Edit Allocation"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteDialogMaterial(m)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Equipment"
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

      {/* Add / Edit Material Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Equipment Allocation' : 'Allocate Equipment to Project'}
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
              Select Solar Project <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="crm-select"
            >
              <option value="">-- Choose target project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectNumber} - {p.projectName} ({p.client?.fullName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Equipment / Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="e.g. 540W Mono-PERC Solar Panel"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="crm-select"
              >
                <option value="Solar Panels">Solar Panels</option>
                <option value="Inverter">Inverter</option>
                <option value="Mounting Structure">Mounting Structure</option>
                <option value="Battery">Battery</option>
                <option value="Cables & Wiring">Cables & Wiring</option>
                <option value="Safety & Breakers">Safety & Breakers</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                className="crm-input"
                placeholder="e.g. Waaree, Tata Power, Growatt"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Technical Specification
              </label>
              <input
                type="text"
                className="crm-input"
                placeholder="e.g. 540W 24V Bi-facial"
                value={formData.specification}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                className="crm-input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="crm-select"
              >
                <option value="Nos">Nos</option>
                <option value="Sets">Sets</option>
                <option value="Meters">Meters</option>
                <option value="Kg">Kg</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="crm-select"
              >
                <option value="Allocated">Allocated</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Installed">Installed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Serial Numbers (Comma-separated)
            </label>
            <input
              type="text"
              className="crm-input font-mono text-xs"
              placeholder="e.g. SN100234, SN100235, SN100236"
              value={formData.serialNumbers}
              onChange={(e) => setFormData({ ...formData, serialNumbers: e.target.value })}
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
              {formSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Allocate Equipment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialogMaterial}
        onClose={() => setDeleteDialogMaterial(null)}
        onConfirm={handleDeleteMaterial}
        title="Delete Equipment Allocation?"
        message={`Are you sure you want to remove ${deleteDialogMaterial?.productName} from the project?`}
        confirmText="Delete Material"
        confirmVariant="danger"
      />
    </div>
  );
};

export default MaterialList;
