import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Loader2, PlayCircle, Flag, Award, RefreshCw, Copy } from 'lucide-react';
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

function ProgressFill({ progress, isMe }: { progress: number; isMe: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.style.setProperty('--progress-width', `${progress}%`);
  }, [progress]);
  return <div ref={ref} className={`h-full transition-all duration-300 rounded-full ${isMe ? 'bg-[#00F3FF]' : 'bg-[#8B5CF6]/60'} progress-fill`} />;
}

interface Opponent {
  id: string; username: string; wpm: number; progress: number; accuracy?: number; wrongKeys?: number; backspaces?: number;
}

// Backend (MongoDB) documents use _id / passage / inviteCode while the older
// frontend model used id / contestText / shareCode — normalize both shapes.
const contestId = (c: any) => c?._id || c?.id;
const contestPassage = (c: any) => c?.passage || c?.contestText || '';
const contestCode = (c: any) => c?.inviteCode || c?.shareCode || '';

export default function OnlineContestArena({ userToken, username, currentUser, recentAttempts, onCoinsAwarded, refreshToken }: Props) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeAttempt, setActiveAttempt] = useState<ContestAttempt | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [claimingCert, setClaimingCert] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [inputText, setInputText] = useState('');
  const [raceState, setRaceState] = useState<'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'>('IDLE');
  const [countdown, setCountdown] = useState(5);
  const [durationRemaining, setDurationRemaining] = useState(60);
  const [myWpm, setMyWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myProgress, setMyProgress] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [opponents, setOpponents] = useState<Opponent[]>([]);

  const API_BASE_URL = `${API_URL}/api`;
  const isAdmin = currentUser.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchContestsList();
    return () => { clearAllTimers(); if (socketRef.current) socketRef.current.disconnect(); };
  }, [refreshToken]);

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

  // Public lobby only lists PUBLIC arenas — private ones are entered via invite code.
  const visibleContests = contests.filter((c: any) => (c.visibility || 'PUBLIC') === 'PUBLIC');

  const initRoomState = (contest: any, attemptData?: any) => {
    setActiveContest(contest);
    setActiveAttempt(attemptData);
    setRaceState('IDLE');
    setInputText('');
    setMyProgress(0); setMyWpm(0); setMyAccuracy(100);
    setDurationRemaining(contest.duration || 60);
    setOpponents([{ id: currentUser.id || 'me', username: username || 'You', wpm: 0, progress: 0, accuracy: 100 }]);
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
    setInputText('');
    setMyProgress(0);
    setMyWpm(0);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownInterval.current!); startContestMatch(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startContestMatch = () => {
    setRaceState('RACING');
    setBackspaceCount(0);
    startTimeRef.current = Date.now();
    durationInterval.current = setInterval(() => {
      setDurationRemaining((prev) => {
        if (prev <= 1) { terminateContestMatch(); return 0; }
        return prev - 1;
      });
    }, 1000);

    try {
      socketRef.current = io(API_URL);
      socketRef.current.emit('join-contest', { contestId: contestId(activeContest), username: username || 'Racer', userId: currentUser.id });
      socketRef.current.on('progress-pushed', (data: any) => {
        setOpponents((prev) => {
          const exists = prev.some((o) => o.id === data.userId || o.id === data.id);
          if (exists) {
            return prev.map((o) => (o.id === data.userId || o.id === data.id)
              ? { ...o, wpm: data.wpm, accuracy: data.accuracy, progress: data.progress, wrongKeys: data.wrongKeys, backspaces: data.backspaces }
              : o);
          }
          return [...prev, {
            id: data.userId || data.id,
            username: data.username || 'Rival',
            wpm: data.wpm || 0,
            accuracy: data.accuracy ?? 100,
            progress: data.progress || 0,
            wrongKeys: data.wrongKeys,
            backspaces: data.backspaces
          }];
        });
      });
    } catch (err) { console.warn("Socket connection failed:", err); }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (raceState !== 'RACING' || !activeContest) return;
    const value = e.target.value;
    setInputText(value);
    let correct = 0, wrong = 0;
    const passage = contestPassage(activeContest);
    for (let i = 0; i < value.length; i++) if (value[i] === passage[i]) correct++; else wrong++;

    const acc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    const prog = Math.min(100, Number(((value.length / passage.length) * 100).toFixed(1)));
    const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 1;
    const wpm = elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60)) : 0;

    setMyAccuracy(acc); setMyProgress(prog); setMyWpm(wpm);

    setOpponents((prev) =>
      prev.map((opp) => (opp.id === currentUser.id || opp.id === 'me')
        ? { ...opp, wpm, progress: prog, accuracy: acc, wrongKeys: wrong, backspaces: backspaceCount }
        : opp)
    );

    if (socketRef.current) {
      socketRef.current.emit('update-progress', {
        contestId: contestId(activeContest),
        userId: currentUser.id,
        wpm,
        accuracy: acc,
        progress: prog
      });
    }
    if (value.length >= passage.length) terminateContestMatch();
  };

  const terminateContestMatch = async () => {
    clearAllTimers();
    setRaceState('FINISHED');
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }

    const passage = contestPassage(activeContest);
    try {
      await fetch(`${API_BASE_URL}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          mode: 'quote',
          wpm: myWpm,
          accuracy: myAccuracy,
          quoteText: activeContest?.title || 'Arena Match',
          totalChars: passage.length
        })
      });
      await fetch(`${API_BASE_URL}/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          actionType: 'CONTEST_FINISH',
          details: `Finished contest ${activeContest?.title || 'Arena Match'} at ${myWpm} WPM`,
          metadata: { contestId: contestId(activeContest), wpm: myWpm, accuracy: myAccuracy, progress: myProgress }
        })
      });
      if (myWpm >= 20 && myAccuracy >= 90) onCoinsAwarded(Math.round(myWpm * 1.5), Math.round(myWpm * 2));
    } catch (e) { console.warn("Save failed"); }
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

  const sortedStandings = [...opponents].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return (b.accuracy ?? 100) - (a.accuracy ?? 100);
  });

  // Guest Access Restriction
  if (currentUser.role === 'GUEST') {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-6 max-w-md mx-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
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
              <li className="flex items-center gap-2"><span className="text-red-400">✕</span> 15+ Practice Sessions</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 transition font-semibold text-sm"
          >
            Return Home
          </button>
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
          <button
            onClick={fetchContestsList}
            className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-[#00F3FF]/40 text-slate-300 hover:text-[#00F3FF] text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-2 shrink-0"
            title="Refresh contest lobbies"
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

      {/* Arena Lobbies Directory */}
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
                    className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
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
                            title="Copy Share Code"
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
                        className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded cursor-pointer transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
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

      {/* Active Race Workspace */}
      {activeContest && (
        <div id="active-race" className="space-y-6">

          <div id="race-header-toolbar" className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#00F3FF]">Active Arena Chamber</span>
              <h3 className="text-sm font-bold text-white uppercase">{activeContest.title}</h3>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Countdown</span>
                <strong className="text-red-400">
                  {durationRemaining < 60
                    ? `${durationRemaining}s`
                    : `${Math.floor(durationRemaining / 60)}m ${durationRemaining % 60}s`} remaining
                </strong>
              </div>
              <button
                onClick={() => { setActiveContest(null); setRaceState('IDLE'); clearAllTimers(); if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } }}
                className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded hover:border-slate-700 cursor-pointer transition"
              >
                Exit Match &larr;
              </button>
            </div>
          </div>

          <div id="race-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

            <div className="md:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">Live Position Tracks</h4>

              <div className="space-y-5">
                {opponents.map((opp) => {
                  const isMe = opp.id === currentUser.id || opp.id === 'me';
                  return (
                    <div key={opp.id} className="space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className={isMe ? 'text-[#00F3FF] font-bold' : 'text-slate-300'}>{opp.username} {isMe && '(You)'}</span>
                        <span className="text-slate-500">{opp.wpm} WPM &bull; {Math.floor(opp.progress)}% Complete</span>
                      </div>

                      <div className="w-full h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden relative">
                        <ProgressFill progress={opp.progress} isMe={isMe} />
                        {opp.progress >= 100 && (
                          <div className="absolute right-1 top-0 text-[8px] text-[#00FF95] uppercase font-bold animate-pulse">FINISH</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {raceState === 'IDLE' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <PlayCircle className="w-12 h-12 text-[#00F3FF] animate-pulse" />
                  <div className="text-center">
                    <span className="text-xs font-mono text-slate-500 block">ARENA GATE LOCKED</span>
                    <p className="text-xs text-slate-300 max-w-xs leading-normal mt-1">Ready to prove your typing speed? Click below to start the synchronized lobby countdown.</p>
                  </div>
                  <button
                    onClick={triggerRaceCountdown}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition shadow-lg"
                  >
                    Engage Gate Countdown
                  </button>
                </div>
              )}

              {raceState === 'COUNTDOWN' && (
                <div className="text-center py-16 space-y-3">
                  <span className="text-xs font-mono tracking-widest uppercase text-red-500 block">Match starts in</span>
                  <p className="text-5xl font-display font-bold text-white text-glow-cyan animate-ping">{countdown}</p>
                </div>
              )}

              {raceState === 'RACING' && (() => {
                const passage = contestPassage(activeContest);
                const lines = passage.match(/.{1,80}(?:\s|$)/g) || [passage];
                const charPos = inputText.length;
                let currentLine = 0;
                let charCount = 0;
                let currentLineText = '';
                let nextLineText = '';
                
                for (let i = 0; i < lines.length; i++) {
                  const lineLen = lines[i].length;
                  if (charCount + lineLen > charPos) {
                    currentLine = i;
                    currentLineText = lines[i];
                    nextLineText = i + 1 < lines.length ? lines[i + 1] : '';
                    break;
                  }
                  charCount += lineLen;
                }

                return (
                  <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-6">
                    <div className="space-y-2 border-b border-slate-850 pb-4">
                      <div className="text-sm font-mono tracking-wide leading-relaxed select-none text-[#00F3FF] font-semibold">
                        {currentLineText.split('').map((char: string, index: number) => {
                          const globalIndex = charCount + index;
                          let colorClass = 'text-slate-600';
                          if (globalIndex < inputText.length) {
                            colorClass = inputText[globalIndex] === char ? 'text-[#00F3FF]' : 'text-[#FF4D6D] bg-[#FF4D6D]/10';
                          }
                          return <span key={`char-${globalIndex}`} className={colorClass}>{char}</span>;
                        })}
                      </div>
                      
                      {nextLineText && (
                        <div className="text-xs font-mono text-slate-600 leading-relaxed select-none opacity-50">
                          {nextLineText}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="race-typing-input" className="text-[9px] font-mono uppercase text-slate-500 block">Type the line above to continue racing</label>
                      <input
                        id="race-typing-input"
                        autoFocus
                        type="text"
                        value={inputText}
                        onChange={handleTypingChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace') setBackspaceCount((b) => b + 1);
                        }}
                        placeholder="Type the current line to proceed to the next..."
                        className="w-full text-xs font-mono bg-slate-900 border border-slate-800 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/30"
                      />
                    </div>
                  </div>
                );
              })()}

              {raceState === 'FINISHED' && (
                <div className="text-center py-12 space-y-4">
                  <Flag className="w-10 h-10 text-[#00FF95] mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white font-display">RACE COMPLETE!</h3>
                    <p className="text-xs text-slate-400">Your metrics have been logged securely. Standings have been published.</p>
                  </div>

                  <div className="flex gap-4 justify-center flex-wrap">
                    <button
                      onClick={() => joinContestRoom(activeContest)}
                      className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Race Again
                    </button>
                    <button
                      onClick={handleClaimCertificate}
                      disabled={claimingCert || myWpm < 20 || myAccuracy < 90}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-xl cursor-pointer hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Award className="w-3.5 h-3.5" /> {claimingCert ? 'Processing...' : 'Claim Official Certificate'}
                    </button>
                  </div>
                </div>
              )}

            </div>

            <div className="md:col-span-1 rounded-2xl bg-slate-950/40 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" /> Live Standings
                </h4>

                {raceState === 'FINISHED' && !isAdmin ? (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center text-xs text-slate-400 font-mono">
                    Final leaderboard is locked for admin review.
                  </div>
                ) : (
                  <div className="space-y-2 font-mono">
                    {sortedStandings.map((opp, idx) => {
                      const isMe = opp.id === currentUser.id || opp.id === 'me';
                      return (
                        <div
                          key={opp.id}
                          className={`p-2.5 border rounded-lg flex items-center justify-between text-xs ${isMe ? 'border-[#00F3FF] bg-[#00F3FF]/5 text-white' : 'border-slate-850 bg-slate-950 text-slate-400'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 text-glow-cyan font-bold">{idx + 1}.</span>
                            <span className="font-semibold">{opp.username.substring(0, 16)}</span>
                          </div>
                          <div className="text-right">
                            <strong className="block">{opp.wpm} WPM</strong>
                            <span className="text-[9px] text-slate-500 block">{Math.floor(opp.progress)}% done</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {raceState === 'FINISHED' && isAdmin && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-1 text-center font-mono">
                  <Award className="w-5 h-5 text-[#00FF95] mx-auto" />
                  <span className="text-[10px] text-[#00FF95] block">Rewards disbursed!</span>
                  <span className="text-[10px] text-slate-500 block">+{myWpm * 2} XP / +{Math.round(myWpm * 1.5)} Coins</span>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
