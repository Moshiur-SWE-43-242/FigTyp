import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Loader2, PlayCircle, Flag, Award, RefreshCw, Copy, Lock, Zap, Download, Crown, Plus, Check, CheckCircle2, UserX, ExternalLink, X, Image as ImageIcon, Upload } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import html2canvas from 'html2canvas';
import { API_URL } from '../config';
import { Contest, ContestAttempt, TypingAttempt, User } from '../types';
import { soundEngine } from '../utils/soundEngine';
import GoogleAd from './GoogleAd';

interface Props {
  userToken: string;
  username: string;
  currentUser: User;
  recentAttempts: TypingAttempt[];
  onCoinsAwarded: (coins: number, xp: number) => void;
  refreshToken?: number;
}

function ProgressFill({ progress, isMe }: { progress: number; isMe: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.style.setProperty('--progress-width', `${progress}%`);
  }, [progress]);
  return <div ref={ref} className={`h-full transition-all duration-300 rounded-full ${isMe ? 'bg-[#00F3FF]' : 'bg-[#8B5CF6]/60'} progress-fill`} />;
}

interface Opponent {
  id: string; 
  socketId?: string;
  username: string; 
  wpm: number; 
  progress: number; 
  accuracy?: number; 
  finished?: boolean;
  finishTime?: string;
  ready?: boolean;
}

const contestId = (c: any) => c?._id || c?.id;
const contestPassage = (c: any) => c?.passage || c?.contestText || '';
const contestCode = (c: any) => c?.inviteCode || c?.shareCode || '';

