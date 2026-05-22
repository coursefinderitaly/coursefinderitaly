import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Trash2, LogOut, ShieldAlert, Edit2, ChevronLeft, Save, Plus,
  MapPin, Phone, Briefcase, GraduationCap, Building2, UserCircle, KeyRound,
  Database, Server, ShieldCheck, Mail, Sun, Moon, Monitor, Globe, FileText, Unlock, Ban,
  MessageSquare, Send, X, AlertTriangle, Search, Globe2, Activity, Smartphone, RefreshCw,
  Calendar, Download
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useTheme } from '../ThemeContext';
import ManageCounselors from './ManageCounselors';
import StudentDetails from './StudentDetails';

import SystemHierarchy from './SystemHierarchy';
import PartnerDirectoryBrowser from './PartnerDirectoryBrowser';
import SearchableSelect from './SearchableSelect';
import ApplicationTracking from './ApplicationTracking';
import * as XLSX from 'xlsx';

const AdminPortal = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, partners, all
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Editor State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [counselorPopupPartner, setCounselorPopupPartner] = useState(null);
  const [partnerStudentsPopup, setPartnerStudentsPopup] = useState(null);
  const [showCreationTypePopup, setShowCreationTypePopup] = useState(false);
  const [selectedCounselorForPopup, setSelectedCounselorForPopup] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, targetId: null });
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [docDeleteConfirm, setDocDeleteConfirm] = useState({ isOpen: false, filename: null });

  // Visitor Analytics state
  const [visitors, setVisitors] = useState([]);
  const [visitorStats, setVisitorStats] = useState({ total: 0, todayCount: 0, weekCount: 0, monthCount: 0 });
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorDate, setVisitorDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Visitor Resizable Columns State & Handlers
  const [visitorColWidths, setVisitorColWidths] = useState({
    time: 150,
    ip: 130,
    user: 180,
    location: 180,
    browser: 150,
    device: 120,
    page: 180,
    referrer: 160
  });

  const handleVisitorColResizeStart = (columnKey, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = visitorColWidths[columnKey];

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(70, startWidth + deltaX);
      setVisitorColWidths((prev) => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const totalVisitorTableWidth = React.useMemo(() => {
    return Object.values(visitorColWidths).reduce((sum, w) => sum + w, 0);
  }, [visitorColWidths]);

  const visitorColumns = [
    { key: 'time', label: 'Time' },
    { key: 'ip', label: 'IP Address' },
    { key: 'user', label: 'User Profile' },
    { key: 'location', label: 'Location' },
    { key: 'browser', label: 'Browser / OS' },
    { key: 'device', label: 'Device' },
    { key: 'page', label: 'Page' },
    { key: 'referrer', label: 'Referrer' }
  ];

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ type: 'empty', key: `empty-${i}` });
    }
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ type: 'day', day, dateStr, key: `day-${day}` });
    }
    return cells;
  }, [calendarMonth]);

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const [visitorClearConfirm, setVisitorClearConfirm] = useState(false);
  const [chatClearConfirm, setChatClearConfirm] = useState({ isOpen: false, studentId: null, studentName: '' });

  // Chat state
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [openChat, setOpenChat] = useState(null);
  const [chatSending, setChatSending] = useState(false);
  const [totalUnreadChats, setTotalUnreadChats] = useState(0);
  const [chatEditorHeight, setChatEditorHeight] = useState(85);

  const chatBottomRef = useRef(null);
  const chatEditorRef = useRef(null);
  const chatEditorDragRef = useRef(null);

  const startChatResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = chatEditorDragRef.current?.offsetHeight || chatEditorHeight;
    const onMove = (mv) => {
      const delta = mv.clientY - startY;
      const newH = Math.min(400, Math.max(80, startH + delta));
      setChatEditorHeight(newH);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };


  // Admin floating alert state
  const [adminAlertUnread, setAdminAlertUnread] = useState(0);
  const [adminAlertMsg, setAdminAlertMsg] = useState(null);
  const [adminAlertDismissed, setAdminAlertDismissed] = useState(false);
  const [showAdminAlert, setShowAdminAlert] = useState(false);

  // WYSIWYG format commands for contenteditable editor
  const execAdminFormat = (e, command, value) => {
    e.preventDefault();
    chatEditorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  // Messages are stored as HTML — render safely with sanitized dangerouslySetInnerHTML
  const renderChatText = (html) => {
    if (!html) return null;
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, ' ');
  };

  const navigate = useNavigate();

  const { theme, setTheme, activeTheme } = useTheme();

  const fetchChats = async () => {
    setChatsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/chats`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        setTotalUnreadChats(data.reduce((acc, c) => acc + c.unreadCount, 0));
      }
    } catch (err) {
      console.error(err);
    }
    setChatsLoading(false);
  };

  const openChatThread = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/chats/${studentId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOpenChat(data);
        // Refresh chat list to update unread counts
        fetchChats();
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendAdminMessage = async () => {
    const html = chatEditorRef.current?.innerHTML?.trim();
    const text = chatEditorRef.current?.innerText?.trim();
    if (!text || !openChat) return;
    setChatSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/chats/${openChat.studentId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-protected': '1'
        },
        body: JSON.stringify({ text: html })
      });
      if (res.ok) {
        if (chatEditorRef.current) chatEditorRef.current.innerHTML = '';
        // Refresh thread
        await openChatThread(openChat.studentId);
      }
    } catch (err) {
      console.error(err);
    }
    setChatSending(false);
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Auto-fetch visitor stats when viewing overview or visitors tab or changing date filter
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'visitors') {
      fetchVisitors(visitorDate);
    }
  }, [activeTab, visitorDate]);

  // Poll for new student messages every 20 seconds (admin side)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/chats/unread-count`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.unread > 0 && data.unread !== adminAlertUnread) {
            setAdminAlertUnread(data.unread);
            setTotalUnreadChats(data.unread);
            setAdminAlertDismissed(false);
            setShowAdminAlert(true);
            // Fetch preview of latest student message
            try {
              const chatsRes = await fetch(`${API_BASE_URL}/admin/chats`, { credentials: 'include' });
              if (chatsRes.ok) {
                const chatData = await chatsRes.json();
                const withUnread = chatData.filter(c => c.unreadCount > 0);
                if (withUnread.length > 0) {
                  setAdminAlertMsg({ studentName: withUnread[0].studentName, text: withUnread[0].lastMessage?.text });
                }
              }
            } catch (e) {}
          } else {
            setAdminAlertUnread(data.unread);
            setTotalUnreadChats(data.unread);
            if (data.unread === 0) { setShowAdminAlert(false); setAdminAlertMsg(null); }
          }
        }
      } catch (err) {}
    };
    poll();
    const interval = setInterval(poll, 20000);
    return () => clearInterval(interval);
  }, [adminAlertUnread]);

  const checkAdminAccess = async () => {
    try {
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include', });
      const meData = await meRes.json();
      if (!meRes.ok || meData.role !== 'admin') {
        return navigate('/dashboard');
      }
      fetchUsers();
    } catch (err) {
      navigate('/');
    }
  };

  const fetchVisitors = async (selectedDate = visitorDate) => {
    setVisitorsLoading(true);
    try {
      let url = `${API_BASE_URL}/visitors?limit=200`;
      if (selectedDate) {
        url += `&date=${selectedDate}`;
      }
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVisitors(data.visitors || []);
        setVisitorStats({ total: data.total || 0, todayCount: data.todayCount || 0, weekCount: data.weekCount || 0, monthCount: data.monthCount || 0 });
      }
    } catch (err) {
      console.error('[fetchVisitors]', err);
    }
    setVisitorsLoading(false);
  };

  const clearVisitorLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/visitors/clear`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-protected': '1' }
      });
      if (res.ok) {
        setVisitors([]);
        setVisitorStats({ total: 0, todayCount: 0, weekCount: 0, monthCount: 0 });
        setVisitorClearConfirm(false);
      }
    } catch (err) {
      console.error('[clearVisitorLogs]', err);
    }
  };

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/documents`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch documents', type: 'error' });
    }
    setDocumentsLoading(false);
  };

  const clearChatHistory = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/chats/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-protected': '1' }
      });
      if (res.ok) {
        setChatClearConfirm({ isOpen: false, studentId: null, studentName: '' });
        // Refresh the open chat thread
        if (openChat && openChat.studentId === studentId) {
          await openChatThread(studentId);
        }
        fetchChats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async (filename) => {
    setDocDeleteConfirm({ isOpen: true, filename });
  };

  const executeDeleteDocument = async () => {
    const filename = docDeleteConfirm.filename;
    setDocDeleteConfirm({ isOpen: false, filename: null });
    try {
      const res = await fetch(`${API_BASE_URL}/admin/documents/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-protected': '1' }
      });
      if (res.ok) {
        setMessage({ text: 'Document permanently deleted from storage', type: 'success' });
        fetchDocuments();
      } else {
        setMessage({ text: 'Failed to delete document', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Server error deleting document', type: 'error' });
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
      credentials: 'include', });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      setMessage({ text: 'Database synchronization failed', type: 'error' });
    }
    setLoading(false);
  };



  const handleEdit = (user) => {
    setMessage({ text: '', type: '' });
    setSelectedUser(user);
    setFormData(user);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setMessage({ text: '', type: '' });
    setSelectedUser(null);
    setIsAdding(true);
    setFormData({ role: 'student', phone: '+91 ', whatsapp: '+91 ' }); // safe defaults
  };

  const cancelEdit = () => {
    setSelectedUser(null);
    setIsAdding(false);
    setFormData({});
    setMessage({ text: '', type: '' });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirmDialog({ isOpen: true, action: 'save', targetId: null });
  };

  const executeSave = async () => {
    setConfirmDialog({ isOpen: false, action: null, targetId: null });
    setMessage({ text: 'Committing to database...', type: 'info' });
    try {
      // Determine if POST (Add) or PUT (Edit)
      const isNew = isAdding;
      const url = isNew ? `${API_BASE_URL}/admin/users` : `${API_BASE_URL}/admin/users/${selectedUser._id}`;
      const method = isNew ? 'POST' : 'PUT';

      // Validation
      if (!formData.email || !formData.firstName) {
        return setMessage({ text: 'First Name and Email are strictly required fields.', type: 'error' });
      }

      const res = await fetch(url, {
      credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: isNew ? 'Account successfully securely provisioned.' : 'Database record successfully updated.', type: 'success' });
        if (isNew) {
          setUsers([data.user, ...users]);
        } else {
          setUsers(users.map(u => u._id === data.user._id ? data.user : u));
        }
        setTimeout(() => cancelEdit(), 1500);
      } else {
        setMessage({ text: data.error || 'Failed to modify database', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Sever Connection Error', type: 'error' });
    }
  };

  const handleDeleteUser = (id, isSelf) => {
    if (isSelf) return alert("System prevents obliterating your own active session account.");
    setConfirmDialog({ isOpen: true, action: 'delete', targetId: id });
  };

  const handlePermanentDeleteUser = (id) => {
    setConfirmDialog({ isOpen: true, action: 'deletePermanent', targetId: id });
  };

  const executeDelete = async () => {
    const id = confirmDialog.targetId;
    const isPermanent = confirmDialog.action === 'deletePermanent';
    setConfirmDialog({ isOpen: false, action: null, targetId: null });
    try {
      const endpoint = isPermanent ? `${API_BASE_URL}/admin/users/${id}/permanent` : `${API_BASE_URL}/admin/users/${id}`;
      const res = await fetch(endpoint, {
      credentials: 'include',
        method: 'DELETE',
        });
      if (res.ok) {
        fetchUsers();
        setMessage({ text: isPermanent ? 'Entity permanently obliterated.' : 'Entity moved to trash successfully.', type: 'success' });
        if (selectedUser && selectedUser._id === id) cancelEdit();
      } else {
        setMessage({ text: 'Failed to erase entity', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error during deletion', type: 'error' });
    }
  };

  const handleRestoreUser = async (id) => {
    if (!window.confirm("Restore this account to active status?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}/restore`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        fetchUsers();
        setMessage({ text: 'Account restored successfully.', type: 'success' });
      } else {
        setMessage({ text: 'Failed to restore account', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error during restoration', type: 'error' });
    }
  };



  const handleUnlockUser = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}/unlock`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setMessage({ text: data.message, type: 'success' });
        fetchUsers(); // Refresh list to update UI
      } else {
        setMessage({ text: 'Failed to unlock user account', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server connection error', type: 'error' });
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}/toggle-block`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
        fetchUsers(); // Refresh list to update UI
      } else {
        setMessage({ text: data.error || 'Failed to toggle block status', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server connection error', type: 'error' });
    }
  };

  const handleDeleteApplication = async (e, studentId, appId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this application?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${studentId}/applications/${appId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMessage({ text: 'Application deleted successfully', type: 'success' });
        fetchUsers(); // Refresh list to update UI
      } else {
        setMessage({ text: 'Failed to delete application', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server connection error', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(()=>{});
    navigate('/');
  };

  const handleDownloadExcel = () => {
    const wsData = [];
    const addEmptyRow = () => wsData.push([]);

    const directStudents = users.filter(u => u.role === 'student' && !u.registeredBy && !u.createdByCounselor);
    const partners = users.filter(u => u.role === 'partner');
    const counselors = users.filter(u => u.role === 'counselor');

    // 1. DIRECT STUDENTS
    wsData.push(["=== DIRECT STUDENTS ==="]);
    wsData.push(["Full Name", "Email Address", "Phone Number", "Access Level", "Registration Date"]);
    if (directStudents.length > 0) {
      directStudents.forEach(u => {
        wsData.push([`${u.firstName || ''} ${u.lastName || ''}`.trim(), u.email || '', u.phone || '', 'Direct Student', u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '']);
      });
    } else {
      wsData.push(["No direct students found."]);
    }
    addEmptyRow();
    addEmptyRow();

    // 2. PARTNERS
    wsData.push(["=== PARTNERS & THEIR STUDENTS ==="]);
    if (partners.length > 0) {
      partners.forEach(p => {
        const partnerName = p.companyName ? `${p.companyName} (${p.firstName || ''} ${p.lastName || ''})` : `${p.firstName || ''} ${p.lastName || ''}`;
        wsData.push([`[PARTNER] ${partnerName}`, `Email: ${p.email || 'N/A'}`, `Phone: ${p.phone || 'N/A'}`, `Joined: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''}`]);
        
        const pStudents = users.filter(u => u.role === 'student' && u.registeredBy && (u.registeredBy === p._id || u.registeredBy === p.studentUniqueId));
        if (pStudents.length > 0) {
          wsData.push(["", "Student Full Name", "Student Email", "Student Phone", "Access Level", "Registration Date"]);
          pStudents.forEach(stu => {
            wsData.push(["", `${stu.firstName || ''} ${stu.lastName || ''}`.trim(), stu.email || '', stu.phone || '', 'Partner Student', stu.createdAt ? new Date(stu.createdAt).toLocaleDateString('en-IN') : '']);
          });
        } else {
          wsData.push(["", "No students registered under this partner yet."]);
        }
        addEmptyRow();
      });
    } else {
      wsData.push(["No partners found."]);
    }
    addEmptyRow();

    // 3. COUNSELORS / FREELANCERS
    wsData.push(["=== COUNSELORS / FREELANCERS & THEIR STUDENTS ==="]);
    if (counselors.length > 0) {
      counselors.forEach(c => {
        wsData.push([`[COUNSELOR/FREELANCER] ${c.firstName || ''} ${c.lastName || ''}`, `Email: ${c.email || 'N/A'}`, `Phone: ${c.phone || 'N/A'}`, `Joined: ${c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : ''}`]);
        
        const cStudents = users.filter(u => u.role === 'student' && u.createdByCounselor && ((typeof u.createdByCounselor === 'string' && u.createdByCounselor === c._id) || (typeof u.createdByCounselor === 'object' && u.createdByCounselor._id === c._id)));
        if (cStudents.length > 0) {
          wsData.push(["", "Student Full Name", "Student Email", "Student Phone", "Access Level", "Registration Date"]);
          cStudents.forEach(stu => {
            wsData.push(["", `${stu.firstName || ''} ${stu.lastName || ''}`.trim(), stu.email || '', stu.phone || '', 'Counselor Student', stu.createdAt ? new Date(stu.createdAt).toLocaleDateString('en-IN') : '']);
          });
        } else {
          wsData.push(["", "No students registered under this counselor yet."]);
        }
        addEmptyRow();
      });
    } else {
      wsData.push(["No counselors/freelancers found."]);
    }

    // Flat list of All Students Sheet
    const activeStudents = users.filter(u => u.role === 'student' && u.isDeleted !== true);
    const studentsSheetData = [
      ["S.No", "Full Name", "Email Address", "Phone Number", "Access Level", "Registered By / Owner", "Total Applications", "Registration Date"]
    ];

    activeStudents.forEach((stu, idx) => {
      const partnerId = stu.registeredBy;
      const partner = partnerId ? users.find(p => p.role === 'partner' && (p._id === partnerId || p.studentUniqueId === partnerId)) : null;
      const partnerName = partner ? (partner.companyName || `${partner.firstName} ${partner.lastName || ''}`.trim()) : (partnerId || '');
      
      const counselorId = typeof stu.createdByCounselor === 'string' ? stu.createdByCounselor : (stu.createdByCounselor?._id || null);
      const counselor = counselorId ? users.find(c => c._id === counselorId) : null;
      const counselorName = counselor ? `${counselor.firstName} ${counselor.lastName || ''}`.trim() : '';

      let level = 'Direct Student';
      let owner = '-';
      if (partnerId) {
        level = 'Partner Student';
        owner = partnerName;
      } else if (counselorId) {
        level = 'Counselor Student';
        owner = counselorName;
      }

      const totalApps = (stu.appliedUniversities || []).filter(app => app && typeof app === 'object' && app.id).length;
      const regDate = stu.createdAt ? new Date(stu.createdAt).toLocaleDateString('en-IN') : '';

      studentsSheetData.push([
        idx + 1,
        `${stu.firstName || ''} ${stu.lastName || ''}`.trim(),
        stu.email || '',
        stu.phone || '',
        level,
        owner,
        totalApps,
        regDate
      ]);
    });

    const workbook = XLSX.utils.book_new();

    // Add Flat Students Sheet first
    const wsStudents = XLSX.utils.aoa_to_sheet(studentsSheetData);
    wsStudents['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 30 }, // Full Name
      { wch: 35 }, // Email Address
      { wch: 20 }, // Phone Number
      { wch: 20 }, // Access Level
      { wch: 30 }, // Registered By
      { wch: 18 }, // Total Applications
      { wch: 20 }, // Registration Date
    ];
    XLSX.utils.book_append_sheet(workbook, wsStudents, "All Students Database");

    // Add Structured Directory Sheet second
    const wsDirectory = XLSX.utils.aoa_to_sheet(wsData);
    wsDirectory['!cols'] = [
      { wch: 38 }, 
      { wch: 35 }, 
      { wch: 35 }, 
      { wch: 20 }, 
      { wch: 20 }, 
    ];
    XLSX.utils.book_append_sheet(workbook, wsDirectory, "Structured Directory");

    // Generate filename dynamically replacing "downlaoddate" with current formatted date
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const formattedDate = `${dd}_${mm}_${yyyy}`;
    
    // Write out the file
    XLSX.writeFile(workbook, `Coursefinder_${formattedDate}.xlsx`);
  };

  const filteredUsers = useMemo(() => {
    const nonAdmins = users.filter(u => u.role !== 'admin');
    if (activeTab === 'trash') return nonAdmins.filter(u => u.isDeleted === true);
    
    const activeNonAdmins = nonAdmins.filter(u => u.isDeleted !== true);

    if (activeTab === 'all' || activeTab === 'overview' || activeTab === 'applications') return activeNonAdmins;
    if (activeTab === 'direct_students') return activeNonAdmins.filter(u => u.role === 'student' && !u.registeredBy && !u.createdByCounselor);
    if (activeTab === 'partner_students') return activeNonAdmins.filter(u => u.role === 'student' && (!!u.registeredBy || !!u.createdByCounselor));
    if (activeTab === 'partners') return activeNonAdmins.filter(u => u.role === 'partner');
    return activeNonAdmins;
  }, [users, activeTab]);

  const allApplications = useMemo(() => {
    const apps = [];
    users.filter(u => u.role === 'student' && u.isDeleted !== true).forEach(student => {
      const validApps = (student.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);
      validApps.forEach(app => {
        
        const partnerId = student.registeredBy;
        const partner = partnerId ? users.find(p => p.role === 'partner' && (p._id === partnerId || p.studentUniqueId === partnerId)) : null;
        const partnerName = partner ? (partner.companyName || `${partner.firstName} ${partner.lastName || ''}`.trim()) : partnerId;
        const counselorId = typeof student.createdByCounselor === 'string' ? student.createdByCounselor : (student.createdByCounselor?._id || null);
        const counselor = counselorId ? users.find(c => c._id === counselorId) : null;
        const counselorName = counselor ? `${counselor.firstName} ${counselor.lastName || ''}`.trim() : 'Counselor';

        let sourceLabel = 'Direct Student';
        if (partnerId && counselorId) {
          sourceLabel = `Partner: ${partnerName} > Counselor: ${counselorName}`;
        } else if (partnerId) {
          sourceLabel = `Partner: ${partnerName}`;
        } else if (counselorId) {
          sourceLabel = `In-house Counselor: ${counselorName}`;
        }
        
        apps.push({
          ...app,
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          studentEmail: student.email,
          studentPhone: student.phone,
          source: sourceLabel
        });
      });
    });
    return apps.reverse(); // Put newest at the top
  }, [users]);

  const stats = {
    total: users.filter(u => u.role !== 'admin' && u.role !== 'counselor' && u.isDeleted !== true).length,
    directStudents: users.filter(u => u.role === 'student' && !u.registeredBy && !u.createdByCounselor && u.isDeleted !== true).length,
    partnerStudents: users.filter(u => u.role === 'student' && (!!u.registeredBy || !!u.createdByCounselor) && u.isDeleted !== true).length,
    partners: users.filter(u => u.role === 'partner' && u.isDeleted !== true).length,
    admins: users.filter(u => u.role === 'admin' && u.isDeleted !== true).length
  };

  if (loading) return (
    <div className="dash-universe loading" style={{ background: 'var(--bg-primary)' }}>
      <div className="loader" style={{ borderTopColor: 'var(--accent-secondary)' }}></div>
      <p style={{ color: 'var(--text-main)', letterSpacing: '2px', textTransform: 'uppercase' }}>Authenticating God Mode...</p>
    </div>
  );

  return (
    <div className="dash-universe" style={{ display: 'flex', background: 'var(--bg-primary)', color: 'var(--text-main)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        ></div>
      )}

      {/* SIDEBAR PANEL */}
      <aside className={`dash-sidebar ${!isSidebarOpen && window.innerWidth <= 768 ? 'mobile-closed' : ''}`} style={{ 
        width: '280px', 
        padding: '1.5rem 1rem', 
        background: 'var(--bg-secondary)', 
        borderRight: '1px solid var(--glass-border)', 
        display: 'flex', 
        flexDirection: 'column',
        position: window.innerWidth <= 768 ? 'fixed' : 'relative',
        transform: window.innerWidth <= 768 && !isSidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        zIndex: 1000,
        height: '100vh',
        transition: 'transform 0.3s ease'
      }}>
        <div style={{ paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <img src="/logo.png" alt="Company Logo" style={{ maxHeight: '42px', maxWidth: '100px', objectFit: 'contain', flexShrink: 0, filter: activeTheme === 'light' ? 'invert(1)' : 'none' }} />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap' }}>SysAdmin</h2>
              <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px', whiteSpace: 'nowrap' }}>ROOT ACCESS</div>
            </div>
          </div>
        </div>



        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <Database size={18} /> Global Overview
          </button>
          <div className="nav-divider" style={{ background: 'var(--glass-border)', margin: '15px 0' }}></div>
          <button className={`nav-item ${activeTab === 'direct_students' ? 'active' : ''}`} onClick={() => { setActiveTab('direct_students'); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <GraduationCap size={18} /> Direct Students
          </button>
          <button className={`nav-item ${activeTab === 'partner_students' ? 'active' : ''}`} onClick={() => { setActiveTab('partner_students'); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <Users size={18} /> Partner Students
          </button>
          <button className={`nav-item ${activeTab === 'partners' ? 'active' : ''}`} onClick={() => { setActiveTab('partners'); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <Briefcase size={18} /> Business Partners
          </button>
          <div className="nav-divider" style={{ background: 'var(--glass-border)', margin: '15px 0' }}></div>
          <button className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => { setActiveTab('applications'); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <FileText size={18} /> Applied Applications
          </button>
          <button className={`nav-item ${activeTab === 'uploaded_documents' ? 'active' : ''}`} onClick={() => { setActiveTab('uploaded_documents'); fetchDocuments(); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <Database size={18} /> Uploaded Documents
          </button>
          <button 
            className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('chats'); fetchChats(); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}
            style={{ position: 'relative' }}
          >
            <MessageSquare size={18} /> Student Chats
            {totalUnreadChats > 0 && (
              <span style={{ position: 'absolute', top: '8px', right: '12px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {totalUnreadChats > 9 ? '9+' : totalUnreadChats}
              </span>
            )}
          </button>
          
          <button className={`nav-item ${activeTab === 'visitors' ? 'active' : ''}`} onClick={() => { setActiveTab('visitors'); fetchVisitors(); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <Globe2 size={18} /> Visitor Analytics
          </button>

          <button className={`nav-item ${activeTab === 'trash' ? 'active' : ''}`} onClick={() => { setActiveTab('trash'); cancelEdit(); if(window.innerWidth<=768) setIsSidebarOpen(false); }}>
            <Trash2 size={18} /> Trash / Restorations
          </button>

          <button className="nav-item logout-btn" onClick={handleLogout} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', width: '100%', justifyContent: 'center', marginTop: '2.5rem' }}>
            <LogOut size={18} /> Secure Disconnect
          </button>
        </nav>

      </aside>

      {/* MAIN CONTENT PANEL */}
      <main className="dash-main" style={{ padding: '1.5rem 2rem', flex: 1, overflowY: activeTab === 'overview' ? 'hidden' : 'auto' }}>

        {viewingStudentProfile ? (
          <div className="animate-fade-in" style={{ background: 'var(--card-bg-solid)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)' }}>
             <StudentDetails 
               student={viewingStudentProfile}
               goBack={() => setViewingStudentProfile(null)}
               isPartnerView={true}
               refreshProfile={fetchUsers}
             />
          </div>
        ) : (
          <>
        {message.text && (
          <div className="status-pill" style={{
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: message.type === 'error' ? '#ef4444' : '#10b981',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            {message.type === 'error' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
            {message.text}
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: LEDGER TABLE */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding && activeTab !== 'applications' && activeTab !== 'uploaded_documents' && activeTab !== 'chats' && activeTab !== 'visitors') && (
          <div className="animate-fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {activeTab === 'overview' ? 'System Overview' : activeTab === 'all' ? 'Master Ledger' : activeTab === 'direct_students' ? 'Direct Student Database' : activeTab === 'partner_students' ? 'Partner-Registered Students' : activeTab === 'trash' ? 'Trash / Restorations' : 'Partner Database'}
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{activeTab === 'trash' ? 'Restore or permanently delete removed accounts.' : 'Directly manage and manipulate raw data records.'}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  style={{ display: window.innerWidth <= 768 ? 'flex' : 'none', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', alignItems: 'center', padding: '5px' }}
                >
                  <Monitor size={24} />
                </button>

                {/* EXPORT BUTTON */}
                <button onClick={handleDownloadExcel} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 15px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'; }}>
                  <Download size={16} /> Export Data
                </button>

                {/* Theme Toggle Group */}
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <button onClick={() => setTheme('light')} style={{ background: theme === 'light' ? 'var(--accent-primary)' : 'transparent', color: theme === 'light' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Light Mode"><Sun size={14} /></button>
                  <button onClick={() => setTheme('dark')} style={{ background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent', color: theme === 'dark' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Dark Mode"><Moon size={14} /></button>
                  <button onClick={() => setTheme('system')} style={{ background: theme === 'system' ? 'var(--accent-primary)' : 'transparent', color: theme === 'system' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="System Sync"><Monitor size={14} /></button>
                </div>
                <button className="btn-save" onClick={() => setShowCreationTypePopup(true)} style={{ background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', color: '#fff' }}>
                  <Plus size={18} /> Create Account
                </button>
              </div>
            </header>

            {activeTab === 'overview' && (
              <>
              <div className="admin-stats-grid" style={{ gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#60a5fa', fontSize: '2.5rem', fontWeight: 800 }}>{stats.total}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Total Records</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#34d399', fontSize: '2.5rem', fontWeight: 800 }}>{stats.directStudents}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Direct Students</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '2.5rem', fontWeight: 800 }}>{stats.partnerStudents}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Partner Students</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '15px', borderRadius: '16px' }}>
                  <div style={{ color: '#c084fc', fontSize: '2.5rem', fontWeight: 800 }}>{stats.partners}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Partners</div>
                </div>
              </div>

              {/* ── Website Traffic Mini-Widget ── */}
              <div
                onClick={() => { setActiveTab('visitors'); fetchVisitors(); cancelEdit(); }}
                style={{
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.07), rgba(139,92,246,0.07))',
                  border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  marginBottom: '30px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor='rgba(6,182,212,0.5)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(6,182,212,0.12)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='rgba(6,182,212,0.2)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <Globe2 size={20} color="#06b6d4" />
                    <span style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-main)', letterSpacing:'-0.3px' }}>Website Traffic</span>
                    {visitorsLoading && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontStyle:'italic' }}>loading…</span>}
                  </div>
                  <span style={{ fontSize:'0.72rem', color:'#06b6d4', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}>
                    View Full Analytics →
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                  {[
                    { label:'Today',      value: visitorStats.todayCount,  color:'#06b6d4' },
                    { label:'This Week',  value: visitorStats.weekCount,   color:'#8b5cf6' },
                    { label:'This Month', value: visitorStats.monthCount,  color:'#f59e0b' },
                    { label:'All Time',   value: visitorStats.total,       color:'#10b981' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'1.8rem', fontWeight:800, color:s.color, lineHeight:1 }}>
                        {visitorsLoading ? '…' : s.value}
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:'4px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}

            {activeTab !== 'overview' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Users size={18} color="#10b981" />
                  Showing <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{activeTab === 'partner_students' ? users.filter(u => u.role === 'partner').length : filteredUsers.length}</span> {activeTab === 'partner_students' ? 'Partner Clusters' : 'Active Database Records'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Real-time Synchronized</div>
              </div>
            )}

            {activeTab === 'partner_students' ? (
              <PartnerDirectoryBrowser users={users} onStudentClick={(u) => setViewingStudentProfile(u)} />
            ) : activeTab === 'overview' ? (
              <SystemHierarchy users={users} onStudentClick={(u) => setViewingStudentProfile(u)} />
            ) : (
            <div className="data-table-wrapper" style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflowX: 'auto', boxShadow: 'var(--shadow-lg)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Entity Name</th>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Identifiers</th>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Access Level</th>
                    <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3f3f46, #27272a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                            {u.firstName ? u.firstName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div 
                              onClick={() => {
                                if (u.role === 'partner') setPartnerStudentsPopup(u);
                                else if (u.role === 'student') setViewingStudentProfile(u);
                              }}
                              style={{ 
                                color: u.role === 'partner' ? 'var(--accent-secondary)' : (u.role === 'student' ? 'var(--accent-primary)' : 'var(--text-main)'), 
                                fontWeight: 600, 
                                fontSize: '0.95rem', 
                                cursor: (u.role === 'partner' || u.role === 'student') ? 'pointer' : 'default',
                                textDecoration: u.role === 'student' ? 'underline' : 'none',
                                textDecorationColor: u.role === 'student' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                                textUnderlineOffset: '4px'
                              }}
                              onMouseOver={(e) => { 
                                if(u.role === 'student') {
                                  e.currentTarget.style.color = '#60a5fa'; 
                                  e.currentTarget.style.textDecorationColor = '#60a5fa'; 
                                }
                              }}
                              onMouseOut={(e) => { 
                                if(u.role === 'student') {
                                  e.currentTarget.style.color = 'var(--accent-primary)'; 
                                  e.currentTarget.style.textDecorationColor = 'rgba(59, 130, 246, 0.3)'; 
                                }
                              }}
                              title={u.role === 'student' ? "Open Complete Student Profile" : (u.role === 'partner' ? "View Assigned Students" : "")}
                            >
                              {u.firstName} {u.lastName}
                            </div>
                            {u.role === 'partner' && (
                              <div 
                                onClick={() => setPartnerStudentsPopup(u)}
                                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'color 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                              >
                                <Building2 size={10} /> {u.companyName || 'No Company'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.phone || 'No Phone Data'}</div>
                        {u.createdAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                            <Activity size={10} />
                            Joined: {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{
                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                            background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : u.role === 'partner' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                            color: u.role === 'admin' ? '#ef4444' : u.role === 'partner' ? '#a78bfa' : '#34d399',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.3)' : u.role === 'partner' ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.3)'}`
                          }}>
                            {u.role}
                          </span>
                          
                          {u.role === 'student' && (
                            <div style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 600, 
                              color: u.registeredBy ? (theme === 'light' ? '#b45309' : '#fbbf24') : (u.createdByCounselor ? (theme === 'light' ? '#1d4ed8' : '#60a5fa') : (theme === 'light' ? '#4b5563' : '#9ca3af')),
                              background: u.registeredBy ? 'rgba(251,191,36,0.1)' : (u.createdByCounselor ? 'rgba(96,165,250,0.1)' : 'rgba(156,163,175,0.1)'),
                              border: `1px solid ${u.registeredBy ? 'rgba(251,191,36,0.3)' : (u.createdByCounselor ? 'rgba(96,165,250,0.3)' : 'rgba(156,163,175,0.3)')}`,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex'
                            }}>
                              {(() => {
                                const partnerId = u.registeredBy;
                                const partner = partnerId ? users.find(p => p.role === 'partner' && (p._id === partnerId || p.studentUniqueId === partnerId)) : null;
                                const partnerName = partner ? (partner.companyName || `${partner.firstName} ${partner.lastName || ''}`.trim()) : partnerId;
                                
                                const counselorId = typeof u.createdByCounselor === 'string' ? u.createdByCounselor : (u.createdByCounselor?._id || null);
                                const counselor = counselorId ? users.find(c => c._id === counselorId) : null;
                                const counselorName = counselor ? `${counselor.firstName} ${counselor.lastName || ''}`.trim() : 'Counselor';

                                if (partnerId && counselorId) {
                                  return `Partner: ${partnerName} > Counselor: ${counselorName}`;
                                } else if (partnerId) {
                                  return `Partner: ${partnerName}`;
                                } else if (counselorId) {
                                  return `In-house Counselor: ${counselorName}`;
                                } else {
                                  return `Direct Student`;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {activeTab === 'trash' ? (
                            <>
                              <button onClick={() => handleRestoreUser(u._id)} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                                <RefreshCw size={14} /> Restore
                              </button>
                              <button onClick={() => handlePermanentDeleteUser(u._id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Trash2 size={14} /> Permanently Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(u)} style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                                <Edit2 size={14} /> Modify
                              </button>
                              <button onClick={() => handleDeleteUser(u._id, u.role === 'admin')} disabled={u.role === 'admin'} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: u.role === 'admin' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, opacity: u.role === 'admin' ? 0.3 : 1 }}>
                                <Trash2 size={14} /> Obliterate
                              </button>
                              <button 
                                onClick={() => handleToggleBlock(u._id)} 
                                disabled={u.role === 'admin'}
                                style={{ 
                                  background: u.isBlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                                  color: u.isBlocked ? '#10b981' : '#f59e0b', 
                                  border: `1px solid ${u.isBlocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, 
                                  padding: '8px 12px', borderRadius: '8px', cursor: u.role === 'admin' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, opacity: u.role === 'admin' ? 0.3 : 1 
                                }}
                              >
                                <Ban size={14} /> {u.isBlocked ? 'Unblock Account' : 'Block Assistant'}
                              </button>
                              {u.lockUntil && new Date(u.lockUntil) > new Date() && (
                                <button onClick={() => handleUnlockUser(u._id)} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                  <Unlock size={14} /> Unlock Access
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '50px 30px', textAlign: 'center', color: '#a1a1aa' }}>
                      <Database size={40} style={{ margin: '0 auto 15px auto', opacity: 0.2 }} />
                      <div>No entities match this criteria.</div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: APPLICATIONS LEDGER */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding && activeTab === 'applications') && (
           <div className="animate-fade-in">
             {selectedApp ? (() => {
                const studentForApp = users.find(u => u._id === selectedApp.studentId);
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
             })() : (
               <>
                 <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  Global Applications Ledger
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>View all finalized university applications submitted system-wide.</p>
              </div>
            </header>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                <FileText size={18} color="#10b981" />
                Showing <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{allApplications.length}</span> Finalized Applications
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {allApplications.length === 0 ? (
                <div className="empty-state" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>No applications submitted yet.</div>
              ) : (
                allApplications.map((app, idx) => (
                  <div 
                    key={idx} 
                    className="widget hover:border-[var(--accent-secondary)]" 
                    onClick={() => setSelectedApp(app)}
                    style={{ padding: '20px', border: '1px solid var(--glass-border)', background: 'var(--card-bg-solid)', borderRadius: '12px', transition: 'all 0.2s ease', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Building2 size={20} className="text-muted" /> {app.name}
                          </h4>
                          <button 
                            onClick={(e) => handleDeleteApplication(e, app.studentId, app.id)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginLeft: 'auto' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'none'; }}
                            title="Delete Application"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {app.location && app.location !== 'null' ? app.location : 'Location Not Specified'}</span>
                          {app.level && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>{app.level === 'null' ? 'Degree' : app.level}</span>}
                        </div>

                        <div style={{ marginTop: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                              <UserCircle size={16} className="text-muted" /> {app.studentName}
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              <Phone size={14} className="text-muted" /> {app.studentPhone || 'No Phone Data'}
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '10px' }}>
                              Source: <span style={{ color: 'var(--text-main)', fontWeight: 500, background: 'var(--glass-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-secondary)' }}>{app.source}</span>
                           </div>
                        </div>
                      </div>
                      <div>
                        {app.programs && app.programs.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', marginTop: '5px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Applied Programs</div>
                            {app.programs.map((prog, pIdx) => (
                              <span key={pIdx} style={{ background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                {prog}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
             </>
             )}
           </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: UPLOADED DOCUMENTS */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding && activeTab === 'uploaded_documents') && (
           <div className="animate-fade-in">
             <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
               <div>
                 <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                   Uploaded Documents Storage
                 </h1>
                 <p style={{ color: 'var(--text-muted)', margin: 0 }}>Review and download candidate documents synced from storage.</p>
               </div>
               <div>
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={documentSearchTerm}
                    onChange={(e) => setDocumentSearchTerm(e.target.value)}
                    style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '10px 15px', borderRadius: '8px', minWidth: '250px', outline: 'none' }}
                  />
               </div>
             </header>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {documentsLoading ? (
                 <div className="empty-state" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>Scanning storage...</div>
               ) : documents.filter(d => d.filename.toLowerCase().includes(documentSearchTerm.toLowerCase())).length === 0 ? (
                 <div className="empty-state" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>No matched documents found.</div>
               ) : (
                 documents.filter(d => d.filename.toLowerCase().includes(documentSearchTerm.toLowerCase())).map((doc, idx) => (
                   <div key={idx} className="widget hover:border-[var(--accent-secondary)]" style={{ padding: '20px', border: '1px solid var(--glass-border)', background: 'var(--card-bg-solid)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 auto' }}>
                        <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1.1rem', wordBreak: 'break-all' }}>
                           {doc.filename}
                        </h4>
                        <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                          <span>Size: {(doc.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>Uploaded: {new Date(doc.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--input-bg)', padding: '5px 10px', borderRadius: '4px' }}>
                          <FileText size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> 
                          <strong>Storage Route:</strong> {doc.filePath}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                           onClick={() => handleDeleteDocument(doc.filename)}
                           style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                        <a href={doc.downloadUrl} download style={{ background: 'var(--accent-primary)', color: '#fff', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Database size={16} /> Download
                        </a>
                      </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: VISITOR ANALYTICS                                                          */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding && activeTab === 'visitors') && (
          <div className="animate-fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Globe2 size={28} color="#06b6d4" /> Visitor Analytics
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Real-time website visitor intelligence. Every front-page visit is logged here.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={fetchVisitors}
                  style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <RefreshCw size={15} /> Refresh
                </button>
                <button
                  onClick={() => setVisitorClearConfirm(true)}
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <Trash2 size={15} /> Clear Logs
                </button>
              </div>
            </header>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Today', value: visitorStats.todayCount, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
                { label: 'This Week', value: visitorStats.weekCount, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
                { label: 'This Month', value: visitorStats.monthCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
                { label: 'All Time', value: visitorStats.total, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '14px', padding: '18px 20px' }}>
                  <div style={{ color: stat.color, fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>{visitorsLoading ? '…' : stat.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filter Bar */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {/* Search */}
              <div style={{ flex: '1 1 300px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by IP, country, browser, city, user…"
                  value={visitorSearch}
                  onChange={e => setVisitorSearch(e.target.value)}
                  style={{
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--glass-border)',
                    padding: '10px 16px 10px 40px',
                    borderRadius: '10px',
                    width: '100%',
                    outline: 'none',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-secondary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>

              {/* Custom Date Filter Button with Calendar Popover */}
              <div ref={calendarRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    minHeight: '44px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
                  onMouseLeave={e => {
                    if (!showCalendar) e.currentTarget.style.borderColor = 'var(--glass-border)';
                  }}
                >
                  <Calendar size={18} color="var(--accent-secondary)" />
                  <span>
                    {visitorDate 
                      ? `${new Date(visitorDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Select Date'
                    }
                  </span>
                  {visitorDate && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-secondary)',
                      textTransform: 'uppercase',
                      marginLeft: '4px'
                    }}>
                      ({(() => {
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const d = new Date(visitorDate);
                        return isNaN(d.getTime()) ? '' : days[d.getDay()];
                      })()})
                    </span>
                  )}
                </button>

                {/* Calendar Popover */}
                {showCalendar && (
                  <div style={{
                    position: 'absolute',
                    top: '52px',
                    right: windowWidth < 768 ? 'auto' : 0,
                    left: windowWidth < 768 ? 0 : 'auto',
                    zIndex: 1000,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '14px',
                    padding: '16px',
                    width: '280px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    boxSizing: 'border-box'
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px', outline: 'none' }}>&lt;</button>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px', outline: 'none' }}>&gt;</button>
                    </div>

                    {/* Weekdays */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <span key={d} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d}</span>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                      {calendarCells.map((cell, index) => {
                        if (cell.type === 'empty') {
                          return <div key={index} />;
                        }

                        const isSelected = visitorDate === cell.dateStr;
                        const isToday = new Date().toISOString().slice(0, 10) === cell.dateStr;

                        return (
                          <button
                            key={cell.key}
                            onClick={() => {
                              setVisitorDate(cell.dateStr);
                              setShowCalendar(false);
                            }}
                            style={{
                              background: isSelected ? 'var(--accent-secondary)' : 'transparent',
                              color: isSelected ? '#fff' : 'var(--text-main)',
                              border: isToday ? '1px solid var(--accent-secondary)' : 'none',
                              borderRadius: '6px',
                              padding: '6px 0',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s',
                              outline: 'none'
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Actions */}
                    {visitorDate && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setVisitorDate('');
                            setShowCalendar(false);
                          }}
                          style={{
                            background: 'transparent',
                            color: '#ef4444',
                            border: 'none',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            outline: 'none'
                          }}
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            {visitorsLoading ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading visitor data…</div>
            ) : (
              <div className="visitor-scroll-container" style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflowX: 'auto', overflowY: 'auto', maxHeight: '550px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                <style>{`
                  .visitor-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: var(--glass-border, rgba(255, 255, 255, 0.15)) transparent;
                  }
                  .visitor-scroll-container::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                  }
                  .visitor-scroll-container::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .visitor-scroll-container::-webkit-scrollbar-thumb {
                    background: var(--glass-border, rgba(255, 255, 255, 0.15));
                    border-radius: 10px;
                    transition: background-color 0.2s;
                  }
                  .visitor-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: var(--accent-secondary, #06b6d4);
                  }
                  .visitor-col-resizer {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 6px;
                    cursor: col-resize;
                    user-select: none;
                    z-index: 10;
                    background: transparent;
                    transition: background-color 0.2s;
                  }
                  .visitor-col-resizer:hover, .visitor-col-resizer:active {
                    background-color: var(--accent-secondary) !important;
                  }
                `}</style>
                <table style={{ width: `${totalVisitorTableWidth}px`, tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 12 }}>
                    <tr>
                      {visitorColumns.map(col => (
                        <th 
                          key={col.key} 
                          style={{ 
                            padding: '12px 16px', 
                            color: '#a1a1aa', 
                            fontSize: '0.72rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px', 
                            fontWeight: 600, 
                            whiteSpace: 'nowrap',
                            position: 'relative',
                            width: `${visitorColWidths[col.key]}px`,
                            boxSizing: 'border-box',
                            background: 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--glass-border)'
                          }}
                        >
                          <div style={{ marginRight: '10px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.label}</div>
                          <div 
                            onMouseDown={(e) => handleVisitorColResizeStart(col.key, e)}
                            className="visitor-col-resizer"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitors
                      .filter(v => {
                        if (!visitorSearch) return true;
                        const q = visitorSearch.toLowerCase();
                        return (
                          (v.ip || '').toLowerCase().includes(q) ||
                          (v.country || '').toLowerCase().includes(q) ||
                          (v.city || '').toLowerCase().includes(q) ||
                          (v.browser || '').toLowerCase().includes(q) ||
                          (v.os || '').toLowerCase().includes(q) ||
                          (v.userName || '').toLowerCase().includes(q) ||
                          (v.userEmail || '').toLowerCase().includes(q) ||
                          (v.userRole || '').toLowerCase().includes(q)
                        );
                      })
                      .map((v, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <div style={{ color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(v.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                          </td>
                          <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#06b6d4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.ip}>{v.ip}</td>
                          
                          {/* Logged in User Profile */}
                          <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.userName ? (
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <div style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.userName}>{v.userName}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.userEmail}>{v.userEmail}</div>
                                <span style={{
                                  background: v.userRole === 'admin' ? 'rgba(239, 68, 68, 0.1)' : v.userRole === 'partner' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                  color: v.userRole === 'admin' ? '#ef4444' : v.userRole === 'partner' ? '#fbbf24' : '#60a5fa',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  display: 'inline-block',
                                  marginTop: '2px'
                                }}>
                                  {v.userRole}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Guest</span>
                            )}
                          </td>

                          <td style={{ padding: '10px 16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <div style={{ color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.country}>{v.country}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={[v.city, v.regionName].filter(Boolean).join(', ')}>{[v.city, v.regionName].filter(Boolean).join(', ')}</div>
                            {v.isp && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.isp}>{v.isp}</div>}
                          </td>
                          <td style={{ padding: '10px 16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <div style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.browser}>{v.browser}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.os}>{v.os}</div>
                          </td>
                          <td style={{ padding: '10px 16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(() => {
                              const isMobile = /Mobile|iPhone|Android|Phone/i.test(v.device);
                              const isTablet = /Tablet|iPad/i.test(v.device);
                              
                              let bg = 'rgba(16,185,129,0.1)';
                              let color = '#34d399';
                              let border = 'rgba(16,185,129,0.3)';
                              
                              if (isMobile) {
                                bg = 'rgba(139,92,246,0.1)';
                                color = '#a78bfa';
                                border = 'rgba(139,92,246,0.3)';
                              } else if (isTablet) {
                                bg = 'rgba(245,158,11,0.1)';
                                color = '#fbbf24';
                                border = 'rgba(245,158,11,0.3)';
                              }
                              
                              return (
                                <span style={{
                                  background: bg,
                                  color: color,
                                  border: `1px solid ${border}`,
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.5px',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '100%'
                                }} title={v.device}>
                                  {v.device}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.page}>{v.page}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.referrer === 'Direct' || !v.referrer ? (
                              <span style={{ color: '#10b981', fontWeight: 600 }}>Direct</span>
                            ) : (
                              <span title={v.referrer}>{v.referrer}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    }
                    {visitors.filter(v => {
                      if (!visitorSearch) return true;
                      const q = visitorSearch.toLowerCase();
                      return (
                        (v.ip||'').toLowerCase().includes(q) ||
                        (v.country||'').toLowerCase().includes(q) ||
                        (v.city||'').toLowerCase().includes(q) ||
                        (v.browser||'').toLowerCase().includes(q) ||
                        (v.os||'').toLowerCase().includes(q) ||
                        (v.userName||'').toLowerCase().includes(q) ||
                        (v.userEmail||'').toLowerCase().includes(q) ||
                        (v.userRole||'').toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <tr><td colSpan="8" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Globe2 size={40} style={{ margin: '0 auto 15px auto', opacity: 0.2, display: 'block' }} />
                        {visitorSearch ? 'No visitors match your search.' : 'No visitors recorded yet. Visit the website to generate data.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Clear confirm dialog */}
            {visitorClearConfirm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%' }}>
                  <h3 style={{ color: '#ef4444', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle size={20} /> Clear All Visitor Logs</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0' }}>This will permanently delete all {visitorStats.total} visitor records. This action cannot be undone.</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setVisitorClearConfirm(false)} style={{ padding: '10px 20px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button onClick={clearVisitorLogs} style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Yes, Clear All</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: ADMIN CHATS                                                                */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding && activeTab === 'chats') && (
          <div className="animate-fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <MessageSquare size={28} color="#8b5cf6" /> Student Chats
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Direct messaging between admin and students. New student messages appear here.</p>
              </div>
              <button onClick={fetchChats} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ↻ Refresh
              </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: openChat ? '320px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

              {/* INBOX LIST */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--table-header-bg)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#8b5cf6" /> Inbox
                    {totalUnreadChats > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>{totalUnreadChats} unread</span>}
                  </h3>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={chatSearchTerm}
                      onChange={(e) => setChatSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-main)',
                        padding: '8px 12px 8px 34px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>
                </div>

                  {chatsLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading chats...</div>
                  ) : chats.length === 0 ? (
                    <div style={{ padding: '50px 30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <MessageSquare size={40} style={{ opacity: 0.2, marginBottom: '15px', display: 'block', margin: '0 auto 15px' }} />
                      <div style={{ fontWeight: 600 }}>No student messages yet</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>When students send you messages, they'll appear here.</div>
                    </div>
                  ) : (() => {
                    // Client-side Filter + Sort: unread first, then by last message time, then alphabetical
                    const filtered = chats.filter(c => {
                      const matchesSearch = c.studentName.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
                                            c.studentEmail.toLowerCase().includes(chatSearchTerm.toLowerCase());
                      return matchesSearch && (c.lastMessage || c.unreadCount > 0);
                    });

                    const sorted = [...filtered].sort((a, b) => {
                      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
                      if (a.lastMessage && b.lastMessage) return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
                      if (a.lastMessage) return -1;
                      if (b.lastMessage) return 1;
                      return a.studentName.localeCompare(b.studentName);
                    });
                    const unreadChats = sorted.filter(c => c.unreadCount > 0);
                    const readChats = sorted.filter(c => c.unreadCount === 0);

                    const renderChatItem = (chat) => (
                      <div
                        key={chat.studentId}
                        onClick={() => openChatThread(chat.studentId)}
                        style={{
                          padding: '14px 20px',
                          borderBottom: '1px solid var(--glass-border)',
                          cursor: 'pointer',
                          background: openChat?.studentId === chat.studentId ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                          borderLeft: openChat?.studentId === chat.studentId ? '3px solid #8b5cf6' : '3px solid transparent',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { if (openChat?.studentId !== chat.studentId) e.currentTarget.style.background = 'var(--input-bg)'; }}
                        onMouseOut={e => { if (openChat?.studentId !== chat.studentId) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: chat.unreadCount > 0 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                              {chat.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: chat.unreadCount > 0 ? 800 : 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {chat.studentName}
                                {chat.unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '0.65rem', fontWeight: 800 }}>{chat.unreadCount} new</span>}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: chat.unreadCount > 0 ? 'var(--text-main)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', marginTop: '2px', fontWeight: chat.unreadCount > 0 ? 600 : 400 }}>
                                {chat.lastMessage ? `${chat.lastMessage.sender === 'admin' ? 'You: ' : ''}${stripHtml(chat.lastMessage.text)}` : <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No messages — click to start</span>}
                              </div>
                            </div>
                          </div>
                          {chat.lastMessage && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(chat.lastMessage.timestamp).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    );

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {unreadChats.length > 0 && (
                          <>
                            <div style={{ padding: '6px 16px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#ef4444', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid var(--glass-border)' }}>● Unread ({unreadChats.length})</div>
                            {unreadChats.map(renderChatItem)}
                          </>
                        )}
                        {readChats.length > 0 && (
                          <>
                            {unreadChats.length > 0 && <div style={{ padding: '6px 16px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', background: 'var(--table-header-bg)', borderBottom: '1px solid var(--glass-border)' }}>All Students</div>}
                            {readChats.map(renderChatItem)}
                          </>
                        )}
                      </div>
                    );
                  })()}
              </div>

              {/* CHAT THREAD */}
              {openChat && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '600px' }}>
                  {/* Thread Header */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--glass-border)', background: 'var(--table-header-bg)', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
                        {openChat.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{openChat.studentName}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{openChat.studentEmail}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => setChatClearConfirm({ isOpen: true, studentId: openChat.studentId, studentName: openChat.studentName })}
                        title="Clear chat history"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', height: '26px', padding: '0 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                      >
                        <Trash2 size={11} /> Clear
                      </button>
                      <button onClick={() => setOpenChat(null)} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {(openChat.messages || []).length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px', fontSize: '0.9rem' }}>No messages yet. Start the conversation!</div>
                    ) : (
                      (openChat.messages || []).map((msg, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '75%',
                            minWidth: 0,
                            padding: '8px 12px',
                            borderRadius: msg.sender === 'admin' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: msg.sender === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'var(--input-bg)',
                            color: msg.sender === 'admin' ? '#fff' : 'var(--text-main)',
                            border: msg.sender === 'admin' ? 'none' : '1px solid var(--glass-border)',
                            fontSize: '0.82rem',
                            lineHeight: '1.5',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            overflow: 'hidden'
                          }}>
                            {renderChatText(msg.text)}
                            <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '4px', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(msg.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Message input — WYSIWYG contenteditable editor */}
                  <div style={{ padding: '6px 12px 10px', borderTop: '1px solid var(--glass-border)' }}>

                    {/* Toolbar row: formatting buttons + send button on the right */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '2px', padding: '2px 4px', background: 'var(--input-bg)', borderRadius: '6px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                        <button
                          onMouseDown={(e) => execAdminFormat(e, 'bold')}
                          title="Bold"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontWeight: 900, fontSize: '0.82rem', lineHeight: 1, fontFamily: 'serif' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >B</button>
                        <button
                          onMouseDown={(e) => execAdminFormat(e, 'italic')}
                          title="Italic"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontStyle: 'italic', fontSize: '0.82rem', lineHeight: 1, fontFamily: 'serif' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >I</button>
                        <div style={{ width: '1px', background: 'var(--glass-border)', margin: '2px 2px', height: '14px' }} />
                        <button
                          onMouseDown={(e) => execAdminFormat(e, 'fontSize', '2')}
                          title="Small text"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >A-</button>
                        <button
                          onMouseDown={(e) => execAdminFormat(e, 'fontSize', '5')}
                          title="Large text"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1 }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >A+</button>
                      </div>
                      <button
                        onClick={sendAdminMessage}
                        disabled={chatSending}
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.78rem', flexShrink: 0 }}
                      >
                        <Send size={13} /> Send
                      </button>
                    </div>

                    {/* Full-width resizable editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <div
                        ref={(el) => { chatEditorRef.current = el; chatEditorDragRef.current = el; }}
                        contentEditable
                        suppressContentEditableWarning
                        onKeyDown={e => { /* Enter inserts new line (default); Ctrl+Enter or Send button to send */ }}

                        data-placeholder="Type a message… (Shift+Enter for newline, Enter to send)"
                        style={{
                          width: '100%',
                          height: `${chatEditorHeight}px`,
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
                        onMouseDown={startChatResize}
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
                        {/* Grip lines */}
                        {[0,1,2,3,4,5].map(i => (
                          <div key={i} style={{ width: '22px', height: '2px', borderRadius: '2px', background: 'rgba(139,92,246,0.4)' }} />
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: DATA EDITOR / CREATOR */}
        {/* -------------------------------------------------------------------------------- */}
        {(selectedUser || isAdding) && (
          <div className="animate-fade-in">

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <button onClick={cancelEdit} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '15px', fontWeight: 600 }}>
                  <ChevronLeft size={16} /> Return to Ledger
                </button>
                <h1 style={{ color: 'var(--text-main)', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {isAdding ? "Create Master Entity" : "Entity Configuration"}
                  {!isAdding && <span style={{ fontSize: '0.85rem', background: 'var(--input-bg)', padding: '4px 12px', borderRadius: '12px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', fontWeight: 'normal' }}>ID: {selectedUser._id}</span>}
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Absolute control over database structure vectors.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {!isAdding && (
                  <button onClick={() => handleDeleteUser(selectedUser._id, selectedUser.role === 'admin')} disabled={selectedUser.role === 'admin'} style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: selectedUser.role === 'admin' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: selectedUser.role === 'admin' ? 0.3 : 1 }}>
                    <Trash2 size={16} /> Destroy
                  </button>
                )}
                <button onClick={handleSave} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -10px rgba(16, 185, 129, 0.5)' }}>
                  <Save size={16} /> Commit Changes
                </button>
              </div>
            </header>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

              {/* SECTION: ACCESS CONTROL */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Server size={18} color="#a78bfa" /> System & Access Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clearance Level (Role) *</label>
                    <SearchableSelect 
                      name="role" 
                      value={formData.role || ''} 
                      onChange={handleChange} 
                      required 
                      options={[
                        { value: 'student', label: 'Student (Standard)' },
                        { value: 'counselor', label: 'Counselor (Sub-Agent)' },
                        { value: 'partner', label: 'Business Partner' }
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isAdding ? "Initial Master Password" : "Reset Access Password"}</label>
                    <input type="text" name="password" value={formData.password || ''} onChange={handleChange} placeholder={isAdding ? "Auto-generated if left blank" : "Leave blank to keep current"} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* SECTION: PERSONAL IDENTITY */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><UserCircle size={18} color="#60a5fa" /> Personal Identity Vector</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary Email *</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required style={{ background: 'var(--input-bg)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>First Name / Given Name *</label>
                    <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last Name / Surname</label>
                    <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* SECTION: CONNECTIVITY & LOCATION */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Globe size={18} color="#34d399" /> Geolocation & Connectivity Nodes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Signature</label>
                    <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp Signature</label>
                    <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sovereign Country</label>
                    <input type="text" name="country" value={formData.country || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>State / Province</label>
                    <input type="text" name="state" value={formData.state || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>City</label>
                    <input type="text" name="city" value={formData.city || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* SECTION: STUDENT OWNERSHIP & ASSIGNMENT */}
              {formData.role === 'student' && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Building2 size={18} color="#fbbf24" /> Master Ownership & Assignment</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Registered By (Partner)</label>
                      <SearchableSelect 
                        name="registeredBy" 
                        value={formData.registeredBy || ''} 
                        onChange={handleChange}
                        placeholder="-- Direct Student (No Partner) --"
                        options={[
                          { value: '', label: '-- Direct Student (No Partner) --' },
                          ...users.filter(u => u.role === 'partner').map(p => ({ value: p._id, label: p.companyName || `${p.firstName} ${p.lastName || ''}`.trim() }))
                        ]}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Counselor</label>
                      <SearchableSelect 
                        name="assignedCounselor" 
                        value={formData.assignedCounselor || ''} 
                        onChange={handleChange}
                        placeholder="-- No Counselor --"
                        options={[
                          { value: '', label: '-- No Counselor --' },
                          ...users.filter(u => u.role === 'counselor' && (!formData.registeredBy || u.parentPartner === formData.registeredBy)).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName || ''}`.trim() }))
                        ]}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Root Creator (Counselor)</label>
                      <SearchableSelect 
                        name="createdByCounselor" 
                        value={formData.createdByCounselor || ''} 
                        onChange={handleChange}
                        placeholder="-- Direct Registration --"
                        options={[
                          { value: '', label: '-- Direct Registration --' },
                          ...users.filter(u => u.role === 'counselor' && (!formData.registeredBy || u.parentPartner === formData.registeredBy)).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName || ''}`.trim() }))
                        ]}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: COUNSELOR ONLY (DYNAMIC) */}
              {formData.role === 'counselor' && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '16px', padding: '20px', boxShadow: '0 0 30px rgba(236, 72, 153, 0.05)', marginTop: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ec4899', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Briefcase size={18} /> Sub-Agent Affiliation</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Parent Partner Agency *</label>
                    <SearchableSelect 
                      name="parentPartner" 
                      value={formData.parentPartner || ''} 
                      onChange={handleChange}
                      required
                      placeholder="-- Select Parent Partner --"
                      options={[
                        { value: '', label: '-- Select Parent Partner --' },
                        ...users.filter(u => u.role === 'partner').map(p => ({ value: p._id, label: p.companyName || `${p.firstName} ${p.lastName || ''}`.trim() }))
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* SECTION: PARTNER ONLY (DYNAMIC) */}
              {formData.role === 'partner' && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '16px', padding: '20px', boxShadow: '0 0 30px rgba(124, 58, 237, 0.05)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '1.1rem' }}><Briefcase size={18} color="#a78bfa" /> Business B2B Configuration</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Company Entity Name</label>
                      <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Company Headquarters Address</label>
                      <input type="text" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizational Designation</label>
                      <input type="text" name="designation" value={formData.designation || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reported Team Size</label>
                      <input type="text" name="teamSize" value={formData.teamSize || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', gridColumn: '1 / -1', marginTop: '10px' }}>
                      <input type="checkbox" name="priorExperience" checked={formData.priorExperience || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }} />
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>Has Prior Overseas Experience</label>
                    </div>
                  </div>
                </div>
              )}

            </form>
            
            {/* INJECTED COUNSELOR MANAGEMENT DIRECTORY FOR PARTNERS */}
            {!isAdding && formData.role === 'partner' && selectedUser && (
              <div style={{ marginTop: '30px', background: 'var(--card-bg-solid)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', padding: '20px', boxShadow: '0 0 30px rgba(59, 130, 246, 0.05)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6', margin: '0 0 20px 0', fontSize: '1.1rem' }}>
                  <Users size={18} /> Affiliated Counselors Directory
                </h3>
                <ManageCounselors setMessage={setMessage} targetPartnerId={selectedUser._id} />
              </div>
            )}

          </div>
        )}
        </>)}
      </main>

      {/* PARTNER STUDENTS POPUP */}
      {partnerStudentsPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-primary)', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg-solid)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color="#10b981" /> Students Registered By {partnerStudentsPopup.companyName || `${partnerStudentsPopup.firstName} ${partnerStudentsPopup.lastName}`}</h2>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage student metadata originating from this partner cluster.</p>
              </div>
              <button 
                onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); }} 
                style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-main)'}
              >
                <div style={{ fontWeight: 'bold' }}>X</div>
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {(() => {
                const allPartnerStudents = users.filter(u => u.role === 'student' && u.registeredBy && (u.registeredBy === partnerStudentsPopup._id || (partnerStudentsPopup.studentUniqueId && u.registeredBy === partnerStudentsPopup.studentUniqueId)));
                
                const groupedStudents = {};
                const partnerCounselors = users.filter(u => u.role === 'counselor' && u.parentPartner === partnerStudentsPopup._id);
                partnerCounselors.forEach(c => { groupedStudents[c._id] = []; });
                groupedStudents['direct'] = [];

                allPartnerStudents.forEach(student => {
                  let counselorId = typeof student.assignedCounselor === 'string' ? student.assignedCounselor : student.assignedCounselor?._id;
                  if (!counselorId) counselorId = typeof student.createdByCounselor === 'string' ? student.createdByCounselor : student.createdByCounselor?._id;
                  counselorId = counselorId || 'direct';

                  if (!groupedStudents[counselorId]) groupedStudents[counselorId] = [];
                  groupedStudents[counselorId].push(student);
                });

                if (selectedCounselorForPopup) {
                   const cId = selectedCounselorForPopup.cId;
                   const isDirect = cId === 'direct';
                   const groupName = isDirect ? 'Directly Registered by Partner' : `${selectedCounselorForPopup.firstName} ${selectedCounselorForPopup.lastName || ''}`.trim();
                   const groupStudents = groupedStudents[cId] || [];

                   return (
                      <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
                          <button onClick={() => setSelectedCounselorForPopup(null)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: 0 }}>
                             <ChevronLeft size={16} /> Directory Matrix
                          </button>
                          <button onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); setFormData({ role: 'student', password: '', registeredBy: partnerStudentsPopup._id, createdByCounselor: isDirect ? '' : cId }); setIsAdding(true); }} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                             <Plus size={16} /> Register Local Student
                          </button>
                        </div>
                        <h3 style={{ color: isDirect ? 'var(--text-main)' : 'var(--accent-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                          {isDirect ? <Building2 size={20} /> : <Briefcase size={20} />} {groupName} 
                          <span style={{ fontSize: '0.75rem', background: isDirect ? 'rgba(255,255,255,0.1)' : 'rgba(124, 58, 237, 0.1)', color: isDirect ? 'var(--text-muted)' : '#a78bfa', padding: '4px 10px', borderRadius: '12px', marginLeft: 'auto' }}>
                            {groupStudents.length} Assigned Students
                          </span>
                        </h3>
                        <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                              <tr>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Entity Name</th>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Identifiers</th>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Access Level</th>
                                <th style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupStudents.length === 0 ? (
                                <tr>
                                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Users size={30} style={{ opacity: 0.3, marginBottom: '10px' }} />
                                    <div>No students currently assigned to this directory.</div>
                                  </td>
                                </tr>
                              ) : groupStudents.map(u => (
                                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3f3f46, #27272a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                                        {u.firstName ? u.firstName.charAt(0).toUpperCase() : '?'}
                                      </div>
                                      <div 
                                        onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); setViewingStudentProfile(u); }}
                                        style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'underline', textDecorationColor: 'rgba(59, 130, 246, 0.3)', textUnderlineOffset: '4px' }}
                                        onMouseOver={(e) => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.textDecorationColor = '#60a5fa'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.textDecorationColor = 'rgba(59, 130, 246, 0.3)'; }}
                                        title="Open Complete Student Profile"
                                      >
                                        {u.firstName} {u.lastName}
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.phone || 'No Phone Data'}</div>
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>student</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <button onClick={() => { setPartnerStudentsPopup(null); setSelectedCounselorForPopup(null); handleEdit(u); }} style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                                        <Edit2 size={14} /> Modify
                                      </button>
                                      <button onClick={() => handleDeleteUser(u._id, false)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <Trash2 size={14} /> Obliterate
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                   );
                }

                // Render Level 1 - Grid of Counselors
                const counselorIds = Object.keys(groupedStudents);

                return (
                  <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {counselorIds.map(cId => {
                      const isDirect = cId === 'direct';
                      const counselorObj = isDirect ? null : users.find(u => u._id === cId);
                      if (!isDirect && !counselorObj) return null;

                      const groupName = isDirect ? 'Direct Registration' : `${counselorObj.firstName} ${counselorObj.lastName || ''}`.trim();
                      const groupStudents = groupedStudents[cId] || [];

                      return (
                         <div 
                           key={cId} 
                           onClick={() => setSelectedCounselorForPopup(isDirect ? { cId: 'direct' } : { ...counselorObj, cId: counselorObj._id })} 
                           className="partner-card-hover" 
                           style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} 
                           onMouseOver={(e) => { e.currentTarget.style.borderColor = isDirect ? 'rgba(16, 185, 129, 0.5)' : 'rgba(236, 72, 153, 0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} 
                           onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                         >
                           <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                             {isDirect ? <Building2 size={20} color="#10b981" /> : <Briefcase size={20} color="#ec4899" />} 
                             {isDirect ? 'Partner Direct Network' : groupName}
                           </h3>
                           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 15px 30px' }}>
                             {isDirect ? 'Managed directly by Partner' : 'Sub-Agent / Counselor Database'}
                           </p>
                           <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: isDirect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 72, 153, 0.1)', color: isDirect ? '#10b981' : '#ec4899', margin: '0 0 0 30px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                              <Users size={16} /> {groupStudents.length} Assigned Students
                           </div>
                         </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL OVERLAY */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'var(--card-bg-solid)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
              {(confirmDialog.action === 'delete' || confirmDialog.action === 'deletePermanent') ? <Trash2 color="#ef4444" /> : <Save color="#10b981" />}
              {confirmDialog.action === 'delete' ? 'Move to Trash' : confirmDialog.action === 'deletePermanent' ? 'Confirm Permanent Deletion' : 'Confirm Changes'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {confirmDialog.action === 'delete'
                ? "This will move the user to the Trash. They will lose access immediately, but can be restored later. Proceed?"
                : confirmDialog.action === 'deletePermanent'
                ? "This will permanently obliterate the user and all associated application data. This destructive action cannot be undone. Proceed?"
                : "Are you sure you want to permanently commit these modifications to the global database?"}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDialog({ isOpen: false, action: null, targetId: null })} style={{ padding: '10px 20px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={(confirmDialog.action === 'delete' || confirmDialog.action === 'deletePermanent') ? executeDelete : executeSave} style={{ padding: '10px 20px', background: (confirmDialog.action === 'delete' || confirmDialog.action === 'deletePermanent') ? '#ef4444' : '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                {confirmDialog.action === 'delete' ? 'Move to Trash' : confirmDialog.action === 'deletePermanent' ? 'Obliterate Entity' : 'Commit Database Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT DELETE CONFIRMATION MODAL */}
      {docDeleteConfirm.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div className="animate-fade-in" style={{ background: 'var(--card-bg-solid)', padding: '28px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)', maxWidth: '420px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>Confirm File Deletion</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>This action is permanent and irreversible.</p>
              </div>
            </div>
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>File to be deleted</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.9rem' }}>{docDeleteConfirm.filename}</div>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.6' }}>
              This will <strong style={{ color: '#ef4444' }}>permanently erase</strong> this file from server storage. It cannot be recovered once deleted.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDocDeleteConfirm({ isOpen: false, filename: null })} style={{ padding: '10px 22px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={executeDeleteDocument} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px -8px rgba(239,68,68,0.5)' }}>
                <Trash2 size={16} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATION TYPE SELECTION POPUP */}
      {showCreationTypePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
           <div style={{ background: 'var(--card-bg-solid)', padding: '30px', borderRadius: '24px', border: '1px solid var(--glass-border)', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative' }}>
            <button 
              onClick={() => setShowCreationTypePopup(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--input-bg)', border: 'none', color: 'var(--text-muted)', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ fontWeight: 'bold' }}>X</div>
            </button>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 10px 0', fontSize: '1.4rem' }}>Initialize New Entity</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px' }}>Select the specific database schema architecture you wish to deploy.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => { setFormData({ role: 'student', password: '' }); setIsAdding(true); setShowCreationTypePopup(false); }}
                style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#34d399'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              >
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '10px', display: 'flex' }}><GraduationCap size={20} /></div>
                Student Registration
              </button>
              
              <button 
                onClick={() => { setFormData({ role: 'counselor', password: '' }); setIsAdding(true); setShowCreationTypePopup(false); }}
                style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.color = '#f472b6'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              >
                <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '10px', borderRadius: '10px', display: 'flex' }}><Briefcase size={20} /></div>
                Counselor (Sub-Agent)
              </button>

              <button 
                onClick={() => { setFormData({ role: 'partner', password: '', priorExperience: false }); setIsAdding(true); setShowCreationTypePopup(false); }}
                style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.color = '#c4b5fd'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              >
                <div style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '10px', borderRadius: '10px', display: 'flex' }}><Building2 size={20} /></div>
                Business Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR CHAT CONFIRMATION MODAL */}
      {chatClearConfirm.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card-bg-solid)', width: '100%', maxWidth: '400px', borderRadius: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'modalSlideUp 0.3s ease-out' }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={30} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Clear Chat History?</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Are you sure you want to clear the conversation with <strong>{chatClearConfirm.studentName}</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--table-header-bg)', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setChatClearConfirm({ isOpen: false, studentId: null, studentName: '' })}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => clearChatHistory(chatClearConfirm.studentId)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
              >
                Clear Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
