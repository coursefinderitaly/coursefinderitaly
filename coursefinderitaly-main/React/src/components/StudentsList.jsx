import React, { useState, useEffect } from 'react';
import { Search, MapPin, UserCheck, Users, Edit2, Trash2, Save, X, Filter } from 'lucide-react';
import Select from 'react-select';
import StudentDetails from './StudentDetails';
import { API_BASE_URL } from '../config';

const StudentsList = ({ profile, setMessage, pendingApplications, setPendingApplications }) => {
  const [students, setStudents] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [filters, setFilters] = useState({ country: '', state: '', isAssigned: '' });
  const [loading, setLoading] = useState(true);
  
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--input-bg)',
      borderColor: state.isFocused ? 'var(--accent-secondary)' : 'var(--input-border)',
      color: 'var(--text-main)',
      minWidth: '180px',
      borderRadius: '10px',
      cursor: 'pointer',
      boxShadow: 'none',
      '&:hover': { borderColor: 'var(--accent-secondary)' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(16px)',
      zIndex: 100,
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'rgba(59, 130, 246, 0.15)' 
        : state.isFocused ? 'rgba(128, 128, 128, 0.1)' : 'transparent',
      color: state.isSelected ? 'var(--accent-secondary)' : 'var(--text-main)',
      cursor: 'pointer',
    }),
    singleValue: (base) => ({ ...base, color: 'var(--text-main)' }),
    input: (base) => ({ ...base, color: 'var(--text-main)' }),
    placeholder: (base) => ({ ...base, color: 'var(--text-muted)' }),
  };

  const assignOptions = [
    { value: '', label: 'Unassigned' },
    ...counselors.map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName || ''} (${c.speciality || 'General'})` }))
  ];

  const offerStatusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Received', label: 'Received' }
  ];

  const studentStatusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Backout', label: 'Backout' },
    { value: 'On Hold', label: 'On Hold' }
  ];

  const filterOptions = [
    { value: '', label: 'All Students' },
    { value: 'true', label: 'Assigned Only' },
    { value: 'false', label: 'Unassigned Only' }
  ];

  useEffect(() => {
    fetchCounselors();
    fetchStudents();
  }, [filters]);

  const fetchCounselors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/erp/counselors`, {
      credentials: 'include',
        });
      if (res.ok) setCounselors(await res.json());
    } catch (err) {}
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE_URL}/erp/students?${query}`, {
      credentials: 'include',
        });
      if (res.ok) setStudents(await res.json());
    } catch (err) { }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSelectFilterChange = (selected) => {
    setFilters({ ...filters, isAssigned: selected ? selected.value : '' });
  };

  const handleAssignCounselor = async (studentId, selectedOption) => {
    const counselorId = selectedOption ? selectedOption.value : '';
    try {
      const res = await fetch(`${API_BASE_URL}/erp/students/${studentId}/assign`, {
      credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ counselorId })
      });
      if (res.ok) {
        fetchStudents();
        if(setMessage) setMessage({ text: 'Counselor assigned successfully.', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      }
    } catch (err) {}
  };

  const handleUpdateOfferStatus = async (studentId, selectedOption) => {
    const offerStatus = selectedOption ? selectedOption.value : 'Pending';
    try {
      const res = await fetch(`${API_BASE_URL}/erp/students/${studentId}`, {
      credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ offerStatus })
      });
      if (res.ok) {
        fetchStudents();
        if(setMessage) setMessage({ text: `Offer status changed to ${offerStatus}`, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      }
    } catch (err) {}
  };

  const handleUpdateStudentStatus = async (studentId, selectedOption) => {
    const studentStatus = selectedOption ? selectedOption.value : 'Active';
    try {
      const res = await fetch(`${API_BASE_URL}/erp/students/${studentId}`, {
      credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ studentStatus })
      });
      if (res.ok) {
        fetchStudents();
        if(setMessage) setMessage({ text: `Student status changed to ${studentStatus}`, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      }
    } catch (err) {}
  };

  const handleEditClick = (student) => {
    setEditingStudentId(student._id);
    setEditFormData({
      firstName: student.firstName, lastName: student.lastName,
      email: student.email, phone: student.phone,
      country: student.country, state: student.state, city: student.city
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/erp/students/${id}`, {
      credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        if(setMessage) setMessage({text: 'Student updated successfully!', type: 'success'});
        setEditingStudentId(null);
        fetchStudents();
      } else {
        const data = await res.json();
        if(setMessage) setMessage({text: data.error || 'Failed to update', type: 'error'});
      }
    } catch(err) {
      if(setMessage) setMessage({text: 'Server error', type: 'error'});
    }
    setTimeout(() => setMessage({text:'', type:''}), 4000);
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to remove this student?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/erp/students/${id}`, {
      credentials: 'include',
        method: 'DELETE',
        });
      if (res.ok) {
        if(setMessage) setMessage({text: 'Student removed successfully.', type: 'success'});
        fetchStudents();
      } else {
        if(setMessage) setMessage({text: 'Failed to remove', type: 'error'});
      }
    } catch(err) {
      if(setMessage) setMessage({text: 'Server error', type: 'error'});
    }
    setTimeout(() => setMessage({text:'', type:''}), 4000);
  };

  if (selectedStudentDetails) {
    return (
      <StudentDetails 
        student={selectedStudentDetails} 
        pendingApplications={pendingApplications}
        setPendingApplications={setPendingApplications}
        isPartnerView={profile.role === 'partner' || profile.role === 'counselor'}
        goBack={() => { setSelectedStudentDetails(null); fetchStudents(); }} 
        refreshProfile={fetchStudents}
      />
    );
  }

  return (
    <div className="view-students">
      <header className="dash-header">
        <div>
          <h1>Student Directory</h1>
          <p>Filter, manage, view profiles, and assign counselors to enrolled students.</p>
        </div>
      </header>

      {pendingApplications && pendingApplications.length > 0 && (
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed var(--accent-secondary)', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
              You have {pendingApplications.length} program(s) selected
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>Please click on a student's row below to continue the application process for them.</p>
          </div>
          <button 
            onClick={() => setPendingApplications && setPendingApplications([])} 
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
          >
            Cancel Application
          </button>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="widget" style={{ marginBottom: '20px', padding: '15px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="theme-flex-filter" style={{ minWidth: '200px' }}>
            <MapPin size={16} className="text-muted" />
            <input type="text" name="country" placeholder="Filter by Country" value={filters.country} onChange={handleFilterChange} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', marginLeft: '8px' }} />
          </div>
          <div className="theme-flex-filter" style={{ minWidth: '200px' }}>
            <MapPin size={16} className="text-muted" />
            <input type="text" name="state" placeholder="Filter by State" value={filters.state} onChange={handleFilterChange} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', marginLeft: '8px' }} />
          </div>
          <div style={{ minWidth: '200px' }}>
            <Select 
              menuPortalTarget={document.body}
              options={filterOptions}
              value={filterOptions.find(o => o.value === filters.isAssigned)}
              onChange={handleSelectFilterChange}
              styles={customSelectStyles}
              placeholder="All Students"
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="widget placeholder-panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px'}}>
          <thead>
            <tr className="theme-header-bg">
              <th style={{padding: '15px'}}>Student Name</th>
              <th style={{padding: '15px'}}>Location</th>
              <th style={{padding: '15px'}}>Contact</th>
              <th style={{padding: '15px'}}>Offer Status</th>
              <th style={{padding: '15px'}}>Student Status</th>
              {profile.role !== 'counselor' && <th style={{padding: '15px'}}>Assigned Counselor</th>}
              <th style={{padding: '15px', textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{padding: '30px', textAlign: 'center'}}>Loading database...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="6" style={{padding: '30px', textAlign: 'center', color: '#9ca3af'}}>No students match the active filters.</td></tr>
            ) : (
              students.map(s => {
                const currentCounselor = s.assignedCounselor 
                  ? assignOptions.find(o => o.value === s.assignedCounselor._id)
                  : assignOptions[0];

                if (editingStudentId === s._id) {
                  return (
                    <tr key={s._id} className="theme-row-border">
                      <td style={{padding: '15px'}}>
                        <input type="text" name="firstName" value={editFormData.firstName} onChange={handleEditChange} className="theme-input" style={{width: '100px', marginBottom: '5px', display: 'block'}} />
                        <input type="text" name="lastName" value={editFormData.lastName} onChange={handleEditChange} className="theme-input" style={{width: '100px', display: 'block'}} />
                      </td>
                      <td style={{padding: '15px'}}>
                        <input type="text" name="city" value={editFormData.city} onChange={handleEditChange} className="theme-input" style={{width: '90px', marginBottom: '5px', display: 'block'}} />
                        <input type="text" name="state" value={editFormData.state} onChange={handleEditChange} className="theme-input" style={{width: '90px', marginBottom: '5px', display: 'block'}} />
                        <input type="text" name="country" value={editFormData.country} onChange={handleEditChange} className="theme-input" style={{width: '90px', display: 'block'}} />
                      </td>
                      <td style={{padding: '15px'}}>
                        <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className="theme-input" style={{width: '130px', marginBottom: '5px', display: 'block'}} />
                        <input type="text" name="phone" value={editFormData.phone} onChange={handleEditChange} className="theme-input" style={{width: '130px', display: 'block'}} />
                      </td>
                      <td style={{padding: '15px', fontSize: '0.8rem'}} className="text-muted">
                        Saved automatically on selection.
                      </td>
                      <td style={{padding: '15px', fontSize: '0.8rem'}} className="text-muted">
                        Status handled in view mode.
                      </td>
                      {profile.role !== 'counselor' && (
                        <td style={{padding: '15px', fontSize: '0.8rem'}} className="text-muted">
                          Counselor assignment handled in view mode.
                        </td>
                      )}
                      <td style={{padding: '15px', textAlign: 'center'}}>
                        <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                          <button onClick={() => handleSaveEdit(s._id)} style={{background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '5px'}} title="Save">
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditingStudentId(null)} style={{background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '5px'}} title="Cancel">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr 
                    key={s._id} 
                    className="theme-row-border" 
                    style={{ transition: 'background 0.2s', cursor: 'pointer' }}
                    onClick={() => setSelectedStudentDetails(s)}
                  >
                    <td style={{padding: '15px'}}>
                      <div style={{fontWeight: '600'}}>{s.firstName} {s.lastName}</div>
                      <div style={{fontSize: '0.8rem'}} className="text-muted">{s.email}</div>
                      {s.createdByCounselor && profile.role === 'partner' && (
                        <div style={{fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '4px', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block'}}>
                          Registered by: {s.createdByCounselor.firstName}
                        </div>
                      )}
                    </td>
                    <td style={{padding: '15px', color: 'var(--text-main)'}}>
                      {s.city}, {s.state}<br/>
                      <span style={{fontSize: '0.8rem'}} className="text-muted">{s.country}</span>
                    </td>
                    <td style={{padding: '15px'}}>
                      <div>{s.email}</div>
                      <div style={{fontSize: '0.8rem'}} className="text-muted">{s.phone}</div>
                    </td>
                    <td style={{padding: '15px'}} onClick={(e) => e.stopPropagation()}>
                      <Select 
                        menuPortalTarget={document.body}
                        options={offerStatusOptions}
                        value={offerStatusOptions.find(o => o.value === (s.offerStatus || 'Pending'))}
                        onChange={(val) => handleUpdateOfferStatus(s._id, val)}
                        styles={{...customSelectStyles, control: (b,st) => ({...customSelectStyles.control(b,st), minWidth: '120px', fontSize: '0.82rem'})}}
                        isSearchable={false}
                      />
                    </td>
                    <td style={{padding: '15px'}} onClick={(e) => e.stopPropagation()}>
                      <Select 
                        menuPortalTarget={document.body}
                        options={studentStatusOptions}
                        value={studentStatusOptions.find(o => o.value === (s.studentStatus || 'Active'))}
                        onChange={(val) => handleUpdateStudentStatus(s._id, val)}
                        styles={{...customSelectStyles, control: (b,st) => ({...customSelectStyles.control(b,st), minWidth: '120px', fontSize: '0.82rem'})}}
                        isSearchable={false}
                      />
                    </td>
                    {profile.role !== 'counselor' && (
                      <td style={{padding: '15px'}} onClick={(e) => e.stopPropagation()}>
                        <Select 
                          menuPortalTarget={document.body}
                          options={assignOptions}
                          value={currentCounselor}
                          onChange={(val) => handleAssignCounselor(s._id, val)}
                          styles={{...customSelectStyles, control: (b,st) => ({...customSelectStyles.control(b,st), minWidth: '160px', fontSize: '0.85rem'})}}
                          isSearchable={true}
                        />
                      </td>
                    )}
                    <td style={{padding: '15px', textAlign: 'center'}} onClick={(e) => e.stopPropagation()}>
                      <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(s); }} style={{background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', opacity: '0.8'}} title="Edit Student">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s._id); }} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: '0.8'}} title="Remove Student">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsList;
