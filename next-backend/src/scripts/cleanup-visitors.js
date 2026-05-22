const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Visitor = require('../models/Visitor');

async function clean() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Error: MONGO_URI is not defined in your environment variables.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB.');
    console.log('Purging existing local network and admin tracking records...');

    const result = await Visitor.deleteMany({
      $or: [
        { userRole: 'admin' },
        { ip: { $in: ['127.0.0.1', '::1', 'localhost', 'Local Network', 'Localhost'] } },
        { country: 'Local Network' },
        { city: 'Localhost' },
        { userName: 'System Admin' }
      ]
    });

    console.log(`Cleanup complete! Purged ${result.deletedCount} old admin/local records from the visitor database.`);
    await mongoose.disconnect();
    console.log('Disconnected safely from MongoDB.');
  } catch (err) {
    console.error('Database connection or deletion error:', err.message);
  }
}

clean();
