import React from 'react';
import { Building2, Code2, Globe2, BookOpen, Milestone, ChevronRight } from 'lucide-react';

interface Props {
  websiteLogo?: string;
  founderPicture?: string;
  mSquareLogo?: string;
  miraCoreLogo?: string;
  founderPictureSize?: number;
}

export default function AboutCompany({ websiteLogo, founderPicture, mSquareLogo, miraCoreLogo, founderPictureSize = 64 }: Props) {
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
        
        <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 font-display tracking-tight leading-tight mb-6">
          FigTyp
        </h1>
        
        <p className="relative z-10 text-slate-400 text-sm md:text-base leading-relaxed max-w-3xl font-sans mb-10">
          FigTyp is built to make typing practice more measurable, more motivating, and more useful for learners, developers, and modern workplace skill growth.
        </p>

        <div className="relative z-10 flex flex-wrap justify-center gap-4 md:gap-8 font-mono text-xs text-slate-300">
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

      {/* 2. Company Descriptions (Bimodal Split Cards with Logos as Headings) */}
      <div className="grid lg:grid-cols-2 gap-6 relative z-10">
        
        {/* M-Square Card */}
        <div className="group relative bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
            <Building2 className="w-32 h-32 text-indigo-500" />
          </div>
          
          {/* Company Logo slot + Highlighted Name */}
          <div className="mb-4 flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/10">
              {mSquareLogo ? (
                <img src={mSquareLogo} alt="M-Square Devs Group logo" className="w-full h-full object-contain p-1.5 drop-shadow-lg" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl font-bold font-display text-indigo-400">M²</span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display leading-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-purple-400 drop-shadow-[0_0_18px_rgba(129,140,248,0.35)]">
              M-Square Devs Group
            </h2>
          </div>

          <p className="text-xs md:text-sm font-medium text-slate-400 mb-4 leading-snug relative z-10 uppercase tracking-wide">
            Designing immersive learning journeys with premium interface systems.
          </p>
          <div className="space-y-4 text-slate-400 text-sm leading-relaxed font-sans relative z-10">
            <p>
              M-Square Devs Group is the platform design and delivery partner for FigTyp, engineering the modular curriculum, user experience, and immersive course architecture that make the platform feel premium, motivating, and easy to adopt.
            </p>
            <p>
              Every lesson, visual system, and reward loop is shaped to support skill progression while preserving the polished look and feel of a modern developer learning arena.
            </p>
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
              <h3 className="relative z-10 text-xl font-bold text-white mb-1">Md Moshiur Rahaman Riat</h3>
              <p className="relative z-10 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Chief Architect</p>
              <div className="relative z-10 inline-flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-[10px] text-slate-400 font-mono">
                <Milestone className="w-3 h-3 text-purple-400" />
                Daffodil International University (DIU)
              </div>
          </div>

          <div className="md:w-3/5 p-10 md:p-12 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-6 pb-4 border-b border-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> The Vision & Foundation
            </h3>
            <div className="space-y-6 text-sm text-slate-300 font-sans leading-relaxed">
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

      {/* 4. Timeline Landmarks (Now Full Width since Brand Assets are removed) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl relative z-10">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-10 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-teal-400" /> Timeline Landmarks
        </h3>
        
        <div className="space-y-10 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-purple-500 before:via-cyan-500 before:to-emerald-500">
          
          {/* Timeline Item 1 */}
          <div className="relative flex items-start gap-6 group">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 bg-purple-500 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.4)] group-hover:scale-125 transition-transform duration-300" />
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex-1 group-hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider bg-purple-500/10 px-2 py-1 rounded">Feb 2025</div>
              </div>
              <h4 className="font-bold text-white text-base md:text-lg mb-2 flex items-center gap-2">
                M-Square Devs Group Began
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">The consortium started shaping immersive learning architecture and premium interface systems.</p>
            </div>
          </div>

          {/* Timeline Item 2 */}
          <div className="relative flex items-start gap-6 group">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 bg-cyan-500 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.4)] group-hover:scale-125 transition-transform duration-300" />
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex-1 group-hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider bg-cyan-500/10 px-2 py-1 rounded">Oct 2025</div>
              </div>
              <h4 className="font-bold text-white text-base md:text-lg mb-2 flex items-center gap-2">
                Platform Expansion
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">The product research arm advanced typing intelligence, certification systems, and cognitive workflow design.</p>
            </div>
          </div>

          {/* Timeline Item 3 */}
          <div className="relative flex items-start gap-6 group">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 bg-emerald-500 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)] group-hover:scale-125 transition-transform duration-300" />
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex-1 group-hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider bg-emerald-500/10 px-2 py-1 rounded">2026, Q4</div>
              </div>
              <h4 className="font-bold text-white text-base md:text-lg mb-2 flex items-center gap-2">
                Daffodil SWE Alliance
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">Moshiur Riat commences prototyping the FigTyp modular design specs.</p>
            </div>
          </div>

          {/* Timeline Item 4 */}
          <div className="relative flex items-start gap-6 group">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-slate-900 bg-teal-400 shrink-0 shadow-[0_0_10px_rgba(45,212,191,0.4)] group-hover:scale-125 transition-transform duration-300" />
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex-1 group-hover:border-teal-400/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-teal-400 uppercase font-bold tracking-wider bg-teal-500/10 px-2 py-1 rounded">2026</div>
              </div>
              <h4 className="font-bold text-white text-base md:text-lg mb-2 flex items-center gap-2">
                FigTyp Arena Launched
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">Officially entered commercial status offering global neural typist arenas.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}