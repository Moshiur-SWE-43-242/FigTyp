import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import { 
  Shield, ShieldCheck, Activity, Database, BookOpen, Layers, Users, Trophy, Award, 
  Bell, Image, Image as ImageIcon, X, FileText, ArrowLeft, RefreshCw, Plus, Trash2, Edit3, 
  CheckCircle, AlertTriangle, Eye, Upload, Key, Zap, Flame, Lock, ChevronRight, Check, Crop,
  Printer, Sun, Moon, Video, Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AuditLog, CMSNotice, Contest, Course, Lesson, WordBank } from '../../types';
import ImageCropModal from '../ImageCropModal';
import { PrivacyPolicyModal, TermsConditionsModal, ContactUsModal, TypingAcademyModal } from '../LegalModals';

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
  | 'ADS_POLICY'
  | 'BLOGS'
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

  // CMU Dark/Light Theme Sync
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const handleToggleCMUTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('figtyp_theme', 'light');
      setIsDarkTheme(false);
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('figtyp_theme', 'dark');
      setIsDarkTheme(true);
    }
  };

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

  // Users Directory & Dossier
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingUserDossier, setViewingUserDossier] = useState<any | null>(null);

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
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseVideoType, setNewCourseVideoType] = useState<'none' | 'youtube' | 'upload'>('none');
  const [newCourseVideoUrl, setNewCourseVideoUrl] = useState('');

  // Course Track Editing
  const [isEditingCourseModal, setIsEditingCourseModal] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseDifficulty, setEditCourseDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro'>('Beginner');
  const [editCourseVideoType, setEditCourseVideoType] = useState<'none' | 'youtube' | 'upload'>('none');
  const [editCourseVideoUrl, setEditCourseVideoUrl] = useState('');

  // Lessons
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonText, setNewLessonText] = useState('');
  const [newLessonInstructions, setNewLessonInstructions] = useState('');
  const [newLessonTargetFinger, setNewLessonTargetFinger] = useState('index');
  const [newLessonVideoType, setNewLessonVideoType] = useState<'none' | 'youtube' | 'upload'>('none');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');

  // Lesson Editing Video
  const [editLessonVideoType, setEditLessonVideoType] = useState<'none' | 'youtube' | 'upload'>('none');
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // CMS Content Hub
  const [cmsItems, setCmsItems] = useState<any[]>([]);
  const [cmsTypeFilter, setCmsTypeFilter] = useState('timeline');
  const [newCmsKey, setNewCmsKey] = useState('');
  const [newCmsTitle, setNewCmsTitle] = useState('');
  const [newCmsShortDesc, setNewCmsShortDesc] = useState('');
  const [newCmsFullDesc, setNewCmsFullDesc] = useState('');
  const [newCmsDate, setNewCmsDate] = useState('');
  const [newCmsColor, setNewCmsColor] = useState('cyan');
  const [newCmsImageUrl, setNewCmsImageUrl] = useState('');
  const [newCmsOrder, setNewCmsOrder] = useState<number>(0);
  const [editingCmsItem, setEditingCmsItem] = useState<any | null>(null);

  // Contests
  const [contests, setContests] = useState<Contest[]>([]);
  const [newContestTitle, setNewContestTitle] = useState('');
  const [newContestDesc, setNewContestDesc] = useState('');
  const [newContestText, setNewContestText] = useState('');
  const [newContestDuration, setNewContestDuration] = useState(60);
  const [newContestStartTime, setNewContestStartTime] = useState('');
  const [newContestEndTime, setNewContestEndTime] = useState('');
  const [newContestLogo, setNewContestLogo] = useState('');

  // Contest Editing State
  const [editingContest, setEditingContest] = useState<any | null>(null);
  const [editContestTitle, setEditContestTitle] = useState('');
  const [editContestDesc, setEditContestDesc] = useState('');
  const [editContestText, setEditContestText] = useState('');
  const [editContestDuration, setEditContestDuration] = useState(60);
  const [editContestStartTime, setEditContestStartTime] = useState('');
  const [editContestEndTime, setEditContestEndTime] = useState('');
  const [editContestStatus, setEditContestStatus] = useState('LOBBY');
  const [editContestVisibility, setEditContestVisibility] = useState('PUBLIC');
  const [editContestLogo, setEditContestLogo] = useState('');

  // Lesson Editing State
  const [editingLesson, setEditingLesson] = useState<{ lesson: any; courseId: string } | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonText, setEditLessonText] = useState('');
  const [editLessonInstructions, setEditLessonInstructions] = useState('');
  const [editLessonTargetFinger, setEditLessonTargetFinger] = useState('index');
  const [editLessonMinWpm, setEditLessonMinWpm] = useState(20);
  const [editLessonMinAccuracy, setEditLessonMinAccuracy] = useState(90);
  const [editLessonXpReward, setEditLessonXpReward] = useState(30);
  const [editLessonCoinsReward, setEditLessonCoinsReward] = useState(20);

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
    targetField: 'logo' | 'mSquare' | 'miraCore' | 'founderPic' | 'adminSig' | 'blogCover' | 'blogAuthor' | 'cmsImage';
  }>({
    isOpen: false,
    imageSrc: '',
    aspectRatio: 'circle',
    title: 'Crop Image',
    targetField: 'founderPic'
  });

  const handleFileForCropping = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'logo' | 'mSquare' | 'miraCore' | 'founderPic' | 'adminSig' | 'blogCover' | 'blogAuthor' | 'cmsImage',
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
    } else if (cropModal.targetField === 'adminSig') {
      setAdminSigInput(croppedDataUrl);
      handleSaveBrandingField('admin-signature', 'adminSignaturePic', croppedDataUrl);
    } else if (cropModal.targetField === 'blogCover') {
      setBlogCoverImage(croppedDataUrl);
    } else if (cropModal.targetField === 'blogAuthor') {
      setBlogAuthorAvatar(croppedDataUrl);
    } else if (cropModal.targetField === 'cmsImage') {
      setNewCmsImageUrl(croppedDataUrl);
    }
    showToast(`${cropModal.title} cropped and updated!`, 'success');
  };

  // Audit Logs
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Blogs Management State
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [isCreatingBlog, setIsCreatingBlog] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState('');
  const [blogAuthorName, setBlogAuthorName] = useState('FigTyp Master Instructor');
  const [blogAuthorRole, setBlogAuthorRole] = useState('Keyboard Performance Specialist');
  const [blogAuthorAvatar, setBlogAuthorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [blogReadTime, setBlogReadTime] = useState(5);
  const [blogTags, setBlogTags] = useState('Touch Typing, Speed Mastery');
  const [blogPublished, setBlogPublished] = useState(true);

  // Dynamic Ad Placements Control State
  const [adPlacements, setAdPlacements] = useState<Record<string, any>>({
    topBanner: true,
    bottomBanner: true,
    leftSkyscraper: true,
    rightSkyscraper: true,
    practiceAds: true,
    contestAds: true,
    profileAds: true,
    blogAds: true
  });
  const [placementsList, setPlacementsList] = useState<Array<{
    key: string;
    name: string;
    desc: string;
    slot: string;
    format: 'horizontal' | 'vertical' | 'rectangle' | 'responsive';
    isEnabled: boolean;
    isCustom?: boolean;
  }>>([
    { key: 'topBanner', name: 'Top Header Banner', desc: 'Global header sponsor', slot: '#9876543210', format: 'horizontal', isEnabled: true },
    { key: 'bottomBanner', name: 'Bottom Sponsor Banner', desc: 'Global footer banner', slot: '#1234567890', format: 'horizontal', isEnabled: true },
    { key: 'leftSkyscraper', name: 'Left Desktop Skyscraper', desc: 'Widescreen left rail (160x600)', slot: '#1029384701', format: 'vertical', isEnabled: true },
    { key: 'rightSkyscraper', name: 'Right Desktop Skyscraper', desc: 'Widescreen right rail (160x600)', slot: '#1029384702', format: 'vertical', isEnabled: true },
    { key: 'practiceAds', name: 'Practice Arena Ads', desc: 'Pre-session & leaderboard ads', slot: '#1122334455', format: 'horizontal', isEnabled: true },
    { key: 'contestAds', name: 'Contest Arena Ads', desc: 'Lobby & rooms sponsor ads', slot: '#3344556677', format: 'horizontal', isEnabled: true },
    { key: 'profileAds', name: 'User Profile Ads', desc: 'Analytics & progress cards', slot: '#5544332211', format: 'rectangle', isEnabled: true },
    { key: 'blogAds', name: 'Blog & Academy Ads', desc: 'In-article & catalog sponsor', slot: '#6677889900', format: 'horizontal', isEnabled: true }
  ]);
  const [editingAdKey, setEditingAdKey] = useState<string | null>(null);
  const [isAddingAdModal, setIsAddingAdModal] = useState(false);
  const [adFormKey, setAdFormKey] = useState('');
  const [adFormName, setAdFormName] = useState('');
  const [adFormDesc, setAdFormDesc] = useState('');
  const [adFormSlot, setAdFormSlot] = useState('');
  const [adFormFormat, setAdFormFormat] = useState<'horizontal' | 'vertical' | 'rectangle' | 'responsive'>('horizontal');
  const [adFormEnabled, setAdFormEnabled] = useState(true);
  const [savingAds, setSavingAds] = useState(false);

  // Platform Academy & Legal Compliance Modals State
  const [academyModalOpen, setAcademyModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

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
        fetchBlogs(),
        fetchAdPlacements(),
        fetchLogs()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/blogs?includeDrafts=true`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.blogs) setBlogsList(data.blogs);
      }
    } catch (e) {}
  };

  const fetchAdPlacements = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/ad-placements`);
      if (res.ok) {
        const data = await res.json();
        if (data.adPlacements) {
          const raw = data.adPlacements;
          setAdPlacements((prev) => ({ ...prev, ...raw }));
          if (Array.isArray(raw._customList)) {
            setPlacementsList(raw._customList);
          } else {
            setPlacementsList((prevList) =>
              prevList.map((p) => ({
                ...p,
                isEnabled: raw[p.key] !== undefined ? Boolean(raw[p.key]) : p.isEnabled
              }))
            );
          }
        }
      }
    } catch (e) {}
  };

  const handleSaveAdPlacements = async (updatedList?: typeof placementsList) => {
    const listToSave = updatedList || placementsList;
    setSavingAds(true);
    try {
      const booleanMap: Record<string, any> = {};
      listToSave.forEach((p) => {
        booleanMap[p.key] = p.isEnabled;
      });
      booleanMap._customList = listToSave;

      const res = await fetch(`${API_URL}/api/settings/ad-placements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ adPlacements: booleanMap })
      });
      if (res.ok) {
        setAdPlacements(booleanMap);
        setPlacementsList(listToSave);
        showToast('Ad Placements updated and live across FigTyp!', 'success');
      } else {
        showToast('Failed to save ad placements.', 'error');
      }
    } catch (e) {
      showToast('Network error saving ad placements.', 'error');
    } finally {
      setSavingAds(false);
    }
  };

  const handleOpenAddPlacement = () => {
    setAdFormKey('');
    setAdFormName('');
    setAdFormDesc('');
    setAdFormSlot('');
    setAdFormFormat('horizontal');
    setAdFormEnabled(true);
    setIsAddingAdModal(true);
  };

  const handleCreatePlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adFormName.trim()) {
      showToast('Placement name is required', 'error');
      return;
    }
    const slugKey = adFormKey.trim() || adFormName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (placementsList.some((p) => p.key === slugKey)) {
      showToast('A placement with this key already exists', 'error');
      return;
    }
    const newPlacement: any = {
      key: slugKey,
      name: adFormName.trim(),
      desc: adFormDesc.trim() || 'Custom placement',
      slot: adFormSlot.trim() || '#1029384756',
      format: adFormFormat,
      isEnabled: adFormEnabled,
      isCustom: true
    };
    const updatedList = [...placementsList, newPlacement];
    setPlacementsList(updatedList);
    setIsAddingAdModal(false);
    handleSaveAdPlacements(updatedList);
    showToast(`New ad placement "${newPlacement.name}" added successfully!`, 'success');
  };

  const handleOpenEditPlacement = (placement: any) => {
    setEditingAdKey(placement.key);
    setAdFormKey(placement.key);
    setAdFormName(placement.name);
    setAdFormDesc(placement.desc);
    setAdFormSlot(placement.slot);
    setAdFormFormat(placement.format || 'horizontal');
    setAdFormEnabled(placement.isEnabled !== false);
  };

  const handleSaveEditedPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdKey) return;
    const updatedList = placementsList.map((p) => {
      if (p.key === editingAdKey) {
        return {
          ...p,
          name: adFormName.trim() || p.name,
          desc: adFormDesc.trim() || p.desc,
          slot: adFormSlot.trim() || p.slot,
          format: adFormFormat,
          isEnabled: adFormEnabled
        };
      }
      return p;
    });
    setPlacementsList(updatedList);
    setEditingAdKey(null);
    handleSaveAdPlacements(updatedList);
    showToast('Ad placement updated successfully!', 'success');
  };

  const handleDeletePlacement = (key: string) => {
    if (!confirm('Are you sure you want to remove this ad placement?')) return;
    const updatedList = placementsList.filter((p) => p.key !== key);
    setPlacementsList(updatedList);
    setEditingAdKey(null);
    handleSaveAdPlacements(updatedList);
    showToast('Ad placement removed.', 'success');
  };

  const handleTogglePlacement = (key: string) => {
    const updatedList = placementsList.map((p) => {
      if (p.key === key) {
        return { ...p, isEnabled: !p.isEnabled };
      }
      return p;
    });
    setPlacementsList(updatedList);
    handleSaveAdPlacements(updatedList);
  };

  const resetBlogForm = () => {
    setBlogTitle('');
    setBlogExcerpt('');
    setBlogContent('');
    setBlogCoverImage('');
    setBlogAuthorName('FigTyp Master Instructor');
    setBlogAuthorRole('Keyboard Performance Specialist');
    setBlogAuthorAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    setBlogReadTime(5);
    setBlogTags('Touch Typing, Speed Mastery');
    setBlogPublished(true);
    setEditingBlog(null);
    setIsCreatingBlog(false);
  };

  const handleOpenEditBlog = (blog: any) => {
    setEditingBlog(blog);
    setIsCreatingBlog(true);
    setBlogTitle(blog.title || '');
    setBlogExcerpt(blog.excerpt || '');
    setBlogContent(blog.content || '');
    setBlogCoverImage(blog.coverImage || '');
    setBlogAuthorName(blog.author?.name || 'FigTyp Master Instructor');
    setBlogAuthorRole(blog.author?.role || 'Keyboard Performance Specialist');
    setBlogAuthorAvatar(blog.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    setBlogReadTime(blog.readTimeMinutes || 5);
    setBlogTags(Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''));
    setBlogPublished(blog.isPublished !== undefined ? blog.isPublished : true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim() || !blogExcerpt.trim()) {
      showToast('Title, excerpt, and content are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: blogTitle,
        excerpt: blogExcerpt,
        content: blogContent,
        coverImage: blogCoverImage,
        author: {
          name: blogAuthorName,
          role: blogAuthorRole,
          avatar: blogAuthorAvatar
        },
        readTimeMinutes: Number(blogReadTime) || 5,
        tags: blogTags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublished: blogPublished
      };

      const url = editingBlog ? `${API_URL}/api/blogs/${editingBlog._id}` : `${API_URL}/api/blogs`;
      const method = editingBlog ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingBlog ? 'Article updated successfully!' : 'New article published!', 'success');
        resetBlogForm();
        fetchBlogs();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save article.', 'error');
      }
    } catch (e) {
      showToast('Network error saving article.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this article?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        showToast('Article deleted.', 'success');
        fetchBlogs();
      } else {
        showToast('Failed to delete article.', 'error');
      }
    } catch (e) {
      showToast('Network error deleting article.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublishBlog = async (blog: any) => {
    try {
      const res = await fetch(`${API_URL}/api/blogs/${blog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ isPublished: !blog.isPublished })
      });
      if (res.ok) {
        showToast(`Article set to ${!blog.isPublished ? 'Published' : 'Draft'}`, 'success');
        fetchBlogs();
      }
    } catch (e) {}
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
        if (data && data.length > 0) {
          setSelectedCourseForEdit(prev => {
            if (!prev) return data[0];
            const prevId = (prev as any)._id || prev.id || (prev as any).courseId;
            const updated = data.find((c: any) => ((c as any)._id || c.id || c.courseId) === prevId);
            return updated || data[0];
          });
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
        const list = Array.isArray(data) ? data : (data?.contests || []);
        setContests(list);
      }
    } catch (e) {
      console.error('Failed to fetch contests:', e);
    }
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
    if (!userId) {
      showToast('Invalid user identifier', 'error');
      return;
    }
    if (currentUser && String((currentUser as any)._id || currentUser.id) === String(userId)) {
      showToast('Cannot delete your own admin account', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this user? All associated attempts, certificates, and logs will be removed.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showToast(data.message || 'User deleted successfully');
        setUsers(prev => prev.filter(u => String(u._id || u.id) !== String(userId)));
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error deleting user', 'error');
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

  // Video File Upload Helper (Uploads to local storage /uploads/videos/)
  const handleUploadVideoFile = async (
    file: File,
    onSuccess: (videoUrl: string) => void
  ) => {
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) {
      showToast('Video file size exceeds maximum limit of 80MB.', 'error');
      return;
    }
    setUploadingVideo(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch(`${API_URL}/api/lessons/upload-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify({
            filename: file.name,
            videoBase64: base64Data
          })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          onSuccess(data.videoUrl);
          showToast('Video uploaded successfully to server storage!');
        } else {
          showToast(data.error || 'Video upload failed', 'error');
        }
        setUploadingVideo(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingVideo(false);
      showToast(err.message || 'Error uploading video', 'error');
    }
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
          title: newCourseTitle.trim(),
          description: newCourseDesc.trim(),
          difficulty: newCourseDifficulty,
          category: newCourseDifficulty,
          videoType: newCourseVideoType,
          videoUrl: newCourseVideoUrl.trim()
        })
      });
      if (res.ok) {
        showToast('New course created');
        setNewCourseTitle('');
        setNewCourseDesc('');
        setNewCourseVideoType('none');
        setNewCourseVideoUrl('');
        fetchCourses();
      }
    } catch (e) {}
  };

  const openEditCourseModal = (course: Course) => {
    setSelectedCourseForEdit(course);
    setEditCourseTitle(course.title || '');
    setEditCourseDesc(course.description || '');
    setEditCourseDifficulty(course.difficulty || 'Beginner');
    setEditCourseVideoType(course.videoType || 'none');
    setEditCourseVideoUrl(course.videoUrl || '');
    setIsEditingCourseModal(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEdit || !editCourseTitle.trim()) return;
    const courseId = (selectedCourseForEdit as any)._id || selectedCourseForEdit.id || (selectedCourseForEdit as any).courseId;
    try {
      const res = await fetch(`${API_URL}/api/lessons/course/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: editCourseTitle.trim(),
          description: editCourseDesc.trim(),
          difficulty: editCourseDifficulty,
          category: editCourseDifficulty,
          videoType: editCourseVideoType,
          videoUrl: editCourseVideoUrl.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showToast('Course track updated successfully');
        setIsEditingCourseModal(false);
        fetchCourses();
      } else {
        showToast(data.error || 'Failed to update course', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating course', 'error');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEdit || !newLessonTitle.trim() || !newLessonText.trim()) return;
    try {
      const courseObjId = (selectedCourseForEdit as any)._id || selectedCourseForEdit.id || (selectedCourseForEdit as any).courseId;
      const res = await fetch(`${API_URL}/api/lessons/course/${courseObjId}/lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: newLessonTitle.trim(),
          text: newLessonText.trim(),
          instructions: newLessonInstructions.trim(),
          targetFinger: newLessonTargetFinger,
          minWpm: 20,
          minAccuracy: 90,
          videoType: newLessonVideoType,
          videoUrl: newLessonVideoUrl.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showToast('Lesson added to curriculum track');
        setNewLessonTitle('');
        setNewLessonText('');
        setNewLessonInstructions('');
        setNewLessonVideoType('none');
        setNewLessonVideoUrl('');
        fetchCourses();
      } else {
        showToast(data.error || 'Failed to add lesson', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error adding lesson', 'error');
    }
  };

  const openEditLessonModal = (l: any, courseId: string) => {
    setEditingLesson({ lesson: l, courseId });
    setEditLessonTitle(l.title || '');
    setEditLessonText(l.text || '');
    setEditLessonInstructions(l.instructions || '');
    setEditLessonTargetFinger(l.targetFinger || 'index');
    setEditLessonMinWpm(Number(l.minWpm) || 20);
    setEditLessonMinAccuracy(Number(l.minAccuracy) || 90);
    setEditLessonXpReward(Number(l.xpReward) || 30);
    setEditLessonCoinsReward(Number(l.coinsReward) || 20);
    setEditLessonVideoType(l.videoType || 'none');
    setEditLessonVideoUrl(l.videoUrl || '');
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editLessonTitle.trim() || !editLessonText.trim()) return;
    const { lesson, courseId } = editingLesson;
    const lessonId = lesson.lessonId || lesson.id || (lesson as any)._id;
    try {
      const res = await fetch(`${API_URL}/api/lessons/course/${courseId}/lesson/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: editLessonTitle.trim(),
          text: editLessonText.trim(),
          instructions: editLessonInstructions.trim(),
          targetFinger: editLessonTargetFinger,
          minWpm: Number(editLessonMinWpm) || 20,
          minAccuracy: Number(editLessonMinAccuracy) || 90,
          xpReward: Number(editLessonXpReward) || 30,
          coinsReward: Number(editLessonCoinsReward) || 20,
          videoType: editLessonVideoType,
          videoUrl: editLessonVideoUrl.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showToast('Lesson drill updated successfully');
        setEditingLesson(null);
        fetchCourses();
      } else {
        showToast(data.error || 'Failed to update lesson', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error updating lesson', 'error');
    }
  };

  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson drill from the track?')) return;
    try {
      const res = await fetch(`${API_URL}/api/lessons/course/${courseId}/lesson/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showToast('Lesson deleted from track');
        fetchCourses();
      } else {
        showToast(data.error || 'Failed to delete lesson', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error deleting lesson', 'error');
    }
  };

  // CMS Hub Actions
  const resetCmsForm = () => {
    setEditingCmsItem(null);
    setNewCmsKey('');
    setNewCmsTitle('');
    setNewCmsShortDesc('');
    setNewCmsFullDesc('');
    setNewCmsDate('');
    setNewCmsColor('cyan');
    setNewCmsImageUrl('');
    setNewCmsOrder(0);
  };

  const handleStartEditCmsItem = (item: any) => {
    setEditingCmsItem(item);
    setCmsTypeFilter(item.contentType || 'timeline');
    setNewCmsKey(item.key || '');
    setNewCmsTitle(item.title || '');
    setNewCmsShortDesc(item.shortDescription || '');
    setNewCmsFullDesc(item.fullDescription || '');
    setNewCmsDate(item.date || '');
    setNewCmsColor(item.color || 'cyan');
    setNewCmsImageUrl(item.imageUrl || item.data?.imageUrl || '');
    setNewCmsOrder(item.order || 0);
    const formElem = document.getElementById('cms-editor-section');
    if (formElem) formElem.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveCmsItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmsKey.trim() || !newCmsTitle.trim()) {
      showToast('Key and Title are required for CMS entry', 'error');
      return;
    }
    try {
      const payload = {
        contentType: cmsTypeFilter.toLowerCase(),
        key: newCmsKey.trim(),
        title: newCmsTitle.trim(),
        shortDescription: newCmsShortDesc,
        fullDescription: newCmsFullDesc,
        date: newCmsDate,
        color: newCmsColor,
        imageUrl: newCmsImageUrl,
        data: {
          imageUrl: newCmsImageUrl
        },
        order: Number(newCmsOrder) || 0
      };

      const url = editingCmsItem ? `${API_URL}/api/cms/${editingCmsItem._id}` : `${API_URL}/api/cms`;
      const method = editingCmsItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editingCmsItem ? 'CMS item updated successfully' : 'CMS content item published', 'success');
        resetCmsForm();
        fetchCMSItems();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to save CMS item', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error saving CMS item', 'error');
    }
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

  // Certificate Status Action (Approve / Revoke)
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
        showToast(`Certificate status updated to ${status}`);
        fetchAllCertificates();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || `Failed to set status to ${status}`, 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error updating certificate status', 'error');
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this certificate record?')) return;
    try {
      const res = await fetch(`${API_URL}/api/certificates/${certId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        showToast('Certificate record deleted');
        fetchAllCertificates();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete certificate', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error deleting certificate', 'error');
    }
  };

  const handleDeleteContest = async (contestId: string) => {
    if (!window.confirm('Are you sure you want to delete this contest room?')) return;
    try {
      const res = await fetch(`${API_URL}/api/contests/${contestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        showToast('Contest room removed');
        fetchContests();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete contest room', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error deleting contest room', 'error');
    }
  };

  const handleToggleContestStatus = async (contestId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/contests/${contestId}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Contest status updated successfully');
        fetchContests();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to toggle contest status', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error toggling contest status', 'error');
    }
  };

  const openEditContestModal = (c: any) => {
    setEditingContest(c);
    setEditContestTitle(c.title || '');
    setEditContestDesc(c.description || '');
    setEditContestText(c.passage || c.contestText || '');
    setEditContestDuration(Number(c.duration) || 60);

    const formatForDatetimeLocal = (dateVal: any) => {
      if (!dateVal) return '';
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => (n < 10 ? '0' + n : n);
        const YYYY = d.getFullYear();
        const MM = pad(d.getMonth() + 1);
        const DD = pad(d.getDate());
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
      } catch {
        return '';
      }
    };

    setEditContestStartTime(formatForDatetimeLocal(c.startTime));
    setEditContestEndTime(formatForDatetimeLocal(c.endTime));
    setEditContestStatus(c.status || 'LOBBY');
    setEditContestVisibility(c.visibility || 'PUBLIC');
  };

  const handleUpdateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContest) return;
    const cId = editingContest._id || editingContest.id;
    try {
      const res = await fetch(`${API_URL}/api/contests/${cId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: editContestTitle.trim(),
          description: editContestDesc.trim(),
          passage: editContestText.trim(),
          contestText: editContestText.trim(),
          duration: Number(editContestDuration) || 60,
          startTime: editContestStartTime ? new Date(editContestStartTime).toISOString() : null,
          endTime: editContestEndTime ? new Date(editContestEndTime).toISOString() : null,
          status: editContestStatus,
          visibility: editContestVisibility
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showToast('Contest updated successfully');
        setEditingContest(null);
        fetchContests();
      } else {
        showToast(data.error || 'Failed to update contest', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error updating contest', 'error');
    }
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
    <div className="min-h-screen bg-white dark:bg-[#060913] text-black dark:text-slate-100 flex flex-col font-sans selection:bg-[#00F3FF]/30 selection:text-white">
      
      {/* ================= CMU TOP COMMAND HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#080d1a]/95 backdrop-blur-md border-b-2 border-black dark:border-slate-800/80 px-4 md:px-8 py-3.5 shadow-md flex items-center justify-between text-black dark:text-white">
        
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center font-display font-extrabold text-white text-lg shadow-[0_0_25px_rgba(0,243,255,0.4)] border border-cyan-300/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider font-display uppercase text-black dark:text-white">
                CONTROL MANAGEMENT <span className="text-cyan-600 dark:text-[#00F3FF]">UNIT</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-[#00F3FF] border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-[#00F3FF] animate-ping" />
                CMU v2.6 OPS
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block">
              Autonomous Governance, CMS Hub, Wordbanks & System Engine
            </span>
          </div>
        </div>

        {/* Center Live Telemetry Indicators */}
        <div className="hidden lg:flex items-center gap-6 font-mono text-xs text-slate-700 dark:text-slate-400 bg-zinc-50 dark:bg-slate-900/80 border-2 border-black dark:border-slate-800 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span>DB: <strong className="text-emerald-700 dark:text-emerald-300">ONLINE</strong></span>
          </div>
          <div className="w-px h-4 bg-zinc-300 dark:bg-slate-800" />
          <div>
            <span>RAM: <strong className="text-cyan-700 dark:text-cyan-300">{stats.memoryUsageMb} MB</strong></span>
          </div>
          <div className="w-px h-4 bg-zinc-300 dark:bg-slate-800" />
          <div>
            <span>UPTIME: <strong className="text-purple-700 dark:text-purple-300">{Math.floor(stats.serverUptimeSeconds / 60)}m</strong></span>
          </div>
          <div className="w-px h-4 bg-zinc-300 dark:bg-slate-800" />
          <div>
            <span>USERS: <strong className="text-black dark:text-white">{stats.totalUsers}</strong></span>
          </div>
        </div>

        {/* Right Action: Return to Arena, Theme Toggle & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleCMUTheme}
            title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2.5 rounded-xl border-2 border-black dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-zinc-100 dark:hover:bg-slate-800 text-black dark:text-slate-300 transition cursor-pointer"
          >
            {isDarkTheme ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          <button
            onClick={loadAllCMUData}
            disabled={loading}
            title="Refresh All Telemetry Data"
            className="p-2.5 rounded-xl border-2 border-black dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-zinc-100 dark:hover:border-cyan-400/40 text-black dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
          </button>

          <button
            onClick={onExitToArena}
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-900 hover:bg-zinc-100 dark:hover:from-cyan-950/60 dark:hover:to-slate-900 border-2 border-black dark:border-slate-700 text-black dark:text-white font-mono text-xs font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-[#00F3FF]" />
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
            className={`fixed top-20 right-8 z-[100] px-5 py-3 rounded-2xl font-mono text-xs shadow-2xl border-2 flex items-center gap-2.5 backdrop-blur-md ${
              statusMsg.type === 'error'
                ? 'bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-600 dark:border-rose-500/50'
                : 'bg-cyan-100 dark:bg-cyan-950/90 text-cyan-800 dark:text-cyan-200 border-cyan-600 dark:border-cyan-500/50'
            }`}
          >
            {statusMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> : <CheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
            <span>{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CMU MAIN BODY GRID ================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* ================= SIDEBAR NAVIGATION ================= */}
        <aside className="w-full md:w-64 lg:w-72 bg-white dark:bg-[#070c19] border-r-2 border-black dark:border-slate-800/80 p-4 space-y-1.5 shrink-0 overflow-y-auto text-black dark:text-white">
          
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
            { id: 'ADS_POLICY', label: 'Ads & Brand Safety', icon: ShieldCheck, badge: 'Safe' },
            { id: 'BLOGS', label: 'Typing Articles & Blogs', icon: BookOpen, badge: `${blogsList.length}` },
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
                    ? 'bg-black text-white dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-600/10 dark:text-cyan-300 border-2 border-black dark:border-cyan-400/40 shadow-sm'
                    : 'text-zinc-700 dark:text-slate-400 hover:text-black dark:hover:text-slate-200 hover:bg-zinc-100 dark:hover:bg-slate-900/60 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-cyan-400' : 'text-zinc-500 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-zinc-800 text-white dark:bg-cyan-400/20 dark:text-cyan-200' : 'bg-zinc-200 text-zinc-800 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 border-t-2 border-black dark:border-slate-900 mt-6 px-3 text-[11px] font-mono text-slate-600 dark:text-slate-500 space-y-2">
            <div>Logged as: <strong className="text-black dark:text-white">{currentUser?.username}</strong></div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400/80 uppercase font-bold">SUPER_ADMIN CLEARANCE</div>
          </div>
        </aside>

        {/* ================= TAB VIEWPORT ================= */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 bg-zinc-50 dark:bg-[#050812] text-black dark:text-slate-100">
          
          {/* TAB 1: OVERVIEW & TELEMETRY */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              
              <div>
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">System Telemetry & Health Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">Real-time metrics, active race rooms, database indices, and system diagnostics.</p>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border-2 border-black dark:border-slate-800/80 shadow-md">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-mono">
                    <span>TOTAL TYPISTS</span>
                    <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-black dark:text-white mt-3 font-display">{stats.totalUsers}</div>
                  <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 mt-1 font-bold">Registered Accounts</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border-2 border-black dark:border-slate-800/80 shadow-md">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-mono">
                    <span>PRACTICE ATTEMPTS</span>
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-black dark:text-white mt-3 font-display">{stats.totalAttempts}</div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 font-bold">Total Keystroke Runs</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border-2 border-black dark:border-slate-800/80 shadow-md">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-mono">
                    <span>ISSUED CERTS</span>
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-black dark:text-white mt-3 font-display">{stats.totalCertificates}</div>
                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1 font-bold">Verified Credentials</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border-2 border-black dark:border-slate-800/80 shadow-md">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-mono">
                    <span>ACTIVE CONTESTS</span>
                    <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-black dark:text-white mt-3 font-display">{stats.totalContests}</div>
                  <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 mt-1 font-bold">Multiplayer Lobbies</div>
                </div>

              </div>

              {/* Subsystems Status Deck */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 space-y-4 shadow-md">
                  <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Storage & Schema Connectivity
                  </h3>
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-slate-950 border-2 border-black dark:border-slate-800/70">
                      <span className="text-slate-600 dark:text-slate-400">Database Engine:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">MongoDB Atlas (Connected)</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-slate-950 border-2 border-black dark:border-slate-800/70">
                      <span className="text-slate-600 dark:text-slate-400">Socket.IO Racing Gateway:</span>
                      <span className="text-cyan-600 dark:text-cyan-300 font-bold">{stats.activeRoomsCount} Active Rooms</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-slate-950 border-2 border-black dark:border-slate-800/70">
                      <span className="text-slate-600 dark:text-slate-400">Node Runtime Environment:</span>
                      <span className="text-black dark:text-white font-bold">{stats.nodeVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 space-y-4 shadow-md">
                  <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <button
                      onClick={() => setActiveTab('WORDBANKS')}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-slate-950 hover:bg-zinc-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-cyan-600 dark:text-cyan-300 font-bold">+ New Wordbank</span>
                      <span className="text-[10px] text-slate-500">Add 10FastFingers or quotes</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('CURRICULUM')}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-slate-950 hover:bg-zinc-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-emerald-600 dark:text-emerald-300 font-bold">+ New Lesson</span>
                      <span className="text-[10px] text-slate-500">Expand course modules</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('NOTICES')}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-slate-950 hover:bg-zinc-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-amber-600 dark:text-amber-300 font-bold">Broadcast Notice</span>
                      <span className="text-[10px] text-slate-500">Push flash alert banner</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('USERS')}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-slate-950 hover:bg-zinc-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-800 text-left transition cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-purple-600 dark:text-purple-300 font-bold">Manage Roles</span>
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
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Universal CMS Content Hub</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">Manage marketing headlines, company timeline milestones, features, and about sections.</p>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {['timeline', 'company_info', 'hero', 'features', 'founder', 'notice'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCmsTypeFilter(t)}
                    className={`px-4 py-2 rounded-xl border-2 transition cursor-pointer ${
                      cmsTypeFilter === t
                        ? 'bg-black text-white dark:bg-cyan-500/20 dark:text-cyan-300 border-black dark:border-cyan-400/50 font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900/60 text-zinc-700 dark:text-slate-400 border-black dark:border-slate-800 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Create / Edit CMS item card */}
              <div id="cms-editor-section" className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 space-y-5 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    {editingCmsItem ? `Edit CMS Entry: "${editingCmsItem.title}"` : `Publish New CMS Entry [${cmsTypeFilter.toUpperCase()}]`}
                  </h3>
                  {editingCmsItem && (
                    <button
                      type="button"
                      onClick={resetCmsForm}
                      className="px-3 py-1 rounded-xl bg-zinc-200 dark:bg-slate-800 text-black dark:text-white text-xs font-mono font-bold hover:bg-zinc-300 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveCmsItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Unique Key *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. timeline_2026_q1"
                      value={newCmsKey}
                      onChange={(e) => setNewCmsKey(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Headline title"
                      value={newCmsTitle}
                      onChange={(e) => setNewCmsTitle(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Short Description</label>
                    <input
                      type="text"
                      placeholder="Summary snippet"
                      value={newCmsShortDesc}
                      onChange={(e) => setNewCmsShortDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Full Description</label>
                    <textarea
                      rows={3}
                      placeholder="Detailed content description"
                      value={newCmsFullDesc}
                      onChange={(e) => setNewCmsFullDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Date / Milestone Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Oct 2026 or Q1 2026"
                      value={newCmsDate}
                      onChange={(e) => setNewCmsDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Accent Color</label>
                      <select
                        value={newCmsColor}
                        onChange={(e) => setNewCmsColor(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                      >
                        <option value="cyan">Cyan</option>
                        <option value="purple">Purple</option>
                        <option value="emerald">Emerald</option>
                        <option value="teal">Teal</option>
                        <option value="amber">Amber</option>
                        <option value="rose">Rose</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Sort Order</label>
                      <input
                        type="number"
                        value={newCmsOrder}
                        onChange={(e) => setNewCmsOrder(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Image Attachment (URL or Local Upload with Crop) */}
                  <div className="sm:col-span-2 p-4 rounded-xl bg-zinc-50 dark:bg-slate-950/80 border-2 border-dashed border-black/20 dark:border-slate-800 space-y-3">
                    <label className="block text-xs font-bold text-black dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        CMS Image / Illustration (Optional)
                      </span>
                      {newCmsImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewCmsImageUrl('')}
                          className="text-rose-500 hover:text-rose-400 text-[10px] font-bold"
                        >
                          Remove Image
                        </button>
                      )}
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {newCmsImageUrl ? (
                        <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-black/20 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                          <img src={newCmsImageUrl} alt="CMS Preview" className="max-w-full max-h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-zinc-200 dark:bg-slate-900 border border-dashed border-zinc-400 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                          No Image
                        </div>
                      )}

                      <div className="flex-1 w-full space-y-2">
                        <input
                          type="text"
                          placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                          value={newCmsImageUrl}
                          onChange={(e) => setNewCmsImageUrl(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-black/20 dark:border-slate-700 rounded-xl px-3 py-2 text-black dark:text-white text-xs outline-none focus:border-cyan-500"
                        />
                        <div className="flex items-center gap-2">
                          <label className="px-3.5 py-1.5 rounded-lg bg-zinc-200 dark:bg-slate-800 hover:bg-zinc-300 dark:hover:bg-slate-700 text-black dark:text-white font-bold cursor-pointer text-xs transition border border-black/20 dark:border-slate-700 inline-flex items-center gap-1.5">
                            <Crop className="w-3.5 h-3.5 text-cyan-500" />
                            <span>Upload & Crop Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileForCropping(e, 'cmsImage', 'square', `Crop ${cmsTypeFilter.toUpperCase()} Image`)}
                            />
                          </label>
                          <span className="text-[10px] text-zinc-500">Pick URL or upload file directly</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20 border-2 border-black flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingCmsItem ? 'Update CMS Entry' : 'Publish to CMS'}</span>
                    </button>
                    {editingCmsItem && (
                      <button
                        type="button"
                        onClick={resetCmsForm}
                        className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-slate-800 text-black dark:text-white font-mono text-xs font-bold hover:bg-zinc-300 dark:hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List of CMS Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono uppercase text-slate-600 dark:text-slate-400">
                    Published Items for [{cmsTypeFilter.toUpperCase()}] ({cmsItems.filter(i => (i.contentType || '').toLowerCase() === cmsTypeFilter.toLowerCase()).length})
                  </h3>
                  <button
                    onClick={() => {
                      resetCmsForm();
                      const formElem = document.getElementById('cms-editor-section');
                      if (formElem) formElem.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    + Add New Item
                  </button>
                </div>

                {cmsItems.filter(i => (i.contentType || '').toLowerCase() === cmsTypeFilter.toLowerCase()).length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-zinc-100 dark:bg-slate-900/40 border-2 border-dashed border-zinc-300 dark:border-slate-800 text-zinc-500 dark:text-slate-500 font-mono text-xs">
                    No published items found for [{cmsTypeFilter.toUpperCase()}]. Fill out the form above to add one.
                  </div>
                ) : (
                  cmsItems.filter(i => (i.contentType || '').toLowerCase() === cmsTypeFilter.toLowerCase()).map((item) => {
                    const itemImg = item.imageUrl || item.data?.imageUrl;
                    return (
                      <div key={item._id} className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border-2 border-black dark:border-slate-800 flex items-start justify-between gap-4 font-mono text-xs shadow-sm hover:border-cyan-500 transition">
                        <div className="flex items-start gap-3.5">
                          {itemImg && (
                            <img
                              src={itemImg}
                              alt={item.title}
                              className="w-14 h-14 rounded-lg object-cover border border-black/20 dark:border-slate-700 shrink-0"
                            />
                          )}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-black dark:text-white text-sm">{item.title}</span>
                              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-zinc-300 dark:border-slate-700 text-[10px] font-bold">{item.key}</span>
                              {item.date && <span className="text-cyan-700 dark:text-cyan-400 text-[10px] font-bold">[{item.date}]</span>}
                              {item.color && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-400 uppercase">
                                  {item.color}
                                </span>
                              )}
                              {item.order !== undefined && (
                                <span className="text-[9px] text-zinc-500">#{item.order}</span>
                              )}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-xs">{item.shortDescription}</p>
                            {item.fullDescription && <p className="text-slate-600 dark:text-slate-500 text-[11px] leading-relaxed">{item.fullDescription}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditCmsItem(item)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition cursor-pointer"
                            title="Edit CMS item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCmsItem(item._id)}
                            className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Delete CMS item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: WORDBANKS & TEXT ENGINE CMS */}
          {activeTab === 'WORDBANKS' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Wordbanks & Text Engine CMS</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">Configure 10FastFingers word pools, software quotes, technical text libraries, and custom typing banks.</p>
              </div>

              {/* Create new wordbank */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 space-y-4 shadow-md">
                <h3 className="text-base font-bold font-display text-black dark:text-white">Create New Wordbank / Quote Collection</h3>
                <form onSubmit={handleCreateWordbank} className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Collection Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Top 500 Modern Tech Words"
                        value={newBankTitle}
                        onChange={(e) => setNewBankTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Category</label>
                      <select
                        value={newBankCategory}
                        onChange={(e: any) => setNewBankCategory(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
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
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Difficulty</label>
                      <select
                        value={newBankDifficulty}
                        onChange={(e: any) => setNewBankDifficulty(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Words List (comma or space separated)</label>
                    <textarea
                      rows={3}
                      placeholder="apple banana orange computer software cloud..."
                      value={newBankWords}
                      onChange={(e) => setNewBankWords(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20 border-2 border-black"
                  >
                    Save Wordbank to CMS
                  </button>
                </form>
              </div>

              {/* Existing Wordbanks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wordbanks.map((b) => (
                  <div key={b._id || b.key} className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 font-mono text-xs space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-black dark:text-white text-sm">{b.title}</h4>
                        <span className="text-[10px] text-cyan-700 dark:text-cyan-400 uppercase font-bold">CATEGORY: {b.category}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteWordbank(b._id || (b as any).id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">{b.description || 'Custom curated wordbank for typing tests.'}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-500 border-t-2 border-black dark:border-slate-800/80 pt-2">
                      <span>Total Words: <strong className="text-black dark:text-white">{(b.words || []).length}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-slate-800 text-black dark:text-slate-300 border border-black dark:border-slate-700 font-bold">{b.difficulty}</span>
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
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Curriculum & Course CMS</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">Design TypingClub-style structured courses, finger positioning drills, and star rewards.</p>
              </div>

              {/* Course Selection & Creator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Courses list */}
                <div className="space-y-3 lg:col-span-1">
                  <h3 className="font-mono text-xs uppercase text-slate-600 dark:text-slate-400 font-bold">Academic Tracks</h3>
                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCourseForEdit(c)}
                        className={`p-3 rounded-xl border-2 font-mono text-xs cursor-pointer transition ${
                          selectedCourseForEdit?.id === c.id
                            ? 'bg-zinc-100 dark:bg-cyan-500/15 border-black dark:border-cyan-400/50 text-black dark:text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900/50 border-zinc-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="font-bold text-sm text-black dark:text-white">{c.title}</div>
                        <div className="text-[10px] text-cyan-700 dark:text-cyan-400 mt-0.5 font-bold">{c.difficulty} Track • {(c.lessons || []).length} Lessons</div>
                      </div>
                    ))}
                  </div>

                  {/* Add Course Form */}
                  <form onSubmit={handleCreateCourse} className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 space-y-2 font-mono text-xs mt-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-500 font-bold block">Add New Course Track</span>
                    <input
                      type="text"
                      placeholder="Course Track Title"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none focus:border-cyan-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Track Description (e.g. Master fundamental finger positioning)"
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none focus:border-cyan-500"
                    />
                    <select
                      value={newCourseDifficulty}
                      onChange={(e: any) => setNewCourseDifficulty(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none focus:border-cyan-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Pro">Pro</option>
                    </select>

                    {/* Course Track Video Media */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-black/10 dark:border-slate-850 rounded-lg space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
                        <Video className="w-3 h-3 text-cyan-500" />
                        <span>Track Video Overview</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={newCourseVideoType}
                          onChange={(e: any) => setNewCourseVideoType(e.target.value)}
                          className="w-1/3 bg-white dark:bg-slate-900 border border-black/20 dark:border-slate-800 rounded px-2 py-1 text-black dark:text-white text-[11px]"
                        >
                          <option value="none">No Video</option>
                          <option value="youtube">YouTube</option>
                          <option value="upload">Upload Video</option>
                        </select>
                        {newCourseVideoType === 'youtube' && (
                          <input
                            type="text"
                            placeholder="https://youtube.com/watch?v=..."
                            value={newCourseVideoUrl}
                            onChange={(e) => setNewCourseVideoUrl(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-black/20 dark:border-slate-800 rounded px-2 py-1 text-black dark:text-white text-[11px]"
                          />
                        )}
                        {newCourseVideoType === 'upload' && (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadVideoFile(f, url => setNewCourseVideoUrl(url));
                              }}
                              className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-cyan-500 file:text-black file:font-bold cursor-pointer"
                            />
                            {uploadingVideo && <span className="text-[10px] text-amber-500 font-bold animate-pulse">Uploading...</span>}
                            {newCourseVideoUrl && !uploadingVideo && <span className="text-[10px] text-emerald-500 font-bold">Uploaded ✓</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <button type="submit" className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition border-2 border-black cursor-pointer">
                      + Create Course
                    </button>
                  </form>
                </div>

                {/* Right: Selected Course Lessons & Lesson Creator */}
                <div className="lg:col-span-2 space-y-5">
                  {selectedCourseForEdit ? (
                    <>
                      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold font-display text-black dark:text-white">{selectedCourseForEdit.title}</h3>
                              {selectedCourseForEdit.videoUrl && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 font-bold">
                                  <Video className="w-2.5 h-2.5" /> Video Linked
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{selectedCourseForEdit.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditCourseModal(selectedCourseForEdit)}
                              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white border border-zinc-300 dark:border-slate-700 transition flex items-center gap-1 font-mono text-[10px] font-bold cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-cyan-400" /> Edit Track & Video
                            </button>
                            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                              {selectedCourseForEdit.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Add Lesson Form */}
                        <form onSubmit={handleAddLesson} className="space-y-3 font-mono text-xs border-t-2 border-black dark:border-slate-800 pt-4">
                          <h4 className="font-bold text-black dark:text-white uppercase text-[11px]">Add Lesson Drill to this Track</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Lesson Title (e.g. Home Row Speed Drill)"
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              className="bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                            />
                            <select
                              value={newLessonTargetFinger}
                              onChange={(e) => setNewLessonTargetFinger(e.target.value)}
                              className="bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
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
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            placeholder="Coaching Instructions for typist"
                            value={newLessonInstructions}
                            onChange={(e) => setNewLessonInstructions(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                          />

                          {/* Lesson Video Media */}
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-black/10 dark:border-slate-850 rounded-xl space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
                              <Video className="w-3.5 h-3.5 text-cyan-500" />
                              <span>Lesson Video Tutorial / Demonstration</span>
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={newLessonVideoType}
                                onChange={(e: any) => setNewLessonVideoType(e.target.value)}
                                className="sm:w-1/3 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white text-xs outline-none"
                              >
                                <option value="none">No Video</option>
                                <option value="youtube">YouTube URL</option>
                                <option value="upload">Upload Video File</option>
                              </select>
                              {newLessonVideoType === 'youtube' && (
                                <input
                                  type="text"
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  value={newLessonVideoUrl}
                                  onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                                  className="flex-1 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white text-xs outline-none focus:border-cyan-500"
                                />
                              )}
                              {newLessonVideoType === 'upload' && (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleUploadVideoFile(f, url => setNewLessonVideoUrl(url));
                                    }}
                                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-500 file:text-black file:font-bold cursor-pointer"
                                  />
                                  {uploadingVideo && <span className="text-[10px] text-amber-500 font-bold animate-pulse">Uploading...</span>}
                                  {newLessonVideoUrl && !uploadingVideo && <span className="text-[10px] text-emerald-500 font-bold">Uploaded ✓</span>}
                                </div>
                              )}
                            </div>
                          </div>

                          <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono rounded-xl transition border-2 border-black cursor-pointer">
                            + Add Lesson Drill
                          </button>
                        </form>
                      </div>

                      {/* Lessons List */}
                      <div className="space-y-2">
                        <h4 className="font-mono text-xs uppercase text-slate-600 dark:text-slate-400 font-bold">Track Drills ({selectedCourseForEdit.lessons?.length || 0})</h4>
                        {(selectedCourseForEdit.lessons || []).map((l, idx) => {
                          const courseId = (selectedCourseForEdit as any)._id || selectedCourseForEdit.id || (selectedCourseForEdit as any).courseId;
                          const lessonId = (l as any).lessonId || l.id || (l as any)._id;
                          return (
                            <div key={l.id || (l as any).lessonId || idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 font-mono text-xs flex items-center justify-between gap-4 shadow-sm">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-black dark:text-white text-sm">{idx + 1}. {l.title}</span>
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-bold">
                                    {l.targetFinger || 'index'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-mono truncate font-medium">&ldquo;{l.text}&rdquo;</div>
                                {l.instructions && <div className="text-[10px] text-slate-600 dark:text-slate-500">{l.instructions}</div>}
                                <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-3 pt-0.5">
                                  <span>Min: <strong className="text-black dark:text-slate-200">{l.minWpm || 20} WPM</strong></span>
                                  <span>Accuracy: <strong className="text-black dark:text-slate-200">{l.minAccuracy || 90}%</strong></span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">+{l.xpReward} XP / +{l.coinsReward} Coins</span>
                                <button
                                  type="button"
                                  onClick={() => openEditLessonModal(l, courseId)}
                                  className="p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-cyan-500/20 text-black dark:text-slate-400 border border-zinc-300 dark:border-slate-700 transition cursor-pointer"
                                  title="Edit Lesson Drill"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(courseId, lessonId)}
                                  className="p-1.5 rounded bg-zinc-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-zinc-300 dark:border-slate-700 transition cursor-pointer"
                                  title="Delete Lesson Drill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Modal to Edit Lesson Drill */}
                      {editingLesson && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                          <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto text-black dark:text-white">
                            <div className="flex items-center justify-between border-b-2 border-black dark:border-slate-800 pb-3">
                              <h3 className="text-sm font-bold text-black dark:text-white font-display flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Edit Lesson Drill
                              </h3>
                              <button
                                type="button"
                                onClick={() => setEditingLesson(null)}
                                className="text-slate-500 hover:text-black dark:hover:text-white text-base font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            <form onSubmit={handleUpdateLesson} className="space-y-3">
                              <div>
                                <label className="block text-slate-600 dark:text-slate-400 mb-1">Lesson Title</label>
                                <input
                                  type="text"
                                  value={editLessonTitle}
                                  onChange={(e) => setEditLessonTitle(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 dark:text-slate-400 mb-1">Target Finger</label>
                                <select
                                  value={editLessonTargetFinger}
                                  onChange={(e) => setEditLessonTargetFinger(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                                >
                                  <option value="index">Index Finger</option>
                                  <option value="middle">Middle Finger</option>
                                  <option value="ring">Ring Finger</option>
                                  <option value="pinky">Pinky Finger</option>
                                  <option value="thumb">Thumbs (Spacebar)</option>
                                  <option value="various">Various / All Fingers</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-600 dark:text-slate-400 mb-1">Drill Practice Keystrokes</label>
                                <textarea
                                  rows={3}
                                  value={editLessonText}
                                  onChange={(e) => setEditLessonText(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 dark:text-slate-400 mb-1">Coaching Instructions</label>
                                <input
                                  type="text"
                                  value={editLessonInstructions}
                                  onChange={(e) => setEditLessonInstructions(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                                />
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Min WPM</label>
                                  <input
                                    type="number"
                                    min="5"
                                    max="200"
                                    value={editLessonMinWpm}
                                    onChange={(e) => setEditLessonMinWpm(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none focus:border-cyan-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Min Acc %</label>
                                  <input
                                    type="number"
                                    min="50"
                                    max="100"
                                    value={editLessonMinAccuracy}
                                    onChange={(e) => setEditLessonMinAccuracy(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none focus:border-cyan-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">XP Reward</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editLessonXpReward}
                                    onChange={(e) => setEditLessonXpReward(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none focus:border-cyan-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Coins Reward</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editLessonCoinsReward}
                                    onChange={(e) => setEditLessonCoinsReward(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none focus:border-cyan-500"
                                  />
                                </div>
                              </div>

                              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-black/10 dark:border-slate-850 rounded-xl space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
                                  <Video className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Lesson Video Tutorial / Demonstration</span>
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <select
                                    value={editLessonVideoType}
                                    onChange={(e: any) => setEditLessonVideoType(e.target.value)}
                                    className="sm:w-1/3 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white text-xs outline-none"
                                  >
                                    <option value="none">No Video</option>
                                    <option value="youtube">YouTube URL</option>
                                    <option value="upload">Upload Video File</option>
                                  </select>
                                  {editLessonVideoType === 'youtube' && (
                                    <input
                                      type="text"
                                      placeholder="https://www.youtube.com/watch?v=..."
                                      value={editLessonVideoUrl}
                                      onChange={(e) => setEditLessonVideoUrl(e.target.value)}
                                      className="flex-1 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white text-xs outline-none focus:border-cyan-500"
                                    />
                                  )}
                                  {editLessonVideoType === 'upload' && (
                                    <div className="flex-1 flex items-center gap-2">
                                      <input
                                        type="file"
                                        accept="video/mp4,video/webm,video/quicktime"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) handleUploadVideoFile(f, url => setEditLessonVideoUrl(url));
                                        }}
                                        className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-500 file:text-black file:font-bold cursor-pointer"
                                      />
                                      {uploadingVideo && <span className="text-[10px] text-amber-500 font-bold animate-pulse">Uploading...</span>}
                                      {editLessonVideoUrl && !uploadingVideo && <span className="text-[10px] text-emerald-500 font-bold">Uploaded ✓</span>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-3 border-t-2 border-black dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setEditingLesson(null)}
                                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-slate-800 text-black dark:text-slate-400 hover:bg-zinc-200 border-2 border-black dark:border-slate-700 transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition cursor-pointer border-2 border-black"
                                >
                                  Save Drill Updates
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Modal to Edit Course Track */}
                      {isEditingCourseModal && selectedCourseForEdit && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                          <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto text-black dark:text-white">
                            <div className="flex items-center justify-between border-b-2 border-black dark:border-slate-800 pb-3">
                              <h3 className="text-sm font-bold text-black dark:text-white font-display flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Edit Course Track & Video
                              </h3>
                              <button
                                type="button"
                                onClick={() => setIsEditingCourseModal(false)}
                                className="text-slate-500 hover:text-black dark:hover:text-white text-base font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            <form onSubmit={handleUpdateCourse} className="space-y-3">
                              <div>
                                <label className="block text-slate-600 dark:text-slate-400 mb-1">Track Title</label>
                                <input
                                  type="text"
                                  value={editCourseTitle}
                                  onChange={(e) => setEditCourseTitle(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 dark:text-slate-400 mb-1">Description</label>
                                <textarea
                                  rows={2}
                                  value={editCourseDesc}
                                  onChange={(e) => setEditCourseDesc(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 dark:text-slate-400 mb-1">Difficulty Tier</label>
                                <select
                                  value={editCourseDifficulty}
                                  onChange={(e: any) => setEditCourseDifficulty(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                                >
                                  <option value="Beginner">Beginner</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Advanced">Advanced</option>
                                  <option value="Pro">Pro</option>
                                </select>
                              </div>

                              {/* Course Overview Video */}
                              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-black/10 dark:border-slate-850 rounded-xl space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
                                  <Video className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Course Overview / Lecture Video</span>
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <select
                                    value={editCourseVideoType}
                                    onChange={(e: any) => setEditCourseVideoType(e.target.value)}
                                    className="sm:w-1/3 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white text-xs outline-none"
                                  >
                                    <option value="none">No Video</option>
                                    <option value="youtube">YouTube URL</option>
                                    <option value="upload">Upload Video File</option>
                                  </select>
                                  {editCourseVideoType === 'youtube' && (
                                    <input
                                      type="text"
                                      placeholder="https://www.youtube.com/watch?v=..."
                                      value={editCourseVideoUrl}
                                      onChange={(e) => setEditCourseVideoUrl(e.target.value)}
                                      className="flex-1 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-black dark:text-white text-xs outline-none focus:border-cyan-500"
                                    />
                                  )}
                                  {editCourseVideoType === 'upload' && (
                                    <div className="flex-1 flex items-center gap-2">
                                      <input
                                        type="file"
                                        accept="video/mp4,video/webm,video/quicktime"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) handleUploadVideoFile(f, url => setEditCourseVideoUrl(url));
                                        }}
                                        className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-500 file:text-black file:font-bold cursor-pointer"
                                      />
                                      {uploadingVideo && <span className="text-[10px] text-amber-500 font-bold animate-pulse">Uploading...</span>}
                                      {editCourseVideoUrl && !uploadingVideo && <span className="text-[10px] text-emerald-500 font-bold">Uploaded ✓</span>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-3 border-t-2 border-black dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingCourseModal(false)}
                                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-slate-800 text-black dark:text-slate-400 hover:bg-zinc-200 border-2 border-black dark:border-slate-700 transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition cursor-pointer border-2 border-black"
                                >
                                  Save Track Updates
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
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
                  <h1 className="text-2xl font-bold font-display text-black dark:text-white">Typist Directory & Role Governance</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">Audit users, inspect complete dossiers, print records, promote Super Admins, and adjust currency.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search by username, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-xl px-4 py-2 font-mono text-xs text-black dark:text-white outline-none focus:border-cyan-500 w-full sm:w-72"
                />
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border-2 border-black dark:border-slate-800 bg-white dark:bg-slate-900/30 overflow-x-auto shadow-md">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-100 dark:bg-slate-950 border-b-2 border-black dark:border-slate-800 text-black dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Typist</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Coins</th>
                      <th className="p-3.5">XP / Level</th>
                      <th className="p-3.5">Joined</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-slate-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-zinc-50 dark:hover:bg-slate-900/60 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-black dark:text-white">{u.username}</div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-500">{u.email}</div>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold border-2 outline-none cursor-pointer ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40'
                                : u.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40'
                                : 'bg-zinc-100 dark:bg-slate-800 text-black dark:text-slate-300 border-black dark:border-slate-700'
                            }`}
                          >
                            <option value="GENERAL_USER">GENERAL_USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>
                        <td className="p-3.5 font-bold text-amber-600 dark:text-amber-300">{u.coins || 0}</td>
                        <td className="p-3.5">
                          <span className="text-cyan-700 dark:text-cyan-300 font-bold">Lvl {u.level || 1}</span>
                          <span className="text-slate-500 ml-1">({u.xp || 0} XP)</span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-500 text-[10px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setViewingUserDossier(u)}
                            className="px-2.5 py-1 rounded bg-black dark:bg-cyan-500/20 hover:bg-zinc-800 dark:hover:bg-cyan-500/30 text-white dark:text-cyan-300 transition text-[10px] font-bold border-2 border-black dark:border-cyan-500/40 inline-flex items-center gap-1 cursor-pointer"
                            title="View Full User Dossier & Print Record"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Dossier</span>
                          </button>
                          <button
                            onClick={() => setEditingUser(u)}
                            className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-black dark:text-slate-300 transition text-[10px] font-bold border-2 border-black dark:border-slate-700 cursor-pointer"
                          >
                            Adjust Balance
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
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
                  <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 font-mono text-xs text-black dark:text-white">
                    <h3 className="text-sm font-bold text-black dark:text-white font-display">
                      Adjust Balance for {editingUser.username}
                    </h3>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Coins</label>
                      <input
                        type="number"
                        defaultValue={editingUser.coins || 0}
                        id="modal-coins-input"
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-1.5 text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">XP</label>
                      <input
                        type="number"
                        defaultValue={editingUser.xp || 0}
                        id="modal-xp-input"
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-1.5 text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Level</label>
                      <input
                        type="number"
                        defaultValue={editingUser.level || 1}
                        id="modal-level-input"
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-lg px-3 py-1.5 text-black dark:text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-1.5 rounded-lg bg-zinc-100 dark:bg-slate-800 text-black dark:text-slate-400 hover:bg-zinc-200 border-2 border-black dark:border-slate-700 cursor-pointer"
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
                        className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 border-2 border-black cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comprehensive User Dossier Modal with Print Capabilities */}
              {viewingUserDossier && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                  <div id="printable-user-dossier" className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full space-y-6 font-mono text-xs shadow-2xl text-black dark:text-white my-8">
                    {/* Dossier Header */}
                    <div className="flex items-start justify-between border-b-2 border-black dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-black dark:border-cyan-400 bg-zinc-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {viewingUserDossier.avatarUrl ? (
                            <img src={viewingUserDossier.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-black dark:text-white">
                              {(viewingUserDossier.username || 'U').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black font-display text-black dark:text-white">
                              {viewingUserDossier.fullName || viewingUserDossier.username}
                            </h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black text-white dark:bg-cyan-500/20 dark:text-cyan-300 border border-black dark:border-cyan-500/40">
                              {viewingUserDossier.role}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-xs">@{viewingUserDossier.username} • Reg ID: {viewingUserDossier.registrationId || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-black dark:bg-cyan-500 text-white dark:text-black font-bold flex items-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-cyan-400 transition cursor-pointer border-2 border-black"
                          title="Print User Dossier Record"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Dossier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingUserDossier(null)}
                          className="p-1.5 rounded-xl border-2 border-black dark:border-slate-700 bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 text-black dark:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Dossier Grid Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Email Address</span>
                        <span className="font-semibold">{viewingUserDossier.email || 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Phone Number</span>
                        <span className="font-semibold">{viewingUserDossier.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Country / Region</span>
                        <span className="font-semibold">{viewingUserDossier.country || 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Institute / Organization</span>
                        <span className="font-semibold">{viewingUserDossier.institute || 'Independent'}</span>
                      </div>
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Social / Portfolio Link</span>
                        <span className="font-semibold truncate block">{viewingUserDossier.socialLink || 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Daily Consecutive Streak</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">🔥 {viewingUserDossier.streak || 0} Consecutive Days</span>
                      </div>
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">XP & Level</span>
                        <span className="font-semibold">Level {viewingUserDossier.level || 1} • {viewingUserDossier.xp || 0} XP</span>
                      </div>
                      <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">FigCoins Balance</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">🪙 {viewingUserDossier.coins || 0} Coins</span>
                      </div>
                    </div>

                    {/* Bio / Summary */}
                    <div className="p-3 rounded-xl border-2 border-black dark:border-slate-800 bg-zinc-50 dark:bg-slate-950">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold mb-1">Typist Bio</span>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {viewingUserDossier.bio || 'No personal biography provided yet.'}
                      </p>
                    </div>

                    {/* Metadata Timestamps */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t-2 border-black dark:border-slate-800 pt-3">
                      <span>Account Created: {viewingUserDossier.createdAt ? new Date(viewingUserDossier.createdAt).toLocaleString() : 'N/A'}</span>
                      <span>Last Active: {viewingUserDossier.streakLastUpdated ? new Date(viewingUserDossier.streakLastUpdated).toLocaleString() : 'Recent'}</span>
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
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Esports & Realtime Contest Lobbies</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">Deploy multiplayer speed race arenas, schedule start/end date-times, and configure passages.</p>
              </div>

              {/* Create Contest Form */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 space-y-4 shadow-md">
                <h3 className="text-base font-bold font-display text-black dark:text-white">Create New Contest Lobby</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newContestTitle.trim() || !newContestText.trim()) {
                      showToast('Please provide a title and typing passage for the contest', 'error');
                      return;
                    }
                    try {
                      const res = await fetch(`${API_URL}/api/contests`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${userToken}`
                        },
                        body: JSON.stringify({
                          title: newContestTitle.trim(),
                          description: newContestDesc.trim() || 'Global speed race tournament',
                          passage: newContestText.trim(),
                          contestText: newContestText.trim(),
                          duration: Number(newContestDuration) || 60,
                          startTime: newContestStartTime ? new Date(newContestStartTime).toISOString() : undefined,
                          endTime: newContestEndTime ? new Date(newContestEndTime).toISOString() : undefined,
                          visibility: 'PUBLIC',
                          logoUrl: newContestLogo.trim() || undefined
                        })
                      });
                      if (res.ok) {
                        showToast('Contest room deployed successfully');
                        setNewContestTitle('');
                        setNewContestDesc('');
                        setNewContestText('');
                        setNewContestStartTime('');
                        setNewContestEndTime('');
                        setNewContestLogo('');
                        fetchContests();
                      } else {
                        const err = await res.json().catch(() => ({}));
                        showToast(err.error || 'Failed to deploy contest room', 'error');
                      }
                    } catch (err: any) {
                      showToast(err.message || 'Network error deploying contest room', 'error');
                    }
                  }}
                  className="space-y-3 font-mono text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Contest Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Saturday Speed Grand Prix"
                        value={newContestTitle}
                        onChange={(e) => setNewContestTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Duration (Seconds)</label>
                      <input
                        type="number"
                        min="15"
                        max="300"
                        value={newContestDuration}
                        onChange={(e) => setNewContestDuration(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Scheduled Start and End Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Scheduled Start Time (Optional)</label>
                      <input
                        type="datetime-local"
                        value={newContestStartTime}
                        onChange={(e) => setNewContestStartTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Scheduled End Time (Optional)</label>
                      <input
                        type="datetime-local"
                        value={newContestEndTime}
                        onChange={(e) => setNewContestEndTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Brief rules, division info, or rewards"
                      value={newContestDesc}
                      onChange={(e) => setNewContestDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Contest Logo / Tournament Insignia */}
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Contest / Tournament Logo (Shown on Official Certificate)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 border-2 border-black dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {newContestLogo ? (
                          <img src={newContestLogo} alt="Logo preview" className="w-full h-full object-cover" />
                        ) : (
                          <Award className="w-5 h-5 text-amber-500/60" />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Paste Contest Logo URL (or data:image/...)"
                        value={newContestLogo}
                        onChange={(e) => setNewContestLogo(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500 text-xs"
                      />
                      <label className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-black dark:text-white rounded-xl cursor-pointer border-2 border-black dark:border-slate-700 transition text-xs font-mono font-bold shrink-0">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') setNewContestLogo(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Passage Text for Competitors</label>
                    <textarea
                      rows={3}
                      placeholder="Text to type during contest..."
                      value={newContestText}
                      onChange={(e) => setNewContestText(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-purple-500/20 border-2 border-black"
                  >
                    Deploy Contest Room
                  </button>
                </form>
              </div>

              {/* Contests List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(contests || []).map((c: any) => {
                  const cId = c._id || c.id;
                  const isOff = c.status === 'INACTIVE' || c.status === 'CANCELLED';
                  return (
                    <div key={cId} className={`p-5 rounded-2xl bg-white dark:bg-slate-900/40 border-2 font-mono text-xs space-y-3 relative group shadow-md ${isOff ? 'border-rose-500/60 opacity-85' : 'border-black dark:border-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-black dark:text-white text-sm">{c.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-500/30">
                            {c.duration}s
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleContestStatus(cId)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                              isOff
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            }`}
                            title={isOff ? 'Reactivate Contest Lobby' : 'Turn Off / Close Lobby'}
                          >
                            {isOff ? 'Turn On' : 'Turn Off'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditContestModal(c)}
                            className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-cyan-500/20 text-black dark:text-slate-400 border border-zinc-300 dark:border-slate-700 text-xs transition cursor-pointer"
                            title="Edit Contest Room & Schedule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContest(cId)}
                            className="p-1 rounded bg-zinc-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-zinc-300 dark:border-slate-700 text-xs transition cursor-pointer"
                            title="Delete Contest Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">{c.description || 'Global speed typing tournament'}</p>

                      {/* Scheduled start/end display */}
                      {(c.startTime || c.endTime) && (
                        <div className="text-[10px] bg-zinc-50 dark:bg-slate-950 p-2.5 rounded-lg border-2 border-black dark:border-slate-800 text-black dark:text-slate-300 flex flex-col gap-0.5">
                          {c.startTime && (
                            <span className="text-cyan-700 dark:text-cyan-300 font-medium">
                              Start: <strong className="text-black dark:text-white">{new Date(c.startTime).toLocaleString()}</strong>
                            </span>
                          )}
                          {c.endTime && (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              End: <strong className="text-black dark:text-white">{new Date(c.endTime).toLocaleString()}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-700 dark:text-slate-400 bg-zinc-50 dark:bg-slate-950 p-2.5 rounded-lg border-2 border-black dark:border-slate-800/80 line-clamp-2">
                        <span className="text-cyan-700 dark:text-cyan-400 font-bold">Passage: </span>
                        {c.passage || c.contestText || 'Standard contest passage'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-500 pt-1">
                        <span>Code: <span className="text-cyan-700 dark:text-cyan-300 font-bold">{c.inviteCode || c.shareCode || 'N/A'}</span></span>
                        <span>
                          Status:{' '}
                          <span className={`uppercase font-bold ${isOff ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {c.status || 'LOBBY'}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal to Edit Contest & Scheduled Time */}
              {editingContest && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto text-black dark:text-white">
                    <div className="flex items-center justify-between border-b-2 border-black dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-black dark:text-white font-display flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Edit Contest Room & Schedule
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingContest(null)}
                        className="text-slate-500 hover:text-black dark:hover:text-white text-base font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleUpdateContest} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Contest Title</label>
                          <input
                            type="text"
                            value={editContestTitle}
                            onChange={(e) => setEditContestTitle(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Duration (Seconds)</label>
                          <input
                            type="number"
                            min="15"
                            max="600"
                            value={editContestDuration}
                            onChange={(e) => setEditContestDuration(Number(e.target.value))}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Scheduled Start & End Time pickers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Scheduled Start Time (Optional)</label>
                          <input
                            type="datetime-local"
                            value={editContestStartTime}
                            onChange={(e) => setEditContestStartTime(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Scheduled End Time (Optional)</label>
                          <input
                            type="datetime-local"
                            value={editContestEndTime}
                            onChange={(e) => setEditContestEndTime(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Lobby Status</label>
                          <select
                            value={editContestStatus}
                            onChange={(e) => setEditContestStatus(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                          >
                            <option value="LOBBY">LOBBY (Open for joining)</option>
                            <option value="COUNTDOWN">COUNTDOWN</option>
                            <option value="RACING">RACING (Active)</option>
                            <option value="FINISHED">FINISHED</option>
                            <option value="INACTIVE">INACTIVE (Closed)</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Visibility</label>
                          <select
                            value={editContestVisibility}
                            onChange={(e) => setEditContestVisibility(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                          >
                            <option value="PUBLIC">PUBLIC</option>
                            <option value="PRIVATE">PRIVATE (Invite Only)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">Description</label>
                        <input
                          type="text"
                          value={editContestDesc}
                          onChange={(e) => setEditContestDesc(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">Contest Typing Passage</label>
                        <textarea
                          rows={4}
                          value={editContestText}
                          onChange={(e) => setEditContestText(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t-2 border-black dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingContest(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-slate-800 text-black dark:text-slate-400 hover:bg-zinc-200 border-2 border-black dark:border-slate-700 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer shadow-lg shadow-purple-500/20 border-2 border-black"
                        >
                          Save Contest Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 7: CERTIFICATES AUDIT */}
          {activeTab === 'CERTIFICATES' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Certificate Governance & Verification</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">Audit all issued diplomas, review verification authenticity, and approve, decline, or revoke status.</p>
              </div>

              <div className="rounded-2xl border-2 border-black dark:border-slate-800 bg-white dark:bg-slate-900/30 overflow-x-auto shadow-md">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-100 dark:bg-slate-950 border-b-2 border-black dark:border-slate-800 text-black dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Recipient</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5">Performance</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Issued At</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-slate-800/60">
                    {allCerts.map((cert) => (
                      <tr key={cert.id || cert._id} className="hover:bg-zinc-50 dark:hover:bg-slate-900/60 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-black dark:text-white">{cert.fullName}</div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-500">{cert.institute || 'Independent Typist'}</div>
                        </td>
                        <td className="p-3.5 text-cyan-700 dark:text-cyan-300 font-bold">{cert.mode}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-black dark:text-white">{cert.wpm} WPM</span>
                          <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">{cert.accuracy}% Acc</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cert.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : cert.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : cert.status === 'DECLINED'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                              : 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border border-zinc-500/30'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-500 text-[10px]">
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {cert.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleCertStatus(cert.id || cert._id, 'APPROVED')}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 text-[10px] font-bold transition cursor-pointer border border-emerald-500/40"
                              title="Approve Certificate"
                            >
                              Approve
                            </button>
                          )}
                          {cert.status !== 'DECLINED' && (
                            <button
                              type="button"
                              onClick={() => handleCertStatus(cert.id || cert._id, 'DECLINED')}
                              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 hover:text-rose-800 text-[10px] font-bold transition cursor-pointer border border-rose-500/40"
                              title="Decline Certificate"
                            >
                              Decline
                            </button>
                          )}
                          {cert.status !== 'REVOKED' && (
                            <button
                              type="button"
                              onClick={() => handleCertStatus(cert.id || cert._id, 'REVOKED')}
                              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 hover:text-amber-800 text-[10px] font-bold transition cursor-pointer border border-amber-500/40"
                              title="Revoke Certificate"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCert(cert.id || cert._id)}
                            className="px-2 py-1 rounded bg-zinc-100 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 text-[10px] transition cursor-pointer border border-zinc-300 dark:border-rose-500/30"
                            title="Delete Certificate Record Permanently"
                          >
                            Delete
                          </button>
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
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Flash Notices & Marquee Broadcaster</h1>
                <p className="text-sm text-zinc-600 dark:text-slate-400 font-mono mt-1">Broadcast urgent system updates, contest schedules, and marquee flashes.</p>
              </div>

              {/* Publish notice */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 shadow-md space-y-4">
                <h3 className="text-base font-bold font-display text-black dark:text-white">Push System Announcement</h3>
                <form onSubmit={handleCreateNotice} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-zinc-700 dark:text-slate-400 mb-1 font-bold">Notice Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. SYSTEM MAINTENANCE or TOURNAMENT REGISTRATION OPEN"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 dark:text-slate-400 mb-1 font-bold">Notice Content</label>
                    <textarea
                      rows={2}
                      placeholder="Details displayed in the scrolling marquee banner..."
                      value={newNoticeContent}
                      onChange={(e) => setNewNoticeContent(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none focus:border-cyan-500 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black font-mono text-xs transition cursor-pointer shadow-lg border-2 border-black"
                  >
                    Broadcast to Marquee
                  </button>
                </form>
              </div>

              {/* Notices List */}
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase text-zinc-700 dark:text-slate-400 font-bold">Active Broadcasts ({notices.length})</h3>
                {notices.map((n) => (
                  <div key={n.id} className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 font-mono text-xs">
                    <div>
                      <span className="font-bold text-black dark:text-white text-sm block">{n.title}</span>
                      <span className="text-zinc-600 dark:text-slate-400 text-xs">{n.content}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-2 text-zinc-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition border border-transparent hover:border-rose-500"
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
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Brand Identity & Visual Assets</h1>
                <p className="text-sm text-zinc-600 dark:text-slate-400 font-mono mt-1">Configure website logo, partner brand logos, founder picture, with Facebook-style interactive cropping.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                
                {/* Founder Picture (Facebook Style Circular Cropper) */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 space-y-4 shadow-lg hover:border-cyan-500 transition text-black dark:text-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      Founder Profile Picture & Dimension
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-bold">
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
                            className="rounded-full object-cover border-2 border-black dark:border-slate-950 bg-zinc-100 dark:bg-slate-900"
                          />
                        </div>
                      ) : (
                        <div
                          style={{ width: founderPicSize, height: founderPicSize }}
                          className="rounded-full border-2 border-dashed border-zinc-400 dark:border-slate-700 bg-zinc-100 dark:bg-slate-950 flex items-center justify-center text-zinc-500 dark:text-slate-600 font-bold"
                        >
                          MR
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold cursor-pointer transition shadow-md border-2 border-black">
                        <Crop className="w-4 h-4" />
                        <span>Upload & Crop Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileForCropping(e, 'founderPic', 'circle', 'Crop Founder Avatar')}
                        />
                      </label>
                      <p className="text-[11px] text-zinc-500 dark:text-slate-500 text-center font-bold">Facebook-style circular drag & zoom crop</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={founderPicInput}
                    onChange={(e) => setFounderPicInput(e.target.value)}
                    placeholder="Or paste Direct Image URL / Base64"
                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white text-xs font-bold"
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-zinc-700 dark:text-slate-400 text-xs min-w-[70px] font-bold">Size: {founderPicSize}px</span>
                    <input
                      type="range"
                      min={48}
                      max={140}
                      value={founderPicSize}
                      onChange={(e) => setFounderPicSize(Number(e.target.value))}
                      className="flex-1 accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => {
                      handleSaveBrandingField('founder-picture', 'founderPicture', founderPicInput);
                      handleSaveBrandingField('founder-picture-size', 'founderPictureSize', founderPicSize);
                    }}
                    className="w-full px-4 py-2.5 bg-zinc-900 dark:bg-slate-800 hover:bg-cyan-500 hover:text-black text-white font-bold rounded-xl transition font-mono text-xs flex items-center justify-center gap-2 border-2 border-black"
                  >
                    <Check className="w-4 h-4" /> Save Profile Settings
                  </button>
                </div>

                {/* FigTyp Brand Logo */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 space-y-4 shadow-lg hover:border-cyan-500 transition text-black dark:text-white">
                  <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    FigTyp Brand Logo
                  </h4>

                  <div className="flex items-center gap-4">
                    {logoInput ? (
                      <img src={logoInput} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-black dark:border-slate-700 shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-slate-950 border-2 border-dashed border-zinc-400 dark:border-slate-700 flex items-center justify-center text-zinc-500 dark:text-slate-600 font-bold">
                        FT
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-black dark:text-white font-bold cursor-pointer transition border-2 border-black dark:border-slate-700 shadow-sm">
                      <Crop className="w-4 h-4 text-cyan-500" />
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
                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white text-xs font-bold"
                  />
                  <button
                    onClick={() => handleSaveBrandingField('logo', 'websiteLogo', logoInput)}
                    className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition border-2 border-black shadow-md"
                  >
                    Save Logo
                  </button>
                </div>

                {/* M-Square Logo */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 space-y-4 shadow-lg hover:border-indigo-500 transition text-black dark:text-white">
                  <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    M-Square Devs Group Logo
                  </h4>

                  <div className="flex items-center gap-4">
                    {mSquareInput ? (
                      <img src={mSquareInput} alt="M-Square" className="w-16 h-16 rounded-xl object-cover border-2 border-black dark:border-slate-700 shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-slate-950 border-2 border-dashed border-zinc-400 dark:border-slate-700 flex items-center justify-center text-zinc-500 dark:text-slate-600 font-bold">
                        M2
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-black dark:text-white font-bold cursor-pointer transition border-2 border-black dark:border-slate-700 shadow-sm">
                      <Crop className="w-4 h-4 text-indigo-500" />
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
                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white text-xs font-bold"
                  />
                  <button
                    onClick={() => handleSaveBrandingField('m-square-logo', 'mSquareLogo', mSquareInput)}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition border-2 border-black shadow-md"
                  >
                    Save M-Square Logo
                  </button>
                </div>

                {/* FigTyp Founder Official Signature */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 space-y-4 shadow-lg hover:border-amber-500 transition text-black dark:text-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      FigTyp Founder Official Signature
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      All Certificates
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 dark:text-slate-400 leading-tight">
                    This official signature seal is verified and automatically stamped on all course diplomas, speed certificates, and tournament awards.
                  </p>

                  <div className="flex items-center gap-4">
                    {adminSigInput ? (
                      <div className="w-24 h-16 rounded-xl bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-700 shadow-md flex items-center justify-center p-1 overflow-hidden">
                        <img src={adminSigInput} alt="Founder Signature" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-24 h-16 rounded-xl bg-zinc-100 dark:bg-slate-950 border-2 border-dashed border-zinc-400 dark:border-slate-700 flex items-center justify-center text-zinc-500 dark:text-slate-600 font-bold text-xs italic">
                        No Signature
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-black dark:text-white font-bold cursor-pointer transition border-2 border-black dark:border-slate-700 shadow-sm">
                      <Crop className="w-4 h-4 text-amber-500" />
                      <span>Upload & Crop Signature</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileForCropping(e, 'adminSig', 'square', 'Crop FigTyp Founder Signature')}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={adminSigInput}
                    onChange={(e) => setAdminSigInput(e.target.value)}
                    placeholder="Signature Image URL or Base64 data"
                    className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white text-xs font-bold"
                  />
                  <button
                    onClick={() => handleSaveBrandingField('admin-signature', 'adminSignaturePic', adminSigInput)}
                    className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition border-2 border-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Founder Signature (All Certificates)</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 11: ADS MONETIZATION & SAFE BRANDING POLICY */}
          {activeTab === 'ADS_POLICY' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Strict Brand Safety & Clean Ads Policy Enforced</span>
                </div>
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Google AdSense Monetization & Brand Safety</h1>
                <p className="text-sm text-zinc-600 dark:text-slate-400 font-mono mt-1">
                  Manage platform ad placements, safe-search category exclusions, and family-safe advertising compliance.
                </p>
              </div>

              {/* Brand Safety Policy Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 shadow-sm space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center font-bold text-lg">
                    ⛔
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white">18+ Nudity & Adult Content</h3>
                    <p className="text-[11px] text-zinc-600 dark:text-slate-400 font-mono mt-1 leading-relaxed">
                      Strictly blocked. Nudity, pornography, sexually explicit content, and adult dating services are blocked across all FigTyp ad containers.
                    </p>
                  </div>
                  <span className="inline-block text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    Status: Enforced & Blocked
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 shadow-sm space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-bold text-lg">
                    💊
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white">Reproductive Health & Pharmacy</h3>
                    <p className="text-[11px] text-zinc-600 dark:text-slate-400 font-mono mt-1 leading-relaxed">
                      Permitted under verified health guidelines. Condoms, contraceptive pills, family planning, and sexual health hygiene ads are allowed without nudity.
                    </p>
                  </div>
                  <span className="inline-block text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Status: Allowed (Health Only)
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800 shadow-sm space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 flex items-center justify-center font-bold text-lg">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white">Contextual Safe Search</h3>
                    <p className="text-[11px] text-zinc-600 dark:text-slate-400 font-mono mt-1 leading-relaxed">
                      Every ad container passes data-ad-safe-search=&quot;true&quot; and exclusion filters directly to Google syndication scripts.
                    </p>
                  </div>
                  <span className="inline-block text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    Status: Active On All Slots
                  </span>
                </div>
              </div>

              {/* Active Platform Ad Placements Directory with Live On/Off Switches & Custom Placements */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border-2 border-black dark:border-slate-800 space-y-6 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-black/10 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-black dark:text-white font-display flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Ad Placement Control Switchboard
                    </h2>
                    <p className="text-xs text-zinc-600 dark:text-slate-400 font-mono mt-0.5">
                      Configure dynamic ad placements anywhere across FigTyp, customize slot IDs, and manage live displays.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleOpenAddPlacement}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border-2 border-black"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Placement</span>
                    </button>
                    <button
                      onClick={() => handleSaveAdPlacements()}
                      disabled={savingAds}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{savingAds ? 'Saving...' : 'Save Placements'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Drawer/Form: Add New Ad Placement */}
                {isAddingAdModal && (
                  <form onSubmit={handleCreatePlacement} className="p-5 rounded-2xl bg-cyan-500/5 border-2 border-cyan-500/30 space-y-4 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-cyan-500" />
                        Create New Ad Placement Area
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddingAdModal(false)}
                        className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-800 text-zinc-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Placement Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Leaderboard Bottom Sponsor"
                          value={adFormName}
                          onChange={(e) => {
                            setAdFormName(e.target.value);
                            if (!adFormKey) {
                              setAdFormKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                            }
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Placement Key (Slug)</label>
                        <input
                          type="text"
                          placeholder="e.g. leaderboardBottom"
                          value={adFormKey}
                          onChange={(e) => setAdFormKey(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Google AdSense Slot ID</label>
                        <input
                          type="text"
                          placeholder="#1029384756"
                          value={adFormSlot}
                          onChange={(e) => setAdFormSlot(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Display Area Description</label>
                        <input
                          type="text"
                          placeholder="Where this ad renders (e.g. In-between global high scores and practice prompt)"
                          value={adFormDesc}
                          onChange={(e) => setAdFormDesc(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Ad Format</label>
                        <select
                          value={adFormFormat}
                          onChange={(e: any) => setAdFormFormat(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white font-mono"
                        >
                          <option value="horizontal">Horizontal Banner (728x90)</option>
                          <option value="vertical">Skyscraper / Rail (160x600)</option>
                          <option value="rectangle">Medium Rectangle (300x250)</option>
                          <option value="responsive">Responsive / Fluid</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black dark:text-white">
                        <input
                          type="checkbox"
                          checked={adFormEnabled}
                          onChange={(e) => setAdFormEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500"
                        />
                        <span>Activate placement immediately</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingAdModal(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-slate-800 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold border-2 border-black"
                        >
                          Add Placement
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Inline Drawer/Form: Edit Existing Ad Placement */}
                {editingAdKey && (
                  <form onSubmit={handleSaveEditedPlacement} className="p-5 rounded-2xl bg-amber-500/5 border-2 border-amber-500/30 space-y-4 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-amber-500" />
                        Edit Ad Placement [{editingAdKey}]
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingAdKey(null)}
                        className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-800 text-zinc-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Placement Name</label>
                        <input
                          type="text"
                          required
                          value={adFormName}
                          onChange={(e) => setAdFormName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Slot ID</label>
                        <input
                          type="text"
                          value={adFormSlot}
                          onChange={(e) => setAdFormSlot(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Ad Format</label>
                        <select
                          value={adFormFormat}
                          onChange={(e: any) => setAdFormFormat(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white font-mono"
                        >
                          <option value="horizontal">Horizontal Banner (728x90)</option>
                          <option value="vertical">Skyscraper / Rail (160x600)</option>
                          <option value="rectangle">Medium Rectangle (300x250)</option>
                          <option value="responsive">Responsive / Fluid</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-600 dark:text-slate-400 mb-1 font-bold">Display Area Description</label>
                      <input
                        type="text"
                        value={adFormDesc}
                        onChange={(e) => setAdFormDesc(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-black/20 dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-black dark:text-white">
                          <input
                            type="checkbox"
                            checked={adFormEnabled}
                            onChange={(e) => setAdFormEnabled(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500"
                          />
                          <span>Active / Enabled</span>
                        </label>
                        {placementsList.find((p) => p.key === editingAdKey)?.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlacement(editingAdKey)}
                            className="text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Custom Placement</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingAdKey(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-slate-800 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-2 border-black"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Placements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                  {placementsList.map((placement) => {
                    const isEnabled = placement.isEnabled !== false;
                    return (
                      <div 
                        key={placement.key} 
                        className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between space-y-3 ${
                          isEnabled 
                            ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/40' 
                            : 'bg-zinc-100 dark:bg-slate-950/60 border-black/10 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-black dark:text-white truncate text-xs" title={placement.name}>
                              {placement.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPlacement(placement)}
                              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-slate-800 text-zinc-600 dark:text-slate-400 hover:text-cyan-500"
                              title="Edit Ad Placement"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold">{placement.slot}</span>
                            <span className="text-[8px] px-1 py-0.2 rounded bg-zinc-200 dark:bg-slate-800 text-zinc-600 dark:text-slate-400 uppercase">
                              {placement.format || 'banner'}
                            </span>
                            {placement.isCustom && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-slate-400 font-sans leading-tight line-clamp-2">
                            {placement.desc}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-black/10 dark:border-slate-800 flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase ${isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                            {isEnabled ? '● Active' : '○ Disabled'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePlacement(placement.key)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                              isEnabled 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                                : 'bg-zinc-300 dark:bg-slate-800 text-zinc-800 dark:text-slate-300 hover:bg-zinc-400'
                            }`}
                          >
                            {isEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Publisher Setup Guide for Google AdSense Dashboard */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-zinc-50 dark:from-slate-900/60 dark:to-slate-950/80 border-2 border-black dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h3 className="font-bold text-sm text-black dark:text-white font-display">
                    AdSense Publisher Brand Safety Checklist
                  </h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed font-sans">
                  To guarantee that no 18+ sexual or nudity ads slip through from Google AdSense, configure your AdSense account blocking rules as follows:
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-slate-900 border border-black/10 dark:border-slate-800 flex items-start gap-3">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">1.</span>
                    <span className="text-zinc-700 dark:text-slate-300">
                      Log in to your <strong>Google AdSense Dashboard</strong> &rarr; Click <strong>Brand safety</strong> &rarr; <strong>Content</strong> &rarr; <strong>Blocking controls</strong>.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-slate-900 border border-black/10 dark:border-slate-800 flex items-start gap-3">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">2.</span>
                    <span className="text-zinc-700 dark:text-slate-300">
                      Open <strong>Sensitive categories</strong> &rarr; Locate <strong>Sexually Suggestive</strong>, <strong>Sensationalism</strong>, and <strong>References to Sex & Sexuality</strong> &rarr; Switch to <strong>Blocked</strong>.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-slate-900 border border-black/10 dark:border-slate-800 flex items-start gap-3">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">3.</span>
                    <span className="text-zinc-700 dark:text-slate-300">
                      Under <strong>Reproductive & Sexual Health</strong> (Family Planning, Condoms, Contraceptives) &rarr; Keep as <strong>Allowed</strong> to monetize health and pharmacy sponsors without any nudity.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: BLOGS & TYPING ACADEMY ARTICLES */}
          {activeTab === 'BLOGS' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-display text-black dark:text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-cyan-500" />
                    <span>Typing Academy & Blog Articles</span>
                  </h1>
                  <p className="text-xs text-zinc-600 dark:text-slate-400 font-mono mt-1">
                    Manage guides, educational content, and SEO articles published on FigTyp.
                  </p>
                </div>
                <button
                  onClick={() => { resetBlogForm(); setIsCreatingBlog(true); }}
                  className="px-5 py-2.5 rounded-xl bg-black text-white dark:bg-cyan-500 dark:text-slate-950 font-mono text-xs font-bold flex items-center gap-2 hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write New Article</span>
                </button>
              </div>

              {/* Create / Edit Form Drawer */}
              {isCreatingBlog && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-cyan-500 space-y-5 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-base text-black dark:text-white font-display">
                      {editingBlog ? 'Edit Article' : 'Write & Publish New Article'}
                    </h3>
                    <button
                      onClick={resetBlogForm}
                      className="p-1 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleSaveBlog} className="space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-zinc-700 dark:text-slate-300 font-bold mb-1">Article Title *</label>
                        <input
                          type="text"
                          required
                          value={blogTitle}
                          onChange={(e) => setBlogTitle(e.target.value)}
                          placeholder="e.g. The 100 WPM Secret: Why Your Brain Controls Speed"
                          className="w-full px-3.5 py-2 rounded-xl border border-black/20 dark:border-slate-700 bg-white dark:bg-slate-950 text-black dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-700 dark:text-slate-300 font-bold mb-1">Estimated Read Time (Mins)</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={blogReadTime}
                          onChange={(e) => setBlogReadTime(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-black/20 dark:border-slate-700 bg-white dark:bg-slate-950 text-black dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-700 dark:text-slate-300 font-bold mb-1">Short Excerpt (Teaser) *</label>
                      <input
                        type="text"
                        required
                        value={blogExcerpt}
                        onChange={(e) => setBlogExcerpt(e.target.value)}
                        placeholder="A punchy 1-2 sentence summary to hook readers..."
                        className="w-full px-3.5 py-2 rounded-xl border border-black/20 dark:border-slate-700 bg-white dark:bg-slate-950 text-black dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-700 dark:text-slate-300 font-bold mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={blogTags}
                        onChange={(e) => setBlogTags(e.target.value)}
                        placeholder="Touch Typing, Ergonomics, Hardware, Speed Drills"
                        className="w-full px-3.5 py-2 rounded-xl border border-black/20 dark:border-slate-700 bg-white dark:bg-slate-950 text-black dark:text-white"
                      />
                    </div>

                    {/* Article Cover Image (URL and Upload Dual Options) */}
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-slate-950/80 border-2 border-dashed border-black/20 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <span>Article Cover Image (URL or Upload with Crop)</span>
                        </label>
                        {blogCoverImage && (
                          <button
                            type="button"
                            onClick={() => setBlogCoverImage('')}
                            className="text-rose-500 hover:text-rose-400 text-[10px] font-bold"
                          >
                            Remove Cover
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {blogCoverImage ? (
                          <div className="w-32 h-20 rounded-xl bg-white dark:bg-slate-900 border border-black/20 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                            <img src={blogCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-32 h-20 rounded-xl bg-zinc-200 dark:bg-slate-900 border border-dashed border-zinc-400 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                            No Cover Image
                          </div>
                        )}

                        <div className="flex-1 w-full space-y-2">
                          <input
                            type="text"
                            placeholder="Direct Image URL (e.g. https://images.unsplash.com/...)"
                            value={blogCoverImage}
                            onChange={(e) => setBlogCoverImage(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-black/20 dark:border-slate-700 rounded-xl px-3 py-2 text-black dark:text-white text-xs outline-none focus:border-cyan-500"
                          />
                          <div className="flex items-center gap-2">
                            <label className="px-3.5 py-1.5 rounded-lg bg-zinc-200 dark:bg-slate-800 hover:bg-zinc-300 dark:hover:bg-slate-700 text-black dark:text-white font-bold cursor-pointer text-xs transition border border-black/20 dark:border-slate-700 inline-flex items-center gap-1.5">
                              <Crop className="w-3.5 h-3.5 text-cyan-500" />
                              <span>Upload & Crop Cover Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileForCropping(e, 'blogCover', 'square', 'Crop Article Cover Image')}
                              />
                            </label>
                            <span className="text-[10px] text-zinc-500">Pick URL or upload file directly</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Author Details with Uploadable/Croppable Avatar */}
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-slate-950/80 border-2 border-black/10 dark:border-slate-800 space-y-3">
                      <label className="block text-xs font-bold text-black dark:text-white">Author Credentials & Profile Avatar</label>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {blogAuthorAvatar ? (
                          <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-2 border-cyan-500 overflow-hidden shrink-0 shadow-md">
                            <img src={blogAuthorAvatar} alt="Author Avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-slate-900 border-2 border-dashed border-zinc-400 dark:border-slate-700 shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                            Avatar
                          </div>
                        )}

                        <div className="flex-1 w-full space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-zinc-600 dark:text-slate-400 text-[10px] font-bold mb-0.5">Author Name</label>
                              <input
                                type="text"
                                value={blogAuthorName}
                                onChange={(e) => setBlogAuthorName(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl border border-black/20 dark:border-slate-700 bg-white dark:bg-slate-950 text-black dark:text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-zinc-600 dark:text-slate-400 text-[10px] font-bold mb-0.5">Author Role / Designation</label>
                              <input
                                type="text"
                                value={blogAuthorRole}
                                onChange={(e) => setBlogAuthorRole(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl border border-black/20 dark:border-slate-700 bg-white dark:bg-slate-950 text-black dark:text-white text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Avatar URL"
                              value={blogAuthorAvatar}
                              onChange={(e) => setBlogAuthorAvatar(e.target.value)}
                              className="flex-1 bg-white dark:bg-slate-900 border border-black/20 dark:border-slate-700 rounded-xl px-2.5 py-1 text-black dark:text-white text-[11px]"
                            />
                            <label className="px-3 py-1 rounded-lg bg-zinc-200 dark:bg-slate-800 hover:bg-zinc-300 dark:hover:bg-slate-700 text-black dark:text-white font-bold cursor-pointer text-xs transition border border-black/20 dark:border-slate-700 inline-flex items-center gap-1 shrink-0">
                              <Crop className="w-3.5 h-3.5 text-cyan-500" />
                              <span>Upload & Crop Avatar</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileForCropping(e, 'blogAuthor', 'circle', 'Crop Author Profile Avatar')}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-700 dark:text-slate-300 font-bold mb-1">Article Content (Markdown Supported) *</label>
                      <textarea
                        rows={12}
                        required
                        value={blogContent}
                        onChange={(e) => setBlogContent(e.target.value)}
                        placeholder="Write article in Markdown: use ## Headings, **bold**, `code blocks`, bullet points..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 dark:border-slate-700 bg-white dark:bg-slate-950 text-black dark:text-white font-mono text-xs resize-y"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-black dark:text-white">
                        <input
                          type="checkbox"
                          checked={blogPublished}
                          onChange={(e) => setBlogPublished(e.target.checked)}
                          className="w-4 h-4 rounded text-cyan-500"
                        />
                        <span>Publish immediately (visible to all users)</span>
                      </label>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={resetBlogForm}
                          className="px-4 py-2 rounded-xl border border-black/20 dark:border-slate-700 font-mono text-xs hover:bg-zinc-100 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs hover:bg-cyan-400"
                        >
                          {editingBlog ? 'Save Updates' : 'Publish Article'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Articles Table */}
              <div className="rounded-2xl border-2 border-black dark:border-slate-800 bg-white dark:bg-slate-900/30 overflow-x-auto shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-100 dark:bg-slate-950 border-b-2 border-black dark:border-slate-800 text-black dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Article Details</th>
                      <th className="p-3.5">Read Time</th>
                      <th className="p-3.5">Views</th>
                      <th className="p-3.5">Tags</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-slate-800/60">
                    {blogsList.map((blog) => (
                      <tr key={blog._id} className="hover:bg-zinc-50 dark:hover:bg-slate-900/60 transition">
                        <td className="p-3.5 max-w-xs">
                          <span className="font-bold text-black dark:text-white block line-clamp-1">{blog.title}</span>
                          <span className="text-[10px] text-zinc-500 dark:text-slate-400 line-clamp-1">{blog.excerpt}</span>
                        </td>
                        <td className="p-3.5 text-zinc-700 dark:text-slate-300">
                          {blog.readTimeMinutes || 5} min
                        </td>
                        <td className="p-3.5 text-zinc-700 dark:text-slate-300">
                          {blog.viewsCount || 0}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {(blog.tags || []).slice(0, 2).map((t: string, i: number) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-slate-800 text-zinc-800 dark:text-slate-300">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleTogglePublishBlog(blog)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                              blog.isPublished
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {blog.isPublished ? '● Published' : '○ Draft'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditBlog(blog)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 12: AUDIT LOGS */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold font-display text-black dark:text-white">Security & Activity Audit Logs</h1>
                <p className="text-sm text-zinc-600 dark:text-slate-400 font-mono mt-1">Real-time audit records of logins, keystroke telemetry uploads, and admin operations.</p>
              </div>

              <div className="rounded-2xl border-2 border-black dark:border-slate-800 bg-white dark:bg-slate-900/30 overflow-x-auto shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-100 dark:bg-slate-950 border-b-2 border-black dark:border-slate-800 text-black dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Action Type</th>
                      <th className="p-3.5">Details</th>
                      <th className="p-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-zinc-50 dark:hover:bg-slate-900/60 transition">
                        <td className="p-3.5">
                          <span className="font-bold text-black dark:text-white block">{(log as any).username || 'User'}</span>
                          <span className="text-[10px] text-zinc-500 dark:text-slate-500">{(log as any).email || log.userId}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30 text-[10px]">
                            {log.actionType || log.action || 'ACTIVITY'}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-800 dark:text-slate-300 text-xs">
                          {log.details || 'System operation executed.'}
                        </td>
                        <td className="p-3.5 text-zinc-500 dark:text-slate-500 text-[10px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Universal Footer Compliance & Academy Navigation */}
          <div className="mt-16 pt-8 border-t border-black/10 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white">FigTyp CMU Engine</span>
              <span>•</span>
              <span>Platform Legal & Learning Hub</span>
            </div>
            <div className="flex items-center flex-wrap gap-4 font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('BLOGS')}
                className="hover:text-amber-500 transition-colors flex items-center gap-1.5"
              >
                <span>📚</span> Typing Academy & Guide Blogs
              </button>
              <span className="text-zinc-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="hover:text-indigo-500 transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-zinc-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="hover:text-indigo-500 transition-colors"
              >
                Terms & Conditions
              </button>
              <span className="text-zinc-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="hover:text-indigo-500 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>

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

      {/* Platform Academy & Legal Compliance Modals */}
      <TypingAcademyModal isOpen={academyModalOpen} onClose={() => setAcademyModalOpen(false)} />
      <PrivacyPolicyModal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
      <TermsConditionsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
      <ContactUsModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

    </div>
  );
}
