import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Save, User, FileText, FolderOpen, Mail, Phone, MapPin, Eraser, X, UploadCloud, Eye, AlertTriangle, ChevronLeft, ChevronRight, Globe, CheckSquare, Plus, Trash2, Download, CheckCircle, Search, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../config';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import nationality from 'i18n-nationality';
import enNationality from 'i18n-nationality/langs/en.json';
import DocumentUpload from './DocumentUpload';
import SearchProgram from './SearchProgram';

nationality.registerLocale(enNationality);

const StudentDetails = ({ student, goBack, pendingApplications = [], setPendingApplications, isPartnerView, refreshProfile }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [applicationSubTab, setApplicationSubTab] = useState('apply');
  const [selectedAppliedProgram, setSelectedAppliedProgram] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [attachedDocsPreview, setAttachedDocsPreview] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasAttachmentsWarning, setHasAttachmentsWarning] = useState(false);
  const [showNoDocsError, setShowNoDocsError] = useState(false);
  const [expandedUniIds, setExpandedUniIds] = useState([]);
  const [selectedForApplication, setSelectedForApplication] = useState(() => {
    let initial = [];
    if (student.savedUniversitiesCart && student.savedUniversitiesCart.length > 0) {
      initial = student.savedUniversitiesCart.filter(u => u && typeof u === 'object' && u.id);
    }
    if (pendingApplications && pendingApplications.length > 0) {
      const existingIds = new Set(initial.map(i => i.id));
      const additions = pendingApplications.filter(p => !existingIds.has(p.id));
      initial = [...initial, ...additions];
    }
    return initial;
  });

  useEffect(() => {
    if (pendingApplications && pendingApplications.length > 0) {
      setSelectedForApplication(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newItems = pendingApplications.filter(s => !existingIds.has(s.id));
        return [...prev, ...newItems];
      });
    }
  }, [pendingApplications]);

  const documentUploadRef = useRef(null);

  // Dropdown options state
  const [countries] = useState(() => {
    let allCountries = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
    const indiaIdx = allCountries.findIndex(c => c.value === 'IN');
    if (indiaIdx > -1) {
      const india = allCountries.splice(indiaIdx, 1)[0];
      allCountries.unshift(india);
    }
    return allCountries;
  });
  const [nationalityOptions, setNationalityOptions] = useState([]);
  const [phonePrefixes] = useState(Country.getAllCountries().map(c => ({
    value: `+${c.phonecode}`,
    label: `${c.name} (+${c.phonecode})`
  })));

  useEffect(() => {
    // Generate nationality options (demonyms)
    const nats = Country.getAllCountries().map(c => {
      const demo = nationality.getName(c.isoCode, "en") || c.name;
      return { value: c.isoCode, label: demo };
    }).sort((a, b) => a.label.localeCompare(b.label));

    // Force "Indian" to the very top
    const indianIdx = nats.findIndex(n => n.value === 'IN');
    if (indianIdx > -1) {
      const indianOpt = nats.splice(indianIdx, 1)[0];
      nats.unshift(indianOpt);
    }
    setNationalityOptions(nats);

    // Initialize form with given student data
    setFormData({
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '', // Raw phone string
      dob: student.dob || '',
      gender: student.gender || '',

      mailingAddress1: student.mailingAddress1 || '',
      mailingAddress2: student.mailingAddress2 || '',
      mailingCountry: student.mailingCountry || '',
      mailingState: student.mailingState || '',
      mailingCity: student.mailingCity || '',
      mailingPincode: student.mailingPincode || '',

      isPermanentSameAsMailing: student.isPermanentSameAsMailing || false,
      permanentAddress1: student.permanentAddress1 || '',
      permanentAddress2: student.permanentAddress2 || '',
      permanentCountry: student.permanentCountry || '',
      permanentState: student.permanentState || '',
      permanentCity: student.permanentCity || '',
      permanentPincode: student.permanentPincode || '',

      passportNo: student.passportNo || '',
      issueDate: student.issueDate || '',
      expiryDate: student.expiryDate || '',
      issueCountry: student.issueCountry || '',
      issueState: student.issueState || '',
      issueCity: student.issueCity || '',

      nationality: student.nationality || '',
      citizenship: student.citizenship || '',
      multiCitizen: student.multiCitizen || false,
      livingInOtherCountry: student.livingInOtherCountry || false,
      otherNationality: student.otherNationality || '',
      otherLivingCountry: student.otherLivingCountry || '',

      altContactName: student.altContactName || '',
      altContactPhone: student.altContactPhone || '',
      altContactEmail: student.altContactEmail || '',
      altContactRelation: student.altContactRelation || '',

      countryOfEducation: student.countryOfEducation || '',
      highestLevelOfEducation: student.highestLevelOfEducation || '',
      educationHistory: student.educationHistory && student.educationHistory.length > 0
        ? student.educationHistory
        : [
          { level: 'Masters', countryOfStudy: '', stateOfStudy: '', universityName: '', programName: '', gradingSystem: '', obtainedGrade: '', percentageObtained: '', primaryLanguage: '', startDate: '', endDate: '' },
          { level: 'Bachelors', countryOfStudy: '', stateOfStudy: '', universityName: '', programName: '', gradingSystem: '', obtainedGrade: '', percentageObtained: '', primaryLanguage: '', startDate: '', endDate: '' },
          { level: '12th or equivalent', countryOfStudy: '', stateOfStudy: '', universityName: '', programName: '', gradingSystem: '', obtainedGrade: '', percentageObtained: '', primaryLanguage: '', startDate: '', endDate: '' }
        ],
      workExperience: student.workExperience && student.workExperience.length > 0
        ? student.workExperience
        : [{ organisationName: '', position: '', jobProfile: '', modeOfSalary: '', startDate: '', endDate: '', currentlyWorkingHere: false }]
    });
  }, [student]);

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--input-bg)',
      borderColor: state.isFocused ? 'var(--accent-secondary)' : 'var(--input-border)',
      color: 'var(--text-main)',
      borderRadius: '12px',
      padding: '2px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(14, 165, 233, 0.15)' : 'none',
      '&:hover': { borderColor: 'var(--accent-secondary)' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(16px)',
      zIndex: 100,
      borderRadius: '12px',
      overflow: 'hidden'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'rgba(59, 130, 246, 0.15)'
        : state.isFocused ? 'rgba(128, 128, 128, 0.1)' : 'transparent',
      color: state.isSelected ? 'var(--accent-secondary)' : 'var(--text-main)',
      cursor: 'pointer',
      fontSize: '0.9rem'
    }),
    singleValue: (base) => ({ ...base, color: 'var(--text-main)' }),
    input: (base) => ({ ...base, color: 'var(--text-main)' }),
    placeholder: (base) => ({ ...base, color: 'var(--text-muted)' }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--glass-border)' }),
    dropdownIndicator: (base) => ({ ...base, color: 'var(--text-muted)' }),
  };

  const handleDateChange = (name, date) => {
    const formattedDate = date ? date.toISOString().split('T')[0] : '';
    setFormData(prev => ({ ...prev, [name]: formattedDate }));
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => {
      const newEdu = [...prev.educationHistory];
      newEdu[index] = { ...newEdu[index], [field]: value };
      return { ...prev, educationHistory: newEdu };
    });
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      educationHistory: [...prev.educationHistory, { level: 'Other Education', countryOfStudy: '', stateOfStudy: '', universityName: '', programName: '', gradingSystem: '', obtainedGrade: '', percentageObtained: '', primaryLanguage: '', startDate: '', endDate: '' }]
    }));
  };

  const handleWorkChange = (index, field, value) => {
    setFormData(prev => {
      const newWork = [...prev.workExperience];
      newWork[index] = { ...newWork[index], [field]: value };
      if (field === 'currentlyWorkingHere' && value === true) {
        newWork[index].endDate = ''; // Reset end date when currently working
      }
      return { ...prev, workExperience: newWork };
    });
  };

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { organisationName: '', position: '', jobProfile: '', modeOfSalary: '', startDate: '', endDate: '', currentlyWorkingHere: false }]
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      let newData = { ...prev, [name]: finalValue };

      if (name === 'isPermanentSameAsMailing' && finalValue === true) {
        newData = {
          ...newData,
          permanentAddress1: newData.mailingAddress1,
          permanentAddress2: newData.mailingAddress2,
          permanentCountry: newData.mailingCountry,
          permanentState: newData.mailingState,
          permanentCity: newData.mailingCity,
          permanentPincode: newData.mailingPincode,
        };
      }
      return newData;
    });
  };

  const enforcePhonePrefix = (e, fieldName) => {
    let { value } = e.target;
    const prefix = '+91 ';
    // allow only numbers after prefix
    const digits = value.replace(prefix, '').replace(/[^\d]/g, '');
    const truncated = digits.slice(0, 10);
    setFormData(prev => ({ ...prev, [fieldName]: prefix + truncated }));
  };

  const clearSection = (section) => {
    if (!window.confirm("Are you sure you want to clear this section?")) return;
    setFormData(prev => {
      let newData = { ...prev };
      const fieldMapping = {
        personal: ['firstName', 'middleName', 'lastName', 'email', 'phone', 'dob', 'gender'],
        mailing: ['mailingAddress1', 'mailingAddress2', 'mailingCountry', 'mailingState', 'mailingCity', 'mailingPincode'],
        permanent: ['permanentAddress1', 'permanentAddress2', 'permanentCountry', 'permanentState', 'permanentCity', 'permanentPincode', 'isPermanentSameAsMailing'],
        passport: ['passportNo', 'issueDate', 'expiryDate', 'issueCountry', 'issueState', 'issueCity'],
        nationality: ['nationality', 'citizenship', 'multiCitizen', 'otherNationality', 'livingInOtherCountry', 'otherLivingCountry'],
        alternative: ['altContactName', 'altContactPhone', 'altContactEmail', 'altContactRelation'],
        academic_top: ['countryOfEducation', 'highestLevelOfEducation']
      };

      if (fieldMapping[section]) {
        fieldMapping[section].forEach(field => {
          if (typeof prev[field] === 'boolean') {
            newData[field] = false;
          } else {
            newData[field] = '';
          }
        });
      }
      return newData;
    });
  };

  const clearEducationEntry = (index) => {
    if (!window.confirm("Are you sure you want to clear this education entry?")) return;
    setFormData(prev => {
      const newEdu = [...prev.educationHistory];
      newEdu[index] = {
        ...newEdu[index],
        countryOfStudy: '', stateOfStudy: '', universityName: '', programName: '',
        gradingSystem: '', obtainedGrade: '', percentageObtained: '', primaryLanguage: '',
        startDate: '', endDate: '', currentlyPursuing: false, isCustomProgram: false
      };
      return { ...prev, educationHistory: newEdu };
    });
  };

  const clearWorkEntry = (index) => {
    if (!window.confirm("Are you sure you want to clear this work experience entry?")) return;
    setFormData(prev => {
      const newWork = [...prev.workExperience];
      newWork[index] = {
        ...newWork[index],
        organisationName: '', position: '', jobProfile: '', modeOfSalary: '',
        startDate: '', endDate: '', currentlyWorkingHere: false
      };
      return { ...prev, workExperience: newWork };
    });
  };

  const handleSelectFieldChange = (name, selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';
    setFormData(prev => {
      let newData = { ...prev, [name]: value };

      // Clear dependent fields
      if (name === 'mailingCountry') {
        newData.mailingState = '';
        newData.mailingCity = '';
        // Auto-fill applicant nationality & citizenship from Mailing Country
        if (!newData.nationality) newData.nationality = value;
        if (!newData.citizenship) newData.citizenship = value;
      } else if (name === 'mailingState') {
        newData.mailingCity = '';
      } else if (name === 'permanentCountry') {
        newData.permanentState = '';
        newData.permanentCity = '';
        // Also auto-fill if permanent country is changed and they are still blank
        if (!newData.nationality) newData.nationality = value;
        if (!newData.citizenship) newData.citizenship = value;
      } else if (name === 'permanentState') {
        newData.permanentCity = '';
      } else if (name === 'issueCountry') {
        newData.issueState = '';
        newData.issueCity = '';
      } else if (name === 'issueState') {
        newData.issueCity = '';
      }

      // Re-trigger "Same as Mailing" if relevant
      if (newData.isPermanentSameAsMailing) {
        newData.permanentAddress1 = newData.mailingAddress1;
        newData.permanentAddress2 = newData.mailingAddress2;
        newData.permanentCountry = newData.mailingCountry;
        newData.permanentState = newData.mailingState;
        newData.permanentCity = newData.mailingCity;
        newData.permanentPincode = newData.mailingPincode;
      }

      return newData;
    });
  };

  const handleSaveProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setMessage('Saving profile changes...');

    try {
      const res = await fetch(`${API_BASE_URL}/erp/students/${student._id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, savedUniversitiesCart: selectedForApplication })
      });

      if (res.ok) {
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 4000);
        return true;
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to update profile.');
        setTimeout(() => setMessage(''), 4000);
        return false;
      }
    } catch (err) {
      setMessage('Server error during update.');
      setTimeout(() => setMessage(''), 4000);
      return false;
    }
  };

  // Helper to get dropdown values from codes
  const getCountryLabel = (code) => countries.find(c => c.value === code);
  const getStateOptions = (countryCode) => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map(s => ({ value: s.isoCode, label: s.name }));
  };
  const getCityOptions = (countryCode, stateCode) => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map(c => ({ value: c.name, label: c.name }));
  };

  // Helper to format date values (especially from Excel)
  const formatDisplayValue = (val, isDeadlineCol = false) => {
    if (val === null || val === undefined || val === "" || val === "N/A" || val === "n/a") return "N/A";

    // Check for Excel serial numbers
    if (typeof val === 'number' && val > 30000 && val < 60000) {
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // Check for ISO date strings
    if (typeof val === 'string' && (val.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(val))) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    // Fallback for strings
    if (isDeadlineCol && typeof val === 'string' && !isNaN(Date.parse(val)) && val.length > 5) {
      const date = new Date(val);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return val;
  };

  return (
    <div className="view-standard student-details-wrapper" style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem' }} className="hover-text-main">
          <ArrowLeft size={18} /> {isPartnerView ? 'Back to Students List' : 'Back to Dashboard'}
        </button>
      </div>

      {/* Header Profile Card */}
      <div className="widget student-header-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', marginBottom: '20px' }}>
        <div className="avatar" style={{ minWidth: '60px', height: '60px', fontSize: '1.8rem' }}>
          {student.firstName.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 5px 0', color: 'var(--text-main)' }}>{student.firstName} {student.lastName}</h2>
          <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {student.email}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {formData.phone || 'N/A'}</span>
          </div>
        </div>
        <div className="student-header-status" style={{ paddingLeft: '20px', borderLeft: '1px solid var(--glass-border)', display: 'flex', gap: '30px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Offer Status</div>
            <div style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>{student.offerStatus || 'Pending'}</div>
          </div>
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Student Status</div>
            <div style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>{student.studentStatus || 'Active'}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-wrapper" style={{ display: 'flex', gap: '2px', background: 'var(--table-header-bg)', padding: '5px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--glass-border)', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'profile', label: 'Profile' },
          { id: 'academic', label: 'Academic Qualification' },
          { id: 'documents', label: 'Documents' },
          { id: 'applications', label: 'Select University' }
        ].map((tabObj, idx) => (
          <button
            key={tabObj.id}
            onClick={() => setActiveTab(tabObj.id)}
            style={{
              flex: 1, padding: '12px', border: 'none',
              background: activeTab === tabObj.id ? 'var(--card-bg-solid)' : 'transparent',
              color: activeTab === tabObj.id ? 'var(--accent-secondary)' : 'var(--text-muted)',
              borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeTab === tabObj.id ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
            }}>
            <span style={{
              background: activeTab === tabObj.id ? 'var(--accent-secondary)' : 'var(--text-muted)',
              color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'
            }}>{idx + 1}</span>
            {tabObj.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {showNoDocsError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #ef4444', color: '#dc2626', padding: '12px 20px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 900, animation: 'shake 0.5s ease', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <AlertTriangle size={24} />
          <span>CRITICAL ACTION REQUIRED: You must select and attach at least one document before you can proceed to the final submission review.</span>
        </div>
      )}

      {/* Tabs Content */}
      <div className="tab-content" style={{ paddingBottom: '40px' }}>
        <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
          <form onSubmit={handleSaveProfile} className="edit-form-grid">

            {/* Personal Information */}
            <div className="widget" style={{ padding: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <button type="button" onClick={() => clearSection('personal')}
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  title="Clear Section"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <User size={18} className="text-muted" /> Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="dash-input-group"><label>First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="theme-input" required /></div>
                <div className="dash-input-group"><label>Middle Name</label><input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="theme-input" /></div>
                <div className="dash-input-group"><label>Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="theme-input" /></div>
                <div className="dash-input-group"><label>Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="theme-input" required /></div>

                <div className="dash-input-group">
                  <label>Mobile Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={(e) => enforcePhonePrefix(e, 'phone')} className="theme-input" placeholder="+91 9876543210" required />
                </div>

                <div className="dash-input-group">
                  <label>Date of Birth</label>
                  <DatePicker
                    selected={formData.dob ? new Date(formData.dob) : null}
                    onChange={(date) => handleDateChange('dob', date)}
                    dateFormat="yyyy-MM-dd"
                    className="theme-input"
                    placeholderText="Select Date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="root"
                  />
                </div>
                <div className="dash-input-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="theme-input theme-select">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mailing Address */}
            <div className="widget" style={{ padding: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <button type="button" onClick={() => clearSection('mailing')}
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  title="Clear Section"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <MapPin size={18} className="text-muted" /> Mailing Address
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="dash-input-group" style={{ gridColumn: '1 / -1' }}><label>Address 1</label><input type="text" name="mailingAddress1" value={formData.mailingAddress1} onChange={handleChange} className="theme-input" /></div>
                <div className="dash-input-group" style={{ gridColumn: '1 / -1' }}><label>Address 2</label><input type="text" name="mailingAddress2" value={formData.mailingAddress2} onChange={handleChange} className="theme-input" /></div>

                <div className="dash-input-group">
                  <label>Country</label>
                  <Select
                    styles={customSelectStyles} options={countries} value={countries.find(c => c.value === formData.mailingCountry)}
                    onChange={(val) => handleSelectFieldChange('mailingCountry', val)} menuPortalTarget={document.body} placeholder="Select Country"
                  />
                </div>
                <div className="dash-input-group">
                  <label>State</label>
                  <Select
                    styles={customSelectStyles} options={getStateOptions(formData.mailingCountry)}
                    value={getStateOptions(formData.mailingCountry).find(s => s.value === formData.mailingState)}
                    onChange={(val) => handleSelectFieldChange('mailingState', val)} menuPortalTarget={document.body} placeholder="Select State"
                    isDisabled={!formData.mailingCountry}
                  />
                </div>
                <div className="dash-input-group">
                  <label>City</label>
                  <Select
                    styles={customSelectStyles} options={getCityOptions(formData.mailingCountry, formData.mailingState)}
                    value={getCityOptions(formData.mailingCountry, formData.mailingState).find(c => c.value === formData.mailingCity)}
                    onChange={(val) => handleSelectFieldChange('mailingCity', val)} menuPortalTarget={document.body} placeholder="Select City"
                    isDisabled={!formData.mailingState}
                  />
                </div>
                <div className="dash-input-group"><label>Pincode</label><input type="text" name="mailingPincode" value={formData.mailingPincode} onChange={handleChange} className="theme-input" /></div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="widget" style={{ padding: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input type="checkbox" name="isPermanentSameAsMailing" checked={formData.isPermanentSameAsMailing} onChange={handleChange} />
                  Same as Mailing Address
                </label>
                <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }}></div>
                <button type="button" onClick={() => clearSection('permanent')}
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  title="Clear Section"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <MapPin size={18} className="text-muted" /> Permanent Address
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', opacity: formData.isPermanentSameAsMailing ? 0.6 : 1, pointerEvents: formData.isPermanentSameAsMailing ? 'none' : 'auto' }}>
                <div className="dash-input-group" style={{ gridColumn: '1 / -1' }}><label>Address 1</label><input type="text" name="permanentAddress1" value={formData.permanentAddress1} onChange={handleChange} className="theme-input" /></div>
                <div className="dash-input-group" style={{ gridColumn: '1 / -1' }}><label>Address 2</label><input type="text" name="permanentAddress2" value={formData.permanentAddress2} onChange={handleChange} className="theme-input" /></div>

                <div className="dash-input-group">
                  <label>Country</label>
                  <Select
                    styles={customSelectStyles} options={countries} value={countries.find(c => c.value === formData.permanentCountry)}
                    onChange={(val) => handleSelectFieldChange('permanentCountry', val)} menuPortalTarget={document.body} placeholder="Select Country"
                  />
                </div>
                <div className="dash-input-group">
                  <label>State</label>
                  <Select
                    styles={customSelectStyles} options={getStateOptions(formData.permanentCountry)}
                    value={getStateOptions(formData.permanentCountry).find(s => s.value === formData.permanentState)}
                    onChange={(val) => handleSelectFieldChange('permanentState', val)} menuPortalTarget={document.body} placeholder="Select State"
                    isDisabled={!formData.permanentCountry}
                  />
                </div>
                <div className="dash-input-group">
                  <label>City</label>
                  <Select
                    styles={customSelectStyles} options={getCityOptions(formData.permanentCountry, formData.permanentState)}
                    value={getCityOptions(formData.permanentCountry, formData.permanentState).find(c => c.value === formData.permanentCity)}
                    onChange={(val) => handleSelectFieldChange('permanentCity', val)} menuPortalTarget={document.body} placeholder="Select City"
                    isDisabled={!formData.permanentState}
                  />
                </div>
                <div className="dash-input-group"><label>Pincode</label><input type="text" name="permanentPincode" value={formData.permanentPincode} onChange={handleChange} className="theme-input" /></div>
              </div>
            </div>

            {/* Passport Info */}
            <div className="widget" style={{ padding: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <button type="button" onClick={() => clearSection('passport')}
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  title="Clear Section"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <FileText size={18} className="text-muted" /> Passport Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="dash-input-group"><label>Passport Number</label><input type="text" name="passportNo" value={formData.passportNo} onChange={handleChange} className="theme-input" /></div>
                <div className="dash-input-group">
                  <label>Issue Date</label>
                  <DatePicker
                    selected={formData.issueDate ? new Date(formData.issueDate) : null}
                    onChange={(date) => handleDateChange('issueDate', date)}
                    dateFormat="yyyy-MM-dd"
                    className="theme-input"
                    placeholderText="Select Date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="root"
                  />
                </div>
                <div className="dash-input-group">
                  <label>Expiry Date</label>
                  <DatePicker
                    selected={formData.expiryDate ? new Date(formData.expiryDate) : null}
                    onChange={(date) => handleDateChange('expiryDate', date)}
                    dateFormat="yyyy-MM-dd"
                    className="theme-input"
                    placeholderText="Select Date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="root"
                  />
                </div>

                <div className="dash-input-group">
                  <label>Issue Country</label>
                  <Select
                    styles={customSelectStyles} options={countries} value={countries.find(c => c.value === formData.issueCountry)}
                    onChange={(val) => handleSelectFieldChange('issueCountry', val)} menuPortalTarget={document.body} placeholder="Select Country"
                  />
                </div>
                <div className="dash-input-group">
                  <label>Issue State</label>
                  <Select
                    styles={customSelectStyles} options={getStateOptions(formData.issueCountry)}
                    value={getStateOptions(formData.issueCountry).find(s => s.value === formData.issueState)}
                    onChange={(val) => handleSelectFieldChange('issueState', val)} menuPortalTarget={document.body} placeholder="Select State"
                    isDisabled={!formData.issueCountry}
                  />
                </div>
                <div className="dash-input-group">
                  <label>Issue City</label>
                  <Select
                    styles={customSelectStyles} options={getCityOptions(formData.issueCountry, formData.issueState)}
                    value={getCityOptions(formData.issueCountry, formData.issueState).find(c => c.value === formData.issueCity)}
                    onChange={(val) => handleSelectFieldChange('issueCity', val)} menuPortalTarget={document.body} placeholder="Select City"
                    isDisabled={!formData.issueState}
                  />
                </div>
              </div>
            </div>

            {/* Nationality */}
            <div className="widget" style={{ padding: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <button type="button" onClick={() => clearSection('nationality')}
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  title="Clear Section"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <User size={18} className="text-muted" /> Nationality
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="dash-input-group">
                  <label>Nationality</label>
                  <Select
                    styles={customSelectStyles} options={nationalityOptions} value={nationalityOptions.find(c => c.value === formData.nationality)}
                    onChange={(val) => handleSelectFieldChange('nationality', val)} menuPortalTarget={document.body} placeholder="Select Nationality"
                  />
                </div>
                <div className="dash-input-group">
                  <label>Citizenship</label>
                  <Select
                    styles={customSelectStyles} options={nationalityOptions} value={nationalityOptions.find(c => c.value === formData.citizenship)}
                    onChange={(val) => handleSelectFieldChange('citizenship', val)} menuPortalTarget={document.body} placeholder="Select Citizenship"
                  />
                </div>

                <div className="dash-input-group" style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                  <input type="checkbox" name="multiCitizen" id="multiCitizen" checked={formData.multiCitizen} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="multiCitizen" style={{ cursor: 'pointer', margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    Is the applicant a citizen of more than one country?
                  </label>
                </div>

                {formData.multiCitizen && (
                  <div className="dash-input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
                    <label>Enter Nationality</label>
                    <Select
                      styles={customSelectStyles} options={nationalityOptions} value={nationalityOptions.find(c => c.value === formData.otherNationality)}
                      onChange={(val) => handleSelectFieldChange('otherNationality', val)} menuPortalTarget={document.body} placeholder="Select Nationality"
                    />
                  </div>
                )}

                <div className="dash-input-group" style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                  <input type="checkbox" name="livingInOtherCountry" id="livingInOtherCountry" checked={formData.livingInOtherCountry} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="livingInOtherCountry" style={{ cursor: 'pointer', margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    Is the applicant living and studying in any other country?
                  </label>
                </div>

                {formData.livingInOtherCountry && (
                  <div className="dash-input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
                    <label>Select Living Country</label>
                    <Select
                      styles={customSelectStyles} options={countries} value={countries.find(c => c.value === formData.otherLivingCountry)}
                      onChange={(val) => handleSelectFieldChange('otherLivingCountry', val)} menuPortalTarget={document.body} placeholder="Select Country"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Alternative Contact */}
            <div className="widget" style={{ padding: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <button type="button" onClick={() => clearSection('alternative')}
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  title="Clear Section"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Phone size={18} className="text-muted" /> Alternative Contact Info
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="dash-input-group"><label>Name</label><input type="text" name="altContactName" value={formData.altContactName} onChange={handleChange} className="theme-input" /></div>
                <div className="dash-input-group"><label>Phone Number</label><input type="tel" name="altContactPhone" value={formData.altContactPhone} onChange={(e) => enforcePhonePrefix(e, 'altContactPhone')} className="theme-input" placeholder="+91 9876543210" /></div>
                <div className="dash-input-group"><label>Email Address</label><input type="email" name="altContactEmail" value={formData.altContactEmail} onChange={handleChange} className="theme-input" /></div>
                <div className="dash-input-group"><label>Relation with Applicant</label><input type="text" name="altContactRelation" value={formData.altContactRelation} onChange={handleChange} className="theme-input" /></div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button type="button" disabled style={{ opacity: 0, pointerEvents: 'none', padding: '12px 20px' }}>Previous</button>
              <button type="submit" className="btn-save" style={{ padding: '12px 30px', fontSize: '1.05rem' }}>
                <Save size={18} /> Save Complete Profile
              </button>
              <button type="button" onClick={() => setActiveTab('academic')} className="btn-save" style={{ padding: '12px 20px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                Next
              </button>
            </div>
          </form>
        </div>
        <div style={{ display: activeTab === 'academic' ? 'block' : 'none' }}>
          <form onSubmit={handleSaveProfile} className="edit-form-grid">
            {/* Top of Academic Qualification */}
            <div className="widget" style={{ padding: '25px', marginBottom: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <button type="button" onClick={() => clearSection('academic_top')}
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  title="Clear Section"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} className="text-muted" /> Academic Qualification
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="dash-input-group">
                  <label>Country of Education</label>
                  <Select
                    styles={customSelectStyles} options={countries} value={countries.find(c => c.value === formData.countryOfEducation)}
                    onChange={(val) => handleSelectFieldChange('countryOfEducation', val)} menuPortalTarget={document.body} placeholder="Select Country"
                  />
                </div>
                <div className="dash-input-group">
                  <label>Highest Level of Education</label>
                  <select name="highestLevelOfEducation" value={formData.highestLevelOfEducation} onChange={handleChange} className="theme-input theme-select">
                    <option value="">Select Level</option>
                    <option value="Masters">Masters</option>
                    <option value="Bachelors">Bachelors</option>
                    <option value="12th or equivalent">12th or equivalent</option>
                  </select>
                </div>
              </div>
            </div>

            {(formData.educationHistory || []).map((edu, index) => {
              const hl = formData.highestLevelOfEducation;
              if (hl === 'Bachelors' && edu.level === 'Masters') return null;
              if (hl === '12th or equivalent' && (edu.level === 'Masters' || edu.level === 'Bachelors')) return null;

              return (
                <div key={index} className="widget" style={{ padding: '25px', marginBottom: '20px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <button type="button" onClick={() => clearEducationEntry(index)}
                      style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                      title="Clear Entry"
                    >
                      <Eraser size={14} />
                    </button>
                  </div>
                  <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '15px' }}>{edu.level}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div className="dash-input-group">
                      <label>Country of Study</label>
                      <Select
                        styles={customSelectStyles} options={countries} value={countries.find(c => c.value === edu.countryOfStudy)}
                        onChange={(val) => handleEducationChange(index, 'countryOfStudy', val ? val.value : '')} menuPortalTarget={document.body} placeholder="Select Country"
                      />
                    </div>
                    <div className="dash-input-group">
                      <label>State of Study</label>
                      <Select
                        styles={customSelectStyles} options={getStateOptions(edu.countryOfStudy)}
                        value={getStateOptions(edu.countryOfStudy).find(s => s.value === edu.stateOfStudy) || null}
                        onChange={(val) => handleEducationChange(index, 'stateOfStudy', val ? val.value : '')} menuPortalTarget={document.body} placeholder="Select State"
                        isDisabled={!edu.countryOfStudy}
                      />
                    </div>
                    <div className="dash-input-group">
                      <label>Name of University/Institution</label>
                      <input type="text" value={edu.universityName} onChange={(e) => handleEducationChange(index, 'universityName', e.target.value)} className="theme-input" />
                    </div>
                    <div className="dash-input-group">
                      <label>Program Name</label>
                      {(() => {
                        const courseOptions = edu.level === 'Masters' ? ['MBA', 'M.Sc', 'M.Tech', 'MA', 'M.Com', 'MCA'] :
                          edu.level === 'Bachelors' ? ['B.Tech', 'B.Sc', 'BA', 'B.Com', 'BBA', 'BCA'] :
                            edu.level === '12th or equivalent' ? ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Arts/Humanities'] :
                              [];

                        const isCustom = edu.programName && !courseOptions.includes(edu.programName);
                        const selectValue = isCustom ? 'Other' : (edu.programName || '');

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <select
                              value={selectValue}
                              onChange={(e) => {
                                if (e.target.value === 'Other') {
                                  if (courseOptions.includes(edu.programName)) handleEducationChange(index, 'programName', '');
                                  handleEducationChange(index, 'isCustomProgram', true);
                                } else {
                                  handleEducationChange(index, 'isCustomProgram', false);
                                  handleEducationChange(index, 'programName', e.target.value);
                                }
                              }}
                              className="theme-input theme-select"
                            >
                              <option value="">Select</option>
                              {courseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              <option value="Other">Other</option>
                            </select>
                            {(selectValue === 'Other' || edu.isCustomProgram) && (
                              <input
                                type="text"
                                value={courseOptions.includes(edu.programName) ? '' : edu.programName}
                                onChange={(e) => handleEducationChange(index, 'programName', e.target.value)}
                                className="theme-input"
                                placeholder="Enter specific program name"
                                style={{ animation: 'fadeIn 0.3s ease' }}
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="dash-input-group">
                      <label>Grading System</label>
                      <select value={edu.gradingSystem} onChange={(e) => handleEducationChange(index, 'gradingSystem', e.target.value)} className="theme-input theme-select">
                        <option value="">Select</option>
                        <option value="Out of 10">Out of 10</option>
                        <option value="Out of 7">Out of 7</option>
                        <option value="Out of 5">Out of 5</option>
                        <option value="Out of 4">Out of 4</option>
                      </select>
                    </div>
                    <div className="dash-input-group">
                      <label>Obtained Grade</label>
                      <input type="text" value={edu.obtainedGrade} onChange={(e) => handleEducationChange(index, 'obtainedGrade', e.target.value)} className="theme-input" />
                    </div>
                    <div className="dash-input-group">
                      <label>Percentage Obtained</label>
                      <input type="text" value={edu.percentageObtained} onChange={(e) => handleEducationChange(index, 'percentageObtained', e.target.value)} className="theme-input" />
                    </div>
                    <div className="dash-input-group">
                      <label>Primary Language of Instruction</label>
                      <input type="text" value={edu.primaryLanguage} onChange={(e) => handleEducationChange(index, 'primaryLanguage', e.target.value)} className="theme-input" />
                    </div>
                    <div className="dash-input-group">
                      <label>Start Date</label>
                      <DatePicker
                        selected={edu.startDate ? new Date(edu.startDate) : null}
                        onChange={(date) => handleEducationChange(index, 'startDate', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="yyyy-MM-dd" className="theme-input" placeholderText="Select Date" showMonthDropdown showYearDropdown dropdownMode="select" portalId="root"
                      />
                    </div>
                    <div className="dash-input-group" style={{ opacity: edu.currentlyPursuing ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                      <label>End Date</label>
                      <DatePicker
                        selected={edu.endDate ? new Date(edu.endDate) : null}
                        onChange={(date) => handleEducationChange(index, 'endDate', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="yyyy-MM-dd" className="theme-input" placeholderText="Select Date" showMonthDropdown showYearDropdown dropdownMode="select" portalId="root"
                        disabled={edu.currentlyPursuing}
                      />
                    </div>
                    <div className="dash-input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', gridColumn: '1 / -1' }}>
                      <input type="checkbox" id={`pursuing-${index}`} checked={edu.currentlyPursuing || false} onChange={(e) => {
                        handleEducationChange(index, 'currentlyPursuing', e.target.checked);
                        if (e.target.checked) handleEducationChange(index, 'endDate', '');
                      }} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <label htmlFor={`pursuing-${index}`} style={{ margin: 0, cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.95rem' }}>Currently pursuing</label>
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
              <button type="button" onClick={addEducation} style={{ padding: '10px 20px', background: 'var(--card-bg)', border: '1px dashed var(--accent-secondary)', color: 'var(--accent-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                + Add Other Education
              </button>
            </div>

            <div className="widget" style={{ padding: '25px', marginBottom: '20px' }}>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={18} className="text-muted" /> Work Experience
              </h3>
              {(formData.workExperience || []).map((work, index) => (
                <div key={index} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: index < formData.workExperience.length - 1 ? '1px dashed var(--glass-border)' : 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '0px', zIndex: 10 }}>
                    <button type="button" onClick={() => clearWorkEntry(index)}
                      style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                      title="Clear Entry"
                    >
                      <Eraser size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div className="dash-input-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Name of the Organisation & Address</label>
                      <input type="text" value={work.organisationName} onChange={(e) => handleWorkChange(index, 'organisationName', e.target.value)} className="theme-input" />
                    </div>
                    <div className="dash-input-group">
                      <label>Position</label>
                      <input type="text" value={work.position} onChange={(e) => handleWorkChange(index, 'position', e.target.value)} className="theme-input" />
                    </div>
                    <div className="dash-input-group">
                      <label>Job Profile</label>
                      <input type="text" value={work.jobProfile} onChange={(e) => handleWorkChange(index, 'jobProfile', e.target.value)} className="theme-input" />
                    </div>
                    <div className="dash-input-group">
                      <label>Mode of Salary</label>
                      <select value={work.modeOfSalary} onChange={(e) => handleWorkChange(index, 'modeOfSalary', e.target.value)} className="theme-input theme-select">
                        <option value="">Select</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div className="dash-input-group">
                      <label>Start Date</label>
                      <DatePicker
                        selected={work.startDate ? new Date(work.startDate) : null}
                        onChange={(date) => handleWorkChange(index, 'startDate', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="yyyy-MM-dd" className="theme-input" placeholderText="Select Date" showMonthDropdown showYearDropdown dropdownMode="select" portalId="root"
                      />
                    </div>
                    <div className="dash-input-group" style={{ opacity: work.currentlyWorkingHere ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                      <label>End Date</label>
                      <DatePicker
                        selected={work.endDate ? new Date(work.endDate) : null}
                        onChange={(date) => handleWorkChange(index, 'endDate', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="yyyy-MM-dd" className="theme-input" placeholderText="Select Date" showMonthDropdown showYearDropdown dropdownMode="select" portalId="root"
                        disabled={work.currentlyWorkingHere}
                      />
                    </div>
                    <div className="dash-input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', gridColumn: '1 / -1', marginTop: '10px' }}>
                      <input type="checkbox" id={`working-${index}`} checked={work.currentlyWorkingHere} onChange={(e) => handleWorkChange(index, 'currentlyWorkingHere', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <label htmlFor={`working-${index}`} style={{ margin: 0, cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.95rem' }}>I am currently working here</label>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button type="button" onClick={addWorkExperience} style={{ padding: '10px 20px', background: 'var(--card-bg)', border: '1px dashed var(--accent-secondary)', color: 'var(--accent-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  + Add Work Experience
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button type="button" onClick={() => setActiveTab('profile')} className="btn-save" style={{ padding: '12px 20px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                Previous
              </button>
              <button type="submit" className="btn-save" style={{ padding: '12px 30px', fontSize: '1.05rem' }}>
                <Save size={18} /> Save Complete Profile
              </button>
              <button type="button" onClick={() => setActiveTab('documents')} className="btn-save" style={{ padding: '12px 20px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                Next
              </button>
            </div>
          </form>
        </div>
        <div style={{ display: activeTab === 'applications' ? 'block' : 'none' }}>
          <div style={{ animation: 'fadeIn 0.3s ease' }}>

            <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px', gap: '30px', padding: '0 10px' }}>
              <button
                type="button"
                onClick={() => setApplicationSubTab('apply')}
                style={{ background: 'none', border: 'none', padding: '10px 0', borderBottom: applicationSubTab === 'apply' ? '2px solid var(--accent-secondary)' : '2px solid transparent', color: applicationSubTab === 'apply' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              >
                Apply To Programs
              </button>
              <button
                type="button"
                onClick={() => setApplicationSubTab('applied')}
                style={{ background: 'none', border: 'none', padding: '10px 0', borderBottom: applicationSubTab === 'applied' ? '2px solid var(--accent-secondary)' : '2px solid transparent', color: applicationSubTab === 'applied' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              >
                Selected Universities
              </button>
            </div>

            {applicationSubTab === 'apply' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <SearchProgram
                  preselectedUnis={selectedForApplication}
                  hideFooter={true}
                  onSelectionChange={(uni, isSelected) => {
                    if (isSelected) {
                      setSelectedForApplication(prev => {
                        const exists = prev.find(p => p.id === uni.id);
                        if (exists) return prev;
                        return [...prev, uni];
                      });
                    } else {
                      setSelectedForApplication(prev => prev.filter(p => p.id !== uni.id));
                    }
                  }}
                />

                {/* Floating Action Buttons when Universities are selected */}
                {selectedForApplication.length > 0 && (
                  <div style={{ position: 'sticky', bottom: '20px', right: '0px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', zIndex: 100, pointerEvents: 'none', marginTop: '-60px' }}>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="btn-save"
                      style={{
                        pointerEvents: 'auto',
                        padding: '12px 25px',
                        fontSize: '1rem',
                        margin: '0 0 20px 0',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--accent-secondary)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '12px'
                      }}
                    >
                      <Save size={18} /> Save Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplicationSubTab('applied')}
                      className="btn-save"
                      style={{
                        pointerEvents: 'auto',
                        padding: '12px 30px',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '1.05rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '0 20px 20px 0',
                        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                        borderRadius: '12px'
                      }}
                    >
                      Next <ArrowRight size={18} />
                    </button>
                  </div>
                )}

                {/* Actions fallback to bottom */}
                {true && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginTop: '30px', padding: '0 5px' }}>
                    <button type="button" onClick={() => setActiveTab('documents')} className="btn-save" style={{ padding: '12px 20px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                      Previous
                    </button>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      {selectedForApplication.length === 0 && (
                        <button type="button" onClick={handleSaveProfile} className="btn-save" style={{ padding: '12px 30px', fontSize: '1.05rem', margin: 0 }}>
                          <Save size={18} /> Save Complete Profile
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {applicationSubTab === 'applied' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {selectedForApplication.length === 0 ? (
                  <div className="empty-state" style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--card-bg-solid)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                    <Search className="text-muted" size={48} style={{ marginBottom: '15px', opacity: 0.5, margin: '0 auto' }} />
                    <h3 style={{ color: 'var(--text-main)', margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 800 }}>No Universities Selected</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Switch to "Apply To Programs" to search and add target universities.</p>
                  </div>
                ) : (
                  <div className="widget" style={{ marginBottom: '20px', background: 'var(--card-bg-solid)', border: '1px solid var(--accent-secondary)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquare size={18} className="text-muted" /> Selected Universities for Application
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                      {selectedForApplication.map((uni, idx) => {
                        const isExpanded = expandedUniIds.includes(uni.id);

                        const stdKeys = ["id", "universityname", "name", "location", "type", "ranking", "percentage", "minpercentage", "programlevel", "level", "interestedfield", "subfield", "programname", "program", "rawsheetdata", "sno"];
                        const otherCols = uni.rawSheetData ? Object.keys(uni.rawSheetData).filter(k => {
                          const n = k.toLowerCase().replace(/[\s_.-]+/g, '');
                          return !stdKeys.includes(n) && uni.rawSheetData[k] && uni.rawSheetData[k] !== "N/A" && uni.rawSheetData[k] !== "";
                        }) : [];

                        return (
                          <div key={uni.id || idx} style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '5px', paddingRight: '25px', fontSize: '1.05rem' }}>{uni.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14} /> {uni.location}</div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Programs: {uni.programs.join(', ')}</span>
                              {uni.intake && <span style={{ fontSize: '0.8rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Intake: {uni.intake}</span>}
                              {uni.level && uni.level !== "N/A" && <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>{uni.level}</span>}
                              {uni.minPercentage && uni.minPercentage !== "0" && <span style={{ fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Min {uni.minPercentage}%</span>}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedForApplication(prev => prev.filter(p => p.id !== uni.id));
                              }}
                              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                              title="Remove University"
                              className="hover:bg-red-500 hover:text-white"
                            >
                              <X size={16} />
                            </button>

                            {otherCols.length > 0 && (
                              <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
                                <button
                                  onClick={() => setExpandedUniIds(prev => prev.includes(uni.id) ? prev.filter(id => id !== uni.id) : [...prev, uni.id])}
                                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 0', transition: 'all 0.2s' }}
                                >
                                  {isExpanded ? <ChevronLeft size={16} style={{ transform: 'rotate(90deg)', transition: 'transform 0.2s' }} /> : <ChevronRight size={16} style={{ transform: 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                                  {isExpanded ? 'Hide Details' : 'Show Details'}
                                </button>

                                {isExpanded && (
                                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--glass-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', animation: 'fadeIn 0.3s ease' }}>
                                    {otherCols.map(col => {
                                      const isDateContext = col.toLowerCase().includes('deadline') || col.toLowerCase().includes('date');
                                      return (
                                        <div key={col} style={{ fontSize: '0.85rem', background: isDateContext ? 'rgba(239, 68, 68, 0.05)' : 'var(--input-bg)', padding: '10px', borderRadius: '8px', border: isDateContext ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: isDateContext ? '#ef4444' : 'var(--text-muted)' }}>{col}</span>
                                          <span style={{ color: isDateContext ? '#ef4444' : 'var(--text-main)', fontWeight: isDateContext ? 800 : 600 }}>{formatDisplayValue(uni.rawSheetData[col], isDateContext)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Actions for Selected Universities */}
                {selectedForApplication.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', padding: '10px 5px', marginTop: '10px', animation: 'fadeIn 0.3s ease' }}>
                    <button type="button" onClick={() => setActiveTab('documents')} className="btn-save" style={{ padding: '12px 20px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                      Previous
                    </button>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button type="button" onClick={handleSaveProfile} className="btn-save" style={{ padding: '12px 30px', fontSize: '1.05rem', margin: 0 }}>
                        <Save size={18} /> Save Complete Profile
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const docsInfo = documentUploadRef.current?.getAttachedFilesInfo() || [];
                          if (docsInfo.length === 0) {
                            setShowNoDocsError(true);
                            setTimeout(() => setShowNoDocsError(false), 5000);
                            return;
                          }
                          setShowNoDocsError(false);
                          setHasAttachmentsWarning(false);
                          const success = await handleSaveProfile();
                          if (success) {
                            setAttachedDocsPreview(docsInfo);
                            setShowSummaryModal(true);
                          }
                        }}
                        className="btn-save"
                        style={{ padding: '12px 30px', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 'none', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
                      >
                        Review & Submit <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
        <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }}>
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <DocumentUpload profile={formData} setMessage={setMessage} ref={documentUploadRef} />
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
              <button type="button" onClick={() => setActiveTab('academic')} className="btn-save" style={{ padding: '12px 20px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                Previous
              </button>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const docsInfo = documentUploadRef.current?.getAttachedFilesInfo() || [];
                    if (docsInfo.length === 0) {
                      setShowNoDocsError(true);
                      setTimeout(() => setShowNoDocsError(false), 5000);
                      return;
                    }

                    setShowNoDocsError(false);
                    setHasAttachmentsWarning(false); // Reset in modal if we have docs

                    const success = await handleSaveProfile();
                    if (success) {
                      setAttachedDocsPreview(docsInfo);
                      setMessage('Documents successfully uploaded!');
                      setTimeout(() => setMessage(''), 5000);
                    }
                  }}
                  className="btn-save"
                  style={{ padding: '12px 30px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 'none' }}
                >
                  <Save size={18} /> Save & Upload Documents
                </button>
              </div>
              <button type="button" onClick={() => setActiveTab('applications')} className="btn-save" style={{ padding: '12px 20px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {isUploading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '380px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#fff', marginBottom: '20px', fontSize: '1.25rem', fontWeight: 800 }}>{uploadProgress < 100 ? 'SUBMITTING...' : 'TRANSMISSION COMPLETE!'}</div>
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #10b981)', width: `${uploadProgress}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
            <div style={{ color: '#94a3b8', marginTop: '15px', fontSize: '1rem', fontWeight: 600 }}>{uploadProgress}% PROCESSED</div>
          </div>
        </div>
      )}

      {showSummaryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'var(--card-bg-solid)', backdropFilter: 'blur(25px)', width: '85%', maxWidth: '1400px', height: '85vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', border: '1px solid var(--glass-border)' }}>
            {!isSubmitted ? (
              <>
                <div style={{ padding: '12px 25px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '25px', flex: 1 }}>
                    <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 900, whiteSpace: 'nowrap' }}>Final Review & Submission</h2>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 15px', borderRadius: '10px', color: '#f87171', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', lineHeight: 1.4 }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                      <span><strong style={{ fontWeight: 800 }}>Attention:</strong> After submission, your profile and documents cannot be modified. Ensure all information is accurate before proceeding.</span>
                    </div>
                    {hasAttachmentsWarning && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '6px 15px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 800 }}>
                        <AlertTriangle size={16} /> NO DOCUMENTS
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowSummaryModal(false)} style={{ background: 'var(--input-bg)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
                </div>

                <div style={{ padding: '15px 25px', overflowY: 'auto', flex: 1, color: 'var(--text-main)', display: 'flex', gap: '20px' }}>
                  {/* Left Column: Info Cards Grid */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', alignContent: 'start' }}>

                    {/* Personal Profile */}
                    <div style={{ background: 'var(--modal-card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0, marginBottom: '15px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}><User size={18} /> PERSONAL PROFILE</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Full Name:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.firstName} {formData.middleName} {formData.lastName}</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Email:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.email}</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Contact:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.phone}</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>DOB:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.dob ? new Date(formData.dob).toLocaleDateString() : 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Gender:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.gender}</span></div>
                        <div style={{ marginTop: '8px', borderTop: '1px dashed var(--glass-border)', paddingTop: '8px' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Alternative Contact:</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.altContactName || 'N/A'} {formData.altContactPhone ? `(${formData.altContactPhone})` : ''} - {formData.altContactRelation || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Passport & Nationality */}
                    <div style={{ background: 'var(--modal-card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0, marginBottom: '15px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}><Globe size={18} /> PASSPORT & NATIONALITY</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Passport No:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.passportNo || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Issue/Expiry:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.issueDate || 'N/A'} - {formData.expiryDate || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Nationality:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{getCountryLabel(formData.nationality)?.label || formData.nationality || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Citizenship:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{getCountryLabel(formData.citizenship)?.label || formData.citizenship || 'N/A'}</span></div>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div style={{ background: 'var(--modal-card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0, marginBottom: '15px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}><MapPin size={18} /> ADDRESS DETAILS</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Mailing Address:</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{[formData.mailingAddress1, formData.mailingAddress2, formData.mailingCity, formData.mailingState, getCountryLabel(formData.mailingCountry)?.label || formData.mailingCountry, formData.mailingPincode].filter(Boolean).join(', ') || 'N/A'}</span>
                        </div>
                        <div style={{ marginTop: '4px', borderTop: '1px dashed var(--glass-border)', paddingTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Permanent Address:</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{[formData.permanentAddress1, formData.permanentAddress2, formData.permanentCity, formData.permanentState, getCountryLabel(formData.permanentCountry)?.label || formData.permanentCountry, formData.permanentPincode].filter(Boolean).join(', ') || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Academic Record */}
                    <div style={{ background: 'var(--modal-card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0, marginBottom: '15px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}><FileText size={18} /> ACADEMIC RECORD</h3>
                      <div style={{ marginBottom: '10px', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Highest:</span> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formData.highestLevelOfEducation || 'N/A'}</span></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(formData.educationHistory || []).map((edu, idx) => {
                          if (!(edu.programName || edu.universityName)) return null;
                          return (
                            <div key={idx} style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{edu.level}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{edu.programName || 'N/A'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Work History */}
                    <div style={{ background: 'var(--modal-card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0, marginBottom: '15px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}><FolderOpen size={18} /> WORK HISTORY</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(formData.workExperience || []).filter(w => w.organisationName || w.position).length > 0 ? formData.workExperience.filter(w => w.organisationName || w.position).map((work, idx) => (
                          <div key={idx} style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{work.position || 'Role'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{work.organisationName || 'N/A'}</div>
                          </div>
                        )) : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No work experience.</div>}
                      </div>
                    </div>

                    {/* Target Universities */}
                    {selectedForApplication.length > 0 && (
                      <div style={{ background: 'var(--modal-card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--accent-secondary)' }}>
                        <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0, marginBottom: '15px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}><CheckSquare size={18} /> TARGET UNIVERSITIES</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                          {selectedForApplication.map((uni, idx) => (
                            <div key={idx} style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{uni.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{uni.location}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Verified Documents Sidebar */}
                  <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: 'var(--modal-card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ color: 'var(--accent-secondary)', marginTop: 0, marginBottom: '15px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}><UploadCloud size={18} /> VERIFIED DOCUMENTS</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                        {attachedDocsPreview.length > 0 ? attachedDocsPreview.map((doc, idx) => (
                          <div key={idx} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.label}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.fileName}</div>
                            </div>
                            <button type="button" onClick={() => documentUploadRef.current?.triggerPreview(doc.id)} style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.2)', color: 'var(--accent-secondary)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                              <Eye size={12} /> VIEW
                            </button>
                          </div>
                        )) : (
                          <div style={{ color: '#ef4444', padding: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 700, fontSize: '0.85rem' }}>NO DOCUMENTS</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '10px 30px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => setShowSummaryModal(false)} className="btn-save" style={{ padding: '10px 24px', background: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem' }}>
                    GO BACK & EDIT
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (documentUploadRef.current) {
                        setIsUploading(true);
                        setUploadProgress(5);
                        await documentUploadRef.current.executeProcessing((p) => setUploadProgress(p), { ...formData, appliedUniversities: selectedForApplication, studentId: student._id });

                        // The database is now updated atomically in the backend during executeProcessing
                        if (refreshProfile) refreshProfile();

                        setTimeout(() => {
                          setIsUploading(false);
                          setIsSubmitted(true);
                          if (setPendingApplications) {
                            setPendingApplications([]);
                          }
                        }, 800);
                      }
                    }}
                    className="btn-save"
                    style={{ padding: '14px 45px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, letterSpacing: '0.5px', boxShadow: '0 8px 12px -3px rgba(16, 185, 129, 0.25)' }}
                  >
                    FINAL SUBMIT & LOCK
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-main)' }}>
                <div style={{ fontSize: '7rem', marginBottom: '25px', filter: 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.2))' }}>✅</div>
                <h1 style={{ fontSize: '3rem', marginBottom: '15px', fontWeight: 950, color: 'var(--text-main)' }}>Submission Successful!</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '35px', maxWidth: '600px', lineHeight: 1.6 }}>Your academic credentials have been verified and securely transmitted.</p>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid #10b981', padding: '20px 35px', borderRadius: '15px', color: '#10b981', fontSize: '1.1rem', marginBottom: '45px', fontWeight: 700 }}>
                  Your Application Submitted Successfully 🎉
                </div>
                <button
                  onClick={goBack}
                  className="btn-save"
                  style={{ padding: '15px 60px', fontSize: '1.2rem', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 800 }}
                >
                  RETURN TO DASHBOARD
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
