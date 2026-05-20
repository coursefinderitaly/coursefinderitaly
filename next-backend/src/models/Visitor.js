const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  ip: { type: String, default: 'unknown' },
  userAgent: { type: String, default: '' },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Desktop' },
  page: { type: String, default: '/' },
  referrer: { type: String, default: 'Direct' },
  country: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown' },
  regionName: { type: String, default: '' },
  isp: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Visitor', VisitorSchema);
