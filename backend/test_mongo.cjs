const mongoose = require('mongoose');

const uri1 = 'mongodb+srv://dinithi:bnaZZOJRZu81sRzO@petspa1.j0r5lvs.mongodb.net/';
const uri2 = 'mongodb+srv://dinithi:bnaZZOJRZu81sRzO@petspa1.j0r5lvs.mongodb.net/petspa?retryWrites=true&w=majority';

async function testConnection(uri) {
  try {
    await mongoose.connect(uri);
    console.log(`Successfully connected to: ${uri}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error(`Failed to connect to ${uri}:`, error.message);
  }
}

async function run() {
  await testConnection(uri1);
  await testConnection(uri2);
}

run();
