import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { BookOpen, CheckCircle2, Lock, ShieldCheck, PlayCircle, Award, RefreshCw, Loader2, QrCode, Zap, Layers } from 'lucide-react';
import { User as UserType } from '../types';

interface Props {
  userToken: string;
  currentUser: UserType;
  onCoinsAwarded: (coins: number, xp: number) => void;
}

type LevelCategory = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export default function StructuredCoursesCenter({ userToken, currentUser, onCoinsAwarded }: Props) {
  const [courseAttempts, setCourseAttempts] = useState<any[]>([]);
  const [activeCourse, setActiveCourse] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<LevelCategory>('BEGINNER');
  const [activePractice, setActivePractice] = useState<{ course: number; category: LevelCategory; session: number; passage: string } | null>(null);
  const [inputText, setInputText] = useState('');
  const [raceState, setRaceState] = useState<'IDLE' | 'RACING' | 'FINISHED'>('IDLE');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [metrics, setMetrics] = useState({ wpm: 0, accuracy: 100 });
  const [claimingCert, setClaimingCert] = useState(false);

  const TOTAL_COURSES = 100;
  const SESSIONS_PER_CATEGORY = 25;
  const CERT_REQUIREMENTS = { BEGINNER: 100, INTERMEDIATE: 50, ADVANCED: 40 };

  const isAdmin = (currentUser as any).role === 'ADMIN';

  useEffect(() => {
    fetchCourseAttempts();
  }, [currentUser.id, userToken]);

  const fetchCourseAttempts = async () => {
    try {
      const res = await fetch(API_URL + '/api/attempts', { headers: { 'Authorization': `Bearer ${userToken}` } });
      if (res.ok) {
        const data = await res.json();
        setCourseAttempts(data.filter((a: any) => String(a.mode).startsWith('course_')));
      }
    } catch (e) {
      console.warn("Could not load course history");
    }
  };

  const logActivity = async (actionType: string, details: string) => {
    try {
      await fetch(API_URL + '/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ actionType, details })
      });
    } catch (e) {}
  };

  const generatePassage = (course: number, category: LevelCategory, session: number) => {
    if (category === 'BEGINNER') return `Welcome to course module ${course} session ${session}. Consistent practice brings perfect muscle memory. Keep your fingers aligned and type steadily.`;
    if (category === 'INTERMEDIATE') return `Intermediate Phase - Course ${course}, Module ${session}: Typing is not just about speed, but rhythm and consistency! Focus on punctuation, capitalization, and maintaining a steady flow without looking at the board.`;
    return `const advancedCourse${course}_${session} = () => { \n  // Advanced keystrokes test\n  let score = (wpm * 1.5) + (acc > 95 ? 100 : 0);\n  return score;\n};`;
  };

  const openPracticeSession = (course: number, category: LevelCategory, session: number) => {
    setActivePractice({ course, category, session, passage: generatePassage(course, category, session) });
    setRaceState('IDLE');
    setInputText('');
    setMetrics({ wpm: 0, accuracy: 100 });
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);
    
    if (raceState === 'IDLE' && value.length > 0) {
      setRaceState('RACING');
      setStartTime(Date.now());
    }
    
    if (!activePractice) return;
    
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === activePractice.passage[i]) correct++;
    }
    
    const accuracy = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    setMetrics(prev => ({ ...prev, accuracy }));
    
    if (value.length >= activePractice.passage.length) {
      setRaceState('FINISHED');
      const elapsedSecs = startTime ? (Date.now() - startTime) / 1000 : 15;
      const finalWpm = Math.round((correct / 5) / (elapsedSecs / 60));
      setMetrics({ wpm: finalWpm, accuracy });
      finishSessionAction(finalWpm, accuracy);
    }
  };

  const finishSessionAction = async (finalWpm: number, finalAcc: number) => {
    if (!activePractice) return;
    try {
      await fetch(API_URL + '/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          mode: `course_${activePractice.category}`,
          wpm: finalWpm,
          accuracy: finalAcc,
          quoteText: `Course ${activePractice.course} - ${activePractice.category} S${activePractice.session}`
        })
      });
      fetchCourseAttempts();
      logActivity('PRACTICE', `Completed ${activePractice.category} Session ${activePractice.session} in Course ${activePractice.course}`);
      if (finalWpm >= 15 && finalAcc >= 85) onCoinsAwarded(10, 15);
    } catch (e) {}
  };

  const getQrCodeBase64 = (text: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve('');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
    });
  };

  const downloadCourseCertificate = async (level: LevelCategory) => {
    setClaimingCert(true);
    try {
      // Loaded on demand so the heavy PDF library stays out of the main bundle
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const width = 297; const height = 210; const centerX = width / 2;

      doc.setFillColor(252, 250, 245); doc.rect(0, 0, width, height, 'F');
      doc.setDrawColor(15, 23, 42); doc.setLineWidth(2); doc.rect(12, 12, width - 24, height - 24);
      doc.setDrawColor(192, 154, 68); doc.setLineWidth(0.5); doc.rect(15, 15, width - 30, height - 30);

      const verifyUrl = `${window.location.origin}/verify/course?user=${encodeURIComponent(currentUser.username || 'user')}&level=${level}&date=${Date.now()}`;
      const qrBase64 = await getQrCodeBase64(verifyUrl);

      doc.setFont("times", "bold"); doc.setFontSize(28); doc.setTextColor(15, 23, 42);
      doc.text(`FIGTYP ${level} TYPING DIPLOMA`, centerX, 55, { align: "center" });

      doc.setFont("times", "italic"); doc.setFontSize(14); doc.setTextColor(100, 100, 100);
      doc.text("This prestigious academic course diploma is awarded to", centerX, 75, { align: "center" });

      doc.setFont("times", "bold"); doc.setFontSize(36); doc.setTextColor(192, 154, 68);
      doc.text(String(currentUser.fullName || currentUser.username || 'Guest').toUpperCase(), centerX, 95, { align: "center" });

      doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.5); doc.line(centerX - 80, 100, centerX + 80, 100);

      doc.setFont("times", "italic"); doc.setFontSize(12); doc.setTextColor(100, 100, 100);
      doc.text(`For successfully completing the stringent requirements of the FigTyp Course Center,`, centerX, 115, { align: "center" });
      doc.text(`mastering over ${CERT_REQUIREMENTS[level]} highly advanced metric-based training sessions.`, centerX, 123, { align: "center" });

      if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', centerX - 20, 140, 40, 40);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7);
        doc.text("SCAN FOR OFFICIAL VERIFICATION", centerX, 185, { align: "center" });
      }

      doc.setFont("times", "normal"); doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString(), 50, 180, { align: "center" });
      doc.line(30, 175, 70, 175);
      doc.text("Date of Completion", 50, 185, { align: "center" });

      doc.text("Super Admin / Founder", width - 50, 180, { align: "center" });
      doc.line(width - 70, 175, width - 30, 175);
      doc.text("Authorized Signature", width - 50, 185, { align: "center" });

      doc.save(`FigTyp_${level}_Course_Certificate.pdf`);
      logActivity('CERTIFICATE_CLAIM', `Claimed ${level} Official Course Diploma`);
      
    } catch (e) {
      alert("Failed to generate PDF Certificate. Please try again.");
    } finally {
      setClaimingCert(false);
    }
  };

  const beginnerCount = courseAttempts.filter(a => a.mode === 'course_BEGINNER').length;
  const intermediateCount = courseAttempts.filter(a => a.mode === 'course_INTERMEDIATE').length;
  const advancedCount = courseAttempts.filter(a => a.mode === 'course_ADVANCED').length;
  const totalCourseProgressCount = beginnerCount + intermediateCount + advancedCount;

  if (activePractice) {
    return (
      <div className="fixed inset-0 z-50 bg-[#06080f]/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#00F3FF]">
                {activePractice.category} TRAINING PROTOCOL
              </span>
              <h2 className="text-xl font-display font-bold text-white">Course {activePractice.course} - Module {activePractice.session}</h2>
            </div>
            <button onClick={() => setActivePractice(null)} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition">
              Abort Exercise
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl leading-relaxed text-sm font-mono tracking-wide select-none">
              {activePractice.passage.split('').map((char, idx) => {
                let color = 'text-slate-600';
                if (idx < inputText.length) {
                  color = inputText[idx] === char ? 'text-[#00FF95]' : 'text-[#FF4D6D] bg-[#FF4D6D]/20';
                }
                return <span key={idx} className={color}>{char}</span>;
              })}
            </div>

            <textarea
              autoFocus
              disabled={raceState === 'FINISHED'}
              value={inputText}
              onChange={handleTypingChange}
              className="w-full h-32 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] rounded-xl p-4 text-white font-mono text-sm resize-none outline-none transition"
              placeholder="Begin typing to engage the stopwatch..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm font-mono text-slate-400">
              <span>Speed: <strong className="text-[#00F3FF]">{metrics.wpm} WPM</strong></span>
              <span>Precision: <strong className={metrics.accuracy > 90 ? 'text-emerald-400' : 'text-red-400'}>{metrics.accuracy}%</strong></span>
            </div>

            {raceState === 'FINISHED' && (
              <div className="flex gap-3 animate-fade-in">
                <button 
                  onClick={() => openPracticeSession(activePractice.course, activePractice.category, activePractice.session)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded-lg transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-run
                </button>
                <button 
                  onClick={() => setActivePractice(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs rounded-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Return to Hub
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-1 pb-16 space-y-10 text-slate-100">
      
      {/* Hero Section */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#060a14] via-slate-900 to-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F3FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 z-10 w-full md:w-2/3">
          <span className="text-[10px] font-mono tracking-widest text-[#00F3FF] uppercase px-3 py-1 bg-[#00F3FF]/10 rounded-full border border-[#00F3FF]/20">
            COGNITIVE TYPING ACADEMICS CORE
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">
            FigTyp Structured Courses Center
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Level up from simple letter-striking into complex operators, database briefs, and stenographic multi-key chords. Complete modules to acquire global experience multipliers!
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>{totalCourseProgressCount} Total Sessions Completed</span>
            </div>
            {!isAdmin && totalCourseProgressCount < 10 && (
              <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400">
                <Lock className="w-4 h-4" />
                <span>Need {10 - totalCourseProgressCount} more for Arena</span>
              </div>
            )}
            {isAdmin && (
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Bypass Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right p-6 bg-slate-900/80 border border-slate-800 rounded-xl hidden md:block z-10 shrink-0">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Curriculum</p>
              <h3 className="text-2xl font-bold text-white font-mono mt-1">{TOTAL_COURSES} Courses</h3>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Bonus Multiplier</p>
              <h3 className="text-2xl font-bold text-[#00FF95] font-mono mt-1">2.0x XP</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Diploma Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CertificateCard 
          title="Beginner" 
          reqCount={CERT_REQUIREMENTS.BEGINNER} 
          userCount={beginnerCount} 
          isAdmin={isAdmin}
          claimingCert={claimingCert}
          onDownload={() => downloadCourseCertificate('BEGINNER')} 
        />
        <CertificateCard 
          title="Intermediate" 
          reqCount={CERT_REQUIREMENTS.INTERMEDIATE} 
          userCount={intermediateCount} 
          isAdmin={isAdmin}
          claimingCert={claimingCert}
          onDownload={() => downloadCourseCertificate('INTERMEDIATE')} 
        />
        <CertificateCard 
          title="Advanced" 
          reqCount={CERT_REQUIREMENTS.ADVANCED} 
          userCount={advancedCount} 
          isAdmin={isAdmin}
          claimingCert={claimingCert}
          onDownload={() => downloadCourseCertificate('ADVANCED')} 
        />
      </div>

      {/* Dynamic Syllabus Panel (Shows when a course is clicked) */}
      {activeCourse && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-[#00F3FF] shadow-[0_0_30px_rgba(0,243,255,0.05)] relative overflow-hidden animate-fade-in scroll-mt-24" id="syllabus-panel">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F3FF]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 relative z-10">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#00F3FF]" /> Course Module {activeCourse} - Syllabus
              </h3>
              <p className="text-sm text-slate-400 mt-2">Select a track and execute targeted muscle memory warmups.</p>
            </div>
            <button 
              onClick={() => setActiveCourse(null)} 
              className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition text-xs font-mono cursor-pointer"
            >
              ✕ Close Syllabus
            </button>
          </div>

          <div className="space-y-8 relative z-10">
            {/* Tabs */}
            <div className="flex gap-3 p-1.5 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as LevelCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 min-w-[140px] py-3 text-xs font-mono font-bold tracking-widest rounded-lg transition-all ${
                    activeCategory === cat 
                      ? 'bg-slate-800 text-[#00F3FF] shadow-md' 
                      : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                  }`}
                >
                  {cat} TRACK
                </button>
              ))}
            </div>
            
            {/* Sessions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {Array.from({ length: SESSIONS_PER_CATEGORY }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => openPracticeSession(activeCourse, activeCategory, i+1)}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-[#00F3FF] hover:bg-slate-900 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block group-hover:text-[#00F3FF] transition">Session {i+1}</span>
                    <span className="text-[10px] font-mono text-slate-500">+10 XP</span>
                  </div>
                  <PlayCircle className="w-6 h-6 text-slate-700 group-hover:text-[#00F3FF] transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* The 100 Course Master Grid */}
      <div className="space-y-6 pt-8 border-t border-slate-850">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00F3FF]" /> Global Module Directory
          </h3>
          <span className="text-xs text-slate-500 font-mono">100 Academic Modules</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {Array.from({ length: TOTAL_COURSES }).map((_, idx) => {
            const mod = idx + 1;
            const isActive = activeCourse === mod;
            return (
              <button 
                key={mod} 
                onClick={() => {
                  setActiveCourse(mod);
                  setTimeout(() => {
                    document.getElementById('syllabus-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#00F3FF]/10 border-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.2)] scale-105' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm ${isActive ? 'bg-[#00F3FF] text-slate-950' : 'bg-slate-950 text-[#00F3FF] border border-slate-800'}`}>
                  {mod}
                </div>
                <span className={`text-[10px] font-bold tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}>MOD {mod}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// Fixed Sub-component
const CertificateCard = ({ title, reqCount, userCount, isAdmin, claimingCert, onDownload }: any) => {
  const isReady = userCount >= reqCount || isAdmin;
  const progress = Math.min(100, (userCount / reqCount) * 100);
  
  const progressClass = progress === 0 ? 'w-0'
    : progress <= 10 ? 'w-1/12'
    : progress <= 20 ? 'w-2/12'
    : progress <= 30 ? 'w-3/12'
    : progress <= 40 ? 'w-4/12'
    : progress <= 50 ? 'w-6/12'
    : progress <= 60 ? 'w-7/12'
    : progress <= 70 ? 'w-8/12'
    : progress <= 80 ? 'w-9/12'
    : progress <= 90 ? 'w-10/12'
    : 'w-full';

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 relative overflow-hidden">
      {isReady && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h4 className={`text-lg font-bold font-display ${isReady ? 'text-emerald-400' : 'text-white'}`}>{title} Diploma</h4>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Requires {reqCount} sessions</p>
        </div>
        <Award className={`w-8 h-8 ${isReady ? 'text-emerald-400 animate-pulse' : 'text-slate-700'}`} />
      </div>
      
      <div className="space-y-1 relative z-10">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>Progress</span>
          <span>{userCount} / {reqCount}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${isReady ? 'bg-emerald-400' : 'bg-[#00F3FF]'} ${progressClass}`} />
        </div>
      </div>

      <button
        onClick={onDownload}
        disabled={!isReady || claimingCert}
        className={`w-full py-3 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 relative z-10 cursor-pointer ${
          isReady 
            ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:opacity-90' 
            : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
        }`}
      >
        {claimingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
        {isReady ? 'Claim Certificate' : 'Locked'}
      </button>
    </div>
  );
};