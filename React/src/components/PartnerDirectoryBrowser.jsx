import React, { useState, useMemo } from 'react';
import { Building2, Briefcase, Users, User, ChevronRight, GraduationCap, Search, Mail, Filter } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

export default function PartnerDirectoryBrowser({ users, onStudentClick }) {
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 1. Process Core Data Sets
  const allPartners = users.filter(u => u.role === 'partner');
  const allCounselors = users.filter(u => u.role === 'counselor');
  const allStudents = users.filter(u => u.role === 'student');

  // True Global Typeahead Search
  const globalSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const lowerQ = searchQuery.toLowerCase();
    return users.filter(u => 
      u.firstName?.toLowerCase().includes(lowerQ) || 
      u.lastName?.toLowerCase().includes(lowerQ) || 
      u.email?.toLowerCase().includes(lowerQ) ||
      u.companyName?.toLowerCase().includes(lowerQ)
    ).slice(0, 15);
  }, [searchQuery, users]);

  const handleGlobalResultClick = (user) => {
    setShowDropdown(false);
    setSearchQuery('');
    
    if (user.role === 'partner') {
      setSelectedPartner(user);
      setSelectedCounselor(null);
    } else if (user.role === 'counselor') {
      const parent = allPartners.find(p => p._id === user.parentPartner);
      if (parent) setSelectedPartner(parent);
      setSelectedCounselor(user);
    } else if (user.role === 'student') {
      onStudentClick(user);
    }
  };

  // Filter partners by generic Search bar if needed
  const filteredPartners = useMemo(() => {
    if (!searchQuery) return allPartners;
    const lowerQ = searchQuery.toLowerCase();
    
    return allPartners.filter(p => {
      // Strict Partner Filter
      const pMatch = (p.companyName?.toLowerCase().includes(lowerQ)) ||
                     (p.firstName?.toLowerCase().includes(lowerQ)) ||
                     (p.lastName?.toLowerCase().includes(lowerQ)) ||
                     (p.email?.toLowerCase().includes(lowerQ));
      
      // Counselor Match
      const cMatch = allCounselors.some(c => 
        c.parentPartner === p._id && 
        (c.firstName?.toLowerCase().includes(lowerQ) || c.lastName?.toLowerCase().includes(lowerQ) || c.email?.toLowerCase().includes(lowerQ))
      );

      // Student Match
      const sMatch = allStudents.some(s => {
        if (!s.registeredBy) return false;
        const sRegId = String(s.registeredBy);
        return sRegId === String(p._id) || (p.studentUniqueId && sRegId === String(p.studentUniqueId));
      });

      // All Mode: Match any level
      return pMatch || cMatch || sMatch;
    });
  }, [searchQuery, allPartners, allCounselors, allStudents]);

  // Derived datasets for the selected scopes
  const currentPartnerCounselors = useMemo(() => {
    if (!selectedPartner) return [];
    let base = allCounselors.filter(c => c.parentPartner === selectedPartner._id);
    
    // Auto-filter sub-list if searching
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      base = base.filter(c => 
        c.firstName?.toLowerCase().includes(lowerQ) || 
        c.lastName?.toLowerCase().includes(lowerQ) || 
        c.email?.toLowerCase().includes(lowerQ)
      );
    }
    return base;
  }, [selectedPartner, allCounselors, searchQuery]);

  const currentPartnerStudents = useMemo(() => {
    if (!selectedPartner) return [];
    return allStudents.filter(s => {
      if (!s.registeredBy) return false;
      const sRegId = String(s.registeredBy);
      return sRegId === String(selectedPartner._id) || 
             (selectedPartner.studentUniqueId && sRegId === String(selectedPartner.studentUniqueId));
    });
  }, [selectedPartner, allStudents]);

  // Split students
  const directPartnerStudents = useMemo(() => {
    return currentPartnerStudents.filter(s => {
      let cId = typeof s.assignedCounselor === 'string' ? s.assignedCounselor : s.assignedCounselor?._id;
      if (!cId) cId = typeof s.createdByCounselor === 'string' ? s.createdByCounselor : s.createdByCounselor?._id;
      
      return !cId || cId === 'direct' || cId === '';
    });
  }, [currentPartnerStudents]);

  const currentlyViewedStudents = useMemo(() => {
    if (!selectedPartner) return [];
    if (!selectedCounselor) return [];
    
    let filtered = [];
    if (selectedCounselor === 'DIRECT') {
      filtered = directPartnerStudents;
    } else {
      filtered = currentPartnerStudents.filter(s => {
        let cId = typeof s.assignedCounselor === 'string' ? s.assignedCounselor : s.assignedCounselor?._id;
        if (!cId) cId = typeof s.createdByCounselor === 'string' ? s.createdByCounselor : s.createdByCounselor?._id;
        return cId === selectedCounselor._id;
      });
    }

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.firstName?.toLowerCase().includes(lowerQ) || 
        s.lastName?.toLowerCase().includes(lowerQ) || 
        s.email?.toLowerCase().includes(lowerQ)
      );
    }
    return filtered;
  }, [selectedPartner, selectedCounselor, currentPartnerStudents, directPartnerStudents, searchQuery]);

  return (
    <div className="directory-browser animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px', background: 'var(--card-bg-solid)', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)' }}>
      
       {/* Omni-Search Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' }}>
         <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
             <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
             <input 
               type="text" 
               placeholder="Global Search across all layers (Students, Counselors, Partners)..." 
               value={searchQuery}
               onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
               onFocus={() => setShowDropdown(true)}
               style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none', transition: 'all 0.2s', fontSize: '0.9rem' }}
             />

             {/* Dynamic Search Dropdown Overlay */}
             {showDropdown && searchQuery.length >= 2 && (
               <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '8px' }}>
                 {globalSearchResults.length === 0 ? (
                   <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>No entities matched your scan.</div>
                 ) : (
                   globalSearchResults.map(res => (
                     <div 
                       key={res._id}
                       onClick={() => handleGlobalResultClick(res)}
                       style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                       onMouseOver={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                       onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                     >
                       <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: res.role === 'partner' ? 'rgba(59,130,246,0.1)' : res.role === 'counselor' ? 'rgba(236,72,153,0.1)' : 'rgba(16,185,129,0.1)', color: res.role === 'partner' ? '#3b82f6' : res.role === 'counselor' ? '#ec4899' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {res.role === 'partner' ? <Building2 size={16} /> : res.role === 'counselor' ? <Briefcase size={16} /> : <User size={16} />}
                       </div>
                       <div style={{ flex: 1 }}>
                         <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>{res.companyName || `${res.firstName} ${res.lastName}`}</div>
                         <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{res.email}</div>
                       </div>
                       <div style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800, background: res.role === 'partner' ? 'rgba(59,130,246,0.1)' : res.role === 'counselor' ? 'rgba(236,72,153,0.1)' : 'rgba(16,185,129,0.1)', color: res.role === 'partner' ? '#3b82f6' : res.role === 'counselor' ? '#ec4899' : '#10b981' }}>
                         {res.role}
                       </div>
                     </div>
                   ))
                 )}
               </div>
             )}
           </div>
           
           <button onClick={() => setShowDropdown(true)} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Search size={16} /> Scan
           </button>
         </div>

         {/* Explicit Quick-Jump Dropdown Filters */}
         <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0 12px', minWidth: 'min-content' }}>
               <Building2 size={16} color="var(--text-muted)" style={{ marginRight: '10px' }} />
               <div style={{ flex: 1 }}>
                 <SearchableSelect 
                   name="selectedPartnerFilter"
                   value={selectedPartner?._id || ''}
                   onChange={e => {
                     if (!e.target.value) { setSelectedPartner(null); setSelectedCounselor(null); return; }
                     const p = allPartners.find(x => x._id === e.target.value);
                     if (p) { setSelectedPartner(p); setSelectedCounselor(null); }
                   }}
                   placeholder="Select specific Partner"
                   options={[
                     { value: '', label: 'Select specific Partner' },
                     ...allPartners.map(p => ({ value: p._id, label: p.companyName || `${p.firstName} ${p.lastName}` }))
                   ]}
                 />
               </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0 12px', minWidth: 'min-content' }}>
               <Briefcase size={16} color="var(--text-muted)" style={{ marginRight: '10px' }} />
               <div style={{ flex: 1 }}>
                 <SearchableSelect 
                   name="selectedCounselorFilter"
                   value={selectedCounselor === 'DIRECT' ? 'DIRECT' : (selectedCounselor?._id || '')}
                   onChange={e => {
                     if (!e.target.value) { setSelectedCounselor(null); return; }
                     if (e.target.value === 'DIRECT') { setSelectedCounselor('DIRECT'); return; }
                     const c = allCounselors.find(x => x._id === e.target.value);
                     if (c) { 
                        const parent = allPartners.find(p => p._id === c.parentPartner);
                        if (parent) setSelectedPartner(parent);
                        setSelectedCounselor(c); 
                     }
                   }}
                   placeholder="Select specific Counselor"
                   options={[
                     { value: '', label: 'Select specific Counselor' },
                     { value: 'DIRECT', label: '⭐ Partner Direct Network' },
                     ...allCounselors.map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }))
                   ]}
                 />
               </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0 12px', minWidth: 'min-content' }}>
               <GraduationCap size={16} color="var(--text-muted)" style={{ marginRight: '10px' }} />
               <div style={{ flex: 1 }}>
                 <SearchableSelect 
                   name="quickStudentOpenFilter"
                   value=""
                   onChange={e => {
                     if (!e.target.value) return;
                     const s = allStudents.find(x => x._id === e.target.value);
                     if (s) {
                       onStudentClick(s);
                     }
                   }}
                   placeholder="Quick-Open Profile"
                   options={[
                     { value: '', label: 'Quick-Open Profile' },
                     ...allStudents.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName} (${s.email})` }))
                   ]}
                 />
               </div>
            </div>
         </div>
      </div>

      {/* Directory Columns */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* COL 1: PARTNERS */}
        <div style={{ width: '33%', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
             <span>Global Partner Franchises</span>
           </div>
           <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
              {filteredPartners.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 10px', fontSize: '0.9rem' }}>No partners found.</div>}
              {filteredPartners.map(p => {
                const isActive = selectedPartner?._id === p._id;
                const pStudCount = allStudents.filter(s => {
                  if (!s.registeredBy) return false;
                  const sRegId = String(s.registeredBy);
                  return sRegId === String(p._id) || (p.studentUniqueId && sRegId === String(p.studentUniqueId));
                }).length;
                return (
                  <div 
                    key={p._id} 
                    onClick={() => { setSelectedPartner(p); setSelectedCounselor(null); }}
                    style={{ background: isActive ? 'var(--accent-primary)' : 'transparent', color: isActive ? '#fff' : 'var(--text-main)', border: isActive ? '1px solid transparent' : '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none' }}
                    onMouseOver={e => !isActive && (e.currentTarget.style.background = 'var(--input-bg)')}
                    onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(59, 130, 246, 0.1)', color: isActive ? '#fff' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={18} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                         <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.companyName || `${p.firstName} ${p.lastName}`}</div>
                         <div style={{ fontSize: '0.75rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                           <span>{pStudCount} Sub-Students</span>
                         </div>
                      </div>
                    </div>
                    <ChevronRight size={18} color={isActive ? '#fff' : 'var(--text-muted)'} style={{ opacity: isActive ? 1 : 0.4 }} />
                  </div>
                )
              })}
           </div>
        </div>

        {/* COL 2: COUNSELORS & GROUPS */}
        <div style={{ width: '33%', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: selectedPartner ? 'var(--bg-primary)' : 'var(--bg-secondary)', transition: 'background 0.3s ease' }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
             <span>{selectedPartner ? `${selectedPartner.companyName?.substring(0,25) || 'Selected Partner'}'s Counselors` : 'Select a Partner'}</span>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
              {!selectedPartner ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5, gap: '10px' }}>
                  <Briefcase size={40} />
                  <span>Awaiting Selection</span>
                </div>
              ) : (
                <div className="animate-fade-in">
                  
                  {/* Local/Direct Master Bucket */}
                  {directPartnerStudents.length > 0 && (
                     <div 
                        onClick={() => setSelectedCounselor('DIRECT')}
                        style={{ background: selectedCounselor === 'DIRECT' ? '#ec4899' : 'var(--card-bg-solid)', color: selectedCounselor === 'DIRECT' ? '#fff' : 'var(--text-main)', border: selectedCounselor === 'DIRECT' ? '1px solid transparent' : '1px dashed #ec4899', borderRadius: '12px', padding: '14px 16px', marginBottom: '15px', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: selectedCounselor === 'DIRECT' ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none' }}
                     >
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <User size={18} color={selectedCounselor === 'DIRECT' ? '#fff' : '#ec4899'} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Partner Direct Network</div>
                            <div style={{ fontSize: '0.75rem', color: selectedCounselor === 'DIRECT' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '2px' }}>{directPartnerStudents.length} Direct Native Students</div>
                          </div>
                       </div>
                       <ChevronRight size={18} />
                     </div>
                  )}

                  {/* Standard Counselors */}
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '5px 5px 10px 5px', borderBottom: '1px solid var(--glass-border)', marginBottom: '10px' }}>Assigned Core Counselors</div>
                  {currentPartnerCounselors.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '20px 10px', fontSize: '0.85rem' }}>No counselors mapped to this franchise.</div>
                  ) : (
                    currentPartnerCounselors.map(c => {
                      const isActive = selectedCounselor?._id === c._id;
                      const activeS_Count = currentPartnerStudents.filter(s => { 
                        let ci = typeof s.assignedCounselor === 'string' ? s.assignedCounselor : s.assignedCounselor?._id; 
                        if (!ci) ci = typeof s.createdByCounselor === 'string' ? s.createdByCounselor : s.createdByCounselor?._id;
                        return ci === c._id; 
                      }).length;
                      return (
                        <div 
                          key={c._id} 
                          onClick={() => setSelectedCounselor(c)}
                          style={{ background: isActive ? 'var(--accent-secondary)' : 'var(--card-bg-solid)', color: isActive ? '#fff' : 'var(--text-main)', border: isActive ? '1px solid transparent' : '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: isActive ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none' }}
                          onMouseOver={e => !isActive && (e.currentTarget.style.borderColor = '#8b5cf6')}
                          onMouseOut={e => !isActive && (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(139, 92, 246, 0.1)', color: isActive ? '#fff' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Briefcase size={16} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.firstName} {c.lastName}</div>
                              <div style={{ fontSize: '0.75rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '2px' }}>{activeS_Count} Bound Clients</div>
                            </div>
                          </div>
                          <ChevronRight size={18} color={isActive ? '#fff' : 'var(--text-muted)'} style={{ opacity: isActive ? 1 : 0.4 }} />
                        </div>
                      )
                    })
                  )}
                </div>
              )}
           </div>
        </div>

        {/* COL 3: STUDENTS RESULT MATRIX */}
        <div style={{ width: '34%', display: 'flex', flexDirection: 'column', background: selectedCounselor ? 'var(--bg-primary)' : 'var(--bg-secondary)', transition: 'background 0.3s ease' }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
             <span>{selectedCounselor ? 'Assignable Client Records' : 'Select a Counselor'}</span>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
              {!selectedCounselor ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5, gap: '10px' }}>
                  <Users size={40} />
                  <span>Awaiting Routing</span>
                </div>
              ) : (
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '10px' }}>
                   {currentlyViewedStudents.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No student records discovered for this isolated node.</div>
                   ) : (
                      currentlyViewedStudents.map(student => (
                        <div 
                          key={student._id}
                          className="partner-card-hover"
                          onClick={() => onStudentClick(student)}
                          style={{ background: 'var(--card-bg-solid)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '15px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #10b981', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateX(5px)'; e.currentTarget.style.borderColor = '#10b981'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateX(0px)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                        >
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               {student.firstName} {student.lastName}
                             </div>
                             <button style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer' }}>Edit Data</button>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                             <Mail size={14} /> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{student.email}</span>
                           </div>
                           <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.7rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Profile: {student.offerStatus || 'Pending'}</span>
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Stage: {student.studentStatus || 'On Hold'}</span>
                           </div>
                        </div>
                      ))
                   )}
                </div>
              )}
           </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
