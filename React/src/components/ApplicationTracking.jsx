import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Paperclip, Send, Paperclip as AttachmentIcon, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ApplicationTracking = ({ student, applications = [], initialSelectedAppId, onBack, isPortalAdmin = false }) => {
  const safeApps = applications.filter(a => a && typeof a === 'object' && a.id);
  const [selectedAppId, setSelectedAppId] = useState(initialSelectedAppId || (safeApps.length > 0 ? safeApps[0].id : null));

  // Chat/Comments state
  // Normally comments would be tied to a specific application ID and fetched/saved in the backend.
  // We'll use a mocked local state initially if there's no backend field yet, but ideally it updates student.appliedUniversities.
  const [commentsMap, setCommentsMap] = useState({});
  const [newComment, setNewComment] = useState('');
  const [showProgramDetails, setShowProgramDetails] = useState(false);

  // Extract application ID (generate one if missing just for UI tracking)
  const getAppRefId = (app) => app.id || (Math.random()*1000).toFixed();

  const selectedApp = safeApps.find(a => a.id === selectedAppId) || safeApps[0];

  useEffect(() => {
    if (selectedAppId && !commentsMap[selectedAppId]) {
      // Initialize with empty array or existing comments if any
      setCommentsMap(prev => ({
        ...prev,
        [selectedAppId]: selectedApp?.comments || []
      }));
    }
  }, [selectedAppId, selectedApp]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !student?._id || !selectedAppId) return;
    
    const senderRole = isPortalAdmin ? 'Admin Team' : 'Student';
    
    const commentData = {
      text: newComment,
      sender: senderRole
    };

    // 1. Optimistic Update
    const optimisticMsg = { ...commentData, timestamp: new Date().toISOString() };
    setCommentsMap(prev => ({
      ...prev,
      [selectedAppId]: [...(prev[selectedAppId] || []), optimisticMsg]
    }));
    setNewComment('');

    // 2. Real API Call
    try {
      const response = await fetch(`${API_BASE_URL}/erp/students/${student._id}/applications/${selectedAppId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(commentData)
      });
      
      if (!response.ok) {
        console.error("Failed to commit comment to database");
        // Optionally: revert UI state or show error
      }
    } catch (err) {
      console.error("Network error on chat:", err);
    }
  };

  const currentComments = commentsMap[selectedAppId] || [];

  return (
    <div className="view-standard" style={{ animation: 'fadeIn 0.3s ease', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      
      {/* Top Header / Breadcrumb */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ArrowLeft size={18} />
          Back
        </button>
        <span style={{ color: 'var(--text-muted)' }}>Students &gt; </span>
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{student?.firstName} {student?.lastName}</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Pane: Applications List */}
        <div style={{ width: '350px', borderRight: '1px solid var(--glass-border)', overflowY: 'auto', background: 'var(--card-bg)' }}>
          {safeApps.map(app => {
            const isSelected = app.id === selectedAppId;
            const appRef = getAppRefId(app);
            const status = app.status || 'Application Received';
            const statusColor = status === 'Case Closed' ? '#10b981' : '#3b82f6';
            
            return (
              <div 
                key={appRef}
                onClick={() => setSelectedAppId(app.id)}
                style={{ 
                  padding: '20px', 
                  borderBottom: '1px solid var(--glass-border)', 
                  cursor: 'pointer',
                  borderLeft: isSelected ? '4px solid var(--accent-secondary)' : '4px solid transparent',
                  background: isSelected ? 'var(--card-bg-solid)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ padding: '4px 10px', background: `${statusColor}15`, color: statusColor, fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', display: 'inline-block', marginBottom: '12px' }}>
                  {status}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ width: '80px', flexShrink: 0, color: 'var(--text-muted)' }}>Date:</span>
                      <span style={{ flex: 1, color: 'var(--text-main)' }}>{app.dateApplied ? new Date(app.dateApplied).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ width: '80px', flexShrink: 0, color: 'var(--text-muted)' }}>Course:</span>
                      <span style={{ flex: 1, color: 'var(--text-main)' }}>{app.programs && app.programs[0] ? app.programs[0] : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ width: '80px', flexShrink: 0, color: 'var(--text-muted)' }}>University:</span>
                      <span style={{ flex: 1, color: 'var(--text-main)', fontWeight: 600 }}>{app.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Selected Application Details */}
        {selectedApp && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', overflowY: 'auto', padding: '30px' }}>
            
            {/* Header / Info box */}
            <div style={{ background: 'var(--card-bg-solid)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '25px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {selectedApp.dateApplied ? new Date(selectedApp.dateApplied).toLocaleString() : new Date().toLocaleString()}
                </span>
                <span style={{ padding: '6px 15px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  {selectedApp.status || 'Application Received'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 600 }}>{selectedApp.programs && selectedApp.programs[0] ? selectedApp.programs[0] : 'Course Details'}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{selectedApp.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>{selectedApp.intake || 'Sep-2026'}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button onClick={() => setShowProgramDetails(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
                  View Program Details
                </button>
              </div>
            </div>

            {/* Fee Status */}
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '15px 25px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Application Fee Status:</span>
              <span style={{ padding: '6px 15px', background: '#10b98120', color: '#10b981', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> {selectedApp.feeStatus || 'No Application Fee'}
              </span>
            </div>

            {/* Comments Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg-solid)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              
              {/* Comments Header */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', padding: '15px 25px' }}>
                <h3 style={{ margin: 0, color: '#3b82f6', fontWeight: 700 }}>Communication Thread</h3>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '200px' }}>
                {currentComments.map((msg, i) => {
                  const isStaff = msg.sender && (msg.sender.toLowerCase().includes('admin') || msg.sender.toLowerCase().includes('partner') || msg.sender.toLowerCase().includes('counselor'));
                  const alignSelf = !isPortalAdmin && isStaff ? 'flex-start' : (!isPortalAdmin && !isStaff ? 'flex-end' : (isPortalAdmin && isStaff ? 'flex-end' : 'flex-start'));
                  const bgColor = alignSelf === 'flex-end' ? 'rgba(59, 130, 246, 0.1)' : 'var(--input-bg)';
                  const borderColor = alignSelf === 'flex-end' ? 'rgba(59, 130, 246, 0.2)' : 'var(--glass-border)';

                  return (
                    <div key={i} style={{ alignSelf, maxWidth: '80%', padding: '12px', background: bgColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                        <strong style={{ color: 'var(--text-main)', marginRight: '8px' }}>{msg.sender}</strong>
                        {new Date(msg.timestamp).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--text-main)' }}>{msg.text}</div>
                    </div>
                  );
                })}
                {currentComments.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px' }}>
                    No comments yet in this thread.
                  </div>
                )}
              </div>

              {/* Editor */}
              <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                  
                  {/* Toolbar */}
                  <div style={{ display: 'flex', padding: '10px 15px', borderBottom: '1px solid var(--glass-border)', gap: '15px' }}>
                    <select style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}>
                      <option>16px</option>
                      <option>14px</option>
                      <option>18px</option>
                    </select>
                    <div style={{ display: 'flex', gap: '10px', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 800, cursor: 'pointer' }}>B</span>
                      <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                      <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                      <span style={{ textDecoration: 'line-through', cursor: 'pointer' }}>S</span>
                    </div>
                  </div>

                  <textarea 
                    placeholder="Write comments..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                    style={{ 
                      width: '100%', 
                      height: '100px', 
                      border: 'none', 
                      background: 'transparent', 
                      color: 'var(--text-main)', 
                      padding: '15px', 
                      resize: 'none', 
                      outline: 'none' 
                    }}
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px', gap: '10px' }}>
                    <button style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <AttachmentIcon size={18} />
                    </button>
                    <button onClick={handleSendComment} style={{ background: '#8b5cf6', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Send size={18} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Program Details Modal */}
      {showProgramDetails && selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-primary)', width: '90%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg-solid)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Program Details</h3>
              <button 
                onClick={() => setShowProgramDetails(false)}
                style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                X
              </button>
            </div>
            <div style={{ padding: '25px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Program Name</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedApp.programs && selectedApp.programs[0] ? selectedApp.programs[0] : 'Course Details'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>University</span>
                  <div style={{ fontWeight: 500 }}>{selectedApp.name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location</span>
                  <div style={{ fontWeight: 500 }}>{selectedApp.location || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Intake</span>
                  <div style={{ fontWeight: 500 }}>{selectedApp.intake || 'Sep-2026'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Level</span>
                  <div style={{ fontWeight: 500 }}>{selectedApp.level || 'Degree'}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowProgramDetails(false)}
                className="btn-save"
                style={{ padding: '10px 20px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracking;
