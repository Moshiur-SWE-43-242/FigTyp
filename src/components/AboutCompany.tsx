import React, { useState, useEffect } from 'react';
import { Building2, Code2, Globe2, BookOpen, Milestone, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function AboutCompany({ websiteLogo, founderPicture, mSquareLogo, miraCoreLogo, founderPictureSize = 64 }: Props) {
  const { content: cmsTimeline } = useCMSContent('timeline');
  const [expandedTimeline, setExpandedTimeline] = useState<TimelineItem | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
    {
      date: 'Feb 2025',
      title: 'M-Square Devs Group Began',
      shortDescription: 'The consortium started shaping immersive learning architecture and premium interface systems.',
      fullDescription: 'The M-Square Devs Group consortium was formally established to architect and deliver FigTyp\'s immersive learning ecosystem. The team focused on designing modular curriculum architecture, premium user interfaces, and comprehensive learning pathways that prioritize both engagement and educational rigor.',
      color: 'purple'
    },
    {
      date: 'Oct 2025',
      title: 'Platform Expansion',
      shortDescription: 'The product research arm advanced typing intelligence, certification systems, and cognitive workflow design.',
      fullDescription: 'Platform expansion phase saw significant advancement in typing intelligence algorithms, real-time analytics engines, and professional certification systems. The team integrated cognitive workflow design patterns to maximize skill retention and performance tracking capabilities.',
      color: 'cyan'
    },
    {
      date: '2026, Q4',
      title: 'Daffodil SWE Alliance',
      shortDescription: 'Moshiur Riat commences prototyping the FigTyp modular design specs.',
      fullDescription: 'A strategic alliance was formed with Daffodil International University to prototype and validate FigTyp\'s modular design specifications. This collaboration brought academic rigor and engineering excellence to the platform\'s core architecture, ensuring scalability and reliability.',
      color: 'emerald'
    },
    {
      date: '2026',
      title: 'FigTyp Arena Launched',
      shortDescription: 'Officially entered commercial status offering global neural typist arenas.',
      fullDescription: 'FigTyp Arena officially launched as a commercial platform, introducing competitive typing arenas with real-time multiplayer capabilities, professional-grade performance analytics, and certification programs for global users seeking to master typing as a core professional skill.',
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
      dot: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
      hover: 'hover:border-purple-500/30 group-hover:text-purple-400',
      badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      pill: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    },
    cyan: {
      dot: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      hover: 'hover:border-cyan-500/30 group-hover:text-cyan-400',
      badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      pill: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    },
    emerald: {
      dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
      hover: 'hover:border-emerald-500/30 group-hover:text-emerald-400',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    teal: {
      dot: 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.4)]',
      hover: 'hover:border-teal-400/30 group-hover:text-teal-400',
      badge: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      pill: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
    }
  };
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20 px-4 sm:px-6">
      
      {/* 1. Hero Section (Centered & Glowing) */}
      <div className="relative flex flex-col items-center text-center pt-16 pb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 mb-4 flex items-center justify-center">
          {websiteLogo ? (
            <img
              src={websiteLogo}
              alt="FigTyp logo"
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-2xl border border-slate-700 bg-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.15)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center font-display font-black text-white text-xl shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              FT
            </div>
          )}
        </div>
        
        <span className="relative z-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase font-mono shadow-[0_0_15px_rgba(59,130,246,0.1)] mb-8">
          Platform Vision
        </span>
        
        <h1 className="relative z-10 text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 font-display tracking-tight leading-tight mb-6">
          FigTyp
        </h1>
        
        <p className="relative z-10 text-slate-400 text-base md:text-lg leading-relaxed max-w-3xl font-sans mb-10">
          FigTyp is built to make typing practice more measurable, more motivating, and more useful for learners, developers, and modern workplace skill growth.
        </p>

        <div className="relative z-10 flex flex-wrap justify-center gap-4 md:gap-8 font-mono text-sm text-slate-300">
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Practice First</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Performance Engine</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800">
            <Globe2 className="w-4 h-4 text-teal-400" />
            <span>Global Learning Arena</span>
          </div>
        </div>
      </div>

      {/* 2. Company Descriptions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-[26px] overflow-hidden shadow-[0_0_0_1px_rgba(54,84,126,0.45)] relative z-10">
        <div className="grid md:grid-cols-[1.05fr_1fr] gap-8 md:gap-10 p-6 md:p-8 lg:p-10 xl:p-12 items-center">
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-[290px] h-[290px] md:w-[330px] md:h-[330px] rounded-full border-[3px] border-indigo-400/80 bg-[radial-gradient(circle,_rgba(99,102,241,0.18),_rgba(30,41,59,0.2)_58%,_rgba(15,23,42,0.1)_100%)] shadow-[0_0_28px_rgba(129,140,248,0.42)]">
              <div className="absolute inset-[18px] rounded-full border border-indigo-300/50 bg-slate-950/80" />
              <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-[26px] bg-slate-950/90 border border-slate-700 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(24,29,50,0.9)]">
                {mSquareLogo ? (
                  <img src={mSquareLogo} alt="M-Square Devs Group logo" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-indigo-300">
                    <span className="text-5xl md:text-6xl font-bold font-display leading-none">M</span>
                    <span className="text-[10px] md:text-[11px] tracking-[0.22em] uppercase font-mono">M-SQUARE DEVS</span>
                  </div>
                )}
              </div>
            </div>

            <h2 className="mt-7 text-4xl md:text-5xl lg:text-[4rem] font-extrabold leading-[0.9] font-display text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-300 to-purple-400 text-center">
              M-Square Devs
              <span className="block">Group</span>
            </h2>
          </div>

          <div className="space-y-6 md:space-y-7">
            <div className="text-[11px] md:text-[12px] font-mono tracking-[0.22em] uppercase text-slate-200 font-bold opacity-90">
              Designing immersive learning journeys with premium interface systems.
            </div>

            <div className="space-y-5 text-[17px] md:text-[18px] text-slate-300 leading-relaxed font-sans">
              <p>
                M-Square Devs Group is the platform design and delivery partner for FigTyp, engineering the modular curriculum, user experience, and immersive course architecture that make the platform feel premium, motivating, and easy to adopt.
              </p>
              <p>
                Every lesson, visual system, and reward loop is shaped to support skill progression while preserving the polished look and feel of a modern developer learning arena.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Founder Profile (ID Card Style) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <div className="flex flex-col md:flex-row">
          
          <div className="md:w-2/5 p-10 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/40 via-transparent to-transparent" />
             {founderPicture ? (
                <div className="relative z-10 rounded-full p-2 bg-gradient-to-tr from-purple-500 to-cyan-500 mb-6 shadow-2xl">
                  <img
                    src={founderPicture}
                    alt="Founder"
                    style={{
                      width: Math.max(176, founderPictureSize),
                      height: Math.max(176, founderPictureSize)
                    }}
                    className="object-cover rounded-full border-4 border-slate-950 bg-slate-900"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-full border-4 border-slate-800 bg-slate-900 flex items-center justify-center mb-6 relative z-10">
                  <Milestone className="w-14 h-14 text-slate-600" />
                </div>
              )}
              <h3 className="relative z-10 text-2xl font-bold text-white mb-1">Md Moshiur Rahaman Riat</h3>
              <p className="relative z-10 text-sm font-mono text-cyan-400 uppercase tracking-widest mb-3 font-semibold">Chief Architect</p>
              <div className="relative z-10 inline-flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-400 font-mono font-semibold">
                <Milestone className="w-3 h-3 text-purple-400" />
                Daffodil International University (DIU)
              </div>
          </div>

          <div className="md:w-3/5 p-10 md:p-12 flex flex-col justify-center">
            <h3 className="text-base font-bold text-white uppercase tracking-widest font-mono mb-6 pb-4 border-b border-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" /> The Vision & Foundation
            </h3>
            <div className="space-y-6 text-base text-slate-300 font-sans leading-relaxed">
              <p>
                As a dedicated Software Engineering student at <strong>Daffodil International University</strong>, Md Moshiur Rahaman Riat recognized a severe technological disparity. Typing platforms routinely treated kinetic mechanics as simple casual games, completely neglecting the complex neural pipelines, cognitive muscle memory, and professional certification needs of developers and clerical officers.
              </p>
              <p>
                Based on a product-first vision, Riat designed the core FigTyp multi-layered engine. The concept blends low-latency gaming infrastructure, real-time analytics, and standard examination procedures into a single cohesive SaaS platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Timeline Landmarks with Clickable Descriptions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl relative z-10">
        <h3 className="text-base font-bold text-white uppercase tracking-widest font-mono mb-10 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-teal-400" /> Timeline Landmarks
        </h3>
        
        <div className="space-y-10 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-purple-500 before:via-cyan-500 before:to-emerald-500">
          
          {timelineItems.map((item, index) => (
            <motion.div 
              key={index}
              className="relative flex items-start gap-6 group cursor-pointer"
              whileHover={{ x: 4 }}
              onClick={() => setExpandedTimeline(item)}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 ${colorMap[item.color].dot} shrink-0 group-hover:scale-125 transition-transform duration-300`} />
              <div className={`bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex-1 ${colorMap[item.color].hover} transition-colors`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-[11px] font-mono uppercase font-bold tracking-wider px-2 py-1.5 rounded border ${colorMap[item.color].pill}`}>
                    {item.date}
                  </div>
                </div>
                <h4 className="font-bold text-white text-lg md:text-xl mb-2 flex items-center gap-2">
                  {item.title}
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-inherit group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-base text-slate-400 leading-relaxed max-w-3xl">{item.shortDescription}</p>
                <div className="mt-3 text-[12px] text-cyan-400/70 font-mono">Click to expand →</div>
              </div>
            </motion.div>
          ))}

        </div>
      </div>

      {/* Expanded Timeline Modal */}
      <AnimatePresence>
        {expandedTimeline && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 w-screen h-screen overflow-hidden" style={{ pointerEvents: 'auto' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(0,243,255,0.1)] relative z-[10000]"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setExpandedTimeline(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition z-10"
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="space-y-6">
                {/* Date Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-mono font-bold tracking-wider uppercase ${colorMap[expandedTimeline.color].badge}`}>
                  <Milestone className="w-3.5 h-3.5" />
                  {expandedTimeline.date}
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-white font-display leading-tight">
                  {expandedTimeline.title}
                </h3>

                {/* Short Description */}
                <p className="text-slate-300 text-base leading-relaxed font-medium">
                  {expandedTimeline.shortDescription}
                </p>

                {/* Full Description */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                  <h4 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-3 font-bold">Detailed Overview</h4>
                  <p className="text-slate-400 text-base leading-relaxed font-sans">
                    {expandedTimeline.fullDescription}
                  </p>
                </div>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedTimeline(null)}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold transition"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}