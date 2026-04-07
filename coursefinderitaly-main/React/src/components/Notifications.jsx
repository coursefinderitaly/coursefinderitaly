import React from 'react';
import { Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react';

const Notifications = () => {
  const mockNotifications = [
    { id: 1, type: 'success', text: "Application #4092 assigned via fast-track tracking.", time: "10 mins ago", icon: CheckCircle, color: "#10b981" },
    { id: 2, type: 'info', text: "System ERP successfully backed up database.", time: "1 hour ago", icon: Info, color: "#3b82f6" },
    { id: 3, type: 'alert', text: "New counselor registration requires administrative approval.", time: "3 hours ago", icon: AlertTriangle, color: "#f59e0b" },
    { id: 4, type: 'info', text: "Student 'Alex Smith' uploaded visa documents.", time: "Yesterday", icon: Info, color: "#3b82f6" },
    { id: 5, type: 'success', text: "Database connection link passed ping diagnostics.", time: "Yesterday", icon: CheckCircle, color: "#10b981" }
  ];

  return (
    <div className="view-notifications">
      <header className="dash-header">
        <div>
          <h1>System Notifications</h1>
          <p>Real-time alerts and ERP logs mapped below.</p>
        </div>
      </header>
      
      <div className="widget placeholder-panel" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {mockNotifications.map(n => (
            <div key={n.id} className="theme-card-bg" style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '15px', 
              padding: '20px', 
              borderRadius: '12px', border: `1px solid ${n.color}40`,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ background: `${n.color}20`, padding: '10px', borderRadius: '50%' }}>
                <n.icon size={20} color={n.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '5px' }}>{n.text}</div>
                <div style={{ fontSize: '0.8rem' }} className="text-muted">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
