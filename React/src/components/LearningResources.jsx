import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, File } from 'lucide-react';

const LearningResources = () => {
  const [currentPath, setCurrentPath] = useState(['Home']);
  
  const mockSystem = {
    'Home': [
      { name: 'Admission Guidelines', type: 'folder' },
      { name: 'Visa Templates', type: 'folder' },
      { name: 'SOP Samples', type: 'folder' },
      { name: 'Welcome Pack.pdf', type: 'file', size: '2.4 MB' }
    ],
    'Admission Guidelines': [
      { name: 'UK Intakes 2026.pdf', type: 'file', size: '1.1 MB' },
      { name: 'Canada Tier System.docx', type: 'file', size: '800 KB' }
    ],
    'Visa Templates': [
      { name: 'Financial Matrix.xlsx', type: 'file', size: '3.2 MB' }
    ],
    'SOP Samples': [
      { name: 'Engineering MS SOP.pdf', type: 'file', size: '540 KB' },
      { name: 'Business MBA SOP.pdf', type: 'file', size: '610 KB' }
    ]
  };

  const currentFolder = currentPath[currentPath.length - 1];
  const items = mockSystem[currentFolder] || [];

  const handleNavigate = (folderName) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  return (
    <div className="view-resources">
      <header className="dash-header">
        <div>
          <h1>Learning Resources</h1>
          <p>Access and retrieve authorized operating documents.</p>
        </div>
      </header>
      
      <div className="widget" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Explorer Header */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
          {currentPath.map((path, idx) => (
            <React.Fragment key={idx}>
              <span 
                style={{ cursor: 'pointer', color: idx === currentPath.length - 1 ? 'white' : '#3b82f6', fontWeight: idx === currentPath.length - 1 ? 'bold' : 'normal' }}
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {path}
              </span>
              {idx < currentPath.length - 1 && <ChevronRight size={16} color="#9ca3af" style={{ margin: '0 8px' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Explorer Body */}
        <div style={{ padding: '10px' }}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead>
              <tr style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                <th style={{padding: '10px', fontWeight: 'normal'}}>Name</th>
                <th style={{padding: '10px', fontWeight: 'normal'}}>Date Modified</th>
                <th style={{padding: '10px', fontWeight: 'normal'}}>Type</th>
                <th style={{padding: '10px', fontWeight: 'normal'}}>Size</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center', color: '#9ca3af'}}>Folder is empty</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr 
                    key={idx} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: item.type === 'folder' ? 'pointer' : 'default' }}
                    onClick={() => item.type === 'folder' && handleNavigate(item.name)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: item.type === 'folder' ? '#60a5fa' : 'white'}}>
                      {item.type === 'folder' ? <Folder size={18} fill="rgba(96, 165, 250, 0.2)" /> : <FileText size={18} />}
                      {item.name}
                    </td>
                    <td style={{padding: '12px', color: '#9ca3af', fontSize: '0.85rem'}}>Today, 09:41 AM</td>
                    <td style={{padding: '12px', color: '#9ca3af', fontSize: '0.85rem', textTransform: 'capitalize'}}>{item.type}</td>
                    <td style={{padding: '12px', color: '#9ca3af', fontSize: '0.85rem'}}>{item.size || '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LearningResources;
