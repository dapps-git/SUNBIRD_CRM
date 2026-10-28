import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  UserCog,
  Search,
  Plus,
  Edit,
  Trash2,
  KeyRound,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';

const availableModules = [
  { key: 'leads', label: 'Lead Management' },
  { key: 'clients', label: 'Real Clients' },
  { key: 'projects', label: 'Projects' },
  { key: 'quotations', label: 'Quotations' },
  { key: 'payments', label: 'Payments' },
  { key: 'materials', label: 'Materials' },
  { key: 'documents', label: 'Documents' },
  { key: 'warranty', label: 'Warranty & Service' },
  { key: 'commissions', label: 'Commissions' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'users', label: 'User Management' },
];

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogUser, setDeleteDialogUser] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    permissions: {
      leads: true,
      clients: true,
      projects: true,
      quotations: true,
      payments: true,
      materials: true,
      documents: true,
      warranty: true,
      commissions: true,
      reports: false,
      users: false,
    },
    isActive: true,
  };
  const [formData, setFormData] = useState(initialForm);
  const [newPassword, setNewPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { search } });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'staff',
      phone: u.phone || '',
      permissions: {
        leads: !!u.permissions?.leads,
        clients: !!u.permissions?.clients,
        projects: !!u.permissions?.projects,
        quotations: !!u.permissions?.quotations,
        payments: !!u.permissions?.payments,
        materials: !!u.permissions?.materials,
        documents: !!u.permissions?.documents,
        warranty: !!u.permissions?.warranty,
        commissions: !!u.permissions?.commissions,
        reports: !!u.permissions?.reports,
        users: !!u.permissions?.users,
      },
      isActive: u.isActive !== false,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Please provide staff name and a valid email address.');
      return;
    }
    if (isAddModalOpen && (!formData.password || formData.password.length < 6)) {
      setFormError('Initial password must be at least 6 characters.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    try {
      if (isEditModalOpen && selectedUser) {
        await api.put(`/users/${selectedUser._id}`, formData);
        setIsEditModalOpen(false);
      } else {
        await api.post('/users', formData);
        setIsAddModalOpen(false);
      }
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save staff account.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6 || !selectedUser) {
      alert('Password must be at least 6 characters.');
      return;
    }
    try {
      await api.patch(`/users/${selectedUser._id}/reset-password`, {
        newPassword,
      });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      alert(`Password updated successfully for ${selectedUser.email}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialogUser) return;
    try {
      await api.delete(`/users/${deleteDialogUser._id}`);
      setDeleteDialogUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex justify-end items-center">
        <button onClick={handleOpenAdd} className="btn-brand text-xs sm:text-sm px-4 py-2">
          <Plus size={16} />
          Add Staff Member
        </button>
      </div>

      {/* Search */}
      <div className="crm-card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input pl-10 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email & Contact</th>
              <th>Role</th>
              <th>Accessible Modules</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading staff accounts...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400">
                  No staff accounts found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const grantedModules = Object.entries(u.permissions || {})
                  .filter(([_, granted]) => granted)
                  .map(([k]) => k);
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="font-bold text-slate-800">{u.name}</div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400" />
                        {u.email}
                      </div>
                      {u.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-slate-400" />
                          {u.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'manager'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.role === 'admin' ? (
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            Full Admin Access
                          </span>
                        ) : (
                          grantedModules.slice(0, 4).map((m) => (
                            <span
                              key={m}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                            >
                              {m}
                            </span>
                          ))
                        )}
                        {grantedModules.length > 4 && u.role !== 'admin' && (
                          <span className="text-[10px] text-slate-400">
                            +{grantedModules.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={u.isActive ? 'Active' : 'Not Approved'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewPassword('');
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Change Password"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Edit Permissions"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteDialogUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
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

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Staff Member: ${selectedUser?.name}` : 'Add New Staff Member'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                className="crm-input"
                placeholder="e.g. rahul@sunbirdsolar.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="crm-select"
              >
                <option value="staff">Staff (Operational)</option>
                <option value="manager">Manager</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="crm-input"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {isAddModalOpen && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Initial Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                className="crm-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}

          {formData.role !== 'admin' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Module Permissions
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {availableModules.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.permissions[m.key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [m.key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          )}

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
              {formSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Reset Password for: ${selectedUser?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              New Password (Min 6 characters)
            </label>
            <input
              type="password"
              required
              className="crm-input"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-brand">
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialogUser}
        onClose={() => setDeleteDialogUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account?"
        message={`Are you sure you want to delete staff account ${deleteDialogUser?.email}?`}
        confirmText="Delete User"
        confirmVariant="danger"
      />
    </div>
  );
};

export default UserList;
