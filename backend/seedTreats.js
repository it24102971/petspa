const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Treat = require('./src/models/Treat');

dotenv.config();

const treats = [
  {
    name: 'Puppy Latte',
    price: 4.50,
    category: 'Drinks',
    emoji: '☕',
    description: 'A warm, frothy milk treat with a hint of vanilla.'
  },
  {
    name: 'Kitty Cupcake',
    price: 3.50,
    category: 'Pastries',
    emoji: '🧁',
    description: 'Soft vanilla cupcake with tuna-safe pink frosting.'
  },
  {
    name: 'Paw Cookie',
    price: 2.00,
    category: 'Snacks',
    emoji: '🐾',
    description: 'Crunchy honey cookie shaped like a cute paw.'
  },
  {
    name: 'Berry Bow Tart',
    price: 4.00,
    category: 'Pastries',
    emoji: '🎀',
    description: 'Fresh berry tart topped with a tiny sugar bow.'
  },
  {
    name: 'Rainbow Shake',
    price: 5.50,
    category: 'Drinks',
    emoji: '🌈',
    description: 'Colorful layered fruit smoothie with cream.'
  },
  {
    name: 'Marshmallow Cloud',
    price: 3.00,
    category: 'Snacks',
    emoji: '☁️',
    description: 'Light and airy marshmallow treat for good pets.'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/paws-pastries');
    console.log('Connected to MongoDB for seeding... 🐾');
    
    // Clear existing treats to avoid duplicates during testing
    await Treat.deleteMany({});
    console.log('Cleared existing treats.');

    await Treat.insertMany(treats);
    console.log('Successfully seeded cute treats! 🧁✨');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
