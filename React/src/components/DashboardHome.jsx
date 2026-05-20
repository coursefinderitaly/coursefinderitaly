import React, { useState, useEffect } from 'react';
import { Activity, Clock, FileText, Users, AlertTriangle } from 'lucide-react';

const IMPORTANT_NOTIFICATIONS = [
  {
    icon: '🔐',
    title: 'Account Security',
    message: 'Your portal account is protected. Never share your login credentials with anyone, including support staff.',
  },
  {
    icon: '📋',
    title: 'Application Processing Times',
    message: 'All submitted applications are currently being processed. Allow up to 48 business hours for status updates.',
  },
  {
    icon: '📄',
    title: 'Document Submission',
    message: 'Ensure all uploaded documents are clear, valid, and not expired. Incomplete submissions may cause delays.',
  },
  {
    icon: '🌐',
    title: 'University Intake Deadlines',
    message: 'September 2026 intake deadlines are approaching. Please finalise course selections and documents promptly.',
  },
];

const ImportantNotifications = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % IMPORTANT_NOTIFICATIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const note = IMPORTANT_NOTIFICATIONS[activeIndex];

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes noteFade {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .imp-notif-wrap {
          position: relative;
          padding: 3px;
          border-radius: 16px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
          background-size: 300% 300%;
          animation: gradientShift 5s ease infinite;
        }
        .imp-notif-inner {
          background: var(--bg-secondary);
          border-radius: 13px;
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-sizing: border-box;
        }
      `}</style>
      <div className="imp-notif-wrap">
        <div className="imp-notif-inner">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <h3 style={{ margin: 0, border: 'none', padding: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Important Notices
            </h3>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {activeIndex + 1} / {IMPORTANT_NOTIFICATIONS.length}
            </span>
          </div>

          {/* Notification body */}
          <div key={activeIndex} style={{ animation: 'noteFade 0.45s ease forwards', flex: 1 }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{note.icon}</div>
            <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {note.title}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
              {note.message}
            </p>
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '6px', paddingTop: '4px' }}>
            {IMPORTANT_NOTIFICATIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: idx === activeIndex ? '22px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: idx === activeIndex ? '#8b5cf6' : 'var(--glass-border)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.35s ease',
                  outline: 'none',
                }}
              />
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

const DashboardHome = ({ isPartner, profile, setActiveTab, stats, fetchStats, setPendingApplications, unreadMsgCount }) => {
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="view-home">
      <header className="dash-header">
        <div>
          <h1>Welcome back, {profile.firstName}!</h1>
          <p>Here is an overview of your operations.</p>
        </div>
      </header>

      {/* Admin message alert banner (student only) */}
      {!isPartner && unreadMsgCount > 0 && (
        <div
          onClick={() => setActiveTab('notifications')}
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.06))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(139,92,246,0.1)'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'}
        >
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '1.2rem' }}>💬</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '2px' }}>
              You have {unreadMsgCount} new message{unreadMsgCount !== 1 ? 's' : ''} from Admin
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to view your messages and reply</div>
          </div>
          <div style={{ background: '#8b5cf6', color: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
            {unreadMsgCount} New
          </div>
        </div>
      )}
      
      {/* Top Level Metric Cards */}
      <div className="widget-grid">
        <div className="widget metric-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h3>{isPartner ? 'Total Students' : 'Saved Courses'}</h3>
          <div className="metric" style={{ justifyContent: 'center' }}>{isPartner ? stats.totalStudents : 0}</div>
          {isPartner && <p className="text-muted" style={{fontSize: '0.8rem', marginTop: '5px'}}>Including new leads</p>}
          <div style={{ position: 'absolute', top: '25px', right: '25px', color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>↑ 4%</div>
        </div>

        {isPartner && (
          <div className="widget metric-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3>Total Counselors</h3>
            <div className="metric" style={{ justifyContent: 'center' }}>{stats.totalCounselors || 0}</div>
            <p className="text-muted" style={{fontSize: '0.8rem', marginTop: '5px'}}>Active sub-accounts</p>
          </div>
        )}

        {isPartner ? (
          <>
            <div className="widget metric-card" style={{ position: 'relative', padding: '20px' }}>
              <h3>Offer Status</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.studentsReceived || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Received</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--glass-border)', padding: '0 10px', flex: 1 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.studentsPending || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</div>
                </div>
              </div>
            </div>

            <div className="widget metric-card" style={{ position: 'relative', padding: '20px' }}>
              <h3>Student Status</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.studentsActive || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', padding: '0 10px', flex: 1 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.studentsBackout || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backout</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a855f7' }}>{stats.studentsHold || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On Hold</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="widget metric-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3>Active Applications</h3>
            <div className="metric" style={{ justifyContent: 'center' }}>{profile.appliedUniversities ? profile.appliedUniversities.filter(u => u && typeof u === 'object' && u.id).length : 0}</div>
            <p className="text-muted" style={{fontSize: '0.8rem', marginTop: '5px'}}>Based on your final submissions</p>
          </div>
        )}
      </div>

      {/* Main Dashboard Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        {/* Recent Activity Timeline */}
        <div className="widget profile-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, border: 'none', padding: 0 }}>
              <Activity size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-3px' }}/>
              Recent Activity
            </h3>
            <span onClick={() => setActiveTab('notifications')} style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', cursor: 'pointer' }}>View All</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}><FileText size={16} /></div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>New application submitted</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student Rahul Sharma applied to Toronto Univ.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}><Clock size={12}/> 2 hours ago</p>
              </div>
            </div>

            {isPartner && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981' }}><Users size={16} /></div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>New Student Lead Registered</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sarah Connor was added to your pipeline.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}><Clock size={12}/> 5 hours ago</p>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#f59e0b' }}><Activity size={16} /></div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>System Update Completed</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>ERP integration synchronized successfully.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}><Clock size={12}/> 1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notifications Card */}
        <ImportantNotifications />

      </div>

    </div>
  );
};

export default DashboardHome;
