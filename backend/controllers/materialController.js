const Material = require('../models/Material');
const Project = require('../models/Project');

// @desc    Get materials for a project or all
// @route   GET /api/materials
// @access  Private
exports.getMaterials = async (req, res) => {
  try {
    const { project, client, category, search } = req.query;
    const query = {};

    if (project) query.project = project;
    if (client) query.client = client;
    if (category && category !== 'All') query.category = category;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { productName: searchRegex },
        { brand: searchRegex },
        { specification: searchRegex },
      ];
    }

    const materials = await Material.find(query)
      .populate('project', 'projectNumber projectName')
      .populate('client', 'clientNumber fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add material to project
// @route   POST /api/materials
// @access  Private
exports.createMaterial = async (req, res) => {
  try {
    const { project, client, productName, category, specification, brand, quantity, unit, serialNumbers, status, notes } = req.body;

    if (!project || !productName) {
      return res.status(400).json({
        success: false,
        message: 'Project and Product Name are required',
      });
    }

    const material = await Material.create({
      project,
      client: client || null,
      productName,
      category: category || 'Solar Panels',
      specification: specification || '',
      brand: brand || '',
      quantity: Number(quantity) || 1,
      unit: unit || 'Nos',
      serialNumbers: Array.isArray(serialNumbers) ? serialNumbers : (serialNumbers ? [serialNumbers] : []),
      status: status || 'Allocated',
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update material
// @route   PUT /api/materials/:id
// @access  Private
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    Object.assign(material, req.body);
    await material.save();

    res.status(200).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  Private
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    await material.deleteOne();
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
