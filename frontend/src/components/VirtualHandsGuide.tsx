import React from 'react';
import { motion } from 'motion/react';

interface Props {
  targetKey?: string;
  className?: string;
}

export type FingerName = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'thumb' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky';

export const getFingerForKey = (key?: string): { finger: FingerName; hand: 'left' | 'right' | 'thumb'; label: string; color: string } => {
  if (!key) {
    return { finger: 'thumb', hand: 'thumb', label: 'Rest Position', color: '#64748b' };
  }

  const k = key.toLowerCase();

  // Spacebar -> Thumbs
  if (k === ' ' || k === 'space' || k === 'spacebar') {
    return { finger: 'thumb', hand: 'thumb', label: 'Thumb (Space)', color: '#f59e0b' };
  }

  // Left Pinky: q, a, z, 1, `, ~, !, @, shift, tab
  if (['q', 'a', 'z', '1', '`', '~', '!', 'tab', 'capslock'].includes(k)) {
    return { finger: 'left-pinky', hand: 'left', label: 'Left Pinky', color: '#ec4899' };
  }

  // Left Ring: w, s, x, 2, @
  if (['w', 's', 'x', '2', '@'].includes(k)) {
    return { finger: 'left-ring', hand: 'left', label: 'Left Ring', color: '#a855f7' };
  }

  // Left Middle: e, d, c, 3, #
  if (['e', 'd', 'c', '3', '#'].includes(k)) {
    return { finger: 'left-middle', hand: 'left', label: 'Left Middle', color: '#0ea5e9' };
  }

  // Left Index: r, t, f, g, v, b, 4, 5, $, %
  if (['r', 't', 'f', 'g', 'v', 'b', '4', '5', '$', '%'].includes(k)) {
    return { finger: 'left-index', hand: 'left', label: 'Left Index', color: '#10b981' };
  }

  // Right Index: y, u, h, j, n, m, 6, 7, ^, &
  if (['y', 'u', 'h', 'j', 'n', 'm', '6', '7', '^', '&'].includes(k)) {
    return { finger: 'right-index', hand: 'right', label: 'Right Index', color: '#10b981' };
  }

  // Right Middle: i, k, ,, <, 8, *
  if (['i', 'k', ',', '<', '8', '*'].includes(k)) {
    return { finger: 'right-middle', hand: 'right', label: 'Right Middle', color: '#0ea5e9' };
  }

  // Right Ring: o, l, ., >, 9, (
  if (['o', 'l', '.', '>', '9', '('].includes(k)) {
    return { finger: 'right-ring', hand: 'right', label: 'Right Ring', color: '#a855f7' };
  }

  // Right Pinky: p, ;, :, /, ?, ', ", [, ], {, }, -, _, =, +, 0, )
  return { finger: 'right-pinky', hand: 'right', label: 'Right Pinky', color: '#ec4899' };
};

