import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bell, CheckCircle, Info } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Messages are stored as HTML — render with dangerouslySetInnerHTML
const renderChatText = (html) => {
  if (!html) return null;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const Notifications = ({ profile }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const [replyEditorHeight, setReplyEditorHeight] = useState(85);

  const chatBottomRef = useRef(null);
  const replyEditorRef = useRef(null);
  const replyDragRef = useRef(null);

  const startReplyResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = replyDragRef.current?.offsetHeight || replyEditorHeight;
    const onMove = (mv) => {
      const delta = mv.clientY - startY;
      const newH = Math.min(400, Math.max(80, startH + delta));
      setReplyEditorHeight(newH);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const execFormat = (e, command, value) => {
    e.preventDefault();
    replyEditorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/erp/my-messages`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendReply = async () => {
    const html = replyEditorRef.current?.innerHTML?.trim();
    const text = replyEditorRef.current?.innerText?.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/erp/my-messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-protected': '1'
        },
        body: JSON.stringify({ text: html })
      });
      if (res.ok) {
        if (replyEditorRef.current) replyEditorRef.current.innerHTML = '';
        setSendStatus('success');
        await fetchMessages();
        setTimeout(() => setSendStatus(''), 3000);
      } else {
        setSendStatus('error');
        setTimeout(() => setSendStatus(''), 3000);
      }
    } catch (err) {
      setSendStatus('error');
      setTimeout(() => setSendStatus(''), 3000);
    }
    setSending(false);
  };

  const adminMessages = messages.filter(m => m.sender === 'admin');

  return (
    <div className="view-notifications">
      <header className="dash-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={24} style={{ color: 'var(--accent-secondary)' }} />
            Notifications & Messages
          </h1>
          <p>Admin messages and system alerts — all in one place.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

        {/* ADMIN MESSAGES SECTION */}
        <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>

          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--glass-border)', background: 'var(--table-header-bg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(139,92,246,0.15)', padding: '6px', borderRadius: '7px' }}>
              <MessageSquare size={14} color="#8b5cf6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>Messages from Admin</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {messages.length === 0 ? 'No messages yet' : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
              </div>
            </div>
            {adminMessages.length > 0 && (
              <span style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderRadius: '12px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800 }}>
                {adminMessages.length}
              </span>
            )}
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <MessageSquare size={40} style={{ opacity: 0.15, display: 'block', margin: '0 auto 14px' }} />
                <div style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '6px' }}>No messages yet</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  When the admin sends you a message,<br />it will appear here.
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'student' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    minWidth: 0,
                    padding: '8px 12px',
                    borderRadius: msg.sender === 'student' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.sender === 'student'
                      ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                      : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    lineHeight: '1.5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    overflow: 'hidden'
                  }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.75, marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {msg.sender === 'student' ? 'You' : '🛡️ Admin'}
                    </div>
                    {renderChatText(msg.text)}
                    <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '5px', textAlign: 'right' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(msg.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* WYSIWYG Formatting toolbar + Reply input */}
          <div style={{ borderTop: '1px solid var(--glass-border)', padding: '6px 10px 10px' }}>

            {/* Toolbar row: formatting + send button on right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', gap: '2px', padding: '2px 4px', background: 'var(--input-bg)', borderRadius: '6px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                <button onMouseDown={(e) => execFormat(e, 'bold')} title="Bold"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontWeight: 900, fontSize: '0.82rem', fontFamily: 'serif' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >B</button>
                <button onMouseDown={(e) => execFormat(e, 'italic')} title="Italic"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontStyle: 'italic', fontSize: '0.82rem', fontFamily: 'serif' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >I</button>
                <div style={{ width: '1px', background: 'var(--glass-border)', margin: '2px 2px', height: '14px' }} />
                <button onMouseDown={(e) => execFormat(e, 'fontSize', '2')} title="Small text"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >A-</button>
                <button onMouseDown={(e) => execFormat(e, 'fontSize', '5')} title="Large text"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >A+</button>
              </div>
              <button
                onClick={sendReply}
                disabled={sending}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.78rem', flexShrink: 0 }}
              >
                <Send size={13} /> Send
              </button>
            </div>

            {/* Full-width resizable editor */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div
                ref={(el) => { replyEditorRef.current = el; replyDragRef.current = el; }}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={e => { /* Enter inserts new line; use Send button to send */ }}

                style={{
                  width: '100%',
                  height: `${replyEditorHeight}px`,
                  overflowY: 'auto',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--glass-border)',
                  borderBottom: 'none',
                  color: 'var(--text-main)',
                  padding: '14px 16px',
                  borderRadius: '12px 12px 0 0',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              />
              {/* Drag-to-resize handle — full width */}
              <div
                onMouseDown={startReplyResize}
                title="Drag to resize input area"
                style={{
                  width: '100%',
                  height: '16px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--glass-border)',
                  borderTop: '1px dashed rgba(139,92,246,0.3)',
                  borderRadius: '0 0 12px 12px',
                  cursor: 'ns-resize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  userSelect: 'none',
                  boxSizing: 'border-box',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--input-bg)'}
              >
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} style={{ width: '22px', height: '2px', borderRadius: '2px', background: 'rgba(139,92,246,0.4)' }} />
                ))}
              </div>
            </div>

            {sendStatus === 'success' && (
              <div style={{ marginTop: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.8rem', textAlign: 'center', borderRadius: '6px', padding: '6px' }}>
                ✓ Message sent to admin!
              </div>
            )}
            {sendStatus === 'error' && (
              <div style={{ marginTop: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', borderRadius: '6px', padding: '6px' }}>
                ✗ Failed to send. Try again.
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM NOTICES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--table-header-bg)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={16} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>System Notices</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: CheckCircle, color: '#10b981', title: 'Account Secured',       text: 'Your portal is protected. Never share credentials with anyone.' },
                { icon: Info,        color: '#3b82f6', title: 'Application Processing', text: 'Allow up to 48 business hours for application status updates.' },
                { icon: Info,        color: '#8b5cf6', title: 'Document Submission',    text: 'Ensure all uploaded documents are clear, valid, and not expired.' },
                { icon: CheckCircle, color: '#f59e0b', title: 'Intake Deadlines',       text: 'September 2026 intake deadlines are approaching. Act promptly.' },
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--input-bg)', borderRadius: '10px', border: `1px solid ${n.color}25` }}>
                  <div style={{ background: `${n.color}18`, padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
                    <n.icon size={16} color={n.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{n.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Notifications;
