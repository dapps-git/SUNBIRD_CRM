import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Sun,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteDialogProject, setDeleteDialogProject] = useState(null);

  // Form State
  const initialForm = {
    client: '',
    projectName: '',
    capacity: '',
    status: 'Approved',
    startDate: '',
    completionDate: '',
    siteAddress: '',
    materialsSummary: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Add Note State
  const [newNote, setNewNote] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects', {
        params: { search, status: statusFilter },
      });
      setProjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (err) {
      console.error('Failed to load client dropdown', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      client: project.client?._id || project.client || '',
      projectName: project.projectName || '',
      capacity: project.capacity || '',
      status: project.status || 'Approved',
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      completionDate: project.completionDate ? new Date(project.completionDate).toISOString().slice(0, 10) : '',
      siteAddress: project.siteAddress || '',
      materialsSummary: project.materialsSummary || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenView = (project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.client || !formData.projectName) {
      setFormError('Please select a customer and provide a project title.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      if (isEditModalOpen && selectedProject) {
        await api.put(`/projects/${selectedProject._id}`, formData);
        setIsEditModalOpen(false);
      } else {
        await api.post('/projects', formData);
        setIsAddModalOpen(false);
      }
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save solar project.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedProject) return;
    try {
      const res = await api.post(`/projects/${selectedProject._id}/notes`, { text: newNote });
      setSelectedProject(res.data.data);
      setNewNote('');
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add project note');
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteDialogProject) return;
    try {
      await api.delete(`/projects/${deleteDialogProject._id}`);
      setDeleteDialogProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex justify-end items-center">
        <button onClick={handleOpenAdd} className="btn-brand text-xs sm:text-sm px-4 py-2">
          <Plus size={16} />
          Create Solar Project
        </button>
      </div>

      {/* Filter and Search */}
      <div className="crm-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 pointer-events-none z-10">
              <Search size={17} />
            </span>
            <input
              type="text"
              placeholder="Search by project name, project ID, site address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input crm-input-has-icon-left text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Project Stages</option>
              <option value="Approved">Approved</option>
              <option value="Planning">Planning & Engineering</option>
              <option value="Installation in Progress">Installation in Progress</option>
              <option value="Completed">Completed & Synchronized</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Project Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Project Info</th>
              <th>Customer</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Timeline</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading projects...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400">
                  No solar projects found. Convert a client or click "Create Solar Project".
                </td>
              </tr>
            ) : (
              projects.map((prj) => (
                <tr key={prj._id}>
                  <td>
                    <div className="font-bold text-slate-800">{prj.projectName}</div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {prj.projectNumber || 'SB-PRJ-NEW'}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-800 text-sm">
                      {prj.client?.fullName || 'Unassigned'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {prj.client?.place} • {prj.client?.phoneNumber}
                    </div>
                  </td>
                  <td>
                    <div className="text-xs font-bold text-slate-700">
                      {prj.capacity || 'Standard Setup'}
                    </div>
                  </td>
                  <td>
                    <Badge variant={prj.status}>{prj.status}</Badge>
                  </td>
                  <td>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      Start: {prj.startDate ? new Date(prj.startDate).toLocaleDateString('en-IN') : 'TBD'}
                    </div>
                    {prj.completionDate && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Target: {new Date(prj.completionDate).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenView(prj)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View Project"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(prj)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Edit Project"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteDialogProject(prj)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Project"
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

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Project: ${selectedProject?.projectNumber}` : 'Create Solar Installation Project'}
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
                  capacity: cl?.systemCapacity || formData.capacity,
                  siteAddress: cl?.fullAddress || formData.siteAddress,
                });
              }}
              className="crm-select"
            >
              <option value="">-- Choose confirmed client --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientNumber} - {c.fullName} ({c.place})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Project Title / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="e.g. 5kW On-Grid Rooftop Solar"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                System Capacity (kW)
              </label>
              <input
                type="text"
                className="crm-input"
                placeholder="e.g. 5 kW"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Lifecycle Stage
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="crm-select"
              >
                <option value="Approved">Approved</option>
                <option value="Planning">Planning & Engineering</option>
                <option value="Installation in Progress">Installation in Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="crm-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Target Completion
              </label>
              <input
                type="date"
                className="crm-input"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Installation Site Address
            </label>
            <input
              type="text"
              className="crm-input"
              placeholder="Rooftop location or premises"
              value={formData.siteAddress}
              onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Materials & Equipment Summary
            </label>
            <textarea
              rows={2}
              className="crm-textarea"
              placeholder="e.g. 10x 540W Mono PERC Panels, 5kW Hybrid Inverter, GI Structure..."
              value={formData.materialsSummary}
              onChange={(e) => setFormData({ ...formData, materialsSummary: e.target.value })}
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
              {formSubmitting ? 'Saving...' : isEditModalOpen ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Project Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Solar Project: ${selectedProject?.projectNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedProject && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-800">{selectedProject.projectName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client: {selectedProject.client?.fullName} ({selectedProject.client?.phoneNumber})
                </p>
              </div>
              <Badge variant={selectedProject.status}>{selectedProject.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-400 block font-semibold uppercase">Capacity</span>
                <span className="font-bold text-slate-800 text-sm">{selectedProject.capacity || 'N/A'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-400 block font-semibold uppercase">Site Address</span>
                <span className="font-bold text-slate-800 text-sm truncate block">{selectedProject.siteAddress || 'N/A'}</span>
              </div>
            </div>

            {selectedProject.materialsSummary && (
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs">
                <span className="font-bold text-blue-700 block mb-1">Equipment Details:</span>
                <p className="text-slate-700">{selectedProject.materialsSummary}</p>
              </div>
            )}

            {/* Notes & Updates */}
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Project Log & Field Notes
              </div>
              <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add site inspection or progress note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="crm-input text-xs"
                />
                <button type="submit" className="btn-brand text-xs px-3 shrink-0">
                  Add Note
                </button>
              </form>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedProject.notes && selectedProject.notes.length > 0 ? (
                  selectedProject.notes.map((n, i) => (
                    <div key={i} className="text-xs p-2.5 rounded bg-slate-50 border border-slate-100">
                      <div className="text-slate-800 font-medium">{n.text}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        By {n.author || 'Staff'} • {new Date(n.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDialogProject}
        onClose={() => setDeleteDialogProject(null)}
        onConfirm={handleDeleteProject}
        title="Delete Solar Project?"
        message={`Are you sure you want to delete ${deleteDialogProject?.projectName} (${deleteDialogProject?.projectNumber})?`}
        confirmText="Delete Project"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ProjectList;
