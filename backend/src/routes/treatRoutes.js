const express = require('express');
const router = express.Router();
const { getTreats, createTreat, updateTreat, deleteTreat } = require('../controllers/treatController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getTreats);
router.post('/', protect, admin, createTreat);
router.put('/:id', protect, admin, updateTreat);
router.delete('/:id', protect, admin, deleteTreat);

module.exports = router;
