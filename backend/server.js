const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Route Imports
const authRoutes = require('./src/routes/authRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const treatRoutes = require('./src/routes/treatRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/treats', treatRoutes);
app.use('/api/orders', orderRoutes);

// Static for uploads
app.use('/uploads', express.static(path.join(__dirname, '/src/uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/paws-pastries';

// Database connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('🎀 Connected to Paws & Pastries MongoDB database! ✨'))
  .catch((err) => {
    console.error('Oops! Could not connect to database:', err.message);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`🌸 Paws & Pastries server is humming at http://localhost:${PORT} 🐾`);
});
