const mongoose = require('mongoose');

const CounselorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialty: { type: String, default: 'General Admissions' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Counselor', CounselorSchema);
