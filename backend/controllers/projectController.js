const Project = require('../models/Project');
const Material = require('../models/Material');
const Document = require('../models/Document');
const Payment = require('../models/Payment');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { projectName: searchRegex },
        { projectNumber: searchRegex },
        { siteAddress: searchRegex },
        { capacity: searchRegex },
      ];
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('client', 'clientNumber fullName phoneNumber place fullAddress finalProjectPrice remainingBalance')
      .populate('assignedEngineer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: projects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project with materials, documents, and payments
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client')
      .populate('assignedEngineer', 'name email phone');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [materials, documents, payments] = await Promise.all([
      Material.find({ project: project._id }),
      Document.find({ $or: [{ project: project._id }, { client: project.client?._id }] }),
      Payment.find({ client: project.client?._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        materials,
        documents,
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { client, projectName, capacity, status, startDate, completionDate, siteAddress, gpsLocation, assignedEngineer, materialsSummary } = req.body;

    const project = await Project.create({
      client,
      projectName,
      capacity,
      status: status || 'Approved',
      startDate,
      completionDate,
      siteAddress,
      gpsLocation,
      assignedEngineer,
      materialsSummary,
      notes: [
        {
          text: 'Project created.',
          author: req.user?.name || 'Staff',
        },
      ],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { status, noteText, ...otherUpdates } = req.body;

    Object.keys(otherUpdates).forEach((key) => {
      project[key] = otherUpdates[key];
    });

    if (status && status !== project.status) {
      project.notes.push({
        text: `Status changed from ${project.status} to ${status}${noteText ? ': ' + noteText : ''}`,
        author: req.user?.name || 'Staff',
      });
      project.status = status;
    } else if (noteText) {
      project.notes.push({
        text: noteText,
        author: req.user?.name || 'Staff',
      });
    }

    await project.save();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await Material.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
