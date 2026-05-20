import React, { useState, useMemo } from 'react';
import { Building, MapPin, GraduationCap, CheckSquare, FileText, Search, Filter, Clock } from 'lucide-react';
import ApplicationTracking from './ApplicationTracking';

const AppliedUniversities = ({ profile }) => {
  const appliedUniversities = (profile?.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);

  const [selectedApp, setSelectedApp] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(appliedUniversities.map(u => u.location).filter(Boolean)));
  }, [appliedUniversities]);

  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(appliedUniversities.map(u => u.level).filter(Boolean)));
  }, [appliedUniversities]);

  const uniqueUniversities = useMemo(() => {
    return Array.from(new Set(appliedUniversities.map(u => u.name).filter(Boolean))).sort();
  }, [appliedUniversities]);

  const filteredUniversities = useMemo(() => {
    return appliedUniversities.filter(uni => {
      if (searchTerm && uni.name && uni.name !== searchTerm) return false;
      if (locationFilter && uni.location !== locationFilter) return false;
      if (levelFilter && uni.level !== levelFilter) return false;
      return true;
    });
  }, [appliedUniversities, searchTerm, locationFilter, levelFilter]);

  if (selectedApp) {
    return (
      <ApplicationTracking
        student={profile}
        applications={appliedUniversities}
        initialSelectedAppId={selectedApp.id}
        onBack={() => setSelectedApp(null)}
      />
    );
  }

  return (
    <div className="view-standard" style={{ animation: 'fadeIn 0.3s ease' }}>
      <header className="dash-header">
        <div>
          <h1>Applied Universities</h1>
          <p>Review the record of all academic applications submitted to your target institutions.</p>
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

      {appliedUniversities.length === 0 ? (
        <div className="widget placeholder-panel mt-4">
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--glass-border)', margin: '0 auto 15px auto' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No Applications Filed</h3>
            <p style={{ color: 'var(--text-muted)' }}>You have not submitted your profile to any universities yet. Use the Course Finder to begin your journey.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="widget" style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              <Filter size={18} /> Filter Applications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select className="theme-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '35px', width: '100%', boxSizing: 'border-box' }}>
                  <option value="">All Universities</option>
                  {uniqueUniversities.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <select className="theme-input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              <select className="theme-input" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Levels</option>
                {uniqueLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-save" onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', width: 'auto' }}>
                <Search size={16} />
                Apply Filters
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredUniversities.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No applications match your filter criteria.
              </div>
            ) : (
              filteredUniversities.map((uni, idx) => (
                <div
                  key={idx}
                  className="widget hover:border-[var(--accent-secondary)]"
                  onClick={() => setSelectedApp(uni)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', border: '1px solid var(--glass-border)', transition: 'all 0.2s ease', background: 'var(--bg-secondary)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ flex: '1 1 auto' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building size={20} className="text-muted" /> {uni.name}
                      </h4>
                      <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px', flexWrap: 'wrap' }}>
                        {uni.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {uni.location}</span>}
                        {uni.minPercentage && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Min. {uni.minPercentage}%</span>}
                        {uni.intake && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '2px 8px', borderRadius: '4px' }}>Intake: {uni.intake}</span>}
                        {uni.type && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px' }}>{uni.type}</span>}
                        {uni.ranking && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>{uni.ranking}</span>}
                        {uni.level && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>{uni.level}</span>}
                      </div>
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#eab308', fontWeight: 600, background: 'rgba(234, 179, 8, 0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                        <Clock size={14} /> Under Process
                      </span>
                    </div>
                  </div>

                  {uni.programs && uni.programs.length > 0 && (
                    <div style={{ marginTop: '5px', paddingTop: '15px', borderTop: '1px dashed var(--glass-border)' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applied Programs</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {uni.programs.map((prog, pIdx) => (
                          <div key={pIdx} style={{ background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            <CheckSquare size={14} className="text-muted" />
                            {prog}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AppliedUniversities;
