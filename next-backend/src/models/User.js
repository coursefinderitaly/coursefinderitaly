const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: false },
  dob: { type: String },
  gender: { type: String },

  // Mailing Address
  mailingAddress1: { type: String },
  mailingAddress2: { type: String },
  mailingCountry: { type: String },
  mailingState: { type: String },
  mailingCity: { type: String },
  mailingPincode: { type: String },

  // Permanent Address
  isPermanentSameAsMailing: { type: Boolean, default: false },
  permanentAddress1: { type: String },
  permanentAddress2: { type: String },
  permanentCountry: { type: String },
  permanentState: { type: String },
  permanentCity: { type: String },
  permanentPincode: { type: String },

  // Passport Info
  passportNo: { type: String },
  issueDate: { type: String },
  expiryDate: { type: String },
  issueCountry: { type: String },
  issueState: { type: String },
  issueCity: { type: String },

  // Nationality
  nationality: { type: String },
  citizenship: { type: String },
  multiCitizen: { type: Boolean, default: false },
  livingInOtherCountry: { type: Boolean, default: false },
  otherNationality: { type: String },
  otherLivingCountry: { type: String },

  // Alternative Contact
  altContactName: { type: String },
  altContactPhone: { type: String },
  altContactEmail: { type: String },
  altContactRelation: { type: String },

  // NEW: Academic Qualifications
  countryOfEducation: { type: String, default: '' },
  highestLevelOfEducation: { type: String, default: '' },
  educationHistory: [{
    level: { type: String, default: '' }, // e.g. Masters, Bachelors, 12th or equivalent
    countryOfStudy: { type: String, default: '' },
    stateOfStudy: { type: String, default: '' },
    universityName: { type: String, default: '' },
    programName: { type: String, default: '' },
    gradingSystem: { type: String, default: '' }, // Out of 10, 7, 5, 4
    obtainedGrade: { type: String, default: '' },
    percentageObtained: { type: String, default: '' },
    primaryLanguage: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date }
  }],

  // NEW: Work Experience
  workExperience: [{
    organisationName: { type: String, default: '' },
    position: { type: String, default: '' },
    jobProfile: { type: String, default: '' },
    modeOfSalary: { type: String, default: '' }, // Cash, Cheque, Bank Transfer
    startDate: { type: Date },
    endDate: { type: Date },
    currentlyWorkingHere: { type: Boolean, default: false }
  }],

  country: { type: String, required: false },
  state: { type: String, required: false },
  city: { type: String, required: false },
  phoneCode: { type: String, default: '+91' },
  phone: { type: String, required: true },
  whatsappCode: { type: String, default: '+91' },
  whatsapp: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'partner', 'admin', 'counselor'], default: 'student' },

  // Partner specific fields (Optional for students)
  companyName: { type: String },
  companyAddress: { type: String },
  teamSize: { type: String },
  priorExperience: { type: Boolean, default: false },
  designation: { type: String },
  studentUniqueId: { type: String },

  assignedCounselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For counselors to link back to the Partner who made them
  createdByCounselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For students explicitly registered by a counselor
  speciality: { type: String }, // For Counselor role
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  appliedUniversities: [new mongoose.Schema({
    id: mongoose.Schema.Types.Mixed,
    name: String,
    location: String,
    level: String,
    minPercentage: Number,
    type: String,
    ranking: String,
    programs: [String],
    intake: String,
    rawSheetData: mongoose.Schema.Types.Mixed,
    status: { type: String, default: 'Under Process' },
    comments: [{
      text: String,
      sender: String,
      tab: String,
      timestamp: { type: Date, default: Date.now }
    }]
  }, { _id: false })],
  savedUniversitiesCart: [new mongoose.Schema({
    id: mongoose.Schema.Types.Mixed,
    name: String,
    location: String,
    level: String,
    minPercentage: Number,
    type: String,
    ranking: String,
    programs: [String],
    intake: String,
    rawSheetData: mongoose.Schema.Types.Mixed
  }, { _id: false })],
  // New Field for Tracking
  offerStatus: { type: String, enum: ['Pending', 'Received'], default: 'Pending' },
  studentStatus: { type: String, enum: ['Active', 'Backout', 'On Hold'], default: 'Active' },

  // Admin <-> Student Messages
  adminMessages: [{
    text: { type: String, required: true },
    sender: { type: String, enum: ['admin', 'student'], required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }],

  // Security & Lockout Mechanisms
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);