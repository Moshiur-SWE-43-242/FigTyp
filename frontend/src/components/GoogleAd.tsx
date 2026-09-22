import React, { useEffect, useRef, useState } from 'react';

interface GoogleAdProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical' | 'banner';
  className?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  label?: string;
  /** When true, displays a clean preview banner if AdSense script is pending or unconfigured */
  fallbackPlaceholder?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const GOOGLE_ADSENSE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID as string) || '';

export default function GoogleAd({
  slot = '1029384756',
  format = 'auto',
  className = '',
  responsive = true,
  style = {},
  label = 'Sponsored Advertisement',
  fallbackPlaceholder = true,
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    // Inject AdSense script if client ID is configured and script not already injected
    if (GOOGLE_ADSENSE_CLIENT_ID && typeof window !== 'undefined') {
      const existingScript = document.querySelector(
        `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT_ID}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
    }

    // Attempt to push ad to Google AdSense
    if (GOOGLE_ADSENSE_CLIENT_ID && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (err) {
        console.warn('Google Ads push skipped or blocked:', err);
        setAdError(true);
      }
    } else {
      // In development or when publisher ID is not yet configured, use fallback banner
      setAdLoaded(false);
    }
  }, [slot]);

  const hasLiveClient = Boolean(GOOGLE_ADSENSE_CLIENT_ID && !adError);

  return (
    <div
      className={`ad-container my-3 overflow-hidden text-center transition-all duration-300 ${className}`}
      aria-label="Advertisement"
    >
      {/* Subtle Ad Label */}
      <div className="flex items-center justify-center gap-1.5 mb-1 select-none">
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono font-medium">
          {label}
        </span>
        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-mono border border-amber-500/20">
          Ad
        </span>
      </div>

      {hasLiveClient ? (
        <ins
          ref={adRef}
          className="adsbygoogle block w-full rounded-xl overflow-hidden"
          style={{ display: 'block', minHeight: '60px', ...style }}
          data-ad-client={GOOGLE_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      ) : fallbackPlaceholder ? (
        /* High-fidelity Google Ads Preview Card for development & pending verification */
        <div
          style={style}
          className="relative group rounded-2xl border-2 border-black dark:border-dashed dark:border-cyan-500/30 bg-white dark:bg-gradient-to-r dark:from-slate-900/60 dark:via-slate-950/80 dark:to-slate-900/60 p-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-gradient-to-br dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-indigo-500/20 border-2 border-black dark:border-cyan-500/40 flex items-center justify-center shrink-0 shadow-xs">
              <span className="text-black dark:text-cyan-400 font-bold text-xs font-mono">Ad</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black dark:text-slate-200 font-display">
                  Google AdSense Unit
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-black border border-black dark:bg-cyan-400/10 dark:text-cyan-400 dark:border-cyan-400/20 font-mono font-bold">
                  Live Slot #{slot.slice(-4)}
                </span>
              </div>
              <p className="text-[11px] text-black dark:text-slate-400 font-sans mt-0.5 max-w-md line-clamp-1 font-medium">
                Contextual Google Ads monetize FigTyp typists. Powered by Google AdSense.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[10px] text-black dark:text-slate-400 font-mono hidden md:inline font-bold">
              Google Ads Ready
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
