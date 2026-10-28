const Document = require('../models/Document');
const Client = require('../models/Client');
const path = require('path');
const fs = require('fs');
const { isCloudinaryConfigured, uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get documents with filters
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    const { client, project, documentType, kycStatus } = req.query;
    const query = {};

    if (client) query.client = client;
    if (project) query.project = project;
    if (documentType && documentType !== 'All') query.documentType = documentType;
    if (kycStatus && kycStatus !== 'All') query.kycStatus = kycStatus;

    const documents = await Document.find(query)
      .populate('client', 'clientNumber fullName phoneNumber')
      .populate('project', 'projectNumber projectName')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload new document or site photo
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    const { client, project, documentType, title, notes, kycStatus } = req.body;

    if (!client || !documentType || !title) {
      return res.status(400).json({
        success: false,
        message: 'Client, document type, and title are required.',
      });
    }

    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';
    let cloudinaryId = '';

    if (req.file) {
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;

      if (isCloudinaryConfigured) {
        try {
          const uploadRes = await uploadToCloudinary(req.file.path, 'sunbird_crm/documents');
          if (uploadRes) {
            fileUrl = uploadRes.secure_url;
            cloudinaryId = uploadRes.public_id;
          } else {
            fileUrl = `/uploads/${req.file.filename}`;
          }
        } catch (uploadErr) {
          console.warn('[Cloudinary Upload Error - Falling back to local]:', uploadErr.message);
          fileUrl = `/uploads/${req.file.filename}`;
        }
      } else {
        fileUrl = `/uploads/${req.file.filename}`;
      }
    } else if (req.body.fileUrl) {
      fileUrl = req.body.fileUrl;
      fileName = title;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide a file to upload or a file URL.',
      });
    }

    const document = await Document.create({
      client,
      project: project || null,
      documentType,
      title,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      cloudinaryId,
      kycStatus: documentType === 'KYC Document' ? (kycStatus || 'Pending') : 'N/A',
      uploadedBy: req.user?._id,
      notes: notes || '',
    });

    // If it's a KYC document, sync client's kycStatus if marked verified
    if (documentType === 'KYC Document' && kycStatus) {
      await Client.findByIdAndUpdate(client, { kycStatus });
    }

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update document KYC status
// @route   PATCH /api/documents/:id/kyc
// @access  Private
exports.updateDocumentKyc = async (req, res) => {
  try {
    const { kycStatus, notes } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    document.kycStatus = kycStatus;
    if (notes) document.notes = notes;
    await document.save();

    // Sync to client
    await Client.findByIdAndUpdate(document.client, { kycStatus });

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Clean up file from Cloudinary or local disk
    if (document.cloudinaryId) {
      await deleteFromCloudinary(document.cloudinaryId);
    } else if (document.fileUrl && document.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', document.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('[File Delete Warning]', e.message);
        }
      }
    }

    await document.deleteOne();
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
