const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/paws-pastries');
    console.log('Connected to MongoDB... 🐾');
    
    const adminExists = await User.findOne({ email: 'admin@paws.com' });
    if (adminExists) {
      console.log('Admin already exists.');
      process.exit();
    }

    const admin = new User({
      name: 'Cafe Admin',
      email: 'admin@paws.com',
      password: 'adminpassword123',
      role: 'admin'
    });

    await admin.save();
    console.log('Successfully seeded Admin user! 👑');
    console.log('Email: admin@paws.com');
    console.log('Password: adminpassword123');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
