import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Globe, Cpu, Radio, Network, Trophy, BarChart3, ChevronRight, User } from 'lucide-react';

const SystemHierarchy = ({ users, onStudentClick }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allStudents = users.filter(u => u.role === 'student');
  const allPartners = users.filter(u => u.role === 'partner');
  const recentStudents = [...allStudents].slice(0, 10);

  // Calculate top partners based on registered students
  const partnerStats = allPartners.map(p => {
    const sCount = allStudents.filter(s => {
      if (!s.registeredBy) return false;
      const sRegId = String(s.registeredBy);
      const pId = String(p._id);
      const pUniqueId = p.studentUniqueId ? String(p.studentUniqueId) : null;
      
      return sRegId === pId || (pUniqueId && sRegId === pUniqueId);
    }).length;
    return { ...p, studentCount: sCount };
  }).sort((a, b) => b.studentCount - a.studentCount).slice(0, 5);

  // Calculate status breakdown for students
  const statusCounts = allStudents.reduce((acc, s) => {
    const status = s.offerStatus || s.studentStatus || 'Pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxStatusCount = statuses.length > 0 ? statuses[0][1] : 1;

  const containerStyle = {
    display: 'flex',
    gap: '20px',
    height: 'calc(100vh - 280px)', // Rigid calc fitting below AdminPortal Header + Top Cards
    overflow: 'hidden',
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const widgetBase = {
    background: 'var(--card-bg-solid)',
    borderRadius: '16px',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  };

  const injectAnimation = `
    @keyframes slide-in-right {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes progress-fill {
      from { width: 0; }
    }
    .cool-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .cool-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .cool-scroll::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    .cool-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.2);
    }
  `;

  return (
    <>
      <style>{injectAnimation}</style>
      <div style={containerStyle}>
        
        {/* WIDGET 1: Top Performers & Analytics (Left Side - Takes up 2/3 of space) */}
        <div style={{ ...widgetBase, flex: '2', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <h3 style={{ color: 'var(--text-main)', margin: '0 0 5px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <BarChart3 color="#3b82f6" /> System Analytics & Performance
               </h3>
               <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Real-time database insights based on active datasets</p>
             </div>

          </div>

          <div style={{ flex: 1, display: 'flex', pading: '24px', overflow: 'hidden' }}>
            
            {/* Database Status Allocation */}
            <div style={{ flex: 1, padding: '24px', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
               <h4 style={{ color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Activity size={18} color="#10b981" /> Application Stage Tracking
               </h4>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, justifyContent: 'center' }}>
                 {statuses.map((stat, i) => (
                   <div key={i} style={{ animation: `slide-up 0.4s ease forwards ${i * 0.1}s`, opacity: 0 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                       <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{stat[0]}</span>
                       <span style={{ color: 'var(--text-muted)' }}>{stat[1]} Profiles</span>
                     </div>
                     <div style={{ width: '100%', height: '8px', background: 'var(--input-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ 
                         width: `${(stat[1] / maxStatusCount) * 100}%`, 
                         height: '100%', 
                         background: i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : i === 2 ? '#f59e0b' : '#8b5cf6',
                         borderRadius: '4px',
                         animation: 'progress-fill 1s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                       }}></div>
                     </div>
                   </div>
                 ))}
                 {statuses.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No status data available.</div>}
               </div>
            </div>

            {/* Top Partner Leaderboard */}
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
               <h4 style={{ color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Trophy size={18} color="#f59e0b" /> Top Performing Partners
               </h4>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                 {partnerStats.map((partner, i) => (
                   <div key={partner._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: i === 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--input-bg)', border: `1px solid ${i === 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--glass-border)'}`, borderRadius: '12px', animation: `slide-up 0.4s ease forwards ${i * 0.1}s`, opacity: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#fff' : 'var(--text-main)', fontWeight: 'bold' }}>
                        #{i + 1}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, color: i === 0 ? '#fbbf24' : 'var(--text-main)', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {partner.companyName || `${partner.firstName} ${partner.lastName}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{partner.email}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: i === 0 ? '#f59e0b' : 'var(--accent-primary)' }}>
                        {partner.studentCount}
                      </div>
                   </div>
                 ))}
                 {partnerStats.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No partners registered.</div>}
               </div>
            </div>

          </div>
        </div>

        {/* WIDGET 2: Live Activity Feed (Right Side - Takes up 1/3 space) */}
        <div style={{ ...widgetBase, flex: '1', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}>
             <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Zap color="#f59e0b" /> Recent Acquisitions
             </h3>
          </div>
          
          <div className="cool-scroll" style={{ flex: '1', overflowY: 'auto', padding: '15px 24px' }}>
            {recentStudents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
                <User size={40} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                Awaiting incoming datagrams...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentStudents.map((student, i) => (
                  <div 
                    key={student._id} 
                    className="hover:bg-[var(--glass-bg)] pointer"
                    onClick={() => onStudentClick(student)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                      background: 'var(--input-bg)', borderRadius: '10px', border: '1px solid var(--glass-border)', 
                      animation: `slide-in-right 0.4s ease forwards ${i * 0.1}s`, opacity: 0,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 'bold' }}>
                        {student.firstName.charAt(0)}
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', border: '2px solid var(--input-bg)' }}></div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {student.firstName} {student.lastName}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                         New Student Vector
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default SystemHierarchy;

