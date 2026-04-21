const mongoose = require('mongoose');

const CafeOrderSchema = new mongoose.Schema({
  items: [
    { 
      name: { type: String, required: true },
      price: { type: Number, required: true },
      emoji: { type: String, default: '☕' }
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  paymentSlip: { type: String }, // URL of the uploaded payment slip
  orderDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CafeOrder', CafeOrderSchema);
