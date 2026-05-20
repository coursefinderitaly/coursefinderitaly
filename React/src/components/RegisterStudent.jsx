import React, { useState, useEffect } from 'react';
import { Save, Globe, MapPin } from 'lucide-react';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import { API_BASE_URL } from '../config';

const ALLOWED_COUNTRIES = []; // Disabled, global unlock

const RegisterStudent = ({ profile, setMessage }) => {
  const [counselors, setCounselors] = useState([]);

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/erp/counselors`, {
      credentials: 'include',
        });
      if (res.ok) setCounselors(await res.json());
    } catch (err) {}
  };

  const assignOptions = [
    { value: '', label: 'Unassigned' },
    ...counselors.map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName || ''} (${c.speciality || 'General'})` }))
  ];
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+91 ',
    password: '',
    assignedCounselor: null
  });

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--input-bg)',
      borderColor: state.isFocused ? 'var(--accent-secondary)' : 'var(--input-border)',
      color: 'var(--text-main)',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(14, 165, 233, 0.15)' : 'none',
      cursor: 'pointer',
      '&:hover': { borderColor: 'var(--accent-secondary)' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(16px)',
      zIndex: 100,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'rgba(59, 130, 246, 0.15)' 
        : state.isFocused ? 'rgba(128, 128, 128, 0.1)' : 'transparent',
      color: state.isSelected ? 'var(--accent-secondary)' : 'var(--text-main)',
      cursor: 'pointer',
      '&:hover': { backgroundColor: 'rgba(128, 128, 128, 0.1)' }
    }),
    singleValue: (base) => ({ ...base, color: 'var(--text-main)' }),
    input: (base) => ({ ...base, color: 'var(--text-main)' }),
    placeholder: (base) => ({ ...base, color: 'var(--text-muted)' }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--glass-border)' }),
    dropdownIndicator: (base) => ({ ...base, color: 'var(--text-muted)' }),
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    setFormData(prev => ({ ...prev, [name]: selectedOption }));
  };

  const enforcePhonePrefix = (e) => {
    let { name, value } = e.target;
    const prefix = '+91 ';
    value = value.replace(/[^\d+ ]/g, ''); // shred alpha characters

    if (!value.startsWith(prefix)) {
      setFormData(prev => ({ ...prev, [name]: prefix }));
    } else {
      const truncated = value.slice(0, prefix.length + 10);
      setFormData(prev => ({ ...prev, [name]: truncated }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ text: 'Registering student...', type: 'info' });

    const payload = {
      ...formData,
      assignedCounselor: formData.assignedCounselor ? formData.assignedCounselor.value : ''
    };

    try {
      const response = await fetch(`${API_BASE_URL}/erp/students`, {
      credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage({ text: 'Student registered successfully.', type: 'success' });
        setFormData({
          firstName: '', lastName: '', email: '', phone: '+91 ', password: '', assignedCounselor: null
        });
      } else {
        const data = await response.json();
        setMessage({ text: data.error || 'Failed to register student.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable.', type: 'error' });
    }
    
    // Auto clear success message
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  return (
    <div className="view-standard">
      <header className="dash-header" style={{ padding: '1.5rem 3rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>Register New Student Lead</h1>
          <p style={{ margin: 0 }}>Enter personal and contact details for the prospect.</p>
        </div>
      </header>
      <form onSubmit={handleRegister} className="edit-form-grid" style={{ gap: '16px', padding: '0 1rem' }}>
        <div className="profile-card full-width edit-card" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '20px 30px' }}>
          
          <div className="dash-input-group">
            <label>First Name*</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="dash-input" />
          </div>
          <div className="dash-input-group">
            <label>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="dash-input" />
          </div>
          <div className="dash-input-group">
            <label>Email Address*</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="dash-input" />
          </div>
          <div className="dash-input-group">
            <label>Set Initial Password*</label>
            <input type="text" name="password" value={formData.password} onChange={handleChange} required className="dash-input" placeholder="e.g. StudentPass123!" />
          </div>
          <div className="dash-input-group">
            <label>Phone Number *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={enforcePhonePrefix} required className="dash-input" />
          </div>
          
          {profile.role !== 'counselor' && (
            <div className="dash-input-group" style={{ zIndex: 100 }}>
              <label>Assigned Counselor</label>
              <Select 
                name="assignedCounselor" value={formData.assignedCounselor} onChange={handleSelectChange} 
                options={assignOptions} styles={{ ...customSelectStyles, menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                menuPortalTarget={document.body}
                placeholder="Select Counselor" isSearchable
              />
            </div>
          )}

          <div className="edit-actions" style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '15px' }}>
            <button type="submit" className="btn-save" style={{ padding: '12px 24px', fontSize: '1rem' }}><Save size={18} /> Save Student Record</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterStudent;
