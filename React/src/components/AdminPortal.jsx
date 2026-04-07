import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Trash2, LogOut, ShieldAlert, Edit2, ChevronLeft, Save, Plus,
  MapPin, Phone, Briefcase, GraduationCap, Building2, UserCircle, KeyRound,
  Database, Server, ShieldCheck, Mail, Sun, Moon, Monitor, Globe, FileText
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useTheme } from '../ThemeContext';
import ManageCounselors from './ManageCounselors';
import StudentDetails from './StudentDetails';

import SystemHierarchy from './SystemHierarchy';
import PartnerDirectoryBrowser from './PartnerDirectoryBrowser';
import SearchableSelect from './SearchableSelect';

const AdminPortal = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, partners, all
  const [message, setMessage] = useState({ text: '', type: '' });

  // Editor State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [counselorPopupPartner, setCounselorPopupPartner] = useState(null);
  const [partnerStudentsPopup, setPartnerStudentsPopup] = useState(null);
  const [showCreationTypePopup, setShowCreationTypePopup] = useState(false);
  const [selectedCounselorForPopup, setSelectedCounselorForPopup] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, targetId: null });
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);

  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include', });
      const meData = await meRes.json();
      if (!meRes.ok || meData.role !== 'admin') {
        return navigate('/dashboard');
      }
      fetchUsers();
    } catch (err) {
      navigate('/');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
      credentials: 'include', });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      setMessage({ text: 'Database synchronization failed', type: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setMessage({ text: '', type: '' });
    setSelectedUser(user);
    setFormData(user);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setMessage({ text: '', type: '' });
    setSelectedUser(null);
    setIsAdding(true);
    setFormData({ role: 'student', phone: '+91 ', whatsapp: '+91 ' }); // safe defaults
  };

  const cancelEdit = () => {
    setSelectedUser(null);
    setIsAdding(false);
    setFormData({});
    setMessage({ text: '', type: '' });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirmDialog({ isOpen: true, action: 'save', targetId: null });
  };

  const executeSave = async () => {
    setConfirmDialog({ isOpen: false, action: null, targetId: null });
    setMessage({ text: 'Committing to database...', type: 'info' });
    try {
      // Determine if POST (Add) or PUT (Edit)
      const isNew = isAdding;
      const url = isNew ? `${API_BASE_URL}/admin/users` : `${API_BASE_URL}/admin/users/${selectedUser._id}`;
      const method = isNew ? 'POST' : 'PUT';

      // Validation
      if (!formData.email || !formData.firstName) {
        return setMessage({ text: 'First Name and Email are strictly required fields.', type: 'error' });
      }

      const res = await fetch(url, {
      credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: isNew ? 'Account successfully securely provisioned.' : 'Database record successfully updated.', type: 'success' });
        if (isNew) {
          setUsers([data.user, ...users]);
        } else {
          setUsers(users.map(u => u._id === data.user._id ? data.user : u));
        }
        setTimeout(() => cancelEdit(), 1500);
      } else {
        setMessage({ text: data.error || 'Failed to modify database', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Sever Connection Error', type: 'error' });
    }
  };

  const handleDeleteUser = (id, isSelf) => {
    if (isSelf) return alert("System prevents obliterating your own active session account.");
    setConfirmDialog({ isOpen: true, action: 'delete', targetId: id });
  };

  const executeDelete = async () => {
    const id = confirmDialog.targetId;
    setConfirmDialog({ isOpen: false, action: null, targetId: null });
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      credentials: 'include',
        method: 'DELETE',
        });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
        setMessage({ text: 'Entity permanently erased from database.', type: 'success' });
        if (selectedUser && selectedUser._id === id) cancelEdit();
      } else {
        setMessage({ text: 'Failed to erase entity', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error during deletion', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(()=>{});
    navigate('/');
  };

  const filteredUsers = useMemo(() => {
    const nonAdmins = users.filter(u => u.role !== 'admin');
    if (activeTab === 'all' || activeTab === 'overview' || activeTab === 'applications') return nonAdmins;
    if (activeTab === 'direct_students') return nonAdmins.filter(u => u.role === 'student' && !u.registeredBy);
    if (activeTab === 'partner_students') return nonAdmins.filter(u => u.role === 'student' && !!u.registeredBy);
    if (activeTab === 'partners') return nonAdmins.filter(u => u.role === 'partner');
    return nonAdmins;
  }, [users, activeTab]);

  const allApplications = useMemo(() => {
    const apps = [];
    users.filter(u => u.role === 'student').forEach(student => {
      const validApps = (student.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);
      validApps.forEach(app => {
        
        const partnerId = student.registeredBy;
        const partner = partnerId ? users.find(p => p.role === 'partner' && (p._id === partnerId || p.studentUniqueId === partnerId)) : null;
        const partnerName = partner ? (partner.companyName || `${partner.firstName} ${partner.lastName || ''}`.trim()) : partnerId;
        const counselorId = typeof student.createdByCounselor === 'string' ? student.createdByCounselor : (student.createdByCounselor?._id || null);
        const counselor = counselorId ? users.find(c => c._id === counselorId) : null;
        const counselorName = counselor ? `${counselor.firstName} ${counselor.lastName || ''}`.trim() : 'Counselor';

        let sourceLabel = 'Direct Student';
        if (partnerId && counselorId) {
          sourceLabel = `Partner: ${partnerName} > Counselor: ${counselorName}`;
        } else if (partnerId) {
          sourceLabel = `Partner: ${partnerName}`;
        } else if (counselorId) {
          sourceLabel = `In-house Counselor: ${counselorName}`;
        }
        
        apps.push({
          ...app,
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          studentEmail: student.email,
          studentPhone: student.phone,
          source: sourceLabel
        });
      });
    });
    return apps.reverse(); // Put newest at the top
  }, [users]);

  const stats = {
    total: users.filter(u => u.role !== 'admin' && u.role !== 'counselor').length,
    directStudents: users.filter(u => u.role === 'student' && !u.registeredBy).length,
    partnerStudents: users.filter(u => u.role === 'student' && !!u.registeredBy).length,
    partners: users.filter(u => u.role === 'partner').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (loading) return (
    <div className="dash-universe loading" style={{ background: 'var(--bg-primary)' }}>
      <div className="loader" style={{ borderTopColor: 'var(--accent-secondary)' }}></div>
      <p style={{ color: 'var(--text-main)', letterSpacing: '2px', textTransform: 'uppercase' }}>Authenticating God Mode...</p>
    </div>
  );

  return (
    <div className="dash-universe" style={{ display: 'flex', background: 'var(--bg-primary)', color: 'var(--text-main)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* SIDEBAR PANEL */}
      <aside className="dash-sidebar" style={{ width: '280px', padding: '1.5rem 1rem', background: 'var(--bg-secondary)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <img src="/logo.png" alt="Company Logo" style={{ maxHeight: '42px', maxWidth: '100px', objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap' }}>SysAdmin</h2>
              <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px', whiteSpace: 'nowrap' }}>ROOT ACCESS</div>
            </div>
          </div>
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
            <LogOut size={18} /> Secure Disconnect
          </button>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1 }}>
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); cancelEdit(); }}>
            <Database size={18} /> Global Overview
          </button>
          <div className="nav-divider" style={{ background: 'var(--glass-border)', margin: '15px 0' }}></div>
          <button className={`nav-item ${activeTab === 'direct_students' ? 'active' : ''}`} onClick={() => { setActiveTab('direct_students'); cancelEdit(); }}>
            <GraduationCap size={18} /> Direct Students
          </button>
          <button className={`nav-item ${activeTab === 'partner_students' ? 'active' : ''}`} onClick={() => { setActiveTab('partner_students'); cancelEdit(); }}>
            <Users size={18} /> Partner Students
          </button>
          <button className={`nav-item ${activeTab === 'partners' ? 'active' : ''}`} onClick={() => { setActiveTab('partners'); cancelEdit(); }}>
            <Briefcase size={18} /> Business Partners
          </button>
          <div className="nav-divider" style={{ background: 'var(--glass-border)', margin: '15px 0' }}></div>
          <button className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => { setActiveTab('applications'); cancelEdit(); }}>
            <FileText size={18} /> Applied Applications
          </button>
        </nav>

      </aside>

      {/* MAIN CONTENT PANEL */}
      <main className="dash-main" style={{ padding: '1.5rem 2rem', flex: 1, overflowY: activeTab === 'overview' ? 'hidden' : 'auto' }}>

        {viewingStudentProfile ? (
          <div className="animate-fade-in" style={{ background: 'var(--card-bg-solid)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)' }}>
             <StudentDetails 
               student={viewingStudentProfile}
               goBack={() => setViewingStudentProfile(null)}
               isPartnerView={true}
               refreshProfile={fetchUsers}
             />
          </div>
        ) : (
          <>
        {message.text && (
          <div className="status-pill" style={{
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: message.type === 'error' ? '#ef4444' : '#10b981',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            {message.type === 'error' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
            {message.text}
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: LEDGER TABLE */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding && activeTab !== 'applications') && (
          <div className="animate-fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {activeTab === 'overview' ? 'System Overview' : activeTab === 'all' ? 'Master Ledger' : activeTab === 'direct_students' ? 'Direct Student Database' : activeTab === 'partner_students' ? 'Partner-Registered Students' : 'Partner Database'}
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Directly manage and manipulate raw data records.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Theme Toggle Group */}
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <button onClick={() => setTheme('light')} style={{ background: theme === 'light' ? 'var(--accent-primary)' : 'transparent', color: theme === 'light' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Light Mode"><Sun size={14} /></button>
                  <button onClick={() => setTheme('dark')} style={{ background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent', color: theme === 'dark' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Dark Mode"><Moon size={14} /></button>
                  <button onClick={() => setTheme('system')} style={{ background: theme === 'system' ? 'var(--accent-primary)' : 'transparent', color: theme === 'system' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="System Sync"><Monitor size={14} /></button>
                </div>

                <button className="btn-save" onClick={() => setShowCreationTypePopup(true)} style={{ background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', color: '#fff' }}>
                  <Plus size={18} /> Create Account
                </button>
              </div>
            </header>

            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#60a5fa', fontSize: '2.5rem', fontWeight: 800 }}>{stats.total}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Total Records</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#34d399', fontSize: '2.5rem', fontWeight: 800 }}>{stats.directStudents}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Direct Students</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '2.5rem', fontWeight: 800 }}>{stats.partnerStudents}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Partner Students</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#c084fc', fontSize: '2.5rem', fontWeight: 800 }}>{stats.partners}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Partners</div>
                </div>
              </div>
            )}

            {activeTab !== 'overview' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Users size={18} color="#10b981" />
                  Showing <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{activeTab === 'partner_students' ? users.filter(u => u.role === 'partner').length : filteredUsers.length}</span> {activeTab === 'partner_students' ? 'Partner Clusters' : 'Active Database Records'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Real-time Synchronized</div>
              </div>
            )}

            {activeTab === 'partner_students' ? (
              <PartnerDirectoryBrowser users={users} onStudentClick={(u) => setViewingStudentProfile(u)} />
            ) : activeTab === 'overview' ? (
              <SystemHierarchy users={users} onStudentClick={(u) => setViewingStudentProfile(u)} />
            ) : (
            <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Entity Name</th>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Identifiers</th>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Access Level</th>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3f3f46, #27272a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                            {u.firstName ? u.firstName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div 
                              onClick={() => u.role === 'partner' && setPartnerStudentsPopup(u)}
                              style={{ color: u.role === 'partner' ? 'var(--accent-secondary)' : 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem', cursor: u.role === 'partner' ? 'pointer' : 'default' }}
                            >
                              {u.firstName} {u.lastName}
                            </div>
                            {u.role === 'partner' && (
                              <div 
                                onClick={() => setPartnerStudentsPopup(u)}
                                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'color 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                              >
                                <Building2 size={10} /> {u.companyName || 'No Company'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.phone || 'No Phone Data'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{
                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                            background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : u.role === 'partner' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                            color: u.role === 'admin' ? '#ef4444' : u.role === 'partner' ? '#a78bfa' : '#34d399',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.3)' : u.role === 'partner' ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.3)'}`
                          }}>
                            {u.role}
                          </span>
                          
                          {u.role === 'student' && (
                            <div style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 600, 
                              color: u.registeredBy ? (theme === 'light' ? '#b45309' : '#fbbf24') : (u.createdByCounselor ? (theme === 'light' ? '#1d4ed8' : '#60a5fa') : (theme === 'light' ? '#4b5563' : '#9ca3af')),
                              background: u.registeredBy ? 'rgba(251,191,36,0.1)' : (u.createdByCounselor ? 'rgba(96,165,250,0.1)' : 'rgba(156,163,175,0.1)'),
                              border: `1px solid ${u.registeredBy ? 'rgba(251,191,36,0.3)' : (u.createdByCounselor ? 'rgba(96,165,250,0.3)' : 'rgba(156,163,175,0.3)')}`,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex'
                            }}>
                              {(() => {
                                const partnerId = u.registeredBy;
                                const partner = partnerId ? users.find(p => p.role === 'partner' && (p._id === partnerId || p.studentUniqueId === partnerId)) : null;
                                const partnerName = partner ? (partner.companyName || `${partner.firstName} ${partner.lastName || ''}`.trim()) : partnerId;
                                
                                const counselorId = typeof u.createdByCounselor === 'string' ? u.createdByCounselor : (u.createdByCounselor?._id || null);
                                const counselor = counselorId ? users.find(c => c._id === counselorId) : null;
                                const counselorName = counselor ? `${counselor.firstName} ${counselor.lastName || ''}`.trim() : 'Counselor';

                                if (partnerId && counselorId) {
                                  return `Partner: ${partnerName} > Counselor: ${counselorName}`;
                                } else if (partnerId) {
                                  return `Partner: ${partnerName}`;
                                } else if (counselorId) {
                                  return `In-house Counselor: ${counselorName}`;
                                } else {
                                  return `Direct Student`;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleEdit(u)} style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                            <Edit2 size={14} /> Modify
                          </button>
                          <button onClick={() => handleDeleteUser(u._id, u.role === 'admin')} disabled={u.role === 'admin'} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: u.role === 'admin' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, opacity: u.role === 'admin' ? 0.3 : 1 }}>
                            <Trash2 size={14} /> Obliterate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '50px 30px', textAlign: 'center', color: '#a1a1aa' }}>
                      <Database size={40} style={{ margin: '0 auto 15px auto', opacity: 0.2 }} />
                      <div>No entities match this criteria.</div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: APPLICATIONS LEDGER */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding && activeTab === 'applications') && (
           <div className="animate-fade-in">
             <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  Global Applications Ledger
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>View all finalized university applications submitted system-wide.</p>
              </div>
            </header>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                <FileText size={18} color="#10b981" />
                Showing <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{allApplications.length}</span> Finalized Applications
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {allApplications.length === 0 ? (
                <div className="empty-state" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>No applications submitted yet.</div>
              ) : (
                allApplications.map((app, idx) => (
                  <div key={idx} className="widget hover:border-[var(--accent-secondary)]" style={{ padding: '20px', border: '1px solid var(--glass-border)', background: 'var(--card-bg-solid)', borderRadius: '12px', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ flex: '1 1 auto' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Building2 size={20} className="text-muted" /> {app.name}
                        </h4>
                        <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {app.location && app.location !== 'null' ? app.location : 'Location Not Specified'}</span>
                          {app.level && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>{app.level === 'null' ? 'Degree' : app.level}</span>}
                        </div>

                        <div style={{ marginTop: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                              <UserCircle size={16} className="text-muted" /> {app.studentName}
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              <Phone size={14} className="text-muted" /> {app.studentPhone || 'No Phone Data'}
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '10px' }}>
                              Source: <span style={{ color: 'var(--text-main)', fontWeight: 500, background: 'var(--glass-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-secondary)' }}>{app.source}</span>
                           </div>
                        </div>
                      </div>
                      <div>
                        {app.programs && app.programs.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', marginTop: '5px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Applied Programs</div>
                            {app.programs.map((prog, pIdx) => (
                              <span key={pIdx} style={{ background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                {prog}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
           </div>
        )}


        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: DATA EDITOR / CREATOR */}
        {/* -------------------------------------------------------------------------------- */}
        {(selectedUser || isAdding) && (
          <div className="animate-fade-in">

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <button onClick={cancelEdit} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '15px', fontWeight: 600 }}>
                  <ChevronLeft size={16} /> Return to Ledger
                </button>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {isAdding ? "Create Master Entity" : "Entity Configuration"}
                  {!isAdding && <span style={{ fontSize: '0.85rem', background: 'var(--input-bg)', padding: '4px 12px', borderRadius: '12px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', fontWeight: 'normal' }}>ID: {selectedUser._id}</span>}
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Absolute control over database structure vectors.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {!isAdding && (
                  <button onClick={() => handleDeleteUser(selectedUser._id, selectedUser.role === 'admin')} disabled={selectedUser.role === 'admin'} style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: selectedUser.role === 'admin' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: selectedUser.role === 'admin' ? 0.3 : 1 }}>
                    <Trash2 size={16} /> Destroy
                  </button>
                )}
                <button onClick={handleSave} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -10px rgba(16, 185, 129, 0.5)' }}>
                  <Save size={16} /> Commit Changes
                </button>
              </div>
            </header>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

              {/* SECTION: ACCESS CONTROL */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Server size={18} color="#a78bfa" /> System & Access Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clearance Level (Role) *</label>
                    <SearchableSelect 
                      name="role" 
                      value={formData.role || ''} 
                      onChange={handleChange} 
                      required 
                      options={[
                        { value: 'student', label: 'Student (Standard)' },
                        { value: 'counselor', label: 'Counselor (Sub-Agent)' },
                        { value: 'partner', label: 'Business Partner' }
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isAdding ? "Initial Master Password" : "Reset Access Password"}</label>
                    <input type="text" name="password" value={formData.password || ''} onChange={handleChange} placeholder={isAdding ? "Auto-generated if left blank" : "Leave blank to keep current"} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* SECTION: PERSONAL IDENTITY */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><UserCircle size={18} color="#60a5fa" /> Personal Identity Vector</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary Email *</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required style={{ background: 'var(--input-bg)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>First Name / Given Name *</label>
                    <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last Name / Surname</label>
                    <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* SECTION: CONNECTIVITY & LOCATION */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Globe size={18} color="#34d399" /> Geolocation & Connectivity Nodes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Signature</label>
                    <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp Signature</label>
                    <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sovereign Country</label>
                    <input type="text" name="country" value={formData.country || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>State / Province</label>
                    <input type="text" name="state" value={formData.state || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>City</label>
                    <input type="text" name="city" value={formData.city || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* SECTION: STUDENT OWNERSHIP & ASSIGNMENT */}
              {formData.role === 'student' && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Building2 size={18} color="#fbbf24" /> Master Ownership & Assignment</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Registered By (Partner)</label>
                      <SearchableSelect 
                        name="registeredBy" 
                        value={formData.registeredBy || ''} 
                        onChange={handleChange}
                        placeholder="-- Direct Student (No Partner) --"
                        options={[
                          { value: '', label: '-- Direct Student (No Partner) --' },
                          ...users.filter(u => u.role === 'partner').map(p => ({ value: p._id, label: p.companyName || `${p.firstName} ${p.lastName || ''}`.trim() }))
                        ]}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Counselor</label>
                      <SearchableSelect 
                        name="assignedCounselor" 
                        value={formData.assignedCounselor || ''} 
                        onChange={handleChange}
                        placeholder="-- No Counselor --"
                        options={[
                          { value: '', label: '-- No Counselor --' },
                          ...users.filter(u => u.role === 'counselor' && (!formData.registeredBy || u.parentPartner === formData.registeredBy)).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName || ''}`.trim() }))
                        ]}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Root Creator (Counselor)</label>
                      <SearchableSelect 
                        name="createdByCounselor" 
                        value={formData.createdByCounselor || ''} 
                        onChange={handleChange}
                        placeholder="-- Direct Registration --"
                        options={[
                          { value: '', label: '-- Direct Registration --' },
                          ...users.filter(u => u.role === 'counselor' && (!formData.registeredBy || u.parentPartner === formData.registeredBy)).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName || ''}`.trim() }))
                        ]}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: COUNSELOR ONLY (DYNAMIC) */}
              {formData.role === 'counselor' && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '16px', padding: '20px', boxShadow: '0 0 30px rgba(236, 72, 153, 0.05)', marginTop: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ec4899', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Briefcase size={18} /> Sub-Agent Affiliation</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Parent Partner Agency *</label>
                    <SearchableSelect 
                      name="parentPartner" 
                      value={formData.parentPartner || ''} 
                      onChange={handleChange}
                      required
                      placeholder="-- Select Parent Partner --"
                      options={[
                        { value: '', label: '-- Select Parent Partner --' },
                        ...users.filter(u => u.role === 'partner').map(p => ({ value: p._id, label: p.companyName || `${p.firstName} ${p.lastName || ''}`.trim() }))
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* SECTION: PARTNER ONLY (DYNAMIC) */}
              {formData.role === 'partner' && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '16px', padding: '20px', boxShadow: '0 0 30px rgba(124, 58, 237, 0.05)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Briefcase size={18} color="#a78bfa" /> Business B2B Configuration</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Company Entity Name</label>
                      <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Company Headquarters Address</label>
                      <input type="text" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizational Designation</label>
                      <input type="text" name="designation" value={formData.designation || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reported Team Size</label>
                      <input type="text" name="teamSize" value={formData.teamSize || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', gridColumn: '1 / -1', marginTop: '10px' }}>
                      <input type="checkbox" name="priorExperience" checked={formData.priorExperience || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }} />
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>Has Prior Overseas Experience</label>
                    </div>
                  </div>
                </div>
              )}

            </form>
            
            {/* INJECTED COUNSELOR MANAGEMENT DIRECTORY FOR PARTNERS */}
            {!isAdding && formData.role === 'partner' && selectedUser && (
              <div style={{ marginTop: '30px', background: 'var(--card-bg-solid)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', padding: '20px', boxShadow: '0 0 30px rgba(59, 130, 246, 0.05)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6', margin: '0 0 20px 0', fontSize: '1.1rem' }}>
                  <Users size={18} /> Affiliated Counselors Directory
                </h3>
                <ManageCounselors setMessage={setMessage} targetPartnerId={selectedUser._id} />
              </div>
            )}

          </div>
        )}
        </>)}
      </main>

      {/* PARTNER STUDENTS POPUP */}
      {partnerStudentsPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-primary)', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg-solid)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color="#10b981" /> Students Registered By {partnerStudentsPopup.companyName || `${partnerStudentsPopup.firstName} ${partnerStudentsPopup.lastName}`}</h2>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage student metadata originating from this partner cluster.</p>
              </div>
              <button 
                onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); }} 
                style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
              >
                <div style={{ fontWeight: 'bold' }}>X</div>
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {(() => {
                const allPartnerStudents = users.filter(u => u.role === 'student' && (u.registeredBy === partnerStudentsPopup._id || u.registeredBy === partnerStudentsPopup.studentUniqueId));
                
                const groupedStudents = {};
                const partnerCounselors = users.filter(u => u.role === 'counselor' && u.parentPartner === partnerStudentsPopup._id);
                partnerCounselors.forEach(c => { groupedStudents[c._id] = []; });
                groupedStudents['direct'] = [];

                allPartnerStudents.forEach(student => {
                  const counselorId = typeof student.createdByCounselor === 'string' ? student.createdByCounselor : (student.createdByCounselor?._id || 'direct');
                  if (!groupedStudents[counselorId]) groupedStudents[counselorId] = [];
                  groupedStudents[counselorId].push(student);
                });

                if (selectedCounselorForPopup) {
                   const cId = selectedCounselorForPopup.cId;
                   const isDirect = cId === 'direct';
                   const groupName = isDirect ? 'Directly Registered by Partner' : `${selectedCounselorForPopup.firstName} ${selectedCounselorForPopup.lastName || ''}`.trim();
                   const groupStudents = groupedStudents[cId] || [];

                   return (
                      <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
                          <button onClick={() => setSelectedCounselorForPopup(null)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: 0 }}>
                             <ChevronLeft size={16} /> Directory Matrix
                          </button>
                          <button onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); setFormData({ role: 'student', password: '', registeredBy: partnerStudentsPopup._id, createdByCounselor: isDirect ? '' : cId }); setIsAdding(true); }} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                             <Plus size={16} /> Register Local Student
                          </button>
                        </div>
                        <h3 style={{ color: isDirect ? 'var(--text-main)' : 'var(--accent-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                          {isDirect ? <Building2 size={20} /> : <Briefcase size={20} />} {groupName} 
                          <span style={{ fontSize: '0.75rem', background: isDirect ? 'rgba(255,255,255,0.1)' : 'rgba(124, 58, 237, 0.1)', color: isDirect ? 'var(--text-muted)' : '#a78bfa', padding: '4px 10px', borderRadius: '12px', marginLeft: 'auto' }}>
                            {groupStudents.length} Assigned Students
                          </span>
                        </h3>
                        <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                              <tr>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Entity Name</th>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Identifiers</th>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Access Level</th>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupStudents.length === 0 ? (
                                <tr>
                                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Users size={30} style={{ opacity: 0.3, marginBottom: '10px' }} />
                                    <div>No students currently assigned to this directory.</div>
                                  </td>
                                </tr>
                              ) : groupStudents.map(u => (
                                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3f3f46, #27272a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                                        {u.firstName ? u.firstName.charAt(0).toUpperCase() : '?'}
                                      </div>
                                      <div 
                                        onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); setViewingStudentProfile(u); }}
                                        style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'underline', textDecorationColor: 'rgba(59, 130, 246, 0.3)', textUnderlineOffset: '4px' }}
                                        onMouseOver={(e) => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.textDecorationColor = '#60a5fa'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.textDecorationColor = 'rgba(59, 130, 246, 0.3)'; }}
                                        title="Open Complete Student Profile"
                                      >
                                        {u.firstName} {u.lastName}
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.phone || 'No Phone Data'}</div>
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>student</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <button onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); handleEdit(u); }} style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                                        <Edit2 size={14} /> Modify
                                      </button>
                                      <button onClick={() => handleDeleteUser(u._id, false)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <Trash2 size={14} /> Obliterate
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                   );
                }

                // Render Level 1 - Grid of Counselors
                const counselorIds = Object.keys(groupedStudents);

                return (
                  <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {counselorIds.map(cId => {
                      const isDirect = cId === 'direct';
                      const counselorObj = isDirect ? null : users.find(u => u._id === cId);
                      if (!isDirect && !counselorObj) return null;

                      const groupName = isDirect ? 'Direct Registration' : `${counselorObj.firstName} ${counselorObj.lastName || ''}`.trim();
                      const groupStudents = groupedStudents[cId] || [];

                      return (
                         <div 
                           key={cId} 
                           onClick={() => setSelectedCounselorForPopup(isDirect ? { cId: 'direct' } : { ...counselorObj, cId: counselorObj._id })} 
                           className="partner-card-hover" 
                           style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} 
                           onMouseOver={(e) => { e.currentTarget.style.borderColor = isDirect ? 'rgba(16, 185, 129, 0.5)' : 'rgba(236, 72, 153, 0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} 
                           onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                         >
                           <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                             {isDirect ? <Building2 size={20} color="#10b981" /> : <Briefcase size={20} color="#ec4899" />} 
                             {isDirect ? 'Partner Direct Network' : groupName}
                           </h3>
                           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 15px 30px' }}>
                             {isDirect ? 'Managed directly by Partner' : 'Sub-Agent / Counselor Database'}
                           </p>
                           <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: isDirect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 72, 153, 0.1)', color: isDirect ? '#10b981' : '#ec4899', margin: '0 0 0 30px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                              <Users size={16} /> {groupStudents.length} Assigned Students
                           </div>
                         </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL OVERLAY */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'var(--card-bg-solid)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
              {confirmDialog.action === 'delete' ? <Trash2 color="#ef4444" /> : <Save color="#10b981" />}
              {confirmDialog.action === 'delete' ? 'Confirm Deletion' : 'Confirm Changes'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {confirmDialog.action === 'delete'
                ? "This will permanently obliterate the user and all associated application data. This destructive action cannot be undone. Proceed?"
                : "Are you sure you want to permanently commit these modifications to the global database?"}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDialog({ isOpen: false, action: null, targetId: null })} style={{ padding: '10px 20px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmDialog.action === 'delete' ? executeDelete : executeSave} style={{ padding: '10px 20px', background: confirmDialog.action === 'delete' ? '#ef4444' : '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                {confirmDialog.action === 'delete' ? 'Obliterate Entity' : 'Commit Database Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATION TYPE SELECTION POPUP */}
      {showCreationTypePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
           <div style={{ background: 'var(--card-bg-solid)', padding: '30px', borderRadius: '24px', border: '1px solid var(--glass-border)', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative' }}>
            <button 
              onClick={() => setShowCreationTypePopup(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--input-bg)', border: 'none', color: 'var(--text-muted)', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ fontWeight: 'bold' }}>X</div>
            </button>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 10px 0', fontSize: '1.4rem' }}>Initialize New Entity</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px' }}>Select the specific database schema architecture you wish to deploy.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => { setFormData({ role: 'student', password: '' }); setIsAdding(true); setShowCreationTypePopup(false); }}
                style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#34d399'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              >
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '10px', display: 'flex' }}><GraduationCap size={20} /></div>
                Student Registration
              </button>
              
              <button 
                onClick={() => { setFormData({ role: 'counselor', password: '' }); setIsAdding(true); setShowCreationTypePopup(false); }}
                style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.color = '#f472b6'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              >
                <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '10px', borderRadius: '10px', display: 'flex' }}><Briefcase size={20} /></div>
                Counselor (Sub-Agent)
              </button>

              <button 
                onClick={() => { setFormData({ role: 'partner', password: '', priorExperience: false }); setIsAdding(true); setShowCreationTypePopup(false); }}
                style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.color = '#c4b5fd'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              >
                <div style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '10px', borderRadius: '10px', display: 'flex' }}><Building2 size={20} /></div>
                Business Partner
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
