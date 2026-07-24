import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Loader2, PlayCircle, Flag, Award, RefreshCw, Copy, Lock, Zap, Download } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { Contest, ContestAttempt, TypingAttempt, User } from '../types';

interface Props {
  userToken: string;
  username: string;
  currentUser: User;
  recentAttempts: TypingAttempt[];
  onCoinsAwarded: (coins: number, xp: number) => void;
  refreshToken?: number;
}

// Progress Bar Component
function ProgressFill({ progress, isMe }: { progress: number; isMe: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.style.setProperty('--progress-width', `${progress}%`);
  }, [progress]);
  return <div ref={ref} className={`h-full transition-all duration-300 rounded-full ${isMe ? 'bg-[#00F3FF]' : 'bg-[#8B5CF6]/60'} progress-fill`} />;
}

interface Opponent {
  id: string; 
  username: string; 
  wpm: number; 
  progress: number; 
  accuracy?: number; 
  finished?: boolean;
}

// Helpers
const contestId = (c: any) => c?._id || c?.id;
const contestPassage = (c: any) => c?.passage || c?.contestText || '';
const contestCode = (c: any) => c?.inviteCode || c?.shareCode || '';

export default function OnlineContestArena({ userToken, username, currentUser, onCoinsAwarded, refreshToken }: Props) {
  // Access Control States
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [practiceCount, setPracticeCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // General States
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [claimingCert, setClaimingCert] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Race & Socket States
  const socketRef = useRef<Socket | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [raceState, setRaceState] = useState<'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'>('IDLE');
  const [countdown, setCountdown] = useState(5);
  const [durationRemaining, setDurationRemaining] = useState(60);
  
  // Advanced Typing Engine States
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordInput, setCurrentWordInput] = useState('');
  const [wordStatuses, setWordStatuses] = useState<Record<number, boolean>>({});
  const [typedWordsMap, setTypedWordsMap] = useState<Record<number, string>>({});
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Performance States
  const [myWpm, setMyWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myProgress, setMyProgress] = useState(0);
  const [opponents, setOpponents] = useState<Opponent[]>([]);

  const API_BASE_URL = `${API_URL}/api`;
  const isAdmin = currentUser.role === 'SUPER_ADMIN';

  // 1. Fetch Practice Status to Unlock Arena
  useEffect(() => {
    const checkPracticeStatus = async () => {
      try {
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
  }, [userToken, isAdmin]);

  // 2. Setup Socket Connection for Live Racing
  useEffect(() => {
    if (isUnlocked && activeContest) {
      socketRef.current = io(API_URL);
      
      socketRef.current.emit('join-contest', { 
        contestId: contestId(activeContest), 
        username: username || 'Racer', 
        userId: currentUser.id 
      });

      socketRef.current.on('update-leaderboard', (updatedPlayers: Opponent[]) => {
        // Sort players: Finished first, then by progress, then by WPM
        const sorted = updatedPlayers.sort((a, b) => {
          if (a.finished && !b.finished) return -1;
          if (!a.finished && b.finished) return 1;
          if (b.progress !== a.progress) return b.progress - a.progress;
          return b.wpm - a.wpm;
        });
        setOpponents(sorted);
      });

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

  const visibleContests = contests.filter((c: any) => (c.visibility || 'PUBLIC') === 'PUBLIC');

  // Initialize Room State
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

  // Advanced Line-by-Line Word Chunking logic
  const passageText = activeContest ? contestPassage(activeContest).trim() : '';
  const words = passageText.split(/\s+/);
  const lineSize = 10;
  const lines: string[][] = [];
  for (let i = 0; i < words.length; i += lineSize) {
    lines.push(words.slice(i, i + lineSize));
  }
  const currentLineIndex = Math.floor(currentWordIndex / lineSize);

  // Calculates WPM, Accuracy, and Progress and broadcasts to Socket
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
    
    // Auto-finish on exact match of the last word
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
    
    // Broadcast final finished state - WE NO LONGER DISCONNECT THE SOCKET HERE!
    // This allows the user to stay in the room and watch others finish the race.
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
          mode: 'quote',
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
      const response = await fetch(`${API_BASE_URL}/certificates/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          wpm: myWpm,
          accuracy: myAccuracy,
          challengeMode: activeContest?.title || 'Arena Contest',
          fullName: currentUser.fullName || currentUser.username
        })
      });
      if (response.ok) alert('✅ Certificate generated! Check Certificates tab.');
      else alert('Failed to generate.');
    } finally { setClaimingCert(false); }
  };

  // Export Leaderboard to PDF (Admin Only Feature)
  const handleExportPDF = async () => {
    if (!isAdmin) return;
    setExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('live-leaderboard-panel');
      
      if (!element) return;

      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: '#020617' // slate-950 background
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FigTyp_Arena_${activeContest?.title?.replace(/\s+/g, '_')}_Result.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to export PDF. Ensure jspdf and html2canvas are available.");
    } finally {
      setExportingPdf(false);
    }
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
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left">
            <p className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-widest font-bold">Requirements:</p>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Full Name</li>
              <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Phone Number</li>
              <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Professional Role</li>
              <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Institute/Company</li>
              <li className="flex items-center gap-2"><span className="text-red-400">✕</span> 5+ Practice Sessions</li>
            </ul>
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

      {/* LOBBIES HERO */}
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
          <button
            onClick={fetchContestsList}
            className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-[#00F3FF]/40 text-slate-300 hover:text-[#00F3FF] text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Lobbies
          </button>
        </div>
      )}

      {statusMsg && (
        <div className="p-3 text-xs font-mono text-center rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D]">
          ⚠️ {statusMsg}
        </div>
      )}

      {/* LOBBIES DIRECTORY */}
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
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#00F3FF]">Active Arena Chamber</span>
              <h3 className="text-sm font-bold text-white uppercase">{activeContest.title}</h3>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Countdown</span>
                <strong className="text-red-400">
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
                className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded hover:border-rose-500/40 hover:text-rose-400 cursor-pointer transition"
              >
                Exit Match &larr;
              </button>
            </div>
          </div>

          <div id="race-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* LEFT SIDE: LIVE MULTIPLAYER LEADERBOARD */}
            <div id="live-leaderboard-panel" className="col-span-1 bg-slate-950 border border-slate-800 rounded-3xl p-6 h-fit shadow-2xl flex flex-col min-h-[300px]">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#00F3FF] font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4" /> 
                  {raceState === 'FINISHED' ? 'Final Standings' : 'Live Standings'}
                </h3>
                
                {/* Admin PDF Export Button (Visible only when finished) */}
                {isAdmin && raceState === 'FINISHED' && (
                  <button 
                    onClick={handleExportPDF}
                    disabled={exportingPdf}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded cursor-pointer transition flex items-center justify-center disabled:opacity-50"
                    title="Download Leaderboard as PDF"
                  >
                    {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              
              <div className="space-y-3 flex-grow overflow-y-auto">
                {opponents.length === 0 ? <p className="text-slate-500 text-xs font-mono text-center mt-10">Waiting for players...</p> : null}
                
                {opponents.map((p, index) => {
                  const isMe = p.id === currentUser.id;
                  return (
                    <div key={p.id} className={`bg-slate-900 border ${isMe ? 'border-[#00F3FF]/50' : 'border-slate-800'} rounded-xl p-3 relative overflow-hidden transition-all duration-300`}>
                      <div 
                        className={`absolute inset-y-0 left-0 ${isMe ? 'bg-[#00F3FF]/10' : 'bg-blue-600/10'} transition-all duration-500 ease-out`} 
                        style={{ width: `${Math.min(100, p.progress)}%` }} 
                      />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-[#e2b714]'} font-bold text-xs`}>
                            #{index + 1}
                          </span>
                          <span className={`${isMe ? 'text-[#00F3FF]' : 'text-white'} font-semibold text-xs tracking-wide`}>
                            {p.username} {isMe && '(You)'}
                          </span>
                          {p.finished && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded uppercase font-bold border border-emerald-500/30">Done</span>}
                        </div>
                        <div className="text-right">
                          <span className={`block ${isMe ? 'text-[#00F3FF]' : 'text-slate-300'} font-bold font-display text-sm leading-tight`}>{p.wpm} WPM</span>
                          <span className="block text-slate-500 text-[9px] font-mono">{Math.floor(p.progress)}% done</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {isAdmin && raceState === 'FINISHED' && (
                <p className="text-[9px] text-slate-500 text-center font-mono mt-4 pt-3 border-t border-slate-800">
                  Admin Tool: Click the top-right icon to export this board.
                </p>
              )}
            </div>

            {/* RIGHT SIDE: TYPING ARENA */}
            <div className="col-span-1 lg:col-span-2 rounded-3xl bg-slate-900/40 border border-slate-800 p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
              
              {raceState === 'IDLE' && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-5 rounded-3xl p-6">
                  <PlayCircle className="w-14 h-14 text-[#00F3FF] animate-pulse" />
                  <div>
                    <span className="text-xs font-mono text-slate-400 block uppercase tracking-widest font-bold">Arena Lobby Ready</span>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto mt-2 leading-relaxed">
                      Connect to the socket and await the synchronized racing countdown. Do not leave the window!
                    </p>
                  </div>
                  <button
                    onClick={triggerRaceCountdown}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-[#00F3FF] text-black hover:opacity-90 font-mono text-xs font-extrabold rounded-xl cursor-pointer transition shadow-[0_0_20px_rgba(0,243,255,0.3)] uppercase tracking-wider"
                  >
                    Start Match Countdown
                  </button>
                </div>
              )}

              {raceState === 'COUNTDOWN' && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur flex flex-col items-center justify-center text-center space-y-4 rounded-3xl">
                  <span className="text-xs font-mono tracking-widest uppercase text-red-500 block font-bold">Match starts in</span>
                  <p className="text-7xl font-display font-bold text-white text-glow-cyan animate-ping">{countdown}</p>
                </div>
              )}

              <div className="w-full opacity-100 transition-opacity">
                
                {raceState === 'FINISHED' ? (
                  <div className="p-10 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-emerald-400 font-mono text-center animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center min-h-[250px]">
                    <div className="flex flex-col items-center justify-center gap-3 mb-6">
                      <Flag className="w-10 h-10 animate-bounce" />
                      <span className="font-bold text-xl tracking-wide uppercase text-white mt-2">Race Finished!</span>
                      <span className="text-sm text-emerald-300">You scored {myWpm} WPM</span>
                      <span className="text-[10px] text-slate-400 mt-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">You can stay here to watch others finish.</span>
                    </div>
                    
                    <div className="mt-4 flex gap-4 justify-center flex-wrap">
                      <button
                        onClick={() => joinContestRoom(activeContest)}
                        className="px-6 py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" /> Rematch Arena
                      </button>
                      <button
                        onClick={handleClaimCertificate}
                        disabled={claimingCert || myWpm < 20 || myAccuracy < 90}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-xl cursor-pointer hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Award className="w-4 h-4" /> {claimingCert ? 'Processing...' : 'Claim Achievement Certificate'}
                      </button>
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

    </div>
  );
}