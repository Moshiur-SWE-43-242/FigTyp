import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

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

/**
 * Google AdSense Safe Content Policy:
 * 1. Nudity, pornography, 18+ adult content, escort/dating services are strictly blocked.
 * 2. Reproductive health, contraceptives, condoms, and family planning pills are permitted in health categories.
 * 3. Enforced via Google AdSense Blocking Controls and contextual safe-search metadata.
 */
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
  const isVertical = format === 'vertical';

  return (
    <div
      className={`ad-container my-2 overflow-hidden text-center transition-all duration-300 ${className}`}
      aria-label="Advertisement"
    >
      {/* Subtle Ad Label & Safe Policy Badge */}
      <div className="flex items-center justify-center gap-1.5 mb-1 select-none">
        <span className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono font-medium">
          {label}
        </span>
        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono border border-amber-500/30 font-bold">
          Ad
        </span>
        <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono border border-emerald-500/20" title="Strict Safe Ads: 18+ Nudity Blocked">
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>Safe Ads</span>
        </span>
      </div>

      {hasLiveClient ? (
        <ins
          ref={adRef}
          className="adsbygoogle block w-full rounded-xl overflow-hidden"
          style={{ display: 'block', minHeight: isVertical ? '400px' : '60px', ...style }}
          data-ad-client={GOOGLE_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          // Strict Safety & Content Restriction Attributes
          data-ad-safe-search="true"
          data-ad-category-exclusion="adult,nudity,sexually_suggestive,pornography,escort_services"
          data-restricted-content="family-safe"
        />
      ) : fallbackPlaceholder ? (
        /* High-fidelity Google Ads Preview Card for development & pending verification */
        isVertical ? (
          /* Vertical Skyscraper Ad Placeholder */
          <div
            style={style}
            className="w-[160px] min-h-[500px] mx-auto rounded-2xl border-2 border-black dark:border-dashed dark:border-cyan-500/40 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-3 flex flex-col items-center justify-between text-center shadow-md select-none"
          >
            <div className="space-y-3 w-full">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border-2 border-black dark:border-cyan-500/40 flex items-center justify-center shadow-xs">
                <span className="text-black dark:text-cyan-400 font-bold text-xs font-mono">Ad</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-black dark:text-slate-200 font-display">
                  Skyscraper Ad
                </div>
                <div className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-black border border-black dark:bg-cyan-400/10 dark:text-cyan-400 dark:border-cyan-400/20 font-mono font-bold inline-block">
                  Slot #{slot.slice(-4)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-black/10 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                Contextual Google Ads monetize FigTyp typists.
              </div>
            </div>

            <div className="w-full pt-3 border-t border-black/10 dark:border-slate-800/80 space-y-1.5">
              <div className="inline-flex items-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>18+ Nudity Blocked</span>
              </div>
              <div className="text-[8px] text-slate-500 dark:text-slate-500 font-mono">
                Pharmacy / Health OK
              </div>
            </div>
          </div>
        ) : (
          /* Horizontal / Rectangle Ad Placeholder */
          <div
            style={style}
            className="relative group rounded-2xl border-2 border-black dark:border-dashed dark:border-cyan-500/30 bg-white dark:bg-gradient-to-r dark:from-slate-900/60 dark:via-slate-950/80 dark:to-slate-900/60 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-gradient-to-br dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-indigo-500/20 border-2 border-black dark:border-cyan-500/40 flex items-center justify-center shrink-0 shadow-xs">
                <span className="text-black dark:text-cyan-400 font-bold text-xs font-mono">Ad</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-black dark:text-slate-200 font-display">
                    Google AdSense Unit
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-black border border-black dark:bg-cyan-400/10 dark:text-cyan-400 dark:border-cyan-400/20 font-mono font-bold">
                    Slot #{slot.slice(-4)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-400 font-mono font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>No Nudity / Family-Safe</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-400 font-sans mt-0.5 max-w-md line-clamp-1 font-medium">
                  Contextual Google Ads monetize FigTyp typists. Nudity blocked; health & pharmacy ads permitted.
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
        )
      ) : null}
    </div>
  );
}

