import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import { 
  Shield, Activity, Database, BookOpen, Layers, Users, Trophy, Award, 
  Bell, Image, FileText, ArrowLeft, RefreshCw, Plus, Trash2, Edit3, 
  CheckCircle, AlertTriangle, Eye, Upload, Key, Zap, Flame, Lock, ChevronRight, Check, Crop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AuditLog, CMSNotice, Contest, Course, Lesson, WordBank } from '../../types';
import ImageCropModal from '../ImageCropModal';

interface Props {
  userToken: string;
  currentUser: User | null;
  onExitToArena: () => void;
  onBrandingUpdated?: () => void;
}

type CMUTab = 
  | 'OVERVIEW'
  | 'CMS_CORE'
  | 'WORDBANKS'
  | 'CURRICULUM'
  | 'USERS'
  | 'CONTESTS'
  | 'CERTIFICATES'
  | 'NOTICES'
  | 'BRANDING'
  | 'AUDIT_LOGS';

export default function ControlManagementUnit({
  userToken,
  currentUser,
  onExitToArena,
  onBrandingUpdated
}: Props) {
  const [activeTab, setActiveTab] = useState<CMUTab>('OVERVIEW');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Telemetry Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttempts: 0,
    totalCertificates: 0,
    totalContests: 0,
    activeRoomsCount: 0,
    serverUptimeSeconds: 0,
    memoryUsageMb: 0,
    nodeVersion: 'v20'
  });

  // Users Directory
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Wordbanks
  const [wordbanks, setWordbanks] = useState<WordBank[]>([]);
  const [newBankTitle, setNewBankTitle] = useState('');
  const [newBankCategory, setNewBankCategory] = useState<'tech' | 'common200' | 'common1000' | 'quotes' | 'code' | 'custom'>('tech');
  const [newBankWords, setNewBankWords] = useState('');
  const [newBankDifficulty, setNewBankDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');

  // Curriculum & Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<Course | null>(null);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDifficulty, setNewCourseDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro'>('Beginner');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonText, setNewLessonText] = useState('');
  const [newLessonInstructions, setNewLessonInstructions] = useState('');
  const [newLessonTargetFinger, setNewLessonTargetFinger] = useState('index');

  // CMS Content Hub
  const [cmsItems, setCmsItems] = useState<any[]>([]);
  const [cmsTypeFilter, setCmsTypeFilter] = useState('timeline');
  const [newCmsKey, setNewCmsKey] = useState('');
  const [newCmsTitle, setNewCmsTitle] = useState('');
  const [newCmsShortDesc, setNewCmsShortDesc] = useState('');
  const [newCmsFullDesc, setNewCmsFullDesc] = useState('');
  const [newCmsDate, setNewCmsDate] = useState('');
  const [newCmsColor, setNewCmsColor] = useState('cyan');

  // Contests
  const [contests, setContests] = useState<Contest[]>([]);
  const [newContestTitle, setNewContestTitle] = useState('');
  const [newContestDesc, setNewContestDesc] = useState('');
  const [newContestText, setNewContestText] = useState('');
  const [newContestDuration, setNewContestDuration] = useState(60);

  // Certificates
  const [allCerts, setAllCerts] = useState<any[]>([]);

  // Notices
  const [notices, setNotices] = useState<CMSNotice[]>([]);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');

  // Branding Settings
  const [logoInput, setLogoInput] = useState('');
  const [mSquareInput, setMSquareInput] = useState('');
  const [miraCoreInput, setMiraCoreInput] = useState('');
  const [founderPicInput, setFounderPicInput] = useState('');
  const [founderPicSize, setFounderPicSize] = useState(48);
  const [adminSigInput, setAdminSigInput] = useState('');

  // Image Cropper Modal State
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    aspectRatio: 'circle' | 'square';
    title: string;
    targetField: 'logo' | 'mSquare' | 'miraCore' | 'founderPic';
  }>({
    isOpen: false,
    imageSrc: '',
    aspectRatio: 'circle',
    title: 'Crop Image',
    targetField: 'founderPic'
  });

  const handleFileForCropping = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'logo' | 'mSquare' | 'miraCore' | 'founderPic',
    aspectRatio: 'circle' | 'square',
    title: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropModal({
          isOpen: true,
          imageSrc: reader.result,
          aspectRatio,
          title,
          targetField
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCroppedSave = (croppedDataUrl: string) => {
    if (cropModal.targetField === 'founderPic') {
      setFounderPicInput(croppedDataUrl);
      handleSaveBrandingField('founder-picture', 'founderPicture', croppedDataUrl);
    } else if (cropModal.targetField === 'logo') {
      setLogoInput(croppedDataUrl);
      handleSaveBrandingField('logo', 'websiteLogo', croppedDataUrl);
    } else if (cropModal.targetField === 'mSquare') {
      setMSquareInput(croppedDataUrl);
      handleSaveBrandingField('m-square-logo', 'mSquareLogo', croppedDataUrl);
    } else if (cropModal.targetField === 'miraCore') {
      setMiraCoreInput(croppedDataUrl);
      handleSaveBrandingField('mira-core-logo', 'miraCoreLogo', croppedDataUrl);
    }
    showToast(`${cropModal.title} cropped and saved!`);
  };

  // Audit Logs
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4500);
  };

  // Initial Data Fetch
  useEffect(() => {
    loadAllCMUData();
  }, [userToken]);

  const loadAllCMUData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchTelemetryStats(),
        fetchUsers(),
        fetchWordbanks(),
        fetchCourses(),
        fetchCMSItems(),
        fetchContests(),
        fetchAllCertificates(),
        fetchNotices(),
        fetchBranding(),
        fetchLogs()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTelemetryStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (e) {}
  };

  const fetchWordbanks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/wordbanks`);
      if (res.ok) {
        const data = await res.json();
        setWordbanks(data || []);
      }
    } catch (e) {}
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/lessons`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data || []);
        if (data && data.length > 0 && !selectedCourseForEdit) {
          setSelectedCourseForEdit(data[0]);
        }
      }
    } catch (e) {}
  };

  const fetchCMSItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCmsItems(data || []);
      }
    } catch (e) {}
  };

  const fetchContests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contests`);
      if (res.ok) {
        const data = await res.json();
        setContests(data || []);
      }
    } catch (e) {}
  };

  const fetchAllCertificates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/certificates/all`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllCerts(data || []);
      }
    } catch (e) {}
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notices`);
      if (res.ok) {
        const data = await res.json();
        setNotices(data || []);
      }
    } catch (e) {}
  };

  const fetchBranding = async () => {
    try {
      const endpoints = [
        { slug: 'logo', setter: setLogoInput, field: 'websiteLogo' },
        { slug: 'm-square-logo', setter: setMSquareInput, field: 'mSquareLogo' },
        { slug: 'mira-core-logo', setter: setMiraCoreInput, field: 'miraCoreLogo' },
        { slug: 'founder-picture', setter: setFounderPicInput, field: 'founderPicture' },
        { slug: 'admin-signature', setter: setAdminSigInput, field: 'adminSignaturePic' }
      ];
      for (const item of endpoints) {
        const res = await fetch(`${API_URL}/api/settings/${item.slug}`);
        if (res.ok) {
          const d = await res.json();
          if (d[item.field]) item.setter(d[item.field]);
        }
      }
      const sizeRes = await fetch(`${API_URL}/api/settings/founder-picture-size`);
      if (sizeRes.ok) {
        const sd = await sizeRes.json();
        if (sd.founderPictureSize) setFounderPicSize(Number(sd.founderPictureSize));
      }
    } catch (e) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {}
  };

  // User Actions
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showToast(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        showToast('Failed to update role', 'error');
      }
    } catch (e) {
      showToast('Error updating role', 'error');
    }
  };

  const handleUpdateBalance = async (userId: string, coins: number, xp: number, level: number) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/balance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ coins, xp, level })
      });
      if (res.ok) {
        showToast('User balance saved successfully');
        setEditingUser(null);
        fetchUsers();
      } else {
        showToast('Failed to save balance', 'error');
      }
    } catch (e) {
      showToast('Error saving balance', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        showToast('User deleted successfully');
        fetchUsers();
      } else {
        showToast('Failed to delete user', 'error');
      }
    } catch (e) {
      showToast('Error deleting user', 'error');
    }
  };

  // Wordbank Actions
  const handleCreateWordbank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/wordbanks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: newBankTitle,
          category: newBankCategory,
          words: newBankWords,
          difficulty: newBankDifficulty
        })
      });
      if (res.ok) {
        showToast('New wordbank created');
        setNewBankTitle('');
        setNewBankWords('');
        fetchWordbanks();
      } else {
        showToast('Failed to create wordbank', 'error');
      }
    } catch (e) {
      showToast('Network error creating wordbank', 'error');
    }
  };

  const handleDeleteWordbank = async (id: string) => {
    if (!confirm('Delete this wordbank?')) return;
    try {
      const res = await fetch(`${API_URL}/api/wordbanks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        showToast('Wordbank deleted');
        fetchWordbanks();
      }
    } catch (e) {}
  };

  // Course Actions
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/lessons/course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: newCourseTitle,
          difficulty: newCourseDifficulty,
          category: newCourseDifficulty
        })
      });
      if (res.ok) {
        showToast('New course created');
        setNewCourseTitle('');
        fetchCourses();
      }
    } catch (e) {}
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEdit || !newLessonTitle.trim() || !newLessonText.trim()) return;
    try {
      const courseObjId = (selectedCourseForEdit as any)._id || selectedCourseForEdit.id;
      const res = await fetch(`${API_URL}/api/lessons/course/${courseObjId}/lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: newLessonTitle,
          text: newLessonText,
          instructions: newLessonInstructions,
          targetFinger: newLessonTargetFinger,
          minWpm: 20,
          minAccuracy: 90
        })
      });
      if (res.ok) {
        showToast('Lesson added to curriculum');
        setNewLessonTitle('');
        setNewLessonText('');
        setNewLessonInstructions('');
        fetchCourses();
      }
    } catch (e) {}
  };

  // CMS Hub Actions
  const handleCreateCmsItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmsKey.trim() || !newCmsTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/cms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          contentType: cmsTypeFilter,
          key: newCmsKey,
          title: newCmsTitle,
          shortDescription: newCmsShortDesc,
          fullDescription: newCmsFullDesc,
          date: newCmsDate,
          color: newCmsColor
        })
      });
      if (res.ok) {
        showToast('CMS content item published');
        setNewCmsKey('');
        setNewCmsTitle('');
        setNewCmsShortDesc('');
        setNewCmsFullDesc('');
        fetchCMSItems();
      } else {
        showToast('Failed to save CMS item', 'error');
      }
    } catch (e) {}
  };

  const handleDeleteCmsItem = async (id: string) => {
    if (!confirm('Delete this CMS item?')) return;
    try {
      const res = await fetch(`${API_URL}/api/cms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        showToast('CMS item deleted');
        fetchCMSItems();
      }
    } catch (e) {}
  };

  // Certificate Status Action
  const handleCertStatus = async (certId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/certificates/${certId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Certificate status set to ${status}`);
        fetchAllCertificates();
      }
    } catch (e) {}
  };

  // Notice Actions
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/cms/notice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ title: newNoticeTitle, content: newNoticeContent })
      });
      if (res.ok) {
        showToast('Flash notice broadcasted');
        setNewNoticeTitle('');
        setNewNoticeContent('');
        fetchNotices();
      }
    } catch (e) {}
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/cms/notice/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        showToast('Notice removed');
        fetchNotices();
      }
    } catch (e) {}
  };

  // Save Branding
  const handleSaveBrandingField = async (slug: string, fieldName: string, value: any) => {
    try {
      const res = await fetch(`${API_URL}/api/settings/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ [fieldName]: value })
      });
      if (res.ok) {
        showToast(`Saved ${slug} successfully`);
        if (onBrandingUpdated) onBrandingUpdated();
      } else {
        showToast(`Failed to update ${slug}`, 'error');
      }
    } catch (e) {
      showToast(`Error saving ${slug}`, 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s)) ||
      (u.role && u.role.toLowerCase().includes(s))
    );
  });

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-[#00F3FF]/30 selection:text-white">
      
      {/* ================= CMU TOP COMMAND HEADER ================= */}
      <header className="sticky top-0 z-50 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 shadow-2xl flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center font-display font-extrabold text-white text-lg shadow-[0_0_25px_rgba(0,243,255,0.4)] border border-cyan-300/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider font-display uppercase text-white">
                CONTROL MANAGEMENT <span className="text-[#00F3FF]">UNIT</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00F3FF]/15 text-[#00F3FF] border border-[#00F3FF]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F3FF] animate-ping" />
                CMU v2.6 OPS
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 block">
              Autonomous Governance, CMS Hub, Wordbanks & System Engine
            </span>
          </div>
        </div>

        {/* Center Live Telemetry Indicators */}
        <div className="hidden lg:flex items-center gap-6 font-mono text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>DB: <strong className="text-emerald-300">ONLINE</strong></span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div>
            <span>RAM: <strong className="text-cyan-300">{stats.memoryUsageMb} MB</strong></span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div>
            <span>UPTIME: <strong className="text-purple-300">{Math.floor(stats.serverUptimeSeconds / 60)}m</strong></span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div>
            <span>USERS: <strong className="text-white">{stats.totalUsers}</strong></span>
          </div>
        </div>

        {/* Right Action: Return to Arena & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadAllCMUData}
            disabled={loading}
            title="Refresh All Telemetry Data"
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={onExitToArena}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-cyan-950/60 hover:to-slate-900 border border-slate-700 hover:border-cyan-400/60 text-white font-mono text-xs font-semibold shadow-lg transition flex items-center gap-2 cursor-pointer hover:shadow-cyan-500/10"
          >
            <ArrowLeft className="w-4 h-4 text-[#00F3FF]" />
            <span>Return to Typist Arena</span>
          </button>
        </div>

      </header>

      {/* Toast Notification */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 z-[100] px-5 py-3 rounded-2xl font-mono text-xs shadow-2xl border flex items-center gap-2.5 backdrop-blur-md ${
              statusMsg.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-cyan-950/90 text-cyan-200 border-cyan-500/50'
            }`}
          >
            {statusMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-cyan-400" />}
            <span>{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CMU MAIN BODY GRID ================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* ================= SIDEBAR NAVIGATION ================= */}
        <aside className="w-full md:w-64 lg:w-72 bg-[#070c19] border-r border-slate-800/80 p-4 space-y-1.5 shrink-0 overflow-y-auto">
          
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            CMU Operational Modules
          </div>

          {[
            { id: 'OVERVIEW', label: 'Telemetry & Stats', icon: Activity, badge: `${stats.totalUsers} usr` },
            { id: 'CMS_CORE', label: 'Universal CMS Hub', icon: Layers, badge: `${cmsItems.length}` },
            { id: 'WORDBANKS', label: 'Wordbanks & Quotes', icon: Database, badge: `${wordbanks.length}` },
            { id: 'CURRICULUM', label: 'Courses & Lessons', icon: BookOpen, badge: `${courses.length}` },
            { id: 'USERS', label: 'Typists & Roles', icon: Users, badge: `${users.length}` },
            { id: 'CONTESTS', label: 'Esports Contests', icon: Trophy, badge: `${contests.length}` },
            { id: 'CERTIFICATES', label: 'Certificates Audit', icon: Award, badge: `${allCerts.length}` },
            { id: 'NOTICES', label: 'Flash Announcements', icon: Bell, badge: `${notices.length}` },
            { id: 'BRANDING', label: 'Brand & Identity', icon: Image },
            { id: 'AUDIT_LOGS', label: 'Security & Audit Logs', icon: FileText, badge: `${logs.length}` },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CMUTab)}
                className={`w-full px-3.5 py-3 rounded-xl font-mono text-xs font-medium flex items-center justify-between transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-400/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 border-t border-slate-900 mt-6 px-3 text-[11px] font-mono text-slate-500 space-y-2">
            <div>Logged as: <strong className="text-white">{currentUser?.username}</strong></div>
            <div className="text-[10px] text-cyan-400/80 uppercase">SUPER_ADMIN CLEARANCE</div>
          </div>
        </aside>

        {/* ================= TAB VIEWPORT ================= */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#050812]">
          
          {/* TAB 1: OVERVIEW & TELEMETRY */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              
              <div>
                <h1 className="text-2xl font-bold font-display text-white">System Telemetry & Health Dashboard</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Real-time metrics, active race rooms, database indices, and system diagnostics.</p>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>TOTAL TYPISTS</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-3 font-display">{stats.totalUsers}</div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-1">Registered Accounts</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>PRACTICE ATTEMPTS</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-3 font-display">{stats.totalAttempts}</div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">Total Keystroke Runs</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>ISSUED CERTS</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-3 font-display">{stats.totalCertificates}</div>
                  <div className="text-[10px] font-mono text-amber-400 mt-1">Verified Credentials</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>ACTIVE CONTESTS</span>
                    <Trophy className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-3 font-display">{stats.totalContests}</div>
                  <div className="text-[10px] font-mono text-purple-400 mt-1">Multiplayer Lobbies</div>
                </div>

              </div>

              {/* Subsystems Status Deck */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Storage & Schema Connectivity
                  </h3>
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/70">
                      <span className="text-slate-400">Database Engine:</span>
                      <span className="text-emerald-400 font-bold">MongoDB Atlas (Connected)</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/70">
                      <span className="text-slate-400">Socket.IO Racing Gateway:</span>
                      <span className="text-cyan-300 font-bold">{stats.activeRoomsCount} Active Rooms</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/70">
                      <span className="text-slate-400">Node Runtime Environment:</span>
                      <span className="text-white font-bold">{stats.nodeVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <button
                      onClick={() => setActiveTab('WORDBANKS')}
                      className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-cyan-300 font-bold">+ New Wordbank</span>
                      <span className="text-[10px] text-slate-500">Add 10FastFingers or quotes</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('CURRICULUM')}
                      className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-emerald-300 font-bold">+ New Lesson</span>
                      <span className="text-[10px] text-slate-500">Expand course modules</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('NOTICES')}
                      className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-amber-300 font-bold">Broadcast Notice</span>
                      <span className="text-[10px] text-slate-500">Push flash alert banner</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('USERS')}
                      className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-purple-300 font-bold">Manage Roles</span>
                      <span className="text-[10px] text-slate-500">Grant admin privileges</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: UNIVERSAL CMS HUB */}
          {activeTab === 'CMS_CORE' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Universal CMS Content Hub</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Manage marketing headlines, company timeline milestones, features, and about sections.</p>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {['timeline', 'company_info', 'hero', 'features', 'founder', 'notice'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCmsTypeFilter(t)}
                    className={`px-4 py-2 rounded-xl border transition cursor-pointer ${
                      cmsTypeFilter === t
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Create new CMS item card */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
                <h3 className="text-base font-bold font-display text-white">Publish New CMS Entry [{cmsTypeFilter.toUpperCase()}]</h3>
                <form onSubmit={handleCreateCmsItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Unique Key</label>
                    <input
                      type="text"
                      placeholder="e.g. timeline_2026_q1"
                      value={newCmsKey}
                      onChange={(e) => setNewCmsKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="Headline title"
                      value={newCmsTitle}
                      onChange={(e) => setNewCmsTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="Summary snippet"
                      value={newCmsShortDesc}
                      onChange={(e) => setNewCmsShortDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Full Description</label>
                    <textarea
                      rows={3}
                      placeholder="Detailed content description"
                      value={newCmsFullDesc}
                      onChange={(e) => setNewCmsFullDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Date / Milestone Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Oct 2026"
                      value={newCmsDate}
                      onChange={(e) => setNewCmsDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Accent Color</label>
                    <select
                      value={newCmsColor}
                      onChange={(e) => setNewCmsColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="cyan">Cyan</option>
                      <option value="purple">Purple</option>
                      <option value="emerald">Emerald</option>
                      <option value="teal">Teal</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      Publish to CMS
                    </button>
                  </div>
                </form>
              </div>

              {/* List of CMS Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-mono uppercase text-slate-400">
                  Published Items for [{cmsTypeFilter}] ({cmsItems.filter(i => i.contentType === cmsTypeFilter).length})
                </h3>
                {cmsItems.filter(i => i.contentType === cmsTypeFilter).map((item) => (
                  <div key={item._id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.title}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">{item.key}</span>
                        {item.date && <span className="text-cyan-400 text-[10px]">[{item.date}]</span>}
                      </div>
                      <p className="text-slate-300 text-xs">{item.shortDescription}</p>
                      {item.fullDescription && <p className="text-slate-500 text-[11px]">{item.fullDescription}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteCmsItem(item._id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer shrink-0"
                      title="Delete CMS item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: WORDBANKS & TEXT ENGINE CMS */}
          {activeTab === 'WORDBANKS' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Wordbanks & Text Engine CMS</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Configure 10FastFingers word pools, software quotes, technical text libraries, and custom typing banks.</p>
              </div>

              {/* Create new wordbank */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold font-display text-white">Create New Wordbank / Quote Collection</h3>
                <form onSubmit={handleCreateWordbank} className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Collection Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Top 500 Modern Tech Words"
                        value={newBankTitle}
                        onChange={(e) => setNewBankTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={newBankCategory}
                        onChange={(e: any) => setNewBankCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      >
                        <option value="tech">Tech & Engineering</option>
                        <option value="common200">10FastFingers Top 200</option>
                        <option value="common1000">10FastFingers Top 1000</option>
                        <option value="quotes">Programming Quotes</option>
                        <option value="code">Code Snippets</option>
                        <option value="custom">Custom Bank</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Difficulty</label>
                      <select
                        value={newBankDifficulty}
                        onChange={(e: any) => setNewBankDifficulty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Words List (comma or space separated)</label>
                    <textarea
                      rows={3}
                      placeholder="apple banana orange computer software cloud..."
                      value={newBankWords}
                      onChange={(e) => setNewBankWords(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Save Wordbank to CMS
                  </button>
                </form>
              </div>

              {/* Existing Wordbanks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wordbanks.map((b) => (
                  <div key={b._id || b.key} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{b.title}</h4>
                        <span className="text-[10px] text-cyan-400 uppercase">CATEGORY: {b.category}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteWordbank(b._id || (b as any).id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate-400 text-xs">{b.description || 'Custom curated wordbank for typing tests.'}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                      <span>Total Words: <strong className="text-white">{(b.words || []).length}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{b.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: CURRICULUM & LESSONS CMS */}
          {activeTab === 'CURRICULUM' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Curriculum & Course CMS</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Design TypingClub-style structured courses, finger positioning drills, and star rewards.</p>
              </div>

              {/* Course Selection & Creator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Courses list */}
                <div className="space-y-3 lg:col-span-1">
                  <h3 className="font-mono text-xs uppercase text-slate-400 font-bold">Academic Tracks</h3>
                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCourseForEdit(c)}
                        className={`p-3 rounded-xl border font-mono text-xs cursor-pointer transition ${
                          selectedCourseForEdit?.id === c.id
                            ? 'bg-cyan-500/15 border-cyan-400/50 text-white'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="font-bold text-sm text-white">{c.title}</div>
                        <div className="text-[10px] text-cyan-400 mt-0.5">{c.difficulty} Track • {(c.lessons || []).length} Lessons</div>
                      </div>
                    ))}
                  </div>

                  {/* Add Course Form */}
                  <form onSubmit={handleCreateCourse} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2 font-mono text-xs mt-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Add New Course Track</span>
                    <input
                      type="text"
                      placeholder="Course Track Title"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                    />
                    <select
                      value={newCourseDifficulty}
                      onChange={(e: any) => setNewCourseDifficulty(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Pro">Pro</option>
                    </select>
                    <button type="submit" className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition">
                      + Create Course
                    </button>
                  </form>
                </div>

                {/* Right: Selected Course Lessons & Lesson Creator */}
                <div className="lg:col-span-2 space-y-5">
                  {selectedCourseForEdit ? (
                    <>
                      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold font-display text-white">{selectedCourseForEdit.title}</h3>
                            <p className="text-xs text-slate-400 font-mono">{selectedCourseForEdit.description}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                            {selectedCourseForEdit.difficulty}
                          </span>
                        </div>

                        {/* Add Lesson Form */}
                        <form onSubmit={handleAddLesson} className="space-y-3 font-mono text-xs border-t border-slate-800 pt-4">
                          <h4 className="font-bold text-white uppercase text-[11px]">Add Lesson Drill to this Track</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Lesson Title (e.g. Home Row Speed Drill)"
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                            />
                            <select
                              value={newLessonTargetFinger}
                              onChange={(e) => setNewLessonTargetFinger(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                            >
                              <option value="index">Index Finger</option>
                              <option value="middle">Middle Finger</option>
                              <option value="ring">Ring Finger</option>
                              <option value="pinky">Pinky Finger</option>
                              <option value="thumb">Thumbs (Spacebar)</option>
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Drill Keystroke Target String (e.g. asdf jkl; asdf jkl;)"
                            value={newLessonText}
                            onChange={(e) => setNewLessonText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                          />
                          <input
                            type="text"
                            placeholder="Coaching Instructions for typist"
                            value={newLessonInstructions}
                            onChange={(e) => setNewLessonInstructions(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                          />
                          <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono rounded-xl transition">
                            + Add Lesson Drill
                          </button>
                        </form>
                      </div>

                      {/* Lessons List */}
                      <div className="space-y-2">
                        <h4 className="font-mono text-xs uppercase text-slate-400 font-bold">Track Drills ({selectedCourseForEdit.lessons?.length || 0})</h4>
                        {(selectedCourseForEdit.lessons || []).map((l, idx) => (
                          <div key={l.id || idx} className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 font-mono text-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="font-bold text-white text-sm">{idx + 1}. {l.title}</span>
                              <div className="text-[11px] text-cyan-300 font-mono">&ldquo;{l.text}&rdquo;</div>
                              {l.instructions && <div className="text-[10px] text-slate-500">{l.instructions}</div>}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-amber-400 font-bold block">+{l.xpReward} XP / +{l.coinsReward} Coins</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-12 text-center text-slate-500 font-mono">Select a course track to manage lessons.</div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: TYPISTS & USERS DIRECTORY */}
          {activeTab === 'USERS' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-display text-white">Typist Directory & Role Governance</h1>
                  <p className="text-sm text-slate-400 font-mono mt-1">Audit users, promote Super Admins, and adjust currency balances.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search by username, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-mono text-xs text-white outline-none focus:border-cyan-400 w-full sm:w-72"
                />
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-x-auto shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Typist</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Coins</th>
                      <th className="p-3.5">XP / Level</th>
                      <th className="p-3.5">Joined</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-900/60 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{u.username}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold border outline-none cursor-pointer ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : u.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="GENERAL_USER">GENERAL_USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>
                        <td className="p-3.5 font-bold text-amber-300">{u.coins || 0}</td>
                        <td className="p-3.5">
                          <span className="text-cyan-300 font-bold">Lvl {u.level || 1}</span>
                          <span className="text-slate-500 ml-1">({u.xp || 0} XP)</span>
                        </td>
                        <td className="p-3.5 text-slate-500 text-[10px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[10px]"
                          >
                            Adjust Balance
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal to edit balance */}
              {editingUser && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 font-mono text-xs">
                    <h3 className="text-sm font-bold text-white font-display">
                      Adjust Balance for {editingUser.username}
                    </h3>
                    <div>
                      <label className="block text-slate-400 mb-1">Coins</label>
                      <input
                        type="number"
                        defaultValue={editingUser.coins || 0}
                        id="modal-coins-input"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">XP</label>
                      <input
                        type="number"
                        defaultValue={editingUser.xp || 0}
                        id="modal-xp-input"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Level</label>
                      <input
                        type="number"
                        defaultValue={editingUser.level || 1}
                        id="modal-level-input"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const c = Number((document.getElementById('modal-coins-input') as HTMLInputElement)?.value);
                          const x = Number((document.getElementById('modal-xp-input') as HTMLInputElement)?.value);
                          const l = Number((document.getElementById('modal-level-input') as HTMLInputElement)?.value);
                          handleUpdateBalance(editingUser._id, c, x, l);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 6: CONTESTS & ESPORTS */}
          {activeTab === 'CONTESTS' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Esports & Realtime Contest Lobbies</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Deploy multiplayer speed race arenas and configure duration/passages.</p>
              </div>

              {/* Create Contest Form */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold font-display text-white">Create New Contest Lobby</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newContestTitle.trim() || !newContestText.trim()) return;
                    try {
                      const res = await fetch(`${API_URL}/api/contests`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${userToken}`
                        },
                        body: JSON.stringify({
                          title: newContestTitle,
                          description: newContestDesc,
                          contestText: newContestText,
                          duration: newContestDuration,
                          visibility: 'PUBLIC'
                        })
                      });
                      if (res.ok) {
                        showToast('Contest lobby deployed');
                        setNewContestTitle('');
                        setNewContestDesc('');
                        setNewContestText('');
                        fetchContests();
                      }
                    } catch (err) {}
                  }}
                  className="space-y-3 font-mono text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Contest Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Saturday Speed Grand Prix"
                        value={newContestTitle}
                        onChange={(e) => setNewContestTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Duration (Seconds)</label>
                      <input
                        type="number"
                        value={newContestDuration}
                        onChange={(e) => setNewContestDuration(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Brief rules or rewards summary"
                      value={newContestDesc}
                      onChange={(e) => setNewContestDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Passage Text for Competitors</label>
                    <textarea
                      rows={3}
                      placeholder="Text to type during contest..."
                      value={newContestText}
                      onChange={(e) => setNewContestText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-purple-500/20"
                  >
                    Deploy Contest Room
                  </button>
                </form>
              </div>

              {/* Contests List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contests.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{c.title}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                        {c.duration}s
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{c.description}</p>
                    <div className="text-[10px] text-slate-500 truncate bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      Text: {c.contestText}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 7: CERTIFICATES AUDIT */}
          {activeTab === 'CERTIFICATES' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Certificate Governance & Verification</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Audit all issued diplomas, review verification authenticity, and approve/revoke status.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-x-auto shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Recipient</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5">Performance</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Issued At</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allCerts.map((cert) => (
                      <tr key={cert.id || cert._id} className="hover:bg-slate-900/60 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{cert.fullName}</div>
                          <div className="text-[10px] text-slate-500">{cert.institute || 'Independent Typist'}</div>
                        </td>
                        <td className="p-3.5 text-cyan-300">{cert.mode}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-white">{cert.wpm} WPM</span>
                          <span className="text-emerald-400 ml-1.5">{cert.accuracy}% Acc</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cert.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : cert.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 text-[10px]">
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {cert.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleCertStatus(cert.id || cert._id, 'APPROVED')}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] transition"
                            >
                              Approve
                            </button>
                          )}
                          {cert.status !== 'REVOKED' && (
                            <button
                              onClick={() => handleCertStatus(cert.id || cert._id, 'REVOKED')}
                              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: NOTICES */}
          {activeTab === 'NOTICES' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Flash Notices & Marquee Broadcaster</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Broadcast urgent system updates, contest schedules, and marquee flashes.</p>
              </div>

              {/* Publish notice */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold font-display text-white">Push System Announcement</h3>
                <form onSubmit={handleCreateNotice} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Notice Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. SYSTEM MAINTENANCE or TOURNAMENT REGISTRATION OPEN"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Notice Content</label>
                    <textarea
                      rows={2}
                      placeholder="Details displayed in the scrolling marquee banner..."
                      value={newNoticeContent}
                      onChange={(e) => setNewNoticeContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Broadcast to Marquee
                  </button>
                </form>
              </div>

              {/* Notices List */}
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase text-slate-400 font-bold">Active Broadcasts ({notices.length})</h3>
                {notices.map((n) => (
                  <div key={n.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-4 font-mono text-xs">
                    <div>
                      <span className="font-bold text-white text-sm block">{n.title}</span>
                      <span className="text-slate-400 text-xs">{n.content}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 9: BRANDING & IDENTITY */}
          {activeTab === 'BRANDING' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Brand Identity & Visual Assets</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Configure website logo, partner brand logos, founder picture, with Facebook-style interactive cropping.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                
                {/* Founder Picture (Facebook Style Circular Cropper) */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg hover:border-cyan-500/30 transition">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      Founder Profile Picture & Dimension
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">
                      Circular Avatar Crop
                    </span>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="relative group">
                      {founderPicInput ? (
                        <div className="rounded-full p-1 bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-[0_0_20px_rgba(0,243,255,0.25)]">
                          <img
                            src={founderPicInput}
                            alt="Founder"
                            style={{ width: founderPicSize, height: founderPicSize }}
                            className="rounded-full object-cover border-2 border-slate-950 bg-slate-900"
                          />
                        </div>
                      ) : (
                        <div
                          style={{ width: founderPicSize, height: founderPicSize }}
                          className="rounded-full border-2 border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-600 font-bold"
                        >
                          MR
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold cursor-pointer transition shadow-md">
                        <Crop className="w-4 h-4" />
                        <span>Upload & Crop Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileForCropping(e, 'founderPic', 'circle', 'Crop Founder Avatar')}
                        />
                      </label>
                      <p className="text-[11px] text-slate-500 text-center">Facebook-style circular drag & zoom crop</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={founderPicInput}
                    onChange={(e) => setFounderPicInput(e.target.value)}
                    placeholder="Or paste Direct Image URL / Base64"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-slate-400 text-xs min-w-[70px]">Size: {founderPicSize}px</span>
                    <input
                      type="range"
                      min={48}
                      max={140}
                      value={founderPicSize}
                      onChange={(e) => setFounderPicSize(Number(e.target.value))}
                      className="flex-1 accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => {
                      handleSaveBrandingField('founder-picture', 'founderPicture', founderPicInput);
                      handleSaveBrandingField('founder-picture-size', 'founderPictureSize', founderPicSize);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-800 hover:bg-cyan-500 hover:text-black text-white font-bold rounded-xl transition font-mono text-xs flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Profile Settings
                  </button>
                </div>

                {/* FigTyp Brand Logo */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg hover:border-cyan-500/30 transition">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    FigTyp Brand Logo
                  </h4>

                  <div className="flex items-center gap-4">
                    {logoInput ? (
                      <img src={logoInput} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 font-bold">
                        FT
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold cursor-pointer transition border border-slate-700">
                      <Crop className="w-4 h-4 text-cyan-400" />
                      <span>Upload & Crop Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileForCropping(e, 'logo', 'square', 'Crop FigTyp Brand Logo')}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    placeholder="Image URL or Base64"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                  <button
                    onClick={() => handleSaveBrandingField('logo', 'websiteLogo', logoInput)}
                    className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition"
                  >
                    Save Logo
                  </button>
                </div>

                {/* M-Square Logo */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg hover:border-cyan-500/30 transition">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    M-Square Devs Group Logo
                  </h4>

                  <div className="flex items-center gap-4">
                    {mSquareInput ? (
                      <img src={mSquareInput} alt="M-Square" className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 font-bold">
                        M2
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold cursor-pointer transition border border-slate-700">
                      <Crop className="w-4 h-4 text-indigo-400" />
                      <span>Upload & Crop Partner Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileForCropping(e, 'mSquare', 'square', 'Crop M-Square Logo')}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={mSquareInput}
                    onChange={(e) => setMSquareInput(e.target.value)}
                    placeholder="Image URL or Base64"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                  <button
                    onClick={() => handleSaveBrandingField('m-square-logo', 'mSquareLogo', mSquareInput)}
                    className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition"
                  >
                    Save M-Square Logo
                  </button>
                </div>

                {/* MiraCore Logo */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg hover:border-cyan-500/30 transition">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                    MiraCore Logix Logo
                  </h4>

                  <div className="flex items-center gap-4">
                    {miraCoreInput ? (
                      <img src={miraCoreInput} alt="MiraCore" className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 font-bold">
                        MC
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold cursor-pointer transition border border-slate-700">
                      <Crop className="w-4 h-4 text-teal-400" />
                      <span>Upload & Crop Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileForCropping(e, 'miraCore', 'square', 'Crop MiraCore Logo')}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={miraCoreInput}
                    onChange={(e) => setMiraCoreInput(e.target.value)}
                    placeholder="Image URL or Base64"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                  <button
                    onClick={() => handleSaveBrandingField('mira-core-logo', 'miraCoreLogo', miraCoreInput)}
                    className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition"
                  >
                    Save MiraCore Logo
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 10: AUDIT LOGS */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Security & Activity Audit Logs</h1>
                <p className="text-sm text-slate-400 font-mono mt-1">Real-time audit records of logins, keystroke telemetry uploads, and admin operations.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-x-auto shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Action Type</th>
                      <th className="p-3.5">Details</th>
                      <th className="p-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-slate-900/60 transition">
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{(log as any).username || 'User'}</span>
                          <span className="text-[10px] text-slate-500">{(log as any).email || log.userId}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20 text-[10px]">
                            {log.actionType || log.action || 'ACTIVITY'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 text-xs">
                          {log.details || 'System operation executed.'}
                        </td>
                        <td className="p-3.5 text-slate-500 text-[10px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* Interactive Facebook-style Image Crop Modal */}
      {cropModal.isOpen && (
        <ImageCropModal
          imageSrc={cropModal.imageSrc}
          aspectRatio={cropModal.aspectRatio}
          title={cropModal.title}
          onSave={handleCroppedSave}
          onClose={() => setCropModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}

    </div>
  );
}
