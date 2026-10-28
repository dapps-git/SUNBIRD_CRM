import React, { useState, useEffect } from 'react';
import api, { BASE_SERVER_URL } from '../../api/client';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  FolderOpen,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  RefreshCw,
  Image,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteDialogDoc, setDeleteDialogDoc] = useState(null);

  // Form
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [documentType, setDocumentType] = useState('Electricity Bill');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents', {
        params: { search, documentType: typeFilter },
      });
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsAndProjects = async () => {
    try {
      const [cRes, pRes] = await Promise.all([api.get('/clients'), api.get('/projects')]);
      setClients(cRes.data.data || []);
      setProjects(pRes.data.data || []);
    } catch (err) {
      console.error('Failed to load clients/projects dropdowns', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchClientsAndProjects();
  }, [search, typeFilter]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!client || !title || !file) {
      setFormError('Please select a client, enter a document title, and choose a file to upload.');
      return;
    }
    setUploading(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('client', client);
      if (project) formData.append('project', project);
      formData.append('documentType', documentType);
      formData.append('title', title);
      formData.append('file', file);
      formData.append('notes', notes);

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUploadModalOpen(false);
      setFile(null);
      setTitle('');
      setNotes('');
      fetchDocuments();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyKyc = async (docId, newStatus) => {
    try {
      await api.patch(`/documents/${docId}/kyc`, { kycStatus: newStatus });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update document verification status');
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteDialogDoc) return;
    try {
      await api.delete(`/documents/${deleteDialogDoc._id}`);
      setDeleteDialogDoc(null);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = BASE_SERVER_URL || '';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isImageFile = (doc) => {
    if (doc.mimeType && doc.mimeType.startsWith('image/')) return true;
    if (doc.fileUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileUrl)) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex justify-end items-center">
        <button
          onClick={() => {
            setFormError('');
            setIsUploadModalOpen(true);
          }}
          className="btn-brand text-xs sm:text-sm px-4 py-2"
        >
          <Upload size={16} />
          Upload Document / Photo
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
              placeholder="Search by document title, customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input crm-input-has-icon-left text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="crm-select text-sm"
            >
              <option value="All">All Document Categories</option>
              <option value="Electricity Bill">Electricity Bill</option>
              <option value="KYC Document">KYC Document (Aadhaar / ID)</option>
              <option value="Site Photo">Pre-installation Site Photo</option>
              <option value="Installation Photo">Installation Progress Photo</option>
              <option value="Completion Certificate">Completion Certificate</option>
              <option value="Other">Other Docs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="crm-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Category</th>
              <th>Customer</th>
              <th>Uploaded Date</th>
              <th>KYC Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                  Loading documents...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400">
                  No documents uploaded yet. Click "Upload Document / Photo".
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-slate-100 text-slate-600">
                        {isImageFile(doc) ? <Image size={18} /> : <FileText size={18} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{doc.title}</div>
                        <span className="text-[11px] text-slate-400">{doc.fileName || 'Attachment'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {doc.documentType}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-800">
                      {doc.client?.fullName || 'N/A'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {doc.client?.clientNumber} • {doc.client?.place}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600">
                      {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td>
                    {['KYC Document', 'Electricity Bill'].includes(doc.documentType) ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant={doc.kycStatus}>{doc.kycStatus}</Badge>
                        <button
                          onClick={() =>
                            handleVerifyKyc(
                              doc._id,
                              doc.kycStatus === 'Verified' ? 'Rejected' : 'Verified'
                            )
                          }
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                          title="Toggle Verification"
                        >
                          <ShieldCheck size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">N/A</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <a
                        href={getFullFileUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        title="Download File"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => setDeleteDialogDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Document"
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

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document or Site Photo"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
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
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="crm-select"
            >
              <option value="">-- Choose client --</option>
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
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="crm-select"
              >
                <option value="Electricity Bill">Electricity Bill</option>
                <option value="KYC Document">KYC Document (Aadhaar / ID)</option>
                <option value="Site Photo">Pre-installation Site Photo</option>
                <option value="Installation Photo">Installation Photo</option>
                <option value="Completion Certificate">Completion Certificate</option>
                <option value="Other">Other Document</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="crm-input"
                placeholder="e.g. Consumer Electricity Bill 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              File Attachment (Image, PDF, Document) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="crm-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Remarks / Verification Notes
            </label>
            <textarea
              rows={2}
              className="crm-textarea"
              placeholder="e.g. Verified consumer number matches solar sanction application..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="btn-brand">
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || 'Document Preview'}
        maxWidth="max-w-3xl"
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span>Customer: {previewDoc.client?.fullName}</span>
              <span>Category: {previewDoc.documentType}</span>
            </div>

            <div className="bg-slate-900 rounded-xl flex items-center justify-center p-4 min-h-[300px] overflow-hidden">
              {isImageFile(previewDoc) ? (
                <img
                  src={getFullFileUrl(previewDoc.fileUrl)}
                  alt={previewDoc.title}
                  className="max-h-[500px] w-auto object-contain rounded"
                />
              ) : (
                <div className="text-center text-white py-12 space-y-3">
                  <FileText size={48} className="mx-auto text-blue-400" />
                  <p className="text-sm font-semibold">{previewDoc.fileName || previewDoc.title}</p>
                  <a
                    href={getFullFileUrl(previewDoc.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-brand text-xs px-4 py-2 inline-flex"
                  >
                    Open Document in New Tab
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setPreviewDoc(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialogDoc}
        onClose={() => setDeleteDialogDoc(null)}
        onConfirm={handleDeleteDocument}
        title="Delete Document?"
        message={`Are you sure you want to remove "${deleteDialogDoc?.title}"?`}
        confirmText="Delete File"
        confirmVariant="danger"
      />
    </div>
  );
};

export default DocumentList;
