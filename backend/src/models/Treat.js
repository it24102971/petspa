const mongoose = require('mongoose');

const TreatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String },
  category: { type: String, default: 'Drinks' }, // Drinks, Snacks, etc.
  emoji: { type: String, default: '🧁' }
}, { timestamps: true });

module.exports = mongoose.model('Treat', TreatSchema);
