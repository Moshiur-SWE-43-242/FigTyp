import React, { useState, useEffect } from 'react';
import { 
  Building2, Code2, Globe2, BookOpen, Milestone, ChevronRight, X, 
  Github, Linkedin, Facebook, Mail, ShieldCheck, Zap, Cpu, Award, 
  ExternalLink, Sparkles, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCMSContent } from '../utils/useCMSContent';

interface TimelineItem {
  _id?: string;
  date: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  color: 'purple' | 'cyan' | 'emerald' | 'teal';
}

interface Props {
  websiteLogo?: string;
  founderPicture?: string;
  mSquareLogo?: string;
  miraCoreLogo?: string;
  founderPictureSize?: number;
}

export default function AboutCompany({
  websiteLogo,
  founderPicture,
  mSquareLogo,
  miraCoreLogo,
  founderPictureSize = 140
}: Props) {
  const { content: cmsTimeline } = useCMSContent('timeline');
  const [expandedTimeline, setExpandedTimeline] = useState<TimelineItem | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
    {
      date: 'Feb 2025',
      title: 'M-Square Devs Group Consortium Formed',
      shortDescription: 'The engineering consortium commenced shaping FigTyp\'s modular learning architecture and design systems.',
      fullDescription: 'The M-Square Devs Group consortium was established to architect and deliver FigTyp\'s immersive learning ecosystem. The team focused on designing modular curriculum architecture, premium user interfaces, and comprehensive learning pathways prioritizing cognitive engagement and mechanical accuracy.',
      color: 'purple'
    },
    {
      date: 'Oct 2025',
      title: 'Real-Time Neural Telemetry Engine',
      shortDescription: 'Platform research team rolled out kinetic typing intelligence, live WebSocket competition rooms, and finger heatmaps.',
      fullDescription: 'Platform expansion phase saw significant advancement in typing intelligence algorithms, real-time analytics engines, and professional certification systems. The team integrated cognitive workflow design patterns to maximize skill retention and performance tracking capabilities.',
      color: 'cyan'
    },
    {
      date: '2026, Q1',
      title: 'Daffodil SWE Engineering Alliance',
      shortDescription: 'Moshiur Riat initiates prototyping of FigTyp enterprise architecture with Daffodil International University standards.',
      fullDescription: 'Academic and software engineering research collaboration with Daffodil International University to prototype and validate FigTyp\'s modular design specifications. This partnership brought rigorous software testing, scalable MongoDB schema design, and deterministic socket state synchronization to the platform.',
      color: 'emerald'
    },
    {
      date: '2026',
      title: 'Commercial SaaS & Global Arena Release',
      shortDescription: 'FigTyp Arena officially enters production, offering low-latency multiplayer races, verifiable certificates, and CMU.',
      fullDescription: 'FigTyp Arena officially launched as a full-featured commercial SaaS platform, introducing competitive typing arenas with real-time multiplayer capabilities, SHA-256 verifiable diploma certificates, and autonomous Control Management Unit.',
      color: 'teal'
    }
  ]);

  useEffect(() => {
    if (cmsTimeline.length > 0) {
      const mapped = cmsTimeline
        .filter(item => item.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(item => ({
          _id: item._id,
          date: item.date || 'N/A',
          title: item.title || 'Untitled',
          shortDescription: item.shortDescription || item.fullDescription || '',
          fullDescription: item.fullDescription || item.shortDescription || '',
          color: (item.color as TimelineItem['color']) || 'purple'
        }));

      if (mapped.length) {
        setTimelineItems(mapped);
      }
    }
  }, [cmsTimeline]);

  const colorMap = {
    purple: {
      dot: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
      hover: 'hover:border-purple-500/40 group-hover:text-purple-300',
      badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      pill: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    },
    cyan: {
      dot: 'bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]',
      hover: 'hover:border-cyan-500/40 group-hover:text-cyan-300',
      badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      pill: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    },
    emerald: {
      dot: 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
      hover: 'hover:border-emerald-500/40 group-hover:text-emerald-300',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    teal: {
      dot: 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]',
      hover: 'hover:border-teal-400/40 group-hover:text-teal-300',
      badge: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      pill: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
    }
  };

  const techStack = [
    'TypeScript',
    'React 19',
    'Node.js',
    'Express 5',
    'Socket.io',
    'MongoDB',
    'TailwindCSS',
    'HTML5 Canvas',
    'JWT Auth',
    'QR Code Engine'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-fade-in pb-24 px-4 sm:px-6">
      
      {/* 1. Executive System Portfolio Header */}
      <div className="relative flex flex-col items-center text-center pt-12 pb-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative z-10 mb-5 flex items-center justify-center">
          {websiteLogo ? (
            <img
              src={websiteLogo}
              alt="FigTyp Logo"
              className="w-20 h-20 object-cover rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-[0_0_30px_rgba(0,243,255,0.2)]"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-display font-black text-white text-2xl shadow-[0_0_25px_rgba(0,243,255,0.3)]">
              FT
            </div>
          )}
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase font-mono shadow-[0_0_12px_rgba(6,182,212,0.15)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> FigTyp System Portfolio
          </span>
          <span className="bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full text-[11px] font-mono">
            v1.0.0 Production Release
          </span>
        </div>
        
        <h1 className="relative z-10 text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 font-display tracking-tight leading-tight max-w-4xl mb-4">
          Engineering The Future of Kinetic Typing Mechanics
        </h1>
        
        <p className="relative z-10 text-slate-400 text-sm sm:text-base leading-relaxed max-w-3xl font-sans mb-8">
          Architected with sub-5ms low-latency WebSocket rooms, tamper-evident cryptographic diplomas, real-time biometric telemetry, and a fully decoupled Control Management Unit.
        </p>

        {/* System Specs Bar */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl font-mono text-xs text-slate-300">
          <div className="p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-center">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">&lt; 5ms Sync</span>
            <span className="text-[10px] text-slate-500">Kinetic WebSocket Loop</span>
          </div>
          <div className="p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">SHA-256 Verifiable</span>
            <span className="text-[10px] text-slate-500">QR-Backed Diplomas</span>
          </div>
          <div className="p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-center">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white">Neural Telemetry</span>
            <span className="text-[10px] text-slate-500">Per-Finger Heatmaps</span>
          </div>
          <div className="p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-center">
            <Globe2 className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">Autonomous CMU</span>
            <span className="text-[10px] text-slate-500">Zero-Downtime Control</span>
          </div>
        </div>
      </div>

      {/* 2. Executive Founder & Chief Architect Portfolio Card */}
      <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[90px] pointer-events-none" />
        
        <div className="grid md:grid-cols-[340px_1fr] items-stretch">
          
          {/* Left Column: Portrait, Credentials & Links */}
          <div className="p-8 sm:p-10 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col items-center text-center justify-between">
            <div className="flex flex-col items-center w-full">
              
              {/* Profile Image with subtle cyan-purple halo */}
              <div className="relative mb-5 group">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 opacity-70 blur-sm group-hover:opacity-100 transition duration-500" />
                {founderPicture ? (
                  <img
                    src={founderPicture}
                    alt="Md Moshiur Rahaman Riat"
                    style={{
                      width: Math.max(140, Math.min(180, founderPictureSize)),
                      height: Math.max(140, Math.min(180, founderPictureSize))
                    }}
                    className="relative rounded-full object-cover border-4 border-slate-950 bg-slate-900 shadow-xl"
                  />
                ) : (
                  <div className="relative w-36 h-36 rounded-full border-4 border-slate-950 bg-slate-900 flex items-center justify-center font-bold text-3xl font-display text-cyan-400">
                    MR
                  </div>
                )}
                {/* Online Status Badge */}
                <div 
                  className="absolute bottom-1 right-2 p-1.5 bg-slate-950 rounded-full border border-slate-800 shadow"
                  title="Lead Architect Online"
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white font-display mb-1">
                Md Moshiur Rahaman Riat
              </h2>
              <div className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Chief Architect & Lead SWE
              </div>

              <div className="inline-flex items-center gap-2 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-300 font-mono mb-6">
                <Milestone className="w-3.5 h-3.5 text-purple-400" />
                <span>Daffodil International University (DIU)</span>
              </div>
            </div>

            {/* Social & Channel Buttons */}
            <div className="w-full pt-4 border-t border-slate-900 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">
                Connect With The Architect
              </span>
              <div className="flex items-center justify-center gap-2.5">
                <a
                  href="https://github.com/Moshiur-SWE-43-242"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-slate-400 hover:text-cyan-400 transition shadow-sm"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/md-moshiur-rahaman-riat-ba7624319/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-slate-400 hover:text-blue-400 transition shadow-sm"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61573284586971"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook Profile"
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-600/50 rounded-xl text-slate-400 hover:text-blue-500 transition shadow-sm"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="mailto:m2devs.support@gmail.com"
                  aria-label="Email Direct"
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-slate-400 hover:text-emerald-400 transition shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Architectural Vision & Tech Stack */}
          <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                <BookOpen className="w-4 h-4" /> Architectural Philosophy & Vision
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display leading-snug">
                From Casual Key-Clicking to High-Performance Cognitive Muscle Memory
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
                As a Software Engineering researcher at <strong>Daffodil International University (DIU)</strong>, Md Moshiur Rahaman Riat recognized a severe technological void in existing typing tools. Most platforms treat typing as casual flash games, ignoring the sub-millisecond tactile rhythms, finger-specific muscle fatigue, and deterministic synchronization required for real developer mastery.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed font-sans">
                Riat designed FigTyp as a modular, low-latency ecosystem: marrying real-time WebSocket contest lobbies, neural typing biometrics, tamper-proof diploma verification, and an autonomous Control Management Unit into a clean, modern SaaS engine.
              </p>
            </div>

            {/* Tech Stack Chips */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="uppercase tracking-wider font-semibold text-slate-300">Core Engineering Stack</span>
                <span className="text-[10px] text-cyan-400">Production Tested</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-mono hover:border-cyan-500/40 hover:text-cyan-300 transition"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 3. Platform Partner Showcase: M-Square Devs Group */}
      <div className="relative bg-slate-900/70 border border-slate-800 rounded-3xl p-8 sm:p-10 overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-[260px_1fr] gap-8 items-center">
          
          {/* Logo Showcase with Sleek Modern Frame */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner text-center">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-indigo-950 to-slate-900 border border-indigo-500/30 flex items-center justify-center p-4 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              {mSquareLogo ? (
                <img
                  src={mSquareLogo}
                  alt="M-Square Devs Group Logo"
                  className="w-full h-full object-contain drop-shadow"
                />
              ) : (
                <div className="text-center">
                  <span className="text-3xl font-extrabold font-display text-indigo-400">M²</span>
                  <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">Devs Group</span>
                </div>
              )}
            </div>
            
            <h4 className="text-lg font-bold text-white font-display">M-Square Devs Group</h4>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider mt-0.5">
              Platform Delivery Partner
            </span>
          </div>

          {/* Partner Scope and Engineering Mandate */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" /> Engineering & Delivery Consortium
            </div>
            <h3 className="text-2xl font-bold text-white font-display">
              Designing Immersive Interface Systems & Pedagogical Architecture
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              M-Square Devs Group serves as the strategic product delivery and interface architecture partner for FigTyp. The consortium engineered the modular curriculum hierarchy, dark aesthetic design tokens, and real-time audio-visual feedback pipelines that make practice sessions both motivating and laser-focused.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://msquaredevs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition hover:underline"
              >
                Visit msquaredevs.com <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-slate-700">|</span>
              <span className="text-xs font-mono text-slate-500">Dhaka, Bangladesh</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Core System Engineering Capabilities */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Built For Sub-Millisecond Speed & Mathematical Verifiability
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
          
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3 hover:border-cyan-500/30 transition">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Sub-5ms Kinetic WebSocket Engine</h4>
            <p className="text-slate-400 font-sans leading-relaxed text-xs">
              Synchronized multi-typist contest rooms powered by custom delta-compression events. Typists receive instant visual feedback without client-side prediction drift.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3 hover:border-purple-500/30 transition">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Tamper-Evident QR Diplomas</h4>
            <p className="text-slate-400 font-sans leading-relaxed text-xs">
              Every completed certification tier mints an immutable serial hash backed by MongoDB and instant verification URLs with downloadable high-res vector PDFs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3 hover:border-emerald-500/30 transition">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Cognitive Biometric Telemetry</h4>
            <p className="text-slate-400 font-sans leading-relaxed text-xs">
              Continuous keystroke interval analysis calculating finger error frequencies, burst speed decay curves, and tailored AI recommendations to break speed plateaus.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3 hover:border-teal-500/30 transition">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Autonomous Control Management Unit</h4>
            <p className="text-slate-400 font-sans leading-relaxed text-xs">
              Zero-downtime headless administration. Update curriculum, wordbanks, system notices, brand visual identities, and security audit logs on the fly.
            </p>
          </div>

        </div>
      </div>

      {/* 5. Timeline Landmarks with Clickable Expansions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl relative">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Code2 className="w-5 h-5 text-teal-400" /> Milestone Landmarks & Platform Evolution
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">Chronological log of FigTyp core engineering achievements</p>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800 text-[11px] font-mono">
            4 Key Milestones
          </span>
        </div>
        
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-purple-500 before:via-cyan-500 before:to-emerald-500">
          
          {timelineItems.map((item, index) => (
            <motion.div 
              key={index}
              className="relative flex items-start gap-5 group cursor-pointer"
              whileHover={{ x: 4 }}
              onClick={() => setExpandedTimeline(item)}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 ${colorMap[item.color].dot} shrink-0 group-hover:scale-125 transition-transform duration-300 mt-1`} />
              <div className={`bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 sm:p-6 flex-1 ${colorMap[item.color].hover} transition-all duration-200 shadow-md`}>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className={`text-[11px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${colorMap[item.color].pill}`}>
                    {item.date}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 group-hover:text-cyan-400 transition">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h4 className="font-bold text-white text-base sm:text-lg mb-1.5">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">{item.shortDescription}</p>
              </div>
            </motion.div>
          ))}

        </div>
      </div>

      {/* Expanded Timeline Modal */}
      <AnimatePresence>
        {expandedTimeline && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -15 }}
              className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative"
            >
              <button
                onClick={() => setExpandedTimeline(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-5">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase ${colorMap[expandedTimeline.color].badge}`}>
                  <Milestone className="w-3.5 h-3.5" />
                  {expandedTimeline.date}
                </div>

                <h3 className="text-2xl font-bold text-white font-display leading-snug">
                  {expandedTimeline.title}
                </h3>

                <p className="text-slate-300 text-sm leading-relaxed font-sans">
                  {expandedTimeline.shortDescription}
                </p>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2 font-bold">
                    Technical Specifications & Scope
                  </h4>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
                    {expandedTimeline.fullDescription}
                  </p>
                </div>

                <button
                  onClick={() => setExpandedTimeline(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition"
                >
                  Close Landmark Overview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}