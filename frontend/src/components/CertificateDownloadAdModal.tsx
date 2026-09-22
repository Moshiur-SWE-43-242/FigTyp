import React, { useState, useEffect } from 'react';
import { Award, Download, X, Clock, CheckCircle } from 'lucide-react';
import GoogleAd from './GoogleAd';
import { Certificate } from '../types';

interface Props {
  certificate: Certificate;
  isOpen: boolean;
  onProceedDownload: () => void;
  onClose: () => void;
}

export default function CertificateDownloadAdModal({
  certificate,
  isOpen,
  onProceedDownload,
  onClose,
}: Props) {
  const [countdown, setCountdown] = useState(3);
  const [canDownload, setCanDownload] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setCanDownload(false);
      return;
    }

    setCountdown(3);
    setCanDownload(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanDownload(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-download-title"
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,243,255,0.2)] text-white text-center guest-restriction-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          aria-label="Cancel download"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Badge */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.25)]">
            <Award className="w-7 h-7 text-cyan-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono uppercase tracking-wider font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Certificate Ready for Export</span>
        </div>

        <h2 id="cert-download-title" className="text-lg sm:text-xl font-bold font-display text-white mb-1">
          Sponsored Certificate Download
        </h2>
        <p className="text-slate-300 text-xs leading-relaxed mb-4">
          Preparing high-resolution PDF for <strong className="text-cyan-400">{certificate.fullName}</strong> ({certificate.wpm} WPM • {certificate.accuracy}% Acc). Supported by our partners.
        </p>

        {/* GOOGLE AD UNIT */}
        <div className="my-3 p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <GoogleAd
            slot="4499221100"
            format="rectangle"
            label="Google Sponsor Advertisement"
            className="my-1"
          />
        </div>

        {/* Action Button & Timer */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onProceedDownload();
              onClose();
            }}
            className={`flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer hover:brightness-110`}
          >
            {canDownload ? (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF Now</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Download ready in {countdown}s...</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
