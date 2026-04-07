import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, MapPin, Globe, Phone, Smartphone, Edit2, Save, X,
  Home, Search, Users, Briefcase, FileText, Bell, MonitorPlay, Building2, CheckSquare, KeyRound,
  Sun, Moon, Monitor, Menu, UploadCloud
} from 'lucide-react';
import './Dashboard.css';
import { useTheme } from './ThemeContext';

import DashboardHome from './components/DashboardHome';
import StudentsList from './components/StudentsList';
import ManageCounselors from './components/ManageCounselors';
import Notifications from './components/Notifications';
import LearningResources from './components/LearningResources';
import SearchProgram from './components/SearchProgram';
import RegisterStudent from './components/RegisterStudent';
import DocumentUpload from './components/DocumentUpload';
import StudentDetails from './components/StudentDetails';
import AppliedUniversities from './components/AppliedUniversities';
import PartnerApplications from './components/PartnerApplications';
import { API_BASE_URL } from './config';

const DesignerTag = ({ isSidebarOpen }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  if (!isSidebarOpen) return null;

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: (e.clientX - rect.left - rect.width / 2) / 5, y: (e.clientY - rect.top - rect.height / 2) / 5 });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      style={{
        marginTop: 'auto', padding: '20px 0 10px 0', textAlign: 'center', fontSize: '0.6rem',
        color: 'var(--text-muted)', letterSpacing: '2px', opacity: 0.4, cursor: 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 0.1s ease-out',
        fontWeight: 'bold', textTransform: 'uppercase'
      }}>
        Designer @NEET
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // which sidebar section is open
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarLocked, setIsSidebarLocked] = useState(true);
  const [pendingApplications, setPendingApplications] = useState([]);

  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Lifted Stats for dynamic re-fetching across child tabs
  const [stats, setStats] = useState({ totalStudents: 0, totalCounselors: 0, totalApplications: 0, pendingApps: 0 });

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/erp/stats`, {
        credentials: 'include',
      });
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (err) { }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) fetchStats();
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.role === 'admin') {
          navigate('/admin');
          return;
        }
        setProfile(data);
        setFormData(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => { });
    localStorage.removeItem('keepSignedIn');
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: 'Updating Profile...', type: 'info' });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          email: formData.email,
          lastName: formData.lastName,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          teamSize: formData.teamSize,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          priorExperience: formData.priorExperience,
          designation: formData.designation,
          studentUniqueId: formData.studentUniqueId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: 'Profile updated successfully.', type: 'success' });
        setProfile(data.user);
        setEditMode(false);
      } else {
        setMessage({ text: data.error || 'Failed to update.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable.', type: 'error' });
    }
  };

  if (!profile) {
    return (
      <div className="dash-universe loading">
        <div className="loader"></div>
        <p>Initializing Portal...</p>
      </div>
    );
  }

  const isPartner = profile.role === 'partner';
  const isCounselor = profile.role === 'counselor';
  const isStudent = profile.role === 'student';

  // Sidebar link generator
  const NavButton = ({ id, icon: Icon, label }) => {
    return (
      <button
        className={`nav-item ${activeTab === id ? 'active' : ''} ${!isSidebarOpen ? 'icon-only' : ''}`}
        onClick={() => { setActiveTab(id); setMessage({ text: '', type: '' }); setEditMode(false); }}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: !isSidebarOpen ? 'center' : 'flex-start' }}
        title={!isSidebarOpen ? label : ''}
      >
        <Icon size={18} style={{ minWidth: '18px' }} />
        <span className="nav-label" style={{ opacity: !isSidebarOpen ? 0 : 1, width: !isSidebarOpen ? 0 : 'auto', transition: 'opacity 0.2s', marginLeft: !isSidebarOpen ? '0' : '10px' }}>{label}</span>
      </button>
    );
  };

  return (
    <div className="dash-universe">
      <div className="dash-bg">
        <div className="dash-blob"></div>
      </div>

      <div className="dash-container">

        {/* ================================== */}
        {/* SIDEBAR                            */}
        {/* ================================== */}
        <aside
          className={`dash-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}
          style={{ width: isSidebarOpen ? '260px' : '80px', padding: isSidebarOpen ? '2rem 1.5rem' : '2rem 10px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          onMouseEnter={() => setIsSidebarOpen(true)}
          onMouseLeave={() => { if (!isSidebarLocked) setIsSidebarOpen(false); }}
        >
          <div className="sidebar-brand" style={{ padding: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: isSidebarOpen ? 'flex-start' : 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
              {/* Force image to fill width gracefully, hiding text part when collapsed */}
              <img src="/logo.png" alt="Company Logo" style={{ height: '38px', objectFit: 'contain', objectPosition: 'center', width: isSidebarOpen ? '200px' : '60px', transition: 'width 0.3s ease', flexShrink: 0 }} />
            </div>
            {isSidebarOpen && (
              <div style={{ animation: 'fadeIn 0.3s ease', marginTop: '0.5rem', marginLeft: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {isPartner ? 'Partner Portal' : isCounselor ? 'Counselor Portal' : 'Student Portal'}
                </span>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            <NavButton id="home" icon={Home} label="Dashboard" />

            {/* Student specific tabs */}
            {isStudent && (
              <>
                <NavButton id="course-finder" icon={Search} label="Course Finder" />
                <NavButton id="applications" icon={FileText} label=" Application" />
                <NavButton id="applied-universities" icon={CheckSquare} label="Applied Universities" />
                <NavButton id="learning" icon={MonitorPlay} label="Learning Resource" />
                <NavButton id="notifications" icon={Bell} label="Notifications" />
                <NavButton id="profile" icon={User} label="Profile" />
              </>
            )}

            {/* Partner specific tabs */}
            {isPartner && (
              <>
                <NavButton id="register-student" icon={User} label="Register New Student" />
                <NavButton id="students-list" icon={Users} label="Students List" />
                <NavButton id="course-finder" icon={Search} label="Search Program" />
                <NavButton id="partner-applications" icon={FileText} label="Applied Applications" />
                <NavButton id="learning" icon={MonitorPlay} label="Learning Resource" />
                <NavButton id="notifications" icon={Bell} label="Notifications" />
                <NavButton id="counselors" icon={Briefcase} label="Manage Counselors" />
                <NavButton id="profile" icon={User} label="My Account" />
              </>
            )}

            {/* Counselor specific tabs */}
            {isCounselor && (
              <>
                <NavButton id="register-student" icon={User} label="Register New Student" />
                <NavButton id="students-list" icon={Users} label="My Students" />
                <NavButton id="course-finder" icon={Search} label="Search Program" />
                <NavButton id="partner-applications" icon={FileText} label="Applied Applications" />
                <NavButton id="profile" icon={User} label="My Account" />
              </>
            )}

            <div className="nav-divider"></div>

            <button className={`nav-item logout-btn ${!isSidebarOpen ? 'icon-only' : ''}`} onClick={handleLogout} style={{ justifyContent: !isSidebarOpen ? 'center' : 'flex-start' }} title={!isSidebarOpen ? 'Logout' : ''}>
              <LogOut size={18} style={{ minWidth: '18px' }} />
              <span className="nav-label" style={{ opacity: !isSidebarOpen ? 0 : 1, width: !isSidebarOpen ? 0 : 'auto', transition: 'opacity 0.2s', marginLeft: !isSidebarOpen ? '0' : '10px' }}>Logout</span>
            </button>
          </nav>

          <div className="sidebar-user" style={{ opacity: !isSidebarOpen ? 0 : 1, overflow: 'hidden', whiteSpace: 'nowrap', transition: 'opacity 0.2s', padding: !isSidebarOpen ? 0 : '1.5rem', height: !isSidebarOpen ? 0 : 'auto' }}>
            <div className="avatar" style={{ minWidth: '40px' }}>{profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U'}</div>
            <div className="user-info">
              <span className="name">{profile.firstName} {profile.lastName || ''}</span>
              <span className="role">{isPartner ? profile.companyName || 'Partner' : isCounselor ? 'Counselor' : 'Student'}</span>
            </div>
          </div>
          <DesignerTag isSidebarOpen={isSidebarOpen} />
        </aside>

        {/* ================================== */}
        {/* MAIN CONTENT AREA                  */}
        {/* ================================== */}
        <main className="dash-main">

          {/* TOP HEADER WITH HAMBURGER & THEME TOGGLE */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 1.5rem', background: 'var(--card-bg-solid)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 11 }}>
            <button
              className="hamburger-btn"
              onClick={() => {
                const nextLock = !isSidebarLocked;
                setIsSidebarLocked(nextLock);
                setIsSidebarOpen(nextLock);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={24} />
            </button>

            {/* THEME TOGGLE (Relocated) */}
            <div style={{ display: 'flex', background: 'var(--table-header-bg)', padding: '5px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              <button onClick={() => setTheme('light')} style={{ background: theme === 'light' ? 'var(--accent-primary)' : 'transparent', color: theme === 'light' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Light Mode"><Sun size={14} /></button>
              <button onClick={() => setTheme('dark')} style={{ background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent', color: theme === 'dark' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Dark Mode"><Moon size={14} /></button>
              <button onClick={() => setTheme('system')} style={{ background: theme === 'system' ? 'var(--accent-primary)' : 'transparent', color: theme === 'system' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="System Auto"><Monitor size={14} /></button>
            </div>
          </div>

          {/* COMMON HEADER LOGIC */}
          {activeTab === 'profile' && (
            <header className="dash-header">
              <div>
                <h1>Profile Management</h1>
                <p>Manage your account credentials and contact data.</p>
              </div>
              {!editMode ? (
                <button className="btn-edit" onClick={() => setEditMode(true)}><Edit2 size={16} /> Edit Profile</button>
              ) : (
                <button className="btn-cancel" onClick={() => { setEditMode(false); setFormData(profile); setMessage({ text: '', type: '' }); }}><X size={16} /> Cancel</button>
              )}
            </header>
          )}

          <div className="dash-content-area">
            {message.text && (
              <div className={`dash-message ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* ================================== */}
            {/* VIEW: HOME OVERVIEW                */}
            {/* ================================== */}
            {activeTab === 'home' && (
              <DashboardHome
                profile={profile}
                isPartner={isPartner}
                setActiveTab={setActiveTab}
                stats={stats}
                fetchStats={fetchStats}
                setPendingApplications={setPendingApplications}
              />
            )}

            {/* ================================== */}
            {/* VIEW: STUDENTS LIST                */}
            {/* ================================== */}
            {activeTab === 'students-list' && (
              <StudentsList
                profile={profile}
                setMessage={setMessage}
                fetchStats={fetchStats}
                pendingApplications={pendingApplications}
                setPendingApplications={setPendingApplications}
              />
            )}

            {/* ================================== */}
            {/* VIEW: REGISTER STUDENT              */}
            {/* ================================== */}
            {activeTab === 'register-student' && <RegisterStudent profile={profile} setMessage={setMessage} />}


            {/* ================================== */}
            {/* VIEW: APPLICATIONS                 */}
            {/* ================================== */}
            {activeTab === 'applications' && (
              isStudent && (
                <StudentDetails
                  student={profile}
                  goBack={() => setActiveTab('home')}
                  pendingApplications={pendingApplications}
                  setPendingApplications={setPendingApplications}
                  refreshProfile={fetchProfile}
                />
              )
            )}

            {/* ================================== */}
            {/* VIEW: APPLIED UNIVERSITIES         */}
            {/* ================================== */}
            {activeTab === 'applied-universities' && (
              <AppliedUniversities profile={profile} />
            )}

            {/* ================================== */}
            {/* VIEW: PARTNER APPLICATIONS         */}
            {/* ================================== */}
            {activeTab === 'partner-applications' && (isPartner || isCounselor) && (
              <PartnerApplications profile={profile} setMessage={setMessage} />
            )}

            {/* ================================== */}
            {/* VIEW: MANAGE COUNSELORS            */}
            {/* ================================== */}
            {activeTab === 'counselors' && <ManageCounselors setMessage={setMessage} />}

            {/* ================================== */}
            {/* VIEW: NOTIFICATIONS                */}
            {/* ================================== */}
            {activeTab === 'notifications' && <Notifications />}

            {/* ================================== */}
            {/* VIEW: LEARNING RESOURCES           */}
            {/* ================================== */}
            {activeTab === 'learning' && <LearningResources />}

            {/* ================================== */}
            {/* VIEW: SEARCH PROGRAM               */}
            {/* ================================== */}
            {activeTab === 'course-finder' && (
              <SearchProgram
                preselectedUnis={pendingApplications}
                onProceed={(selected) => {
                  setPendingApplications(selected);
                  if (isPartner || isCounselor) {
                    setActiveTab('students-list');
                  } else {
                    setActiveTab('applications');
                  }
                }}
              />
            )}

            {/* ================================== */}
            {/* VIEW: PROFILE MANAGEMENT           */}
            {/* ================================== */}
            {activeTab === 'profile' && (
              <>
                {!editMode ? (
                  <div className="profile-grid">
                    <div className="profile-card">
                      <h3>Core Identification</h3>
                      <div className="data-row">
                        <span className="label">Full Name</span>
                        <span className="value">{profile.firstName} {profile.lastName || ''}</span>
                      </div>
                      <div className="data-row">
                        <span className="label">Email Address</span>
                        <span className="value">{profile.email}</span>
                      </div>
                    </div>

                    <div className="profile-card">
                      <h3>Geospatial Data</h3>
                      <div className="data-row">
                        <Globe size={16} className="data-icon" />
                        <div>
                          <span className="label">Country</span>
                          <span className="value">{profile.country}</span>
                        </div>
                      </div>
                      <div className="data-row">
                        <MapPin size={16} className="data-icon" />
                        <div>
                          <span className="label">State / Region</span>
                          <span className="value">{profile.state}</span>
                        </div>
                      </div>
                      <div className="data-row">
                        <MapPin size={16} className="data-icon" />
                        <div>
                          <span className="label">City</span>
                          <span className="value">{profile.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`profile-card ${!isPartner ? 'full-width' : ''}`}>
                      <h3>Contact Details</h3>
                      <div className="data-row">
                        <Phone size={16} className="data-icon" />
                        <div>
                          <span className="label">Phone</span>
                          <span className="value">{profile.phoneCode} {profile.phone}</span>
                        </div>
                      </div>
                      <div className="data-row">
                        <Smartphone size={16} className="data-icon" />
                        <div>
                          <span className="label">WhatsApp</span>
                          <span className="value">{profile.whatsapp ? `${profile.whatsappCode} ${profile.whatsapp}` : 'Not Configured'}</span>
                        </div>
                      </div>
                    </div>

                    {isPartner && (
                      <div className="profile-card">
                        <h3>Business Details</h3>
                        <div className="data-row">
                          <Building2 size={16} className="data-icon" />
                          <div>
                            <span className="label">Company Name</span>
                            <span className="value">{profile.companyName || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="data-row">
                          <MapPin size={16} className="data-icon" />
                          <div>
                            <span className="label">Company Address</span>
                            <span className="value">{profile.companyAddress || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="data-row">
                          <Users size={16} className="data-icon" />
                          <div>
                            <span className="label">Team Size</span>
                            <span className="value">{profile.teamSize || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="data-row">
                          <Briefcase size={16} className="data-icon" />
                          <div>
                            <span className="label">Designation</span>
                            <span className="value">{profile.designation || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="data-row">
                          <KeyRound size={16} className="data-icon" />
                          <div>
                            <span className="label">Student Unique ID</span>
                            <span className="value">{profile.studentUniqueId || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="data-row">
                          <CheckSquare size={16} className="data-icon" />
                          <div>
                            <span className="label">Prior Experience</span>
                            <span className="value">{profile.priorExperience ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleUpdate} className="edit-form-grid">
                    <div className="profile-card full-width edit-card">
                      <div className="dash-input-group">
                        <label>Email Address</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="dash-input" />
                      </div>

                      <div className="dash-input-group">
                        <label>First Name</label>
                        <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required className="dash-input" />
                      </div>

                      <div className="dash-input-group">
                        <label>Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} className="dash-input" />
                      </div>

                      <div className="dash-input-group">
                        <label>Country</label>
                        <input type="text" name="country" value={formData.country || ''} onChange={handleChange} required className="dash-input" />
                      </div>

                      <div className="dash-input-group">
                        <label>State</label>
                        <input type="text" name="state" value={formData.state || ''} onChange={handleChange} required className="dash-input" />
                      </div>

                      <div className="dash-input-group">
                        <label>City</label>
                        <input type="text" name="city" value={formData.city || ''} onChange={handleChange} required className="dash-input" />
                      </div>

                      <div className="dash-input-group">
                        <label>Phone Number *</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value.slice(0, 10) })} required className="dash-input" />
                      </div>
                      <div className="dash-input-group">
                        <label>WhatsApp Number</label>
                        <input type="tel" name="whatsapp" value={formData.whatsapp || ''} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.slice(0, 10) })} className="dash-input" />
                      </div>

                      {isPartner && (
                        <>
                          <div className="dash-input-group">
                            <label>Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} required className="dash-input" />
                          </div>
                          <div className="dash-input-group">
                            <label>Company Address</label>
                            <input type="text" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} required className="dash-input" />
                          </div>
                          <div className="dash-input-group">
                            <label>Team Size</label>
                            <input type="text" name="teamSize" value={formData.teamSize || ''} onChange={handleChange} required className="dash-input" />
                          </div>
                          <div className="dash-input-group">
                            <label>Designation</label>
                            <input type="text" name="designation" value={formData.designation || ''} onChange={handleChange} required className="dash-input" />
                          </div>

                          <div className="input-group col-span-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px', gridColumn: '1 / -1' }}>
                            <input
                              type="checkbox"
                              name="priorExperience"
                              id="priorExperience"
                              checked={formData.priorExperience || false}
                              onChange={(e) => setFormData({ ...formData, priorExperience: e.target.checked })}
                              style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            <label htmlFor="priorExperience" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}> Prior experience in study abroad?</label>
                          </div>
                        </>
                      )}

                      <div className="edit-actions">
                        <button type="submit" className="btn-save"><Save size={16} /> Save Changes</button>
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}

            {activeTab === 'notifications' && (
              <div className="view-standard">
                <header className="dash-header">
                  <div>
                    <h1>Notifications</h1>
                    <p>System alerts and critical updates.</p>
                  </div>
                </header>
                <div className="widget placeholder-panel"><div className="empty-state">No new alerts at this moment.</div></div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
