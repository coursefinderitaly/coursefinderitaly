import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Building, MapPin, GraduationCap, FileText, User,
  CheckCircle, Phone, Filter, Mail, List, Calendar, Briefcase, Clock
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import ApplicationTracking from './ApplicationTracking';

const PartnerApplications = ({ profile, setMessage }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(''); // University search
  const [studentSearchTerm, setStudentSearchTerm] = useState(''); // Student search
  const [locationFilter, setLocationFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [counselorFilter, setCounselorFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/erp/students`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data);
      } else {
        if (setMessage) setMessage({ text: data.error || 'Failed to fetch students', type: 'error' });
      }
    } catch (err) {
      if (setMessage) setMessage({ text: 'Server error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Extract and Normalize Applications
  const allApplications = useMemo(() => {
    const apps = [];
    students.forEach(student => {
      const validApps = (student.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);
      validApps.forEach(app => {
        let counselorLabel = 'Direct';
        if (student.createdByCounselor) {
          counselorLabel = `${student.createdByCounselor.firstName} ${student.createdByCounselor.lastName || ''}`;
        } else if (student.assignedCounselor) {
          counselorLabel = `${student.assignedCounselor.firstName} ${student.assignedCounselor.lastName || ''}`;
        }

        apps.push({
          ...app,
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          studentEmail: student.email,
          studentPhone: student.phone,
          counselorName: counselorLabel,
          appliedDate: student.updatedAt || student.createdAt || null
        });
      });
    });
    return apps.sort((a, b) => {
      const dateA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
      const dateB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    });
  }, [students]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Unique values for filters
  const uniqueLocations = useMemo(() => [...new Set(allApplications.map(app => app.location).filter(Boolean))].sort(), [allApplications]);
  const uniqueLevels = useMemo(() => [...new Set(allApplications.map(app => app.level).filter(Boolean))].sort(), [allApplications]);
  const uniqueCounselors = useMemo(() => [...new Set(allApplications.map(app => app.counselorName).filter(Boolean))].sort(), [allApplications]);

  const filteredApplications = useMemo(() => {
    return allApplications.filter(app => {
      const matchesUni = !searchTerm || app.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStudent = !studentSearchTerm || app.studentName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) || app.studentEmail?.toLowerCase().includes(studentSearchTerm.toLowerCase());
      const matchesLoc = !locationFilter || app.location === locationFilter;
      const matchesLvl = !levelFilter || app.level === levelFilter;
      const matchesCounselor = !counselorFilter || app.counselorName === counselorFilter;

      return matchesUni && matchesStudent && matchesLoc && matchesLvl && matchesCounselor;
    });
  }, [allApplications, searchTerm, studentSearchTerm, locationFilter, levelFilter, counselorFilter]);

  const StatusBadge = ({ status = 'Under Process' }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      color: '#eab308',
      fontWeight: 600,
      background: 'rgba(234, 179, 8, 0.1)',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      border: '1px solid rgba(234, 179, 8, 0.2)'
    }}>
      <Clock size={12} /> {status}
    </span>
  );

  if (selectedApp) {
    const studentForApp = students.find(s => s._id === selectedApp.studentId);
    const studentApps = (studentForApp?.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);
    return (
      <ApplicationTracking
        student={studentForApp}
        applications={studentApps}
        initialSelectedAppId={selectedApp.id}
        onBack={() => setSelectedApp(null)}
        isPortalAdmin={true}
      />
    );
  }

  return (
    <div className="view-standard" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <header className="dash-header" style={{ marginBottom: '10px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <List className="text-accent" /> Applied Applications
          </h1>
          <p>Consolidated ledger of student university filings and counselor submissions.</p>
        </div>
      </header>

      {/* Notice Banner */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        padding: '12px 20px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#ef4444'
      }}>
        <Clock size={18} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          Notice: Submitted applications are currently Under Process. Please allow up to 48 hours for updates.
        </span>
      </div>

      {/* ENHANCED FILTER BAR */}
      <div className="widget" style={{ padding: '20px', marginBottom: '5px', background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>

          <div className="dash-input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={12} /> Search Student</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="theme-input"
                placeholder="Name or Email..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                style={{ paddingLeft: '35px' }}
              />
            </div>
          </div>

          <div className="dash-input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Building size={12} /> University</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="theme-input"
                placeholder="University Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '35px' }}
              />
            </div>
          </div>

          <div className="dash-input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={12} /> Region</label>
            <select className="theme-input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">All Regions</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          <div className="dash-input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><GraduationCap size={12} /> Level</label>
            <select className="theme-input" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="">All Levels</option>
              {uniqueLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </div>

          <div className="dash-input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Briefcase size={12} /> Submitted By</label>
            <select className="theme-input" value={counselorFilter} onChange={(e) => setCounselorFilter(e.target.value)}>
              <option value="">All Counselors</option>
              {uniqueCounselors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="widget" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loader" style={{ margin: '0 auto 20px auto' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Syncing application data...</p>
        </div>
      ) : allApplications.length === 0 ? (
        <div className="widget empty-state" style={{ padding: '60px', textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--glass-border)', marginBottom: '20px' }} />
          <h3>No Records Found</h3>
          <p>Your managed students haven't filed any applications yet.</p>
        </div>
      ) : (
        <div className="widget" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'transparent' }}>
          <div className="data-table-wrapper" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
            <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-tertiary)' }}>
                <tr>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>Student Details</th>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>University & Region</th>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>Applied Programs</th>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>Intake</th>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>Submission Info</th>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No applications match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedApp(app)}
                      style={{
                        transition: 'background 0.2s',
                        background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                        cursor: 'pointer'
                      }}
                      className="hover-row"
                    >
                      <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{app.studentName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {app.studentEmail}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {app.studentPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>{app.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {app.location || 'N/A'}</span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>{app.level || 'Degree'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {app.programs && app.programs.length > 0 ? (
                            app.programs.map((p, pIdx) => (
                              <span key={pIdx} style={{
                                fontSize: '0.75rem',
                                background: 'var(--bg-secondary)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-main)'
                              }}>
                                {p}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Course General</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                          {app.intake || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{app.counselorName}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {formatDate(app.appliedDate)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>
                        <StatusBadge />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '15px 20px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredApplications.length}</strong> of <strong>{allApplications.length}</strong> applications
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-filter" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => {
                setSearchTerm(''); setStudentSearchTerm(''); setLocationFilter(''); setLevelFilter(''); setCounselorFilter('');
              }}>Reset All Filters</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-row:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .text-accent {
          color: var(--accent-secondary);
        }
        .data-table-wrapper::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .data-table-wrapper::-webkit-scrollbar-track {
          background: transparent;
        }
        .data-table-wrapper::-webkit-scrollbar-thumb {
          background: var(--glass-border);
          border-radius: 10px;
        }
        .data-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default PartnerApplications;