export default function VirtualHandsGuide({ targetKey, className = '' }: Props) {
  const fingerInfo = getFingerForKey(targetKey);

  const isHighlighted = (f: FingerName) => fingerInfo.finger === f;

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-slate-950/60 border-2 border-black dark:border-slate-800/80 font-mono text-xs select-none text-black dark:text-white shadow-sm ${className}`}>
      
      {/* Target indicator banner */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-black dark:text-slate-400 font-bold">Touch Typing Guidance:</span>
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold shadow-sm transition-all duration-150 border-2"
            style={{ backgroundColor: `${fingerInfo.color}20`, color: fingerInfo.color, borderColor: `${fingerInfo.color}` }}
          >
            {fingerInfo.label} &bull; Key: [{targetKey === ' ' ? 'SPACE' : (targetKey || '—').toUpperCase()}]
          </span>
        </div>
        <span className="text-[9px] text-black/60 dark:text-slate-500 uppercase font-bold">TypingClub &reg; Virtual Hands</span>
      </div>

      {/* Interactive Left & Right Hands Display */}
      <div className="flex items-center justify-center gap-8 md:gap-16 py-2">
        
        {/* LEFT HAND */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-black dark:text-slate-400 font-bold uppercase tracking-wider">Left Hand</span>
          <div className="flex items-end gap-1.5 h-20 p-2 rounded-xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800/90 shadow-inner">
            
            {/* Left Pinky */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-pink-500 font-bold">A</span>
              <div
                className={`w-4 h-12 rounded-t-full transition-all duration-200 ${
                  isHighlighted('left-pinky')
                    ? 'bg-pink-500 shadow-[0_0_15px_#ec4899] scale-105'
                    : 'bg-pink-100 dark:bg-pink-950/40 border border-pink-500/50'
                }`}
              />
            </div>

            {/* Left Ring */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-purple-500 font-bold">S</span>
              <div
                className={`w-4 h-14 rounded-t-full transition-all duration-200 ${
                  isHighlighted('left-ring')
                    ? 'bg-purple-500 shadow-[0_0_15px_#a855f7] scale-105'
                    : 'bg-purple-100 dark:bg-purple-950/40 border border-purple-500/50'
                }`}
              />
            </div>

            {/* Left Middle */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-sky-500 font-bold">D</span>
              <div
                className={`w-4 h-16 rounded-t-full transition-all duration-200 ${
                  isHighlighted('left-middle')
                    ? 'bg-sky-500 shadow-[0_0_15px_#0ea5e9] scale-105'
                    : 'bg-sky-100 dark:bg-sky-950/40 border border-sky-500/50'
                }`}
              />
            </div>

            {/* Left Index */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-emerald-600 font-bold">F</span>
              <div
                className={`w-4 h-14 rounded-t-full transition-all duration-200 ${
                  isHighlighted('left-index')
                    ? 'bg-emerald-500 shadow-[0_0_15px_#10b981] scale-105'
                    : 'bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-500/50'
                }`}
              />
            </div>

            {/* Left Thumb */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-amber-500 font-bold">_</span>
              <div
                className={`w-4 h-9 rounded-t-full transition-all duration-200 ${
                  isHighlighted('thumb')
                    ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b] scale-105'
                    : 'bg-amber-100 dark:bg-amber-950/40 border border-amber-500/50'
                }`}
              />
            </div>

          </div>
        </div>

        {/* RIGHT HAND */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-black dark:text-slate-400 font-bold uppercase tracking-wider">Right Hand</span>
          <div className="flex items-end gap-1.5 h-20 p-2 rounded-xl bg-white dark:bg-slate-900/60 border-2 border-black dark:border-slate-800/90 shadow-inner">
            
            {/* Right Thumb */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-amber-500 font-bold">_</span>
              <div
                className={`w-4 h-9 rounded-t-full transition-all duration-200 ${
                  isHighlighted('thumb')
                    ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b] scale-105'
                    : 'bg-amber-100 dark:bg-amber-950/40 border border-amber-500/50'
                }`}
              />
            </div>

            {/* Right Index */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-emerald-600 font-bold">J</span>
              <div
                className={`w-4 h-14 rounded-t-full transition-all duration-200 ${
                  isHighlighted('right-index')
                    ? 'bg-emerald-500 shadow-[0_0_15px_#10b981] scale-105'
                    : 'bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-500/50'
                }`}
              />
            </div>

            {/* Right Middle */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-sky-500 font-bold">K</span>
              <div
                className={`w-4 h-16 rounded-t-full transition-all duration-200 ${
                  isHighlighted('right-middle')
                    ? 'bg-sky-500 shadow-[0_0_15px_#0ea5e9] scale-105'
                    : 'bg-sky-100 dark:bg-sky-950/40 border border-sky-500/50'
                }`}
              />
            </div>

            {/* Right Ring */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-purple-500 font-bold">L</span>
              <div
                className={`w-4 h-14 rounded-t-full transition-all duration-200 ${
                  isHighlighted('right-ring')
                    ? 'bg-purple-500 shadow-[0_0_15px_#a855f7] scale-105'
                    : 'bg-purple-100 dark:bg-purple-950/40 border border-purple-500/50'
                }`}
              />
            </div>

            {/* Right Pinky */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-pink-500 font-bold">;</span>
              <div
                className={`w-4 h-12 rounded-t-full transition-all duration-200 ${
                  isHighlighted('right-pinky')
                    ? 'bg-pink-500 shadow-[0_0_15px_#ec4899] scale-105'
                    : 'bg-pink-100 dark:bg-pink-950/40 border border-pink-500/50'
                }`}
              />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
