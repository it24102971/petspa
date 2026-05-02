const Treat = require('../models/Treat');

// @desc    Get all treats
// @route   GET /api/treats
// @access  Public
exports.getTreats = async (req, res) => {
  try {
    const treats = await Treat.find();
    res.json(treats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a treat
// @route   POST /api/treats
// @access  Private/Admin
exports.createTreat = async (req, res) => {
  try {
    const treat = new Treat(req.body);
    const created = await treat.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a treat
// @route   PUT /api/treats/:id
// @access  Private/Admin
exports.updateTreat = async (req, res) => {
  try {
    const treat = await Treat.findById(req.params.id);
    if (treat) {
      treat.name = req.body.name || treat.name;
      treat.price = req.body.price || treat.price;
      treat.description = req.body.description || treat.description;
      treat.imageUrl = req.body.imageUrl || treat.imageUrl;
      treat.category = req.body.category || treat.category;

      const updated = await treat.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Treat not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a treat
// @route   DELETE /api/treats/:id
// @access  Private/Admin
exports.deleteTreat = async (req, res) => {
  try {
    const treat = await Treat.findById(req.params.id);
    if (treat) {
      await treat.deleteOne();
      res.json({ message: 'Treat removed' });
    } else {
      res.status(404).json({ message: 'Treat not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
