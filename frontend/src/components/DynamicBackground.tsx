import React, { useMemo } from 'react';

interface DynamicBackgroundProps {
  activeTab?: string;
  theme?: 'dark' | 'light';
  pointer?: { x: number; y: number };
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  activeTab = 'PRACTICE',
  theme = 'dark',
  pointer = { x: 50, y: 50 },
}) => {
  // Only render on dark mode
  if (theme === 'light') {
    return null;
  }

  const sceneType: 'space' | 'keyboard' | 'spaceship-robot' = useMemo(() => {
    if (activeTab === 'TRAINING' || activeTab === 'MULTIPLAYER') {
      return 'keyboard';
    }
    if (activeTab === 'ABOUT') {
      return 'spaceship-robot';
    }
    return 'space';
  }, [activeTab]);

  // Generate deterministic stars for space / spaceship scenes
  const stars = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        x: ((i * 29.3) % 100) + 1,
        y: ((i * 37.7) % 100) + 1,
        size: (i % 3) + 1,
        opacity: 0.15 + ((i * 7) % 25) / 100,
        duration: 3 + ((i * 5) % 6),
        delay: (i % 5) * 0.6,
        color: i % 3 === 0 ? '#00F3FF' : i % 3 === 1 ? '#8B5CF6' : '#FFFFFF',
      })),
    []
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none transition-opacity duration-700"
      aria-hidden="true"
      style={{
        opacity: 0.16,
      }}
    >
      {/* SCENE 1: SPACE (Home & Practice) */}
      {sceneType === 'space' && (
        <div className="absolute inset-0">
          {/* Ambient Glows */}
          <div
            className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[110px] bg-gradient-to-br from-cyan-600/30 to-blue-700/10 animate-pulse"
            style={{ animationDuration: '8s' }}
          />
          <div
            className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[120px] bg-gradient-to-bl from-purple-700/25 to-pink-600/10 animate-pulse"
            style={{ animationDuration: '11s' }}
          />
          <div className="absolute -bottom-[20%] left-[25%] w-[60vw] h-[60vw] rounded-full blur-[140px] bg-gradient-to-t from-cyan-500/20 to-transparent" />

          {/* Perspective Star Grid */}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,#000_60%,transparent_100%)]"
            style={{
              transform: `perspective(1000px) rotateX(25deg) translateY(${pointer.y * 0.08}px)`,
              transformOrigin: 'center bottom',
            }}
          />

          {/* Twinkling Space Stars */}
          {stars.map((star) => (
            <span
              key={star.id}
              className="absolute rounded-full animate-ping"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                opacity: star.opacity,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}

          {/* Shooting Stars */}
          <div className="shooting-star shooting-star-1" />
          <div className="shooting-star shooting-star-2" />
        </div>
      )}

      {/* SCENE 2: KEYBOARD MATRIX (Course & Race) */}
      {sceneType === 'keyboard' && (
        <div className="absolute inset-0">
          {/* Cyber Digital Glow */}
          <div className="absolute -top-[10%] left-[20%] w-[60vw] h-[40vw] rounded-full blur-[130px] bg-cyan-600/20" />
          <div className="absolute -bottom-[15%] right-[10%] w-[55vw] h-[45vw] rounded-full blur-[140px] bg-indigo-600/25" />

          {/* Floating Keycaps Matrix */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-6 p-8 opacity-75">
            {[
              { key: 'ESC', x: 8, y: 15, delay: 0 },
              { key: 'TAB', x: 22, y: 28, delay: 1.5 },
              { key: 'Q', x: 38, y: 18, delay: 3.2 },
              { key: 'W', x: 52, y: 24, delay: 0.8 },
              { key: 'E', x: 68, y: 16, delay: 2.1 },
              { key: 'R', x: 84, y: 22, delay: 4.0 },
              { key: 'A', x: 14, y: 46, delay: 1.2 },
              { key: 'S', x: 30, y: 52, delay: 2.8 },
              { key: 'D', x: 48, y: 44, delay: 0.5 },
              { key: 'F', x: 64, y: 50, delay: 3.6 },
              { key: 'J', x: 78, y: 45, delay: 1.9 },
              { key: 'K', x: 90, y: 55, delay: 2.4 },
              { key: 'SHIFT', x: 10, y: 74, delay: 0.9 },
              { key: 'SPACE', x: 42, y: 78, delay: 2.5, wide: true },
              { key: 'ENTER', x: 76, y: 75, delay: 1.7 },
              { key: '⌘', x: 26, y: 76, delay: 3.1 },
              { key: '⚡', x: 88, y: 78, delay: 0.3 },
            ].map((k, idx) => (
              <div
                key={idx}
                className="absolute flex items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-900/60 shadow-[0_0_15px_rgba(0,243,255,0.12)] backdrop-blur-sm animate-float-key"
                style={{
                  left: `${k.x}%`,
                  top: `${k.y}%`,
                  width: k.wide ? '120px' : '52px',
                  height: '48px',
                  animationDelay: `${k.delay}s`,
                  animationDuration: '6s',
                }}
              >
                <span className="font-mono text-xs font-bold text-cyan-300/80 tracking-widest">
                  {k.key}
                </span>
                <span className="absolute -bottom-1 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
              </div>
            ))}
          </div>

          {/* Matrix Circuit Lines */}
          <svg className="absolute inset-0 w-full h-full stroke-cyan-500/15" fill="none">
            <line x1="0" y1="20%" x2="100%" y2="20%" strokeDasharray="12 12" />
            <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="16 16" />
            <line x1="0" y1="80%" x2="100%" y2="80%" strokeDasharray="8 8" />
            <line x1="25%" y1="0" x2="25%" y2="100%" strokeDasharray="10 10" />
            <line x1="75%" y1="0" x2="75%" y2="100%" strokeDasharray="14 14" />
          </svg>
        </div>
      )}

      {/* SCENE 3: SPACESHIP & ROBOT (About Page) */}
      {sceneType === 'spaceship-robot' && (
        <div className="absolute inset-0">
          {/* Deep Space Background for About */}
          <div className="absolute top-[10%] left-[10%] w-[45vw] h-[45vw] rounded-full blur-[140px] bg-violet-600/20" />
          <div className="absolute bottom-[10%] right-[15%] w-[50vw] h-[50vw] rounded-full blur-[130px] bg-cyan-600/20" />

          {/* Twinkling Stars */}
          {stars.map((star) => (
            <span
              key={star.id}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                opacity: star.opacity * 1.2,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}

          {/* Cruising Spaceship with Thruster Beam */}
          <div className="absolute cruising-spaceship top-[16%] left-0">
            <div className="relative flex items-center">
              {/* Thruster exhaust beam */}
              <div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-cyan-400/80 to-cyan-300 rounded-full blur-[1px] animate-pulse" />
              {/* Spaceship Silhouette SVG */}
              <svg
                width="64"
                height="32"
                viewBox="0 0 64 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_12px_rgba(0,243,255,0.7)]"
              >
                {/* Hull */}
                <path
                  d="M4 16 L22 8 L54 13 L62 16 L54 19 L22 24 Z"
                  fill="#0E1726"
                  stroke="#00F3FF"
                  strokeWidth="1.5"
                />
                {/* Cockpit canopy */}
                <ellipse cx="38" cy="16" rx="9" ry="3.5" fill="#00F3FF" fillOpacity="0.75" />
                {/* Wing fin top */}
                <path d="M22 8 L14 1 L28 8 Z" fill="#8B5CF6" stroke="#00F3FF" strokeWidth="0.8" />
                {/* Wing fin bottom */}
                <path d="M22 24 L14 31 L28 24 Z" fill="#8B5CF6" stroke="#00F3FF" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* Floating Companion Robot / Droid on the right side */}
          <div className="absolute floating-robot right-[8%] top-[38%]">
            <div className="relative flex flex-col items-center">
              {/* Robot SVG */}
              <svg
                width="72"
                height="80"
                viewBox="0 0 72 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
              >
                {/* Antenna */}
                <line x1="36" y1="12" x2="36" y2="4" stroke="#00F3FF" strokeWidth="2" strokeLinecap="round" />
                <circle cx="36" cy="3" r="3" fill="#00F3FF" className="animate-ping" style={{ transformOrigin: '36px 3px' }} />
                
                {/* Head */}
                <rect x="20" y="12" width="32" height="24" rx="8" fill="#0F172A" stroke="#00F3FF" strokeWidth="1.5" />
                {/* Visor / Eye display */}
                <rect x="25" y="18" width="22" height="10" rx="4" fill="#030712" />
                <ellipse cx="31" cy="23" rx="3" ry="2.5" fill="#00F3FF" />
                <ellipse cx="41" cy="23" rx="3" ry="2.5" fill="#00F3FF" />

                {/* Neck connector */}
                <rect x="33" y="36" width="6" height="4" fill="#8B5CF6" />

                {/* Torso */}
                <path
                  d="M18 40 H54 L49 64 H23 L18 40 Z"
                  fill="#0F172A"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                />
                {/* Core power reactor */}
                <circle cx="36" cy="51" r="5" fill="#00F3FF" fillOpacity="0.8" className="animate-pulse" />

                {/* Arms */}
                <path d="M16 44 L8 54 L12 56" stroke="#00F3FF" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M56 44 L64 54 L60 56" stroke="#00F3FF" strokeWidth="1.5" strokeLinecap="round" />

                {/* Thruster Ring Glow */}
                <ellipse cx="36" cy="67" rx="10" ry="3" fill="#8B5CF6" fillOpacity="0.6" />
                <path d="M30 68 L36 78 L42 68" fill="#00F3FF" fillOpacity="0.7" className="animate-pulse" />
              </svg>
              {/* Hologram ring below droid */}
              <div className="w-16 h-2 rounded-full border border-cyan-400/40 blur-[1px] animate-pulse -mt-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicBackground;
