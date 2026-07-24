import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from './config';
import { 
  Keyboard, BookOpen, Users, Bot, Award, Shield, HelpCircle, 
  Coins, Zap, LogOut, User, Bell, ChevronRight, Menu, X, Landmark
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { User as UserType, TypingAttempt, CMSNotice } from './types';

import AuthGateway from './components/AuthGateway';
import PracticeArena from './components/PracticeArena';
import CourseTraining from './components/CourseTraining';
import OnlineContestArena from './components/OnlineContestArena';
import AICoachPanel from './components/AICoachPanel';
import Certificator from './components/Certificator';
import SuperAdminConsole from './components/SuperAdminConsole';
import AboutCompany from './components/AboutCompany';
import BrandedFooter from './components/BrandedFooter';
import UserProfilePanel from './components/UserProfilePanel';

type TabType = 'PRACTICE' | 'TRAINING' | 'MULTIPLAYER' | 'COACH' | 'REWARDS' | 'ADMIN' | 'ABOUT' | 'PROFILE';

export default function App() {
  // ১. State Initialization with LocalStorage (যাতে রিফ্রেশ দিলে লগআউট না হয়)
  const [user, setUser] = useState<UserType | null>(() => {
    const savedUser = localStorage.getItem('figtyp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string>(() => localStorage.getItem('figtyp_token') || '');
  
  const [activeTab, setActiveTab] = useState<TabType>('PRACTICE');
  const [notices, setNotices] = useState<CMSNotice[]>([]);
  const [attempts, setAttempts] = useState<TypingAttempt[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [websiteLogo, setWebsiteLogo] = useState<string>('');
  const [founderPicture, setFounderPicture] = useState<string>('');
  const [mSquareLogo, setMSquareLogo] = useState<string>('');
  const [miraCoreLogo, setMiraCoreLogo] = useState<string>('');
  const [founderPictureSize, setFounderPictureSize] = useState<number>(48);
  const [contestRefreshToken, setContestRefreshToken] = useState(0);
  const [guestRestrictionModal, setGuestRestrictionModal] = useState<{ show: boolean; feature: string }>({ show: false, feature: '' });

  const isGuest = user?.role === 'GUEST';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // ২. ৫ মিনিটের Inactivity Timeout Logic
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken('');
    localStorage.removeItem('figtyp_user');
    localStorage.removeItem('figtyp_token');
    setActiveTab('PRACTICE');
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    
    // ৫ মিনিট = 5 * 60 * 1000 = 300000 ms
    inactivityTimerRef.current = setTimeout(() => {
      if (user) {
        handleLogout();
        alert("Session Expired: You have been logged out due to 5 minutes of inactivity.");
      }
    }, 300000); 
  }, [user, handleLogout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handleUserActivity = () => resetInactivityTimer();

    if (user) {
      resetInactivityTimer();
      events.forEach(event => window.addEventListener(event, handleUserActivity));
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, [user, resetInactivityTimer]);


  const handleRestrictedTabClick = (feature: string) => {
    if (isGuest) {
      setGuestRestrictionModal({ show: true, feature });
      return;
    }
    return true;
  };

  const attemptKey = (attempt: TypingAttempt | { id?: string; createdAt?: string; wpm?: number }) => String(attempt?.id || `${attempt?.createdAt || 'attempt'}-${attempt?.wpm || 0}`);

  const handleLoginRedirect = () => {
    setGuestRestrictionModal({ show: false, feature: '' });
    handleLogout();
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    if (user) {
      fetchGlobalCMSNotices();
      fetchMySessionAttempts(token || user.id);
    }
  }, [user, token]);

  const fetchBranding = async () => {
    try {
      const res = await fetch(API_URL + '/api/settings/logo');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setWebsiteLogo(data.websiteLogo || '');
      }
    } catch (e) {
      console.warn("Could not fetch database website settings logo:", e);
    }
    try {
       const res = await fetch(API_URL + '/api/settings/founder-picture');
       const contentType = res.headers.get("content-type");
       if (res.ok && contentType && contentType.includes("application/json")) {
         const data = await res.json();
         setFounderPicture(data.founderPicture || '');
       }
     } catch (e) {
       console.warn("Could not fetch database website founder picture:", e);
     }
     try {
       const res = await fetch(API_URL + '/api/settings/founder-picture-size');
       const contentType = res.headers.get("content-type");
       if (res.ok && contentType && contentType.includes("application/json")) {
         const data = await res.json();
         setFounderPictureSize(data.founderPictureSize || 48);
       }
     } catch (e) {
       console.warn("Could not fetch database website founder picture size:", e);
     }
    try {
      const res = await fetch(API_URL + '/api/settings/m-square-logo');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setMSquareLogo(data.mSquareLogo || '');
      }
    } catch (e) {
      console.warn("Could not fetch database website mSquareLogo:", e);
    }
    try {
      const res = await fetch(API_URL + '/api/settings/mira-core-logo');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setMiraCoreLogo(data.miraCoreLogo || '');
      }
    } catch (e) {
      console.warn("Could not fetch database website miraCoreLogo:", e);
    }
  };

  const fetchGlobalCMSNotices = async () => {
    const localNotices = localStorage.getItem('figtyp_notices');
    if (localNotices) {
      setNotices(JSON.parse(localNotices));
    } else {
      try {
        const res = await fetch(API_URL + '/api/notices');
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setNotices(data);
        }
      } catch (e) {
        console.warn("Could not fetch global CMS notices:", e);
      }
    }
  };

  const fetchMySessionAttempts = async (explicitToken?: string) => {
    const activeToken = explicitToken || token;
    if (!activeToken) return;
    try {
      const res = await fetch(API_URL + '/api/attempts', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setAttempts(data);
      }
    } catch (e) {
      console.warn("Could not fetch typing attempts:", e);
    }
  };

  const handleCoinsAwarded = (coinsBonus: number, xpBonus: number) => {
    if (!user) return;
    setUser((prevUser) => {
      if (!prevUser) return null;
      let totalXp = prevUser.xp + xpBonus;
      let currentLevel = prevUser.level;
      let remainingXp = totalXp;
      let nextLevelThreshold = currentLevel * 150;

      while (remainingXp >= nextLevelThreshold) {
        remainingXp -= nextLevelThreshold;
        currentLevel += 1;
        nextLevelThreshold = currentLevel * 150;
      }

      const updatedUser = {
        ...prevUser,
        coins: prevUser.coins + coinsBonus,
        xp: remainingXp,
        level: currentLevel
      };

      // ৩. লোকাল স্টোরেজেও আপডেট করা হলো যাতে রিফ্রেশে কয়েন হারিয়ে না যায়
      localStorage.setItem('figtyp_user', JSON.stringify(updatedUser));

      return updatedUser;
    });
  };

  const handleAuthenticated = (loggedInUser: UserType, userToken: string) => {
    setUser(loggedInUser);
    setToken(userToken);
    
    // লগিনের সাথে সাথেই ডাটা LocalStorage-এ সেভ হচ্ছে
    localStorage.setItem('figtyp_user', JSON.stringify(loggedInUser));
    localStorage.setItem('figtyp_token', userToken);
    
    setActiveTab('PRACTICE');
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between overflow-x-hidden">
        
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md p-4 sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div 
              onClick={() => { window.location.href = '/'; }}
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition duration-200 select-none active:scale-95 transform group"
              title="Home Page"
            >
              {websiteLogo ? (
                <img src={websiteLogo} alt="Logo Brand" className="w-14 h-14 object-cover rounded-xl border border-slate-800 shadow-lg group-hover:border-[#00F3FF]/40 transition" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#00F3FF] to-blue-600 flex items-center justify-center font-display font-bold text-white text-xl shadow-lg neon-shadow-blue">
                  FT
                </div>
              )}
              <div className="flex flex-col justify-center text-left">
                <span className="text-2xl font-extrabold tracking-wider font-display text-white uppercase block leading-tight group-hover:text-[#00F3FF] transition">
                  FIG<span className="text-[#00F3FF]">TYP</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase block leading-none mt-1">MIRACORE</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none mt-0.5">ARENA</span>
              </div>
            </div>
            
            <div className="font-mono text-[10px] text-slate-500 uppercase flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-[#00F3FF]" /> Established 2025
            </div>
          </div>
        </motion.header>

        <main className="flex-1 flex flex-col justify-center py-12 px-6">
          <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 text-left"
            >
              <span className="inline-block text-[10px] font-mono font-semibold tracking-widest text-[#00F3FF] uppercase px-3 py-1.5 bg-[#00F3FF]/10 rounded-full border border-[#00F3FF]/20">
                The World's Premier Neural Typing Arena
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
                Train Kinetic Muscle Memory with premium typing coaching
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md">
                Unlock high-performance coding speeds under monitored practice workflows. Created by software engineers at Daffodil University, powered by MiraCore Logix.
              </p>

              <div className="grid grid-cols-2 gap-4 font-mono text-[11px] text-slate-500 border-t border-slate-900 pt-6">
                <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <strong className="text-[#00F3FF] block mb-1 flex items-center gap-1.5"><BookOpen className="w-3 h-3"/> Premium Courses</strong>
                  Structured typing progression paths.
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <strong className="text-[#00FF95] block mb-1 flex items-center gap-1.5"><Award className="w-3 h-3"/> Verified Certs</strong>
                  Professional typing qualifications.
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AuthGateway onAuthenticated={handleAuthenticated} websiteLogo={websiteLogo} />
            </motion.div>

          </div>
        </main>

        <BrandedFooter onSelectTab={(tab) => setActiveTab(tab as TabType)} />
      </div>
    );
  }

  return (
    <div id="app-workspace" className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col justify-between">
      
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-b border-slate-900 bg-slate-950/90 backdrop-blur sticky top-0 z-50 p-4 pb-0 shadow-lg"
      >
         <div className="w-full flex items-center justify-between px-2 md:px-6 pb-4">
          
          <div 
            onClick={() => setActiveTab('PRACTICE')}
            className="flex items-center gap-4 cursor-pointer hover:opacity-85 transition duration-200 select-none active:scale-95 transform group"
            title="Home / Practice Arena"
          >
            {websiteLogo ? (
              <img src={websiteLogo} alt="Logo Brand" className="w-14 h-14 object-cover rounded-xl border border-slate-800 transition group-hover:border-[#00F3FF]/40 shadow-lg" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] flex items-center justify-center font-display font-extrabold text-white text-xl shadow-lg neon-shadow-blue transition group-hover:brightness-110">
                FT
              </div>
            )}
            <div className="flex flex-col justify-center text-left">
              <span className="text-2xl font-extrabold tracking-wider font-display text-white uppercase block group-hover:text-[#00F3FF] transition duration-250 leading-tight">
                FIG<span className="text-[#00F3FF]">TYP</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase block leading-none mt-1">MIRACORE</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none mt-0.5">ARENA</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 ml-auto">
            
            <nav className="flex items-center gap-[3px] bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
              <button
                onClick={() => setActiveTab('PRACTICE')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'PRACTICE' ? 'bg-[#00F3FF]/15 text-[#00F3FF] shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <Keyboard className="w-3.5 h-3.5" /> Practice
              </button>
              <button
                onClick={() => {
                  if (handleRestrictedTabClick('Courses')) {
                    setActiveTab('TRAINING');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'TRAINING' ? 'bg-[#00F3FF]/15 text-[#00F3FF] shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Courses
              </button>
              <button
                onClick={() => {
                  if (handleRestrictedTabClick('Race Esports')) {
                    setActiveTab('MULTIPLAYER');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'MULTIPLAYER' ? 'bg-[#00F3FF]/15 text-[#00F3FF] shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <Users className="w-3.5 h-3.5" /> Races
              </button>
              <button
                onClick={() => setActiveTab('COACH')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'COACH' ? 'bg-[#00F3FF]/15 text-[#00F3FF] shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <Bot className="w-3.5 h-3.5" /> Coach
              </button>
              <button
                onClick={() => {
                  if (handleRestrictedTabClick('PDF Certificates')) {
                    setActiveTab('REWARDS');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'REWARDS' ? 'bg-[#00F3FF]/15 text-[#00F3FF] shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <Award className="w-3.5 h-3.5" /> Certs
              </button>
              <button
                onClick={() => setActiveTab('ABOUT')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'ABOUT' ? 'bg-[#00F3FF]/15 text-[#00F3FF] shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <Landmark className="w-3.5 h-3.5" /> About
              </button>
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'PROFILE' ? 'bg-[#00F3FF]/15 text-[#00F3FF] shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <User className="w-3.5 h-3.5" /> Profile
              </button>
              
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('ADMIN')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'ADMIN' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-rose-400 hover:text-rose-200 hover:bg-rose-500/10'}`}
                >
                  <Shield className="w-3.5 h-3.5" /> Admin
                </button>
              )}
            </nav>

            <div className="flex items-center gap-4">
              
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs shadow-sm">
                <Zap className="w-4 h-4 text-[#00F3FF] animate-pulse" />
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block leading-none">Level {user.level}</span>
                  <span className="text-slate-300 block">{user.xp} XP</span>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs text-amber-400 shadow-sm">
                <Coins className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block leading-none">Coins</span>
                  <span className="font-bold text-amber-300">{user.coins} FigCoins</span>
                </div>
              </motion.div>

              <div className="w-px h-8 bg-slate-800" />
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setActiveTab('PROFILE')} 
                  className="text-right cursor-pointer group select-none"
                  title="View Account Profile"
                >
                  <span className="text-xs font-semibold text-white group-hover:text-[#00F3FF] transition block truncate max-w-[100px]">{user.username}</span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block group-hover:text-[#00F3FF]/40 transition">{user.role}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition shadow-sm"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {notices.length > 0 && (
          <div className="bg-[#FF4D6D]/10 border-t border-[#FF4D6D]/20 text-slate-100 py-1.5 px-3 overflow-hidden flex items-center -mx-4 md:-mx-6 px-4 md:px-6">
            <div className="flex items-center gap-2 shrink-0 bg-[#FF4D6D]/20 px-2 py-0.5 rounded border border-[#FF4D6D]/30 z-10 shadow-[0_0_10px_rgba(255,77,109,0.2)]">
              <Bell className="w-3 h-3 text-[#FF4D6D] animate-bounce" />
              <strong className="text-[#FF4D6D] uppercase text-[10px] font-mono tracking-widest">CMS FLASH:</strong>
            </div>
            <div className="ml-3 overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap inline-flex items-center text-[11px] font-mono text-slate-300 gap-12">
                {notices.map((notice) => (
                  <span key={notice.id} className="inline-flex items-center gap-2">
                    <span className="text-white font-bold">{notice.title}</span>
                    <span>&bull;</span>
                    <span>{notice.content}</span>
                    <span className="text-slate-500 ml-2">[{new Date(notice.createdAt).toLocaleDateString()}]</span>
                  </span>
                ))}
                {notices.map((notice) => (
                  <span key={`${notice.id}-repeat`} className="inline-flex items-center gap-2">
                    <span className="text-white font-bold">{notice.title}</span>
                    <span>&bull;</span>
                    <span>{notice.content}</span>
                    <span className="text-slate-500 ml-2">[{new Date(notice.createdAt).toLocaleDateString()}]</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu Animaton */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-900 overflow-hidden font-mono text-xs bg-slate-950"
            >
              <div className="space-y-1 p-4">
                <button
                  onClick={() => { setActiveTab('PRACTICE'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'PRACTICE' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <Keyboard className="w-4 h-4" /> Practice Arena
                </button>
                <button
                  onClick={() => { 
                    if (handleRestrictedTabClick('Courses')) {
                      setActiveTab('TRAINING'); setIsMobileMenuOpen(false); 
                    }
                  }}
                  className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'TRAINING' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <BookOpen className="w-4 h-4" /> Academic Courses
                </button>
                <button
                  onClick={() => { 
                    if (handleRestrictedTabClick('Race Esports')) {
                      setActiveTab('MULTIPLAYER'); setIsMobileMenuOpen(false); 
                    }
                  }}
                  className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'MULTIPLAYER' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <Users className="w-4 h-4" /> Race Lobbies
                </button>
                <button
                  onClick={() => { setActiveTab('COACH'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'COACH' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <Bot className="w-4 h-4" /> AI Coach
                </button>
                <button
                  onClick={() => { 
                    if (handleRestrictedTabClick('PDF Certificates')) {
                      setActiveTab('REWARDS'); setIsMobileMenuOpen(false); 
                    }
                  }}
                  className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'REWARDS' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <Award className="w-4 h-4" /> PDF Certificates
                </button>
                <button
                  onClick={() => { setActiveTab('ABOUT'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'ABOUT' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <Landmark className="w-4 h-4" /> About Company
                </button>
                <button
                  onClick={() => { setActiveTab('PROFILE'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'PROFILE' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <User className="w-4 h-4" /> Personal Profile
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => { setActiveTab('ADMIN'); setIsMobileMenuOpen(false); }}
                    className={`w-full py-3 text-left px-4 rounded-xl flex items-center gap-3 ${activeTab === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-rose-400 hover:bg-slate-900'}`}
                  >
                    <Shield className="w-4 h-4" /> Super Admin Portal
                  </button>
                )}

                <div className="border-t border-slate-800 pt-4 mt-2 flex items-center justify-between text-slate-500 px-2">
                  <span className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-amber-500" /> {user.coins} Coins</span>
                  <button onClick={handleLogout} className="text-red-400 font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                    Logout Session &rarr;
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="flex-grow overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 h-full"
          >
            {activeTab === 'PRACTICE' && (
              <PracticeArena 
                userToken={token} 
                recentAttempts={attempts}
                onAttemptSaved={(att) => setAttempts((prev) => [att, ...prev.filter((item) => attemptKey(item) !== attemptKey(att))])}
                onCoinsAwarded={handleCoinsAwarded}
              />
            )}

            {activeTab === 'TRAINING' && (
              <CourseTraining 
                userToken={token}
                currentUser={user}
                onCoinsAwarded={handleCoinsAwarded}
              />
            )}

            {activeTab === 'MULTIPLAYER' && (
              <OnlineContestArena 
                userToken={token} 
                username={user.username}
                currentUser={user}
                recentAttempts={attempts}
                onCoinsAwarded={handleCoinsAwarded}
                refreshToken={contestRefreshToken}
              />
            )}

          {activeTab === 'COACH' && (
            <AICoachPanel 
              userToken={token} 
              recentAttempts={attempts}
            />
          )}

          {activeTab === 'REWARDS' && (
            <Certificator 
              userToken={token} 
              currentUser={user}
              onCertificateIssued={fetchMySessionAttempts}
            />
          )}

           {activeTab === 'ABOUT' && (
            <AboutCompany websiteLogo={websiteLogo} founderPicture={founderPicture} mSquareLogo={mSquareLogo} miraCoreLogo={miraCoreLogo} founderPictureSize={founderPictureSize} />
          )}

          {activeTab === 'PROFILE' && (
            <UserProfilePanel 
              userToken={token}
              currentUser={user}
              onUserPropsUpdated={(updatedUser) => {
                setUser(updatedUser);
                localStorage.setItem('figtyp_user', JSON.stringify(updatedUser)); // প্রোফাইল আপডেট হলেও লোকাল স্টোরেজ আপডেট হবে
              }}
              onLogoutTriggered={handleLogout}
              recentAttempts={attempts}
            />
          )}

            {activeTab === 'ADMIN' && isSuperAdmin && (
              <SuperAdminConsole 
                userToken={token} 
                founderPictureSize={founderPictureSize}
                onLogoUpdated={(logoVal) => setWebsiteLogo(logoVal)}
                onFounderPictureUpdated={(picVal) => setFounderPicture(picVal)}
                onFounderPictureSizeUpdated={(size) => setFounderPictureSize(size)}
                onMSquareLogoUpdated={(mSquareVal) => setMSquareLogo(mSquareVal)}
                onMiraCoreLogoUpdated={(miraCoreVal) => setMiraCoreLogo(miraCoreVal)}
                onContestsChanged={() => setContestRefreshToken((value) => value + 1)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BrandedFooter onSelectTab={(tab) => setActiveTab(tab as TabType)} />

      {/* Guest Restriction Modal (Animated) */}
      <AnimatePresence>
        {guestRestrictionModal.show && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-[#00F3FF]/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,243,255,0.1)]"
            >
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 bg-gradient-to-br from-[#00F3FF]/20 to-blue-500/20 border border-[#00F3FF]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                  >
                    <HelpCircle className="w-10 h-10 text-[#00F3FF]" />
                  </motion.div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 font-display tracking-wide">Guest Access Limited</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    To access <span className="font-semibold text-[#00F3FF] bg-[#00F3FF]/10 px-2 py-0.5 rounded">{guestRestrictionModal.feature}</span>, please create an account or sign in with your existing credentials.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-left shadow-inner">
                  <p className="text-[10px] font-mono text-slate-500 mb-3 uppercase tracking-widest font-bold">Guest limitations:</p>
                  <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center"><span className="text-red-400 text-[10px]">✕</span></div> Cannot complete lessons
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center"><span className="text-red-400 text-[10px]">✕</span></div> Cannot join race competitions
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center"><span className="text-red-400 text-[10px]">✕</span></div> Cannot download certificates
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><span className="text-emerald-400 text-[10px]">✓</span></div> Can view all website content
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><span className="text-emerald-400 text-[10px]">✓</span></div> Can use practice typing arena
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGuestRestrictionModal({ show: false, feature: '' })}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition font-semibold text-sm cursor-pointer"
                  >
                    Continue as Guest
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLoginRedirect}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition font-semibold text-sm cursor-pointer"
                  >
                    Login / Signup
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}