import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, MapPin, Globe, Phone, Smartphone, Edit2, Save, X,
  Home, Search, Users, Briefcase, FileText, Bell, MonitorPlay, Building2, CheckSquare, KeyRound,
  Sun, Moon, Monitor, Menu, UploadCloud, MessageSquare, ChevronRight
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
  if (!isSidebarOpen || window.innerWidth <= 768) return null;

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

  // Unread admin messages state (for student floating alert)
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [latestAdminMsg, setLatestAdminMsg] = useState(null);
  const [showMsgAlert, setShowMsgAlert] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Chat popup state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
      setIsSidebarLocked(false);
    }
  }, []);

  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Lifted Stats for dynamic re-fetching across child tabs
  const [stats, setStats] = useState({ totalStudents: 0, totalCounselors: 0, totalApplications: 0, pendingApps: 0 });

  // Poll for unread admin messages (student portal)
  const pollUnreadMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/erp/my-messages/unread`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.unread > 0 && data.unread !== unreadMsgCount) {
          setUnreadMsgCount(data.unread);
          setAlertDismissed(false);
          setShowMsgAlert(true);
          // Fetch latest message for preview
          try {
            const msgRes = await fetch(`${API_BASE_URL}/erp/my-messages`, { credentials: 'include' });
            if (msgRes.ok) {
              const msgs = await msgRes.json();
              const adminMsgs = msgs.filter(m => !m.read && m.sender === 'admin');
              if (adminMsgs.length > 0) setLatestAdminMsg(adminMsgs[adminMsgs.length - 1]);
            }
          } catch (e) {}
        } else {
          setUnreadMsgCount(data.unread);
          if (data.unread === 0) { setShowMsgAlert(false); setLatestAdminMsg(null); }
        }
      }
    } catch (err) {}
  };

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

  // Start polling for student unread messages once profile loads
  useEffect(() => {
    if (profile && profile.role === 'student') {
      pollUnreadMessages();
      const interval = setInterval(pollUnreadMessages, 20000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.role === 'admin') {
          navigate('/admin');
          return;
        }
        setProfile(data);
        setFormData(data);
      } else {
        const errData = await resp.json().catch(() => ({}));
        console.warn('Profile fetch rejected:', errData);
        handleLogout();
      }
    } catch (err) {
      console.error('Critical Profile Fetch Error:', err);
      setMessage({ text: 'API unreachable. Contacting server...', type: 'error' });
      // Wait bit before auto-logout on network error to avoid blink issues
      setTimeout(() => navigate('/'), 3000);
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
        onClick={() => { 
            setActiveTab(id); 
            setMessage({ text: '', type: '' }); 
            setEditMode(false); 
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
                setIsSidebarLocked(false);
            }
        }}
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
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div 
            className="sidebar-overlay"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
            onClick={() => { setIsSidebarOpen(false); setIsSidebarLocked(false); }}
          ></div>
        )}
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
              <div style={{ animation: 'fadeIn 0.3s ease', marginTop: '0.5rem', width: '100%', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {isPartner ? 'Partner Portal' : isCounselor ? 'Counselor Portal' : 'Student Portal'}
                </span>
              </div>
            )}
          </div>

          <nav className="sidebar-nav" style={{ paddingBottom: '80px' }}>
            <NavButton id="home" icon={Home} label="Dashboard" />

            {/* Student specific tabs */}
            {isStudent && (
              <>
                <NavButton id="course-finder" icon={Search} label="Course Finder" />
                <NavButton id="applications" icon={FileText} label=" Application" />
                <NavButton id="applied-universities" icon={CheckSquare} label="Applied Universities" />
                <NavButton id="learning" icon={MonitorPlay} label="Learning Resource" />
                {/* Notifications with unread badge */}
                <button
                  className={`nav-item ${activeTab === 'notifications' ? 'active' : ''} ${!isSidebarOpen ? 'icon-only' : ''}`}
                  onClick={() => {
                    setActiveTab('notifications');
                    setMessage({ text: '', type: '' });
                    setEditMode(false);
                    setShowMsgAlert(false);
                    setAlertDismissed(true);
                    if (window.innerWidth <= 768) { setIsSidebarOpen(false); setIsSidebarLocked(false); }
                  }}
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: !isSidebarOpen ? 'center' : 'flex-start', position: 'relative' }}
                  title={!isSidebarOpen ? 'Notifications' : ''}
                >
                  <Bell size={18} style={{ minWidth: '18px' }} />
                  <span className="nav-label" style={{ opacity: !isSidebarOpen ? 0 : 1, width: !isSidebarOpen ? 0 : 'auto', transition: 'opacity 0.2s', marginLeft: !isSidebarOpen ? '0' : '10px' }}>Notifications</span>
                  {unreadMsgCount > 0 && (
                    <span style={{ position: 'absolute', top: '8px', right: isSidebarOpen ? '12px' : '6px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, animation: 'pulse 2s infinite' }}>
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </button>
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

            <button className={`nav-item logout-btn ${!isSidebarOpen ? 'icon-only' : ''}`} onClick={handleLogout} style={{ justifyContent: !isSidebarOpen && window.innerWidth > 768 ? 'center' : 'flex-start' }} title={!isSidebarOpen ? 'Logout' : ''}>
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
                unreadMsgCount={unreadMsgCount}
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
            {activeTab === 'notifications' && <Notifications profile={profile} />}

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

          </div>
        </main>
      </div>

      {/* FLOATING CHAT FAB - only for students */}
      {isStudent && (
        <>
          {/* Chat Popup */}
          {isChatOpen && (
            <div className="fab-chat-popup" style={{
              position: 'fixed', bottom: '90px', right: '24px', zIndex: 99998,
              width: '340px',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              boxShadow: '0 24px 60px -8px rgba(0,0,0,0.5), 0 8px 30px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              animation: 'chatPopIn 0.35s cubic-bezier(0.16,1,0.3,1)'
            }}>
              <style>{`
                @keyframes chatPopIn {
                  from { transform: scale(0.85) translateY(20px); opacity: 0; }
                  to   { transform: scale(1) translateY(0);       opacity: 1; }
                }
                .chat-quick-btn {
                  background: var(--input-bg);
                  border: 1px solid var(--glass-border);
                  color: var(--text-muted);
                  padding: 6px 12px;
                  border-radius: 20px;
                  font-size: 0.74rem;
                  cursor: pointer;
                  transition: all 0.2s;
                  white-space: nowrap;
                  flex-shrink: 0;
                  font-family: inherit;
                }
                .chat-quick-btn:hover {
                  background: rgba(0,71,171,0.2);
                  border-color: rgba(0,71,171,0.5);
                  color: var(--text-main);
                }
                .chat-bubble-student {
                  background: linear-gradient(135deg, #0047AB, #00D2FF);
                  color: #fff;
                  border-radius: 14px 14px 4px 14px;
                  padding: 8px 12px;
                  font-size: 0.82rem;
                  max-width: 82%;
                  align-self: flex-end;
                  line-height: 1.5;
                  word-break: break-word;
                  box-shadow: 0 2px 8px rgba(0,71,171,0.3);
                }
                .chat-bubble-admin {
                  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
                  color: #fff;
                  border-radius: 14px 14px 14px 4px;
                  padding: 8px 12px;
                  font-size: 0.82rem;
                  max-width: 82%;
                  align-self: flex-start;
                  line-height: 1.5;
                  word-break: break-word;
                  box-shadow: 0 2px 8px rgba(109,40,217,0.3);
                }
                .chat-time-label {
                  font-size: 0.63rem;
                  color: var(--text-muted);
                  margin-top: 2px;
                }
                .fab-chat-input:focus {
                  border-color: #0047AB !important;
                  box-shadow: 0 0 0 3px rgba(0,71,171,0.15);
                  outline: none;
                }
              `}</style>

              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #0047AB, #0070d2)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageSquare size={16} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Chat with Admin</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)' }}>We'll reply as soon as possible</div>
                </div>
                <button
                  onClick={() => { setIsChatOpen(false); setActiveTab('notifications'); setShowMsgAlert(false); setAlertDismissed(true); }}
                  title="Open full chat"
                  style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', padding: '4px 9px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, fontFamily: 'inherit' }}
                >
                  <ChevronRight size={12} /> Expand
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Messages area */}
              <div id="fab-chat-msgs" className="fab-chat-section" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '240px', overflowY: 'auto', minHeight: '80px' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '20px 0', lineHeight: '1.7' }}>
                    <MessageSquare size={26} style={{ opacity: 0.15, display: 'block', margin: '0 auto 8px' }} />
                    No messages yet.<br />Send one below!
                  </div>
                ) : (
                  chatMessages.map((m, i) => {
                    const isMe = m.sender === 'student';
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          className={isMe ? 'chat-bubble-student' : 'chat-bubble-admin'}
                          dangerouslySetInnerHTML={{ __html: m.text }}
                        />
                        <div className="chat-time-label" style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                          {isMe ? 'You' : '🛡️ Admin'} · {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    );
                  })
                )}
                <div id="fab-chat-bottom" />
              </div>

              {/* Quick message chips — scrollable, no visible scrollbar */}
              <div className="fab-chat-section fab-chat-chips-wrap" style={{ borderTop: '1px solid var(--glass-border)', flexShrink: 0, position: 'relative' }}>
                <div className="fab-chat-chips" style={{ padding: '8px 14px', display: 'flex', gap: '6px', overflowX: 'auto' }}>
                  {['When is my consultation?', 'Need help with docs', 'Application update?', 'Please call me'].map(q => (
                    <button key={q} className="chat-quick-btn" onClick={() => setChatInput(q)}>{q}</button>
                  ))}
                </div>
                {/* Fade mask indicating more chips */}
                <div className="fab-chips-fade" />
              </div>

              {/* Input area */}
              <div className="fab-chat-section" style={{ display: 'flex', gap: '8px', padding: '8px 14px 12px', flexShrink: 0 }}>
                <input
                  className="fab-chat-input"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) {
                      e.preventDefault();
                      const text = chatInput.trim();
                      setChatInput('');
                      setChatSending(true);
                      try {
                        const res = await fetch(`${API_BASE_URL}/erp/my-messages`, {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json', 'x-csrf-protected': '1' },
                          body: JSON.stringify({ text })
                        });
                        if (res.ok) {
                          const updated = await fetch(`${API_BASE_URL}/erp/my-messages`, { credentials: 'include' });
                          if (updated.ok) setChatMessages(await updated.json());
                        }
                      } catch(err) {}
                      setChatSending(false);
                      setTimeout(() => document.getElementById('fab-chat-bottom')?.scrollIntoView({ behavior: 'smooth' }), 80);
                    }
                  }}
                  placeholder="Type a message… (Enter to send)"
                  style={{
                    flex: 1, background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                    color: 'var(--text-main)', padding: '9px 13px', borderRadius: '10px',
                    fontSize: '0.85rem', fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                />
                <button
                  disabled={!chatInput.trim() || chatSending}
                  onClick={async () => {
                    const text = chatInput.trim();
                    if (!text) return;
                    setChatInput('');
                    setChatSending(true);
                    try {
                      const res = await fetch(`${API_BASE_URL}/erp/my-messages`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', 'x-csrf-protected': '1' },
                        body: JSON.stringify({ text })
                      });
                      if (res.ok) {
                        const updated = await fetch(`${API_BASE_URL}/erp/my-messages`, { credentials: 'include' });
                        if (updated.ok) setChatMessages(await updated.json());
                      }
                    } catch(err) {}
                    setChatSending(false);
                    setTimeout(() => document.getElementById('fab-chat-bottom')?.scrollIntoView({ behavior: 'smooth' }), 80);
                  }}
                  style={{
                    background: chatInput.trim() && !chatSending ? 'linear-gradient(135deg, #0047AB, #00D2FF)' : 'var(--input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: chatInput.trim() && !chatSending ? '#fff' : 'var(--text-muted)',
                    width: '38px', height: '38px', borderRadius: '10px',
                    cursor: !chatInput.trim() || chatSending ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* FAB Button */}
          <button
            onClick={() => {
              const next = !isChatOpen;
              setIsChatOpen(next);
              if (next) {
                fetch(`${API_BASE_URL}/erp/my-messages`, { credentials: 'include' })
                  .then(r => r.ok ? r.json() : [])
                  .then(data => {
                    setChatMessages(data);
                    setTimeout(() => document.getElementById('fab-chat-bottom')?.scrollIntoView({ behavior: 'smooth' }), 150);
                  })
                  .catch(() => {});
              }
            }}
            title="Chat with Admin"
            style={{
              position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999,
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0047AB, #00D2FF)',
              border: 'none', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(0,71,171,0.5), 0 4px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
              transform: isChatOpen ? 'scale(0.92) rotate(15deg)' : 'scale(1)'
            }}
          >
            {isChatOpen ? <X size={22} /> : <MessageSquare size={22} />}
            {!isChatOpen && unreadMsgCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: '20px', height: '20px', background: '#ef4444',
                borderRadius: '50%', border: '2px solid var(--bg-primary)',
                fontSize: '0.6rem', fontWeight: 800, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 2s infinite'
              }}>{unreadMsgCount > 9 ? '9+' : unreadMsgCount}</span>
            )}
            {!isChatOpen && unreadMsgCount === 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px',
                width: '14px', height: '14px', background: '#22c55e',
                borderRadius: '50%', border: '2px solid var(--bg-primary)',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </button>
        </>
      )}

      {/* FLOATING ADMIN MESSAGE ALERT - bottom right corner */}
      {isStudent && showMsgAlert && !alertDismissed && latestAdminMsg && activeTab !== 'notifications' && (
        <div style={{
          position: 'fixed', bottom: '94px', right: '24px', zIndex: 99999,
          width: '320px', background: 'var(--card-bg-solid)',
          border: '1px solid rgba(139,92,246,0.4)',
          borderRadius: '16px', boxShadow: '0 20px 60px -10px rgba(139,92,246,0.4), 0 8px 30px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(120%); opacity: 0; }
              to   { transform: translateX(0);   opacity: 1; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes pingDot {
              75%, 100% { transform: scale(2); opacity: 0; }
            }
          `}</style>

          {/* Purple accent bar */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #8b5cf6, #6d28d9, #4f46e5)' }} />

          {/* Alert header */}
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} color="#fff" />
              </div>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--card-bg-solid)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>🛡️ Message from Admin</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {unreadMsgCount} new message{unreadMsgCount !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={() => { setShowMsgAlert(false); setAlertDismissed(true); }}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Message preview */}
          <div style={{ margin: '0 16px 14px', padding: '10px 12px', background: 'rgba(139,92,246,0.08)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.15)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              &ldquo;{latestAdminMsg.text}&rdquo;
            </p>
          </div>

          {/* Action button */}
          <div style={{ padding: '0 16px 16px' }}>
            <button
              onClick={() => {
                setActiveTab('notifications');
                setShowMsgAlert(false);
                setAlertDismissed(true);
              }}
              style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              View Messages <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
