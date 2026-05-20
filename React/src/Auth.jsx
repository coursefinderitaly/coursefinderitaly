import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { 
  Mail, Lock, User, MapPin, Phone, Globe, Smartphone, 
  KeyRound, CheckSquare, Square, Building2, Users, Briefcase,
  Sun, Moon, Monitor, Eye, EyeOff, TrendingUp, BookOpen, CreditCard, Mic, LayoutDashboard
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import './Auth.css';
import { API_BASE_URL } from './config';

import { Country, State, City } from 'country-state-city';

const ALLOWED_COUNTRIES = []; // Deprecated, lifting restriction

const Auth = ({ isModal = false, onClose, initialMode = 'login', initialRole = 'partner' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot'
  const [role, setRole] = useState(initialRole); // 'student', 'partner'
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPartnerPopup, setShowPartnerPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      background: 'var(--input-bg)',
      borderColor: 'var(--input-border)',
      color: 'var(--text-main)',
      boxShadow: 'none',
      minHeight: '42px',
      '&:hover': { borderColor: 'var(--accent-primary)' }
    }),
    menu: (provided) => ({
      ...provided,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      zIndex: 9999
    }),
    menuList: (provided) => ({
      ...provided,
      background: 'var(--bg-secondary)',
      padding: 0
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isSelected
        ? 'var(--accent-primary)'
        : state.isFocused
          ? 'var(--input-focus, rgba(124, 58, 237, 0.1))'
          : 'transparent',
      color: state.isSelected ? '#ffffff' : 'var(--text-main)',
      cursor: 'pointer',
      ':active': { background: 'var(--accent-secondary)' }
    }),
    singleValue: (provided) => ({ ...provided, color: 'var(--text-main)' }),
    input: (provided) => ({ ...provided, color: 'var(--text-main)' }),
    placeholder: (provided) => ({ ...provided, color: 'var(--text-muted)' }),
    dropdownIndicator: (provided) => ({ ...provided, color: 'var(--text-muted)' }),
    clearIndicator: (provided) => ({ ...provided, color: 'var(--text-muted)' }),
    indicatorSeparator: (provided) => ({ ...provided, background: 'var(--glass-border)' })
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const passwordToggleProps = {
    onClick: togglePasswordVisibility,
    style: { cursor: 'pointer', color: 'var(--text-muted)' }
  };

    // Automatic session redirect removed by user request. 
    // The modal will now stay open and allow manual re-login or registration.


  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
        setMode('login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const all = Country.getAllCountries();
    const sorted = all.sort((a, b) => {
      if (a.isoCode === 'IN') return -1;
      if (b.isoCode === 'IN') return 1;
      return a.name.localeCompare(b.name);
    });
    setCountries(sorted.map(c => ({ value: c.isoCode, label: c.name, phonecode: c.phonecode })));
  }, []);

  // Unified state for fields across both forms
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', 
    country: null, state: null, city: null, 
    phone: '+91 ', whatsapp: '+91 ', email: '', 
    password: '', confirmPassword: '',
    // Partner specifics
    companyName: '', companyAddress: '', teamSize: '', priorExperience: false, designation: '', studentUniqueId: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: selectedOption };
      
      if (name === 'country') {
        updated.state = null;
        updated.city = null;
        if (selectedOption) {
          const pCode = selectedOption.phonecode ? `+${selectedOption.phonecode} ` : '+91 ';
          updated.phone = pCode;
          updated.whatsapp = pCode;
          setStates(State.getStatesOfCountry(selectedOption.value).map(s => ({ value: s.isoCode, label: s.name })));
        } else {
          setStates([]);
        }
        setCities([]);
      } else if (name === 'state') {
        updated.city = null;
        if (selectedOption && updated.country) {
          setCities(City.getCitiesOfState(updated.country.value, selectedOption.value).map(c => ({ value: c.name, label: c.name })));
        } else {
          setCities([]);
        }
      }
      
      return updated;
    });
  };

  const enforcePhonePrefix = (e) => {
    let { name, value } = e.target;
    // Aggressively stripe alphabets and bad characters instantly
    value = value.replace(/[^\d+ ]/g, '');
    const prefix = formData.country && formData.country.phonecode ? `+${formData.country.phonecode} ` : '+91 ';
    
    if (!value.startsWith(prefix)) {
      setFormData(prev => ({ ...prev, [name]: prefix }));
    } else {
      const truncated = value.slice(0, prefix.length + 10);
      setFormData(prev => ({ ...prev, [name]: truncated }));
    }
  };

  const validateSignup = (targetRole) => {
    if (targetRole === 'student') {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ text: 'Passwords do not match.', type: 'error' });
        return false;
      }
      if (formData.password && formData.password.length < 6) {
        setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
        return false;
      }
    }
    if (!formData.country || !formData.state || !formData.city) {
      setMessage({ text: 'Please select Country, State, and City.', type: 'error' });
      return false;
    }
    if (targetRole === 'partner' && !formData.companyName) {
      setMessage({ text: 'Company Name is required for Partners.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSignup = async (e, forcedRole) => {
    e.preventDefault();
    if (!validateSignup(forcedRole)) return;
    setMessage({ text: forcedRole === 'partner' ? 'Submitting request...' : 'Registering profile...', type: 'info' });

    // Format data for backend
    const splitPhone = formData.phone.split(' ');
    const finalPhoneCode = splitPhone.length > 1 ? splitPhone[0] : (formData.country && formData.country.phonecode ? `+${formData.country.phonecode}` : '+91');
    const finalPhone = splitPhone.length > 1 ? splitPhone[1] : formData.phone;

    let finalWhatsappCode = finalPhoneCode;
    let finalWhatsapp = formData.whatsapp;
    if (formData.whatsapp) {
      const splitWhatsapp = formData.whatsapp.split(' ');
      finalWhatsappCode = splitWhatsapp.length > 1 ? splitWhatsapp[0] : finalPhoneCode;
      finalWhatsapp = splitWhatsapp.length > 1 ? splitWhatsapp[1] : formData.whatsapp;
    }

    const payload = {
      ...formData,
      phoneCode: finalPhoneCode,
      phone: finalPhone,
      whatsappCode: finalWhatsappCode,
      whatsapp: finalWhatsapp,
      role: forcedRole,
      country: formData.country ? formData.country.label : '',
      state: formData.state ? formData.state.label : '',
      city: formData.city ? formData.city.label : ''
    };

    try {
      const endpoint = forcedRole === 'partner' ? `${API_BASE_URL}/auth/partner-request` : `${API_BASE_URL}/auth/signup`;
      const response = await fetch(endpoint, {
      credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        if (forcedRole === 'partner') {
          setShowPartnerPopup(true);
          setMode('login');
          setMessage({ text: '', type: '' });
        } else {
          setShowSuccessPopup(true);
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
          setMessage({ text: '', type: '' });
        }
      } else {
        setMessage({ text: data.error || 'Registration failed.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable.', type: 'error' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: 'Logging in...', type: 'info' });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
      credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.email, password: formData.password }),
      });
      const data = await response.json();

      if (response.ok) {
        // Token is now managed securely via HTTPOnly cookies from the backend
        sessionStorage.setItem('tab_session', 'true'); // Required for Strict Tab Close Session Killer
        
        if (keepSignedIn) {
          localStorage.setItem('keepSignedIn', 'true');
        } else {
          localStorage.removeItem('keepSignedIn');
        }
        
        setMessage({ text: 'Login successful.', type: 'success' });
        navigate('/dashboard'); 
      } else {
        setMessage({ text: data.error || 'Invalid credentials.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable.', type: 'error' });
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setMessage({ text: 'Password recovery link sent.', type: 'success' });
  };

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  };

  // Reusable Select Component block
  const renderLocationSelects = () => (
    <>
      <div className="input-group">
        <label>Country*</label>
        <div className="select-wrapper">
          <Globe className="input-icon" />
          <Select 
            name="country"
            value={formData.country}
            onChange={handleSelectChange}
            options={countries}
            styles={customSelectStyles}
            classNamePrefix="react-select"
            placeholder="Search Country"
            isSearchable
            required
          />
        </div>
      </div>
      <div className="input-group">
        <label>State*</label>
        <div className="select-wrapper">
          <MapPin className="input-icon" />
          <Select 
            name="state"
            value={formData.state}
            onChange={handleSelectChange}
            options={states}
            styles={customSelectStyles}
            classNamePrefix="react-select"
            placeholder="Search State"
            isSearchable
            required
            isDisabled={!formData.country}
          />
        </div>
      </div>
      <div className="input-group">
        <label>City*</label>
        <div className="select-wrapper">
          <MapPin className="input-icon" />
          <Select 
            name="city"
            value={formData.city}
            onChange={handleSelectChange}
            options={cities}
            styles={customSelectStyles}
            classNamePrefix="react-select"
            placeholder="Search City"
            isSearchable
            required
            isDisabled={!formData.state}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className={`auth-glass-container ${mode === 'signup' ? 'signup-mode' : ''}`}>
      {isModal && typeof onClose === 'function' && (
        <button className="auth-close-btn" onClick={onClose} style={{ position: 'absolute', top: '15px', right: '20px', background: 'var(--error-color)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', zIndex: 10 }} title="Close">✕</button>
      )}
      {/* FORMS (RIGHT SIDE) */}
      <div className="auth-content single-layout">
        <div className="content-header">
          <h2>
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Recover Password'}
          </h2>
          <p>
            {mode === 'login' ? 'Please log in with your credentials.' 
              : mode === 'signup' ? 'Register as a Student or Business Partner below.' 
              : 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

          {message.text && <div className={`status-pill ${message.type}`}>{message.text}</div>}

          {/* ROLE SELECTOR ON SIGNUP */}
          {mode === 'signup' && (
            <div className="role-tabs animated-fade-in">
              <button type="button" className={`role-tab ${role === 'partner' ? 'active' : ''}`} onClick={() => setRole('partner')}>
                <Briefcase size={18} /> Business Partner Registration
              </button>
              <button type="button" className={`role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                <User size={18} /> Student Registration
              </button>
            </div>
          )}

          {mode === 'signup' && role === 'student' && (
            <div className="single-form-wrapper">
              <div className="form-column">
              {/* === STUDENT FORM === */}
                <form onSubmit={(e) => handleSignup(e, 'student')} className="auth-form form-sub-grid">
                  <div className="input-group"><label>Email*</label><div className="input-container"><Mail className="input-icon"/><input type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="student@example.com" required /></div></div>
                  <div className="input-group"><label>First Name*</label><div className="input-container"><User className="input-icon"/><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="auth-input" placeholder="First Name" required /></div></div>
                  <div className="input-group"><label>Last Name</label><div className="input-container"><User className="input-icon"/><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="auth-input" placeholder="Last Name" /></div></div>
                  {renderLocationSelects()}
                  <div className="input-group"><label>Phone*</label><div className="input-container"><Phone className="input-icon"/><input type="tel" name="phone" value={formData.phone} onChange={enforcePhonePrefix} className="auth-input" required /></div></div>
                  <div className="input-group"><label>WhatsApp</label><div className="input-container"><Smartphone className="input-icon"/><input type="tel" name="whatsapp" value={formData.whatsapp} onChange={enforcePhonePrefix} className="auth-input" /></div></div>
                  <div className="input-group"><label>Password*</label><div className="input-container"><Lock className="input-icon"/><input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="auth-input" placeholder="••••••••" required /><div className="password-toggle" {...passwordToggleProps}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</div></div></div>
                  <div className="input-group"><label>Confirm Password*</label><div className="input-container"><Lock className="input-icon"/><input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="auth-input" placeholder="••••••••" required /><div className="password-toggle" {...passwordToggleProps}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</div></div></div>
                  <button type="submit" className="btn-primary mt-2">Complete Student Signup</button>
                </form>
              </div>
            </div>
          )}

          {/* === PARTNER FORM === */}
          {mode === 'signup' && role === 'partner' && (
            <div className="single-form-wrapper form-transition-enter">
              <div className="form-column">
                <form onSubmit={(e) => handleSignup(e, 'partner')} className="auth-form form-sub-grid">
                  <div className="input-group"><label>Company Name*</label><div className="input-container"><Building2 className="input-icon"/><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="auth-input" placeholder="Company Name" required /></div></div>
                  <div className="input-group"><label>Company Address*</label><div className="input-container"><MapPin className="input-icon"/><input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="auth-input" placeholder="Company Address" required /></div></div>
                  <div className="input-group"><label>Designation*</label><div className="input-container"><Briefcase className="input-icon"/><input type="text" name="designation" value={formData.designation} onChange={handleChange} className="auth-input" placeholder="Designation (e.g. CEO, Manager)" required /></div></div>
                  <div className="input-group"><label>Email*</label><div className="input-container"><Mail className="input-icon"/><input type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="partner@example.com" required /></div></div>
                  <div className="input-group"><label>First Name*</label><div className="input-container"><User className="input-icon"/><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="auth-input" placeholder="First Name" required /></div></div>
                  <div className="input-group"><label>Last Name</label><div className="input-container"><User className="input-icon"/><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="auth-input" placeholder="Last Name" /></div></div>
                  {renderLocationSelects()}
                  <div className="input-group"><label>Team Size*</label><div className="input-container"><Users className="input-icon"/><input type="number" name="teamSize" value={formData.teamSize} onChange={handleChange} className="auth-input" placeholder="e.g. 10" required /></div></div>
                  <div className="input-group"><label>Phone*</label><div className="input-container"><Phone className="input-icon"/><input type="tel" name="phone" value={formData.phone} onChange={enforcePhonePrefix} className="auth-input" required /></div></div>
                  <div className="input-group"><label>WhatsApp</label><div className="input-container"><Smartphone className="input-icon"/><input type="tel" name="whatsapp" value={formData.whatsapp} onChange={enforcePhonePrefix} className="auth-input" /></div></div>
                  <div className="input-group col-span-2"><label className="checkbox-group"><input type="checkbox" name="priorExperience" checked={formData.priorExperience} onChange={handleChange} /><div className="custom-checkbox"><CheckSquare size={16} className="check-mark" /></div><span>Prior experience in study abroad?</span></label></div>
                  <button type="submit" className="btn-primary">Complete Partner Signup</button>
                </form>
              </div>
            </div>
          )}


          {/* ====================================================== */}
          {/* LOGIN FORM */}
          {/* ====================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label>Email OR Phone Number*</label>
                <div className="input-container">
                  <User className="input-icon" />
                  <input type="text" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="Email or Phone Number" required />
                </div>
              </div>

              <div className="input-group">
                <label>Password*</label>
                <div className="input-container">
                  <Lock className="input-icon" />
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="auth-input" placeholder="••••••••" required />
                  <div className="password-toggle" {...passwordToggleProps}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
              </div>

              <div className="login-extras">
                <label className="checkbox-group">
                  <input type="checkbox" checked={keepSignedIn} onChange={() => setKeepSignedIn(!keepSignedIn)} />
                  <div className="custom-checkbox">
                    <CheckSquare size={16} className="check-mark" />
                  </div>
                  <span>Keep me signed in</span>
                </label>
              </div>
              
              <button type="submit" className="btn-primary">Login</button>
            </form>
          )}

          {/* ====================================================== */}
          {/* FORGOT PASSWORD FORM */}
          {/* ====================================================== */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="auth-form">
              <div className="input-group">
                <label>Registered Email Address</label>
                <div className="input-container">
                  <KeyRound className="input-icon" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="you@example.com" required />
                </div>
              </div>
              <button type="submit" className="btn-primary">Reset Password</button>
            </form>
          )}

          {/* FOOTER NAVIGATION */}
          <div className="auth-footer">
            {mode === 'login' ? (
              <>
                <span className="switch-mode">New user? <span className="switch-link" onClick={() => {setMode('signup'); setMessage({text:'', type:''});}}>Register here</span></span>
                <button type="button" className="forgot-btn" onClick={() => {setMode('forgot'); setMessage({text:'', type:''});}}>Forgot password?</button>
              </>
            ) : mode === 'signup' ? (
              <span className="switch-mode">Have an account? <span className="switch-link" onClick={() => {setMode('login'); setMessage({text:'', type:''});}}>Back to Login</span></span>
            ) : (
              <span className="switch-mode">Remembered it? <span className="switch-link" onClick={() => {setMode('login'); setMessage({text:'', type:''});}}>Back to Login</span></span>
            )}
          </div>

        </div>
      </div>

      {showPartnerPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', zIndex: 10000, justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg-solid, #18181b)', padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--accent-primary, #7c3aed)', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <h2 style={{ color: '#fff', marginBottom: '15px', fontSize: '2rem' }}>🎉 Congratulations!</h2>
            <p style={{ color: 'var(--text-muted, #9ca3af)', marginBottom: '30px', fontSize: '1.1rem', lineHeight: 1.5 }}>
              Your Business Partner registration request has been successfully submitted.<br/><br/>
              We will contact you soon to activate your ID & Password.
            </p>
            <button onClick={() => setShowPartnerPopup(false)} className="btn-primary" style={{ width: 'auto', padding: '12px 30px' }}>Okay, Back to Login</button>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', zIndex: 10001, justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg-solid)', padding: '40px', borderRadius: '24px', textAlign: 'center', border: '2px solid #10b981', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', animation: 'containerFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div style={{ color: '#10b981', fontSize: '40px' }}>✓</div>
            </div>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '12px', fontSize: '1.8rem' }}>Registration Successful!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '20px' }}>
              Welcome aboard! Your student account has been created.
            </p>
            <div className="status-pill info" style={{ margin: 0 }}>
              Redirecting to login page in 3 seconds...
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Auth;