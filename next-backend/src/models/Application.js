const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  programName: { type: String, required: true },
  destinationCountry: { type: String, required: true },
  intake: { type: String },
  status: { type: String, enum: ['Under Review', 'Accepted', 'Rejected', 'Document Pending'], default: 'Under Review' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