export default function OnlineContestArena({ userToken, username, currentUser, onCoinsAwarded, refreshToken }: Props) {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [practiceCount, setPracticeCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [claimingCert, setClaimingCert] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [raceState, setRaceState] = useState<'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'>('IDLE');
  const [countdown, setCountdown] = useState(5);
  const [durationRemaining, setDurationRemaining] = useState(60);
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordInput, setCurrentWordInput] = useState('');
  const [wordStatuses, setWordStatuses] = useState<Record<number, boolean>>({});
  const [typedWordsMap, setTypedWordsMap] = useState<Record<number, string>>({});
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const [myWpm, setMyWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myProgress, setMyProgress] = useState(0);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [contestLeaderboard, setContestLeaderboard] = useState<any[]>([]);
  
  // Profile modal state
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Custom Race Room Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState(`${username || 'Racer'}'s Derby`);
  const [createLogoUrl, setCreateLogoUrl] = useState('');
  const [createDuration, setCreateDuration] = useState<number>(60);
  const [createVisibility, setCreateVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [createCategory, setCreateCategory] = useState<'COMMON' | 'QUOTES' | 'TECH' | 'CUSTOM'>('COMMON');
  const [customPassage, setCustomPassage] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isMyReady, setIsMyReady] = useState(false);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size should be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCreateLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const API_BASE_URL = `${API_URL}/api`;
  const isAdmin = currentUser.role === 'SUPER_ADMIN';
  const isRoomHost = Boolean(activeContest && (
    (activeContest.createdBy && activeContest.createdBy.toString() === currentUser.id) ||
    isAdmin
  ));

  // Branded Custom Logo Request State
  const [logoOrgName, setLogoOrgName] = useState('');
  const [isSubmittingLogoRequest, setIsSubmittingLogoRequest] = useState(false);
  const [logoRequestSuccessMsg, setLogoRequestSuccessMsg] = useState('');
  const [showLogoRequestInput, setShowLogoRequestInput] = useState(false);
  const [currentUserApproval, setCurrentUserApproval] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    (currentUser as any)?.customLogoApproval || 'NONE'
  );

  const canUseCustomLogo = isAdmin || currentUserApproval === 'APPROVED';

  const handleRequestCustomLogo = async () => {
    if (!logoOrgName.trim()) {
      alert("Please provide your organization or tournament name.");
      return;
    }
    setIsSubmittingLogoRequest(true);
    try {
      const res = await fetch(`${API_URL}/api/contests/request-custom-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ orgName: logoOrgName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUserApproval('PENDING');
        setLogoRequestSuccessMsg("Request sent to Admin! Once approved, you can brand tournaments with your custom logo.");
        setShowLogoRequestInput(false);
      } else {
        alert(data.error || "Failed to submit request.");
      }
    } catch (err) {
      alert("Network error while submitting request.");
    } finally {
      setIsSubmittingLogoRequest(false);
    }
  };

  const handleDownloadContestCertificate = async () => {
    if (!activeContest) return;
    setClaimingCert(true);
    try {
      const { default: jsPdfConstructor } = await import('jspdf');
      const doc = new jsPdfConstructor('landscape', 'mm', 'a4');
      const width = 297;
      const height = 210;
      const centerX = width / 2;

      // 1. Soft Ivory Parchment Background
      doc.setFillColor(252, 250, 243);
      doc.rect(0, 0, width, height, 'F');

      // 2. Primary Outer Navy Border
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(1.8);
      doc.rect(10, 10, width - 20, height - 20);

      // 3. Ornate Double Gold Trim Frame
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.rect(13, 13, width - 26, height - 26);
      doc.setLineWidth(0.3);
      doc.rect(15, 15, width - 30, height - 30);

      // 4. Corner Ornaments
      const corners = [
        [15, 15], [width - 15, 15], [15, height - 15], [width - 15, height - 15]
      ];
      doc.setFillColor(212, 175, 55);
      corners.forEach(([cx, cy]) => {
        doc.circle(cx, cy, 1.8, 'F');
      });

      // 5. Header: FIGTYP OFFICIAL CERTIFICATION
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 130, 20);
      doc.text('FIGTYP MULTIPLAYER ARENA • OFFICIAL COMPETITION RECORD', centerX, 32, { align: 'center' });

      // 6. Title
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.text('CERTIFICATE OF ACHIEVEMENT', centerX, 44, { align: 'center' });

      // 7. Subtitle
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text('This credential validates that the typist below has successfully completed', centerX, 54, { align: 'center' });

      // 8. Contest Name
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      doc.text(String(activeContest.title || 'Multiplayer Championship'), centerX, 64, { align: 'center' });

      // 9. Recipient Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42);
      const recipient = currentUser.fullName || currentUser.username || username || 'Contest Champion';
      doc.text(recipient, centerX, 84, { align: 'center' });
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(centerX - 60, 88, centerX + 60, 88);

      // 10. Performance Badges
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text(`Recorded Speed: ${myWpm} WPM   |   Accuracy: ${myAccuracy}%   |   Time: ${activeContest.duration || 60}s`, centerX, 102, { align: 'center' });

      // 11. Custom Logo or FigTyp Seal
      const contestLogoUrl = activeContest.contestLogo || activeContest.logoUrl;
      if (contestLogoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = contestLogoUrl;
          });
          doc.addImage(img, 'PNG', centerX - 12, 112, 24, 24);
        } catch (_) {
          doc.setFont('times', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(180, 130, 20);
          doc.text('🏆 OFFICIAL TOURNAMENT SEAL', centerX, 126, { align: 'center' });
        }
      } else {
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(180, 130, 20);
        doc.text('⭐ VERIFIED FIGTYP ARENA RUN', centerX, 126, { align: 'center' });
      }

      // 12. Date & Signatures
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Issued Date: ${dateStr}`, 30, 170);
      doc.text(`Verification ID: FIG-${activeContest.inviteCode || 'ARENA'}-${Date.now().toString().slice(-6)}`, 30, 175);

      doc.setFont('helvetica', 'bold');
      doc.text('Moshiur Rahaman Riat', width - 70, 170);
      doc.setFont('helvetica', 'normal');
      doc.text('Lead Architect, FigTyp Arena', width - 70, 175);

      doc.save(`FigTyp_Contest_${(activeContest.title || 'Race').replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error("Certificate download error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setClaimingCert(false);
    }
  };

  useEffect(() => {
    const checkPracticeStatus = async () => {
      try {
        // If the user is authenticated and not a guest, allow direct access
        if (currentUser && currentUser.role && currentUser.role !== 'GUEST') {
          setIsUnlocked(true);
          setCheckingAccess(false);
          return;
        }

        const res = await fetch(API_BASE_URL + '/user/practice-status', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPracticeCount(data.dailyPracticeCount || 0);
          if (data.dailyPracticeCount >= 5 || isAdmin) {
            setIsUnlocked(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch practice status:", err);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkPracticeStatus();
  }, [userToken, isAdmin, currentUser, refreshToken]);

  useEffect(() => {
    if (isUnlocked && activeContest) {
      socketRef.current = io(API_URL);
      
      socketRef.current.emit('join-contest', { 
        contestId: contestId(activeContest), 
        username: username || 'Racer', 
        userId: currentUser.id 
      });

      socketRef.current.on('update-leaderboard', (updatedPlayers: Opponent[]) => {
        setOpponents(sortLeaderboard(updatedPlayers));
      });

      socketRef.current.on('race-starting', ({ countdownSeconds }: { countdownSeconds: number }) => {
        setRaceState('COUNTDOWN');
        setCountdown(countdownSeconds || 5);
        setCurrentWordInput('');
        setCurrentWordIndex(0);
        setWordStatuses({});
        setTypedWordsMap({});
        setMyProgress(0);
        setMyWpm(0);

        if (countdownInterval.current) clearInterval(countdownInterval.current);
        soundEngine.playBeep(false);

        let remaining = countdownSeconds || 5;
        countdownInterval.current = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);
          if (remaining <= 0) {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
            soundEngine.playBeep(true);
            startContestMatch();
          } else {
            soundEngine.playBeep(false);
          }
        }, 1000);
      });

      socketRef.current.on('race-reset', () => {
        clearAllTimers();
        setRaceState('IDLE');
        setCurrentWordInput('');
        setCurrentWordIndex(0);
        setWordStatuses({});
        setTypedWordsMap({});
        setMyProgress(0);
        setMyWpm(0);
        setIsMyReady(false);
        setDurationRemaining(activeContest.duration || 60);
      });

      socketRef.current.on('kicked-from-room', ({ message }: { message: string }) => {
        alert(message || 'You were removed from this race room by the host.');
        setActiveContest(null);
        setRaceState('IDLE');
        clearAllTimers();
      });

      // Fetch persistent contest leaderboard (all historical participants)
      fetchContestLeaderboard(activeContest);

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [isUnlocked, activeContest, currentUser.id, username]);

  useEffect(() => {
    if (isUnlocked) fetchContestsList();
    return () => clearAllTimers();
  }, [refreshToken, isUnlocked]);

  // URL Invite Code joiner
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('race');
    if (code && !activeContest && contests.length > 0) {
      setJoinCode(code.toUpperCase());
      joinByCode(code.toUpperCase());
    }
  }, [contests, activeContest]);

  const handleHostStartRace = () => {
    if (!socketRef.current || !activeContest) return;
    socketRef.current.emit('start-race', {
      contestId: contestId(activeContest),
      countdownSeconds: 5
    });
  };

  const handleHostResetRace = () => {
    if (!socketRef.current || !activeContest) return;
    socketRef.current.emit('reset-race', {
      contestId: contestId(activeContest)
    });
  };

  const handleHostKickPlayer = (targetSocketId?: string) => {
    if (!socketRef.current || !activeContest || !targetSocketId) return;
    if (!confirm('Kick this participant from the race room?')) return;
    socketRef.current.emit('kick-player', {
      contestId: contestId(activeContest),
      targetSocketId
    });
  };

  const handleToggleReady = () => {
    if (!socketRef.current || !activeContest) return;
    const nextReady = !isMyReady;
    setIsMyReady(nextReady);
    socketRef.current.emit('toggle-ready', {
      contestId: contestId(activeContest),
      ready: nextReady
    });
  };

  const handleCreateRaceRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return alert('Please enter a race room title.');
    
    let passage = customPassage.trim();
    if (createCategory === 'COMMON') {
      passage = "the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find";
    } else if (createCategory === 'QUOTES') {
      passage = "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. As with all matters of the heart, you will know when you find it. Excellence is not an act, but a habit. We are what we repeatedly do.";
    } else if (createCategory === 'TECH') {
      passage = "Modern distributed architectures rely on asynchronous message passing, non-blocking I/O events, and idempotent state synchronization to deliver ultra-low latency responsive experiences across high-concurrency client clusters.";
    } else if (!passage) {
      passage = "FigTyp competitive typing tournament arena measures kinetic telemetry, precision accuracy, and real-time bursts of mechanical speed across typists worldwide.";
    }

    setIsCreatingRoom(true);
    try {
      const res = await fetch(`${API_BASE_URL}/contests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: createTitle.trim(),
          duration: createDuration,
          visibility: createVisibility,
          passage,
          passageCategory: createCategory,
          logoUrl: createLogoUrl.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.contest) {
        setShowCreateModal(false);
        setCreateLogoUrl('');
        fetchContestsList();
        initRoomState(data.contest);
      } else {
        alert(data.error || 'Failed to create race room.');
      }
    } catch (err) {
      alert('Network error creating race room.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const clearAllTimers = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (durationInterval.current) clearInterval(durationInterval.current);
  };

  const fetchContestsList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/contests`);
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        const list = data.contests || (Array.isArray(data) ? data : []);
        setContests(list);
      }
    } catch (e) {
      console.warn("Failed to fetch contests list:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchContestLeaderboard = async (contest: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/contest/${contestId(contest)}`);
      if (res.ok) {
        const data = await res.json();
        setContestLeaderboard(data);
      }
    } catch (e) {
      console.warn("Failed to fetch contest leaderboard:", e);
    }
  };

  const handleViewUserProfile = async (userId: string, username: string) => {
    if (!isAdmin) return; // Only admin can view profiles
    
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setSelectedUserProfile(userData);
      } else {
        console.warn('Failed to fetch user profile');
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const isContestEnded = (c: any) => {
    if (!c?.endTime) return false;
    const end = new Date(c.endTime).getTime();
    return !isNaN(end) && end < Date.now();
  };

  const isContestUpcoming = (c: any) => {
    if (!c?.startTime) return false;
    const start = new Date(c.startTime).getTime();
    return !isNaN(start) && start > Date.now();
  };

  const visibleContests = contests.filter((c: any) => 
    (c.visibility || 'PUBLIC') === 'PUBLIC' && c.status !== 'INACTIVE' && c.status !== 'CANCELLED'
  );

  const getRaceScore = (player: Partial<Opponent>) => {
    const wpm = Number(player.wpm || 0);
    const accuracy = Number(player.accuracy || 100);
    const progress = Number(player.progress || 0);
    return Math.round((wpm * accuracy) / 100 + progress * 0.6);
  };

  const sortLeaderboard = (players: Opponent[]) => {
    // Sort by: finished first, then highest WPM, then highest progress
    return [...players].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      
      // Primary sort: highest WPM first
      if ((b.wpm || 0) !== (a.wpm || 0)) return (b.wpm || 0) - (a.wpm || 0);
      
      // Secondary sort: highest progress
      if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
      
      // Tertiary sort: by score
      const scoreA = getRaceScore(a);
      const scoreB = getRaceScore(b);
      return scoreB - scoreA;
    });
  };

  const getMergedLeaderboard = () => {
    // Merge persistent leaderboard with live player data
    const livePlayerMap = new Map(opponents.map(p => [String(p.username), p]));
    const merged = contestLeaderboard.map(entry => {
      const livePlayer = livePlayerMap.get(entry.username);
      if (livePlayer) {
        // If player is currently racing, show live data
        return {
          ...entry,
          wpm: Math.max(entry.wpm, livePlayer.wpm || 0),
          accuracy: livePlayer.accuracy || entry.accuracy,
          progress: livePlayer.progress || 0,
          finished: livePlayer.finished || false,
          finishTime: livePlayer.finishTime
        };
      }
      return { ...entry, progress: 0, finished: false };
    });
    
    // Add any live players who aren't in the persistent leaderboard yet
    const existingNames = new Set(merged.map(m => m.username));
    opponents.forEach(livePlayer => {
      if (!existingNames.has(livePlayer.username)) {
        merged.push({
          username: livePlayer.username,
          wpm: livePlayer.wpm || 0,
          accuracy: livePlayer.accuracy || 100,
          progress: livePlayer.progress || 0,
          finished: livePlayer.finished || false,
          finishTime: livePlayer.finishTime,
          rank: 0,
          createdAt: new Date().toISOString()
        });
      }
    });
    
    return sortLeaderboard(merged as Opponent[]);
  };

  const initRoomState = (contest: any) => {
    setActiveContest(contest);
    setRaceState('IDLE');
    setCurrentWordInput('');
    setCurrentWordIndex(0);
    setWordStatuses({});
    setTypedWordsMap({});
    setMyProgress(0); 
    setMyWpm(0); 
    setMyAccuracy(100);
    setDurationRemaining(contest.duration || 60);
    setOpponents([{ id: currentUser.id || 'me', username: username || 'You', wpm: 0, progress: 0, accuracy: 100, finished: false }]);
  };

  const joinByCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setStatusMsg('');
    try {
      const normalized = code.trim().toUpperCase();
      const foundContest = contests.find(c => contestCode(c).toUpperCase() === normalized);
      if (foundContest) {
        if (foundContest.status === 'INACTIVE' || foundContest.status === 'CANCELLED') {
          setStatusMsg('This contest is currently turned off or inactive.');
          return;
        }
        if (isContestEnded(foundContest)) { setStatusMsg('This contest has already ended.'); return; }
        if (foundContest.visibility === 'PRIVATE' && !isAdmin) {
          const invited = (foundContest.invitedUsers || []).includes(currentUser.id);
          if (!invited) { setStatusMsg('This private contest is not assigned to your account.'); return; }
        }
        initRoomState(foundContest);
        setJoinCode('');
      } else {
        setStatusMsg('Invalid code. No matching arena found.');
      }
    } finally { setLoading(false); }
  };

  const joinContestRoom = async (contest: Contest) => {
    if (contest.status === 'INACTIVE' || contest.status === 'CANCELLED') {
      setStatusMsg('This contest is currently turned off or inactive.');
      return;
    }
    if (isContestEnded(contest)) { setStatusMsg('This contest has already ended.'); return; }
    if (contest.visibility === 'PRIVATE' && !isAdmin) {
      const invited = (contest.invitedUsers || []).includes(currentUser.id);
      if (!invited) { setStatusMsg('This private contest is not assigned to your account.'); return; }
    }
    setStatusMsg('');
    initRoomState(contest);
  };

  const triggerRaceCountdown = () => {
    setRaceState('COUNTDOWN');
    setCountdown(5);
    setCurrentWordInput('');
    setCurrentWordIndex(0);
    setWordStatuses({});
    setTypedWordsMap({});
    setMyProgress(0);
    setMyWpm(0);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { 
          clearInterval(countdownInterval.current!); 
          startContestMatch(); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startContestMatch = () => {
    setRaceState('RACING');
    startTimeRef.current = Date.now();
    setTimeout(() => { inputRef.current?.focus(); }, 100);

    durationInterval.current = setInterval(() => {
      setDurationRemaining((prev) => {
        if (prev <= 1) { 
          terminateContestMatch(currentWordIndex, wordStatuses, typedWordsMap); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
  };

  const passageText = activeContest ? contestPassage(activeContest).trim() : '';
  const words = passageText.split(/\s+/);
  const lineSize = 10;
  const lines: string[][] = [];
  for (let i = 0; i < words.length; i += lineSize) {
    lines.push(words.slice(i, i + lineSize));
  }
  const currentLineIndex = Math.floor(currentWordIndex / lineSize);

  const emitLiveProgress = (idx: number, currentInput: string, statuses = wordStatuses, typedMap = typedWordsMap) => {
    let correctChars = 0;
    let totalChecked = 0;
    let correctCharsForWpm = 0;
    let totalCharsTyped = 0;

    for (let i = 0; i < idx; i++) {
      const target = words[i] || '';
      const typed = typedMap[i] || '';
      if (target === typed) {
        correctCharsForWpm += target.length + 1; 
      }
      for (let j = 0; j < Math.max(target.length, typed.length); j++) {
        if (j < target.length && j < typed.length && target[j] === typed[j]) correctChars++;
        totalChecked++;
      }
      totalChecked++; 
      if (target === typed) correctChars++; 
      totalCharsTyped += Math.max(target.length, typed.length) + 1;
    }

    const currentTarget = words[idx] || '';
    let currentWordCorrect = true;
    for (let i = 0; i < currentInput.length; i++) {
      if (currentInput[i] === currentTarget[i]) correctChars++;
      else currentWordCorrect = false;
      totalChecked++;
    }
    if (currentWordCorrect) {
      correctCharsForWpm += currentInput.length;
    }
    totalCharsTyped += currentInput.length;

    const acc = totalChecked > 0 ? Math.round((correctChars / totalChecked) * 100) : 100;
    const totalPassageChars = passageText.length;
    const prog = Math.min(100, Number(((totalCharsTyped / totalPassageChars) * 100).toFixed(1)));
    const elapsedMinutes = (Date.now() - (startTimeRef.current || Date.now())) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round((correctCharsForWpm / 5) / Math.max(elapsedMinutes, 0.01)) : 0;

    setMyAccuracy(acc);
    setMyProgress(prog);
    setMyWpm(wpm);

    if (socketRef.current) {
      socketRef.current.emit('update-progress', {
        contestId: contestId(activeContest),
        userId: currentUser.id,
        wpm,
        accuracy: acc,
        progress: prog,
        finished: false
      });
    }
  };

  const handleWordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (raceState !== 'RACING') return;
    const value = e.target.value;
    
    if (value.endsWith(' ')) return;
    
    setCurrentWordInput(value);
    emitLiveProgress(currentWordIndex, value);

    const targetWord = words[currentWordIndex] || '';
    
    if (currentWordIndex === words.length - 1 && value === targetWord) {
      const finalStatuses = { ...wordStatuses, [currentWordIndex]: true };
      const finalTypedWords = { ...typedWordsMap, [currentWordIndex]: value };
      setWordStatuses(finalStatuses);
      setTypedWordsMap(finalTypedWords);
      terminateContestMatch(currentWordIndex + 1, finalStatuses, finalTypedWords);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (raceState !== 'RACING') return;

    // Backspace to previous word when current input is empty
    if (e.key === 'Backspace' && !currentWordInput && currentWordIndex > 0) {
      e.preventDefault();
      const prevIdx = currentWordIndex - 1;
      const prevWord = typedWordsMap[prevIdx] || '';
      
      const nextStatuses = { ...wordStatuses };
      delete nextStatuses[prevIdx];
      const nextTyped = { ...typedWordsMap };
      delete nextTyped[prevIdx];

      setWordStatuses(nextStatuses);
      setTypedWordsMap(nextTyped);
      setCurrentWordIndex(prevIdx);
      setCurrentWordInput(prevWord);

      emitLiveProgress(prevIdx, prevWord, nextStatuses, nextTyped);
      return;
    }
    
    if (e.key === ' ') {
      e.preventDefault();
      const trimmedVal = currentWordInput.trim();
      if (!trimmedVal) return;

      const targetWord = words[currentWordIndex] || '';
      const isCorrect = trimmedVal === targetWord;

      const nextStatuses = { ...wordStatuses, [currentWordIndex]: isCorrect };
      const nextTyped = { ...typedWordsMap, [currentWordIndex]: trimmedVal };

      setWordStatuses(nextStatuses);
      setTypedWordsMap(nextTyped);

      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      setCurrentWordInput('');

      emitLiveProgress(nextIdx, '', nextStatuses, nextTyped);

      if (nextIdx >= words.length) {
        terminateContestMatch(nextIdx, nextStatuses, nextTyped);
      }
    }
  };

  const terminateContestMatch = async (finalIdx = currentWordIndex, finalStatuses = wordStatuses, finalTypedMap = typedWordsMap) => {
    clearAllTimers();
    setRaceState('FINISHED');
    
    if (socketRef.current) { 
      socketRef.current.emit('update-progress', {
        contestId: contestId(activeContest),
        userId: currentUser.id,
        wpm: myWpm,
        accuracy: myAccuracy,
        progress: 100,
        finished: true
      });
    }

    try {
      await fetch(`${API_BASE_URL}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          mode: 'contest',
          contestId: contestId(activeContest),
          wpm: myWpm,
          accuracy: myAccuracy,
          quoteText: activeContest?.title || 'Arena Match',
          totalChars: passageText.length
        })
      });
      await fetch(`${API_BASE_URL}/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          actionType: 'CONTEST_FINISH',
          details: `Finished contest ${activeContest?.title || 'Arena Match'} at ${myWpm} WPM`,
          metadata: { contestId: contestId(activeContest), wpm: myWpm, accuracy: myAccuracy, progress: 100 }
        })
      });
      if (myWpm >= 20 && myAccuracy >= 90) {
        onCoinsAwarded(Math.round(myWpm * 1.5), Math.round(myWpm * 2));
      }
    } catch (e) { console.warn("Contest save failed"); }
  };

  const handleClaimCertificate = async () => {
    if (myWpm < 20 || myAccuracy < 90) { alert('Minimum 20 WPM and 90% accuracy required!'); return; }
    setClaimingCert(true);
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          wpm: myWpm,
          accuracy: myAccuracy,
          challengeMode: activeContest?.title || 'Arena Contest',
          fullName: currentUser.fullName || currentUser.username,
          contestId: contestId(activeContest),
          contestTitle: activeContest?.title || 'Arena Contest',
          contestLogo: (activeContest as any)?.logoUrl || (activeContest as any)?.contestLogo || null
        })
      });
      if (response.ok) alert('✅ Certificate claim submitted and pending admin approval. You will receive an email once approved.');
      else alert('Failed to submit certificate claim.');
    } finally { setClaimingCert(false); }
  };

  // Direct PDF Export using Top-level Imports
  const handleExportPDF = async () => {
    if (!isAdmin) return;
    setExportingPdf(true);
    try {
      const element = document.getElementById('live-leaderboard-panel');
      if (!element) {
        alert("Leaderboard element not found.");
        return;
      }

      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: '#020617',
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { default: jsPdfConstructor } = await import('jspdf');
      const pdf = new jsPdfConstructor('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FigTyp_Arena_${activeContest?.title?.replace(/\s+/g, '_') || 'Contest'}_Leaderboard.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to export PDF: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportLeaderboardCsv = () => {
    if (!activeContest) return;

    const mergedBoard = getMergedLeaderboard();
    const csvRows = [
      ['Rank', 'Player', 'WPM', 'Accuracy', 'Progress', 'Status'],
      ...mergedBoard.map((player, index) => [
        index + 1,
        player.username,
        player.wpm || 0,
        player.accuracy || 100,
        `${Math.round(player.progress || 0)}%`,
        player.finished ? 'Finished' : (player.progress ? 'Racing' : 'Pending')
      ])
    ];

    const csvContent = csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FigTyp_Leaderboard_${activeContest.title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ========================== RENDERS ==========================

  if (currentUser.role === 'GUEST') {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-6 max-w-md mx-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-2xl">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500/50 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Guest Cannot Access Race Esports</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Race Esports competitions require a <span className="font-semibold text-cyan-300">registered account</span> and profile completion.
            </p>
          </div>
          <button onClick={() => window.location.href = '/'} className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 transition font-semibold text-sm cursor-pointer">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (checkingAccess) {
    return <div className="text-center py-20 text-[#00F3FF] animate-pulse font-mono flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin" /> Verifying Access Clearances...
    </div>;
  }

  if (!isUnlocked) {
    return (
      <div className="relative max-w-4xl mx-auto mt-10 p-1 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Lock className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Arena Locked</h2>
          <p className="text-slate-400 font-mono mb-6 max-w-md">
            The Multiplayer Contest Arena requires peak kinetic memory. Complete 5 daily practice warmups to unlock access.
          </p>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex justify-between text-sm font-mono mb-2">
              <span className="text-slate-400">Daily Practices</span>
              <span className="text-[#00F3FF] font-bold">{practiceCount} / 5</span>
            </div>
            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-[#00F3FF] transition-all duration-1000 absolute top-0 left-0 bottom-0"
                style={{ width: `${(practiceCount / 5) * 100}%` }}
              />
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 bg-[#00F3FF]/10 hover:bg-[#00F3FF]/20 text-[#00F3FF] border border-[#00F3FF]/30 rounded-xl font-mono text-xs transition cursor-pointer"
            >
              Go to Practice Arena &rarr;
            </button>
          </div>
        </div>
        <div className="opacity-20 p-10 space-y-6 filter blur-[6px]">
          <div className="h-20 bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div id="contest-module" className="space-y-6 max-w-5xl mx-auto px-4 pt-1 pb-6 text-slate-100">

      {!activeContest && (
        <div id="contests-intro" className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101b2a] to-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-[#00F3FF] uppercase px-3 py-1 bg-[#00F3FF]/10 rounded-full">
              Live Esports Neural Lobbies
            </span>
            <h2 className="text-2xl font-display font-medium text-white flex items-center gap-2">
              Multiplayer Typing Contests Arena
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
              Create invite codes, register for global championships, or challenge live rivals in real-time. High speed and precision win global coin stakes!
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-mono text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Host Custom Race
            </button>
            <button
              onClick={fetchContestsList}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-[#00F3FF]/40 text-slate-300 hover:text-[#00F3FF] text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Contest Lobby Sponsor Ad */}
      {!activeContest && (
        <GoogleAd
          slot="3344556677"
          format="horizontal"
          label="Contest Arena Sponsor"
          className="my-4 max-w-4xl mx-auto"
        />
      )}

      {statusMsg && (
        <div className="p-3 text-xs font-mono text-center rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D]">
          ⚠️ {statusMsg}
        </div>
      )}

      {!activeContest && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-white tracking-wide flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                <span className="text-[#00F3FF]">🔑</span> Unlock Private Battle Arena
              </h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Enter a private match invitation code to join secure corporate or private arenas directly.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <input
                type="text"
                placeholder="e.g. JF5S9C"
                maxLength={8}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full sm:w-32 text-xs text-center font-mono uppercase bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none rounded-lg p-2 text-white transition focus:ring-1 focus:ring-[#00F3FF]/30"
              />
              <button
                onClick={() => joinByCode(joinCode)}
                disabled={loading}
                className="px-3 py-2 bg-[#00F3FF] hover:bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
              >
                Join Arena
              </button>
            </div>
          </div>

          <div id="lobbies-deck" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center p-12 text-slate-400 font-mono text-sm gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#00F3FF]" /> Retrieving active neural gateways...
              </div>
            ) : visibleContests.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-500 text-xs border border-slate-800 rounded-xl">
                No public lobbies currently published by Admin.
              </div>
            ) : (
              visibleContests.map((cnt: any) => {
                const ended = isContestEnded(cnt);
                const upcoming = isContestUpcoming(cnt);
                return (
                  <div
                    key={contestId(cnt)}
                    className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white tracking-wide">{cnt.title}</h4>
                        {ended ? (
                          <span className="text-[8px] font-mono uppercase bg-slate-500/10 border border-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded">🏁 Ended</span>
                        ) : upcoming ? (
                          <span className="text-[8px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">⏳ Upcoming</span>
                        ) : (
                          <span className="text-[8px] font-mono uppercase bg-green-500/10 border border-green-500/20 text-[#00FF95] px-1.5 py-0.5 rounded">🟢 Live</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2">{cnt.description}</p>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div className="flex items-center gap-2">
                        <span>Code: <strong className="text-white uppercase">{contestCode(cnt) || 'N/A'}</strong></span>
                        {contestCode(cnt) && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(contestCode(cnt));
                              alert('Share Code Copied: ' + contestCode(cnt));
                            }}
                            className="text-[#00F3FF] hover:text-white transition flex items-center gap-1 bg-[#00F3FF]/10 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        )}
                      </div>
                      <span>Length: {cnt.duration < 60 ? `${cnt.duration}s` : `${Math.round(cnt.duration / 60)}m`}</span>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => joinContestRoom(cnt)}
                        disabled={ended}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded cursor-pointer transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
                      >
                        Enter Room <Users className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ACTIVE RACING ARENA */}
      {activeContest && (
        <div id="active-race" className="space-y-6">

          <div id="race-header-toolbar" className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850 gap-4 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#00F3FF]">Active Arena Chamber</span>
                {isRoomHost && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> You are Room Host
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                {activeContest.title}
                <span className="text-xs font-mono font-normal text-slate-400 lowercase">
                  by {activeContest.hostUsername || 'Host'}
                </span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs">
              {contestCode(activeContest) && (
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Code: <strong className="text-white">{contestCode(activeContest)}</strong></span>
                  <button
                    onClick={() => {
                      const shareLink = `${window.location.origin}/?race=${contestCode(activeContest)}`;
                      navigator.clipboard.writeText(shareLink);
                      alert(`Invite link copied to clipboard!\n${shareLink}`);
                    }}
                    className="text-[#00F3FF] hover:text-white transition flex items-center gap-1 text-[10px] ml-1 cursor-pointer"
                    title="Copy Shareable Link"
                  >
                    <Copy className="w-3 h-3" /> Share
                  </button>
                </div>
              )}

              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Countdown</span>
                <strong className={durationRemaining < 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>
                  {durationRemaining < 60 ? `${durationRemaining}s` : `${Math.floor(durationRemaining / 60)}m ${durationRemaining % 60}s`} remaining
                </strong>
              </div>

              <button
                onClick={() => { 
                  setActiveContest(null); 
                  setRaceState('IDLE'); 
                  clearAllTimers(); 
                  if (socketRef.current) {
                    socketRef.current.disconnect(); 
                    socketRef.current = null;
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg hover:border-rose-500/40 hover:text-rose-400 cursor-pointer transition"
              >
                Exit Match &larr;
              </button>
            </div>
          </div>

          <div id="race-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* LEFT SIDE: LIVE MULTIPLAYER LEADERBOARD */}
            <div id="live-leaderboard-panel" className="col-span-1 bg-slate-950 border border-slate-800 rounded-3xl p-6 h-fit shadow-2xl flex flex-col min-h-[300px]">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#00F3FF] font-mono text-base font-bold uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-5 h-5" /> 
                  Live Standings
                </h3>
                
                {/* Admin PDF Download Button */}
                {isAdmin && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportLeaderboardCsv}
                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded cursor-pointer transition flex items-center justify-center"
                      title="Download Leaderboard as CSV/Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      disabled={exportingPdf}
                      className="p-1.5 bg-[#00F3FF]/10 hover:bg-[#00F3FF]/20 text-[#00F3FF] border border-[#00F3FF]/30 rounded cursor-pointer transition flex items-center justify-center disabled:opacity-50"
                      title="Download Leaderboard as PDF"
                    >
                      {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-3 flex-grow overflow-y-auto">
                {contestLeaderboard.length === 0 && opponents.length === 0 ? <p className="text-slate-500 text-xs font-mono text-center mt-10">No participants yet...</p> : null}
                
                {getMergedLeaderboard().map((p, index) => {
                  const isMe = p.id === currentUser.id || p.username === (username || 'You');
                  const displayProgress = p.progress || 0;
                  return (
                    <div 
                      key={`${p.id || p.username}-${index}`} 
                      className={`bg-slate-900 border ${isMe ? 'border-[#00F3FF]/50' : 'border-slate-800'} rounded-xl p-3 relative overflow-hidden transition-all duration-300 ${isAdmin && !isMe ? 'cursor-pointer hover:border-[#00F3FF]/30 hover:bg-slate-850' : ''}`}
                      onClick={() => isAdmin && !isMe && handleViewUserProfile(p.id, p.username)}
                      title={isAdmin && !isMe ? 'Click to view profile' : ''}
                    >
                      <div 
                        className={`absolute inset-y-0 left-0 ${isMe ? 'bg-[#00F3FF]/10' : 'bg-blue-600/10'} transition-all duration-500 ease-out`} 
                        style={{ width: `${Math.min(100, displayProgress)}%` }} 
                      />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-[#e2b714]'} font-bold text-sm`}>
                            #{index + 1}
                          </span>
                          <span className={`${isMe ? 'text-[#00F3FF]' : 'text-white'} font-semibold text-sm tracking-wide`}>
                            {p.username} {isMe && '(You)'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`block ${isMe ? 'text-[#00F3FF]' : 'text-slate-300'} font-bold font-display text-lg leading-tight`}>{p.wpm} WPM</span>
                          <span className="block text-slate-500 text-[10px] font-mono">
                            {p.finished && p.finishTime 
                              ? `Finished at ${new Date(p.finishTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` 
                              : `${Math.floor(p.progress)}% done`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE: TYPING ARENA */}
            <div className="col-span-1 lg:col-span-2 rounded-3xl bg-slate-900/40 border border-slate-800 p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
              
              {raceState === 'IDLE' && (
                <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-6 rounded-3xl p-6">
                  {isRoomHost ? (
                    <div className="max-w-md w-full space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 block uppercase tracking-widest font-bold">Host Operations Deck</span>
                        <h3 className="text-xl font-bold text-white mt-1">Ready to Launch Match</h3>
                        <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                          You are the room host. When racers are ready, trigger the synchronized countdown.
                        </p>
                      </div>

                      {/* Participant status pill list */}
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-left space-y-2 max-h-36 overflow-y-auto">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Chamber Typists ({opponents.length})</span>
                        {opponents.map((p) => {
                          const isMe = p.id === currentUser.id;
                          return (
                            <div key={p.socketId || p.id} className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-800/60 last:border-0">
                              <span className="text-white flex items-center gap-1.5">
                                {p.ready ? (
                                  <span className="text-emerald-400 text-[10px] font-bold">● Ready</span>
                                ) : (
                                  <span className="text-amber-400/80 text-[10px]">○ Waiting</span>
                                )}
                                {p.username} {isMe && '(You)'}
                              </span>
                              {!isMe && p.socketId && (
                                <button
                                  onClick={() => handleHostKickPlayer(p.socketId)}
                                  className="text-slate-500 hover:text-red-400 transition cursor-pointer p-0.5"
                                  title="Kick from room"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={() => {
                            const shareLink = `${window.location.origin}/?race=${contestCode(activeContest)}`;
                            navigator.clipboard.writeText(shareLink);
                            alert(`Invite link copied to clipboard!\n${shareLink}`);
                          }}
                          className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#00F3FF]" /> Share Link
                        </button>
                        <button
                          onClick={handleHostStartRace}
                          className="flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-mono text-xs font-extrabold rounded-xl cursor-pointer transition shadow-[0_0_25px_rgba(245,158,11,0.35)] uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-4 h-4 text-slate-950" /> Launch Countdown
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md w-full space-y-4">
                      <PlayCircle className="w-12 h-12 text-[#00F3FF] animate-pulse mx-auto" />
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 block uppercase tracking-widest font-bold">Awaiting Room Host</span>
                        <h3 className="text-lg font-bold text-white mt-1">
                          Host: <span className="text-amber-300">{activeContest.hostUsername || 'Room Host'}</span>
                        </h3>
                        <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                          Toggle your ready status and wait for the host to launch the synchronized match countdown.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={handleToggleReady}
                          className={`py-3 px-6 font-mono text-xs font-bold rounded-xl cursor-pointer transition flex items-center justify-center gap-2 ${isMyReady ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' : 'bg-slate-900 hover:bg-slate-850 text-[#00F3FF] border border-[#00F3FF]/40'}`}
                        >
                          {isMyReady ? <CheckCircle2 className="w-4 h-4" /> : null}
                          {isMyReady ? 'Ready for Race (Click to Cancel)' : 'Mark as Ready 🟢'}
                        </button>
                        <button
                          onClick={() => {
                            const shareLink = `${window.location.origin}/?race=${contestCode(activeContest)}`;
                            navigator.clipboard.writeText(shareLink);
                            alert(`Invite link copied to clipboard!\n${shareLink}`);
                          }}
                          className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#00F3FF]" /> Share
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {raceState === 'COUNTDOWN' && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur flex flex-col items-center justify-center text-center space-y-4 rounded-3xl">
                  <span className="text-xs font-mono tracking-widest uppercase text-red-500 block font-bold">Synchronized Match Countdown</span>
                  <p className="text-8xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 animate-ping">
                    {countdown}
                  </p>
                  <span className="text-xs font-mono text-slate-400">Keep your fingers placed on the home row!</span>
                </div>
              )}

              <div className="w-full opacity-100 transition-opacity">
                
                {/* ANIMATED KINETIC SPEEDWAY TRACK */}
                <div className="mb-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-850">
                    <span className="flex items-center gap-1.5 text-[#00F3FF]">
                      <Flag className="w-3.5 h-3.5 text-[#00F3FF]" /> Live Kinetic Speedway
                    </span>
                    <span className="text-amber-400 font-semibold">Finish Line 🏁</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {opponents.map((player) => {
                      const isMe = player.id === currentUser.id || player.username === (username || 'You');
                      const isPlayerHost = activeContest && (activeContest.createdBy === player.id);
                      const prog = Math.min(100, Math.max(0, player.progress || 0));

                      return (
                        <div key={player.socketId || player.id || player.username} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className={`flex items-center gap-1 font-semibold ${isMe ? 'text-[#00F3FF]' : 'text-slate-300'}`}>
                              {isPlayerHost && <span title="Room Host"><Crown className="w-3 h-3 text-amber-400" /></span>}
                              {player.username} {isMe && '(You)'}
                              {player.finished && <span className="text-emerald-400 font-bold ml-1">🏁 Finished</span>}
                              {!player.finished && player.ready && <span className="text-emerald-400 text-[9px] ml-1">[Ready]</span>}
                            </span>
                            <span className="text-slate-400 font-mono">
                              <strong className={isMe ? 'text-[#00F3FF]' : 'text-white'}>{player.wpm || 0}</strong> WPM • {Math.round(prog)}%
                            </span>
                          </div>

                          <div className="h-5 bg-slate-900 rounded-full border border-slate-800 relative overflow-hidden flex items-center px-1">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-300 ${isMe ? 'bg-gradient-to-r from-cyan-500 to-[#00F3FF] shadow-[0_0_10px_#00F3FF]' : 'bg-gradient-to-r from-indigo-600 to-purple-500'}`}
                              style={{ width: `${Math.max(4, prog)}%` }}
                            />
                            {/* Animated Car Icon at front */}
                            <div 
                              className="absolute transition-all duration-300 transform -translate-y-1/2 top-1/2 text-sm select-none pointer-events-none"
                              style={{ left: `calc(${Math.min(94, Math.max(0, prog))}% - 8px)` }}
                            >
                              🏎️
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {raceState === 'FINISHED' ? (
                  <div className="p-10 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-emerald-400 font-mono text-center animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center min-h-[250px]">
                    <div className="flex flex-col items-center justify-center gap-3 mb-6">
                      <Flag className="w-10 h-10 animate-bounce text-emerald-400" />
                      <span className="font-bold text-2xl tracking-wide uppercase text-white mt-2">Race Complete!</span>
                      <span className="text-base text-emerald-300">You scored {myWpm} WPM with {myAccuracy}% Accuracy</span>
                      <span className="text-[10px] text-slate-400 mt-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                        {isRoomHost ? 'You are Room Host: trigger a rematch when ready.' : 'Waiting for host to trigger the rematch.'}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex gap-4 justify-center flex-wrap">
                      {isRoomHost ? (
                        <button
                          onClick={handleHostResetRace}
                          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-lg shadow-amber-500/25"
                        >
                          <RefreshCw className="w-4 h-4" /> Host Rematch / Reset Chamber
                        </button>
                      ) : (
                        <button
                          onClick={() => joinContestRoom(activeContest)}
                          className="px-6 py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-4 h-4" /> Refresh Status
                        </button>
                      )}

                      <button
                        onClick={handleDownloadContestCertificate}
                        disabled={claimingCert || myWpm < 10}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 text-xs font-mono font-bold rounded-xl cursor-pointer hover:opacity-95 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/25 border-2 border-black dark:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" /> {claimingCert ? 'Generating Certificate...' : 'Download Contest Certificate (PDF)'}
                      </button>

                      <button
                        onClick={handleClaimCertificate}
                        disabled={claimingCert || myWpm < 20 || myAccuracy < 90}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-xl cursor-pointer hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black dark:border-transparent"
                      >
                        <Award className="w-4 h-4" /> {claimingCert ? 'Processing...' : 'Submit Claim to Admin'}
                      </button>
                    </div>

                    {/* Contest Results Google Ad */}
                    <div className="w-full mt-6 pt-4 border-t border-emerald-500/20">
                      <GoogleAd
                        slot="7766554433"
                        format="horizontal"
                        label="Contest Champion Sponsor"
                        className="max-w-2xl mx-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => inputRef.current?.focus()}
                    className="relative p-8 md:p-10 rounded-3xl bg-zinc-950/40 border border-zinc-900/60 leading-relaxed text-left transition select-none outline-none font-mono tracking-wider cursor-text w-full min-h-[250px]"
                  >
                    {!isFocused && raceState === 'RACING' && (
                      <div className="absolute inset-0 bg-zinc-950/65 backdrop-blur-[2px] flex items-center justify-center rounded-3xl z-10 font-mono text-sm text-[#00F3FF] cursor-pointer">
                        <span className="animate-pulse">🞂 Click here to focus and resume racing</span>
                      </div>
                    )}

                    <div className="space-y-5 select-none">
                      
                      {lines[currentLineIndex] && (
                        <div className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-900/60 relative">
                          <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                            <span className="text-[10px] text-[#00F3FF] uppercase tracking-widest font-semibold font-mono">
                              🏁 Active Race Line {currentLineIndex + 1}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {words.length - currentWordIndex} words remaining
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-3 gap-y-3 text-lg md:text-xl leading-relaxed font-mono transition-all duration-300 min-h-[3rem] items-center text-left">
                            {lines[currentLineIndex].map((word, wInLineIdx) => {
                              const lineStartWordIdx = currentLineIndex * lineSize;
                              const absWordIdx = lineStartWordIdx + wInLineIdx;
                              
                              if (absWordIdx < currentWordIndex) {
                                const typedWord = typedWordsMap[absWordIdx] || '';
                                return (
                                  <span key={wInLineIdx} className="transition-colors duration-150 relative inline-block pb-1">
                                    {word.split('').map((char, cIdx) => {
                                      const typedChar = typedWord[cIdx];
                                      let charClass = "text-zinc-600";
                                      if (typedChar === char) charClass = "text-emerald-400";
                                      else if (typedChar !== undefined) charClass = "text-rose-500 bg-rose-500/20 rounded-sm";
                                      else charClass = "text-rose-500/50 border-b-2 border-dotted border-rose-500/40";
                                      return <span key={cIdx} className={charClass}>{char}</span>;
                                    })}
                                    {typedWord.length > word.length && (
                                      <span className="text-rose-500 line-through decoration-2 decoration-rose-600 bg-rose-500/10">
                                        {typedWord.slice(word.length)}
                                      </span>
                                    )}
                                  </span>
                                );
                              }
                              
                              if (absWordIdx === currentWordIndex) {
                                return (
                                  <span key={wInLineIdx} className="relative inline-block px-1.5 py-0.5 rounded bg-zinc-900/60 border border-[#00F3FF]/30">
                                    {word.split('').map((char, cIdx) => {
                                      let charColor = "text-zinc-500"; 
                                      const isCursorHere = cIdx === currentWordInput.length;
                                      
                                      if (cIdx < currentWordInput.length) {
                                        const matches = currentWordInput[cIdx] === char;
                                        charColor = matches ? "text-emerald-400" : "text-rose-500 bg-rose-500/20 font-bold rounded-sm";
                                      }
                                      
                                      return (
                                        <span key={cIdx} className="relative">
                                          {isCursorHere && isFocused && (
                                            <span className="absolute -left-[1px] top-0 bottom-0 w-[2.5px] bg-[#00F3FF] animate-pulse shadow-[0_0_8px_#00F3FF]" />
                                          )}
                                          <span className={charColor}>{char}</span>
                                        </span>
                                      );
                                    })}
                                    
                                    {currentWordInput.length === word.length && isFocused && (
                                      <span className="relative inline-block w-[1px]">
                                        <span className="absolute -left-[1px] top-0.5 bottom-0.5 w-[2.5px] bg-[#00F3FF] animate-pulse shadow-[0_0_8px_#00F3FF]" />
                                      </span>
                                    )}
                                    
                                    {currentWordInput.length > word.length && (
                                      currentWordInput.slice(word.length).split("").map((char, cIdx) => (
                                        <span key={`extra-${cIdx}`} className="text-rose-500 bg-rose-500/20 line-through text-base md:text-lg font-bold">
                                          {char}
                                        </span>
                                      ))
                                    )}
                                  </span>
                                );
                              }
                              
                              return (
                                <span key={wInLineIdx} className="text-zinc-600 font-mono transition-all duration-150">
                                  {word}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {currentLineIndex + 1 < lines.length && (
                        <div className="p-4 rounded-xl bg-zinc-950/10 border border-zinc-900/20 opacity-40 hover:opacity-60 transition-opacity duration-200">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold font-mono block mb-2">
                            ⏭️ Next Line ({currentLineIndex + 2})
                          </span>
                          <div className="flex flex-wrap gap-x-3.5 gap-y-2 text-sm md:text-base leading-relaxed font-mono text-zinc-650 text-left">
                            {lines[currentLineIndex + 1].map((word, wInLineIdx) => (
                              <span key={wInLineIdx} className="text-zinc-600">{word}</span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    <input
                      ref={inputRef}
                      disabled={raceState !== 'RACING'}
                      type="text"
                      value={currentWordInput}
                      onChange={handleWordInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="absolute opacity-0 pointer-events-none w-0 h-0"
                      autoFocus
                    />
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Profile Modal for Admin User Viewing */}
      {selectedUserProfile && isAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedUserProfile(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition p-2 bg-slate-800/50 rounded-full"
              title="Close Profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {loadingProfile ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#00F3FF] animate-spin" />
              </div>
            ) : (
              <div className="p-8 space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  {selectedUserProfile.avatarUrl ? (
                    <img
                      src={selectedUserProfile.avatarUrl}
                      alt={selectedUserProfile.username}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00F3FF]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] flex items-center justify-center font-bold text-2xl text-white">
                      {selectedUserProfile.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedUserProfile.fullName || selectedUserProfile.username}</h2>
                    <p className="text-slate-400 text-sm font-mono">@{selectedUserProfile.username}</p>
                    <p className="text-[#00F3FF] text-sm font-semibold mt-1">{selectedUserProfile.email}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-sm text-slate-400 uppercase font-mono block">Level</span>
                    <span className="text-2xl font-bold text-[#00F3FF] mt-2">{selectedUserProfile.level || 1}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-sm text-slate-400 uppercase font-mono block">XP</span>
                    <span className="text-2xl font-bold text-purple-400 mt-2">{selectedUserProfile.xp || 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-sm text-slate-400 uppercase font-mono block">Coins</span>
                    <span className="text-2xl font-bold text-amber-400 mt-2">{selectedUserProfile.coins || 0}</span>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="border-t border-slate-800 pt-6 space-y-3">
                  {selectedUserProfile.registrationId && (
                    <div>
                      <span className="text-sm text-slate-400 uppercase font-mono">Registration ID</span>
                      <p className="text-white font-semibold">{selectedUserProfile.registrationId}</p>
                    </div>
                  )}
                  {selectedUserProfile.phoneNumber && (
                    <div>
                      <span className="text-sm text-slate-400 uppercase font-mono">Phone</span>
                      <p className="text-white">{selectedUserProfile.phoneNumber}</p>
                    </div>
                  )}
                  {selectedUserProfile.institute && (
                    <div>
                      <span className="text-sm text-slate-400 uppercase font-mono">Institute</span>
                      <p className="text-white">{selectedUserProfile.institute}</p>
                    </div>
                  )}
                  {selectedUserProfile.professionalRole && (
                    <div>
                      <span className="text-sm text-slate-400 uppercase font-mono">Role</span>
                      <p className="text-white">{selectedUserProfile.professionalRole}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Race Room Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-gradient-to-b dark:from-[#0b1120] dark:to-[#070b14] border-2 border-black dark:border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl dark:shadow-[0_0_50px_rgba(245,158,11,0.2)] text-slate-900 dark:text-slate-100 my-8">
            
            <div className="flex justify-between items-center pb-4 border-b-2 border-black/10 dark:border-amber-500/20 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white font-serif">Host a Custom Race</h3>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">Configure your multiplayer arena chamber</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRaceRoom} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-black dark:text-slate-400 font-bold block mb-1">Race Chamber Title</label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-black dark:border-slate-800 focus:border-amber-500 rounded-xl p-3 text-black dark:text-white outline-none font-medium"
                  placeholder="e.g. Apex Speed Derby"
                />
              </div>

              {/* Contest / Tournament Logo Section with Admin Request Flow */}
              {canUseCustomLogo ? (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-2 border-black/15 dark:border-amber-500/30 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-black dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 font-mono">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      Tournament Logo / Insignia
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">(Custom Approved)</span>
                    </label>
                    {createLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setCreateLogoUrl('')}
                        className="text-[10px] text-red-600 dark:text-red-400 hover:underline font-mono cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-amber-500/50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {createLogoUrl ? (
                        <img
                          src={createLogoUrl}
                          alt="Contest Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Trophy className="w-5 h-5 text-amber-500/60" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={createLogoUrl}
                        onChange={(e) => setCreateLogoUrl(e.target.value)}
                        placeholder="Paste Image URL (https://...)"
                        className="w-full bg-white dark:bg-slate-900 border-2 border-black/20 dark:border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none text-[11px]"
                      />
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-black dark:text-slate-300 rounded-lg cursor-pointer transition text-[10px] border border-black/20 dark:border-slate-700 font-bold">
                          <Upload className="w-3 h-3 text-amber-500" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoFileUpload}
                          />
                        </label>
                        <span className="text-[9px] text-slate-500 font-mono">JPG, PNG, WebP or SVG</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono block mb-1">Or Quick Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: '🏆 Gold Cup', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=60' },
                        { name: '⚡ Speed Apex', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&auto=format&fit=crop&q=60' },
                        { name: '🎯 Grand Prix', url: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=120&auto=format&fit=crop&q=60' },
                        { name: '👑 Master Crest', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=60' }
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset.name}
                          onClick={() => setCreateLogoUrl(preset.url)}
                          className={`px-2 py-0.5 rounded-md text-[10px] border transition cursor-pointer ${createLogoUrl === preset.url ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold' : 'bg-white dark:bg-slate-900 border-black/20 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-slate-200'}`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-2 border-black/15 dark:border-amber-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-black dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 font-mono">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      Tournament Certificate Logo
                    </label>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold">
                      Standard FigTyp Certificate
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    General user contests provide the official verified FigTyp certificate to all participants. Adding your own <strong>Custom Brand/Organization Logo</strong> and hosting expanded tournaments requires Admin Approval.
                  </p>

                  {currentUserApproval === 'PENDING' ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Your request for Custom Logo & Tournament Hosting is <strong>Pending Admin Review</strong>.</span>
                    </div>
                  ) : showLogoRequestInput ? (
                    <div className="space-y-2 pt-2 border-t border-black/10 dark:border-slate-800">
                      <label className="text-[10px] font-mono text-black dark:text-slate-400 block font-bold">Organization / Tournament Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={logoOrgName}
                          onChange={(e) => setLogoOrgName(e.target.value)}
                          placeholder="e.g. Acme Tech League or DIU Club"
                          className="flex-1 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-black dark:text-white outline-none text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={handleRequestCustomLogo}
                          disabled={isSubmittingLogoRequest}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer transition shadow border-2 border-black dark:border-transparent disabled:opacity-50"
                        >
                          {isSubmittingLogoRequest ? 'Sending...' : 'Submit Request'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {logoRequestSuccessMsg && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mb-2">
                          ✓ {logoRequestSuccessMsg}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowLogoRequestInput(true)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-black dark:border-amber-500/40 text-black dark:text-amber-300 rounded-xl text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        Request Admin Approval for Custom Logo & Expanded Race
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-black dark:text-slate-400 font-bold block mb-1">Match Duration</label>
                  <select
                    value={createDuration}
                    onChange={(e) => setCreateDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-black dark:border-slate-800 focus:border-amber-500 rounded-xl p-3 text-black dark:text-white outline-none cursor-pointer font-medium"
                  >
                    <option value={30}>30 Seconds (Sprint)</option>
                    <option value={60}>60 Seconds (Standard)</option>
                    <option value={120}>120 Seconds (Endurance)</option>
                  </select>
                </div>

                <div>
                  <label className="text-black dark:text-slate-400 font-bold block mb-1">Visibility</label>
                  <select
                    value={createVisibility}
                    onChange={(e) => setCreateVisibility(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-black dark:border-slate-800 focus:border-amber-500 rounded-xl p-3 text-black dark:text-white outline-none cursor-pointer font-medium"
                  >
                    <option value="PUBLIC">Public Lobby</option>
                    <option value="PRIVATE">Private (Code Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-black dark:text-slate-400 font-bold block mb-1.5">Track Vocabulary Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'COMMON', label: '10Fast Common' },
                    { id: 'QUOTES', label: 'Curated Quote' },
                    { id: 'TECH', label: 'Tech Vocab' },
                    { id: 'CUSTOM', label: 'Custom Text' }
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCreateCategory(cat.id as any)}
                      className={`py-2 px-2 text-center rounded-xl border-2 transition cursor-pointer text-[11px] font-bold ${createCategory === cat.id ? 'bg-amber-500 text-slate-950 border-black dark:bg-amber-500/20 dark:border-amber-400 dark:text-amber-300' : 'bg-white dark:bg-slate-950 border-black/20 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-slate-200'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {createCategory === 'CUSTOM' && (
                <div>
                  <label className="text-black dark:text-slate-400 font-bold block mb-1">Custom Text Passage</label>
                  <textarea
                    rows={3}
                    value={customPassage}
                    onChange={(e) => setCustomPassage(e.target.value)}
                    placeholder="Paste or type custom passage text..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-black dark:border-slate-800 focus:border-amber-500 rounded-xl p-3 text-black dark:text-white outline-none resize-none font-mono"
                  />
                </div>
              )}

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-black dark:text-slate-300 rounded-xl transition cursor-pointer border-2 border-black dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRoom}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 border-2 border-black dark:border-transparent disabled:opacity-50"
                >
                  {isCreatingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Launch Chamber
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}