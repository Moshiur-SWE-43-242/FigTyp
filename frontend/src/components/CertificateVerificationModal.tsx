import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, CheckCircle2, AlertTriangle, Printer, ExternalLink, Award, Calendar, Hash, User, Building } from 'lucide-react';
import { API_URL } from '../config';

import { Certificate } from '../types';

interface Props {
  certId: string;
  onClose: () => void;
  onViewDiploma?: (cert: Certificate) => void;
}

export default function CertificateVerificationModal({ certId, onClose, onViewDiploma }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certData, setCertData] = useState<any | null>(null);

  useEffect(() => {
    if (!certId) return;
    fetchVerification();
  }, [certId]);

  const fetchVerification = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/certificates/verify/${certId}`);
      const data = await res.json();
      if (res.ok && data.certificate) {
        setCertData(data.certificate);
      } else {
        setError(data.error || 'Certificate record not found in official registry.');
      }
    } catch (err) {
      setError('Unable to reach validation gateway. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-[#080d1a] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-slate-100 overflow-hidden my-8">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700/50"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs text-amber-300 tracking-wider uppercase">Authenticating Credential Registry...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-sans">Verification Failed</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">{error}</p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-xl cursor-pointer transition"
              >
                Close Portal
              </button>
            </div>
          </div>
        ) : certData ? (
          <div className="space-y-6">
            
            {/* Header with holographic verified seal */}
            <div className="text-center space-y-3 border-b border-amber-500/20 pb-6">
              <div className="flex items-center justify-center gap-3">
                {certData.contestLogo && (
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-amber-500/40 p-1 flex items-center justify-center overflow-hidden shadow">
                    <img src={certData.contestLogo} alt="Contest Logo" className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold tracking-wider uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Officially Verified & Authentic
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 pt-1">
                FigTyp Certificate Registry
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {certData.contestTitle ? (
                  <span className="text-cyan-400 font-bold block mb-1">Tournament Event: {certData.contestTitle}</span>
                ) : null}
                Issued by <span className="text-amber-300">{certData.verifiedBy || 'FigTyp Global Certification Board'}</span>
              </p>
            </div>

            {/* Recipient Spotlight Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-amber-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Recipient Name</span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">{certData.fullName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3 h-3 text-slate-500" />
                    {certData.institute || 'FigTyp Global Typing Academy'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block">Typing Speed</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">{certData.wpm} WPM</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block">Precision</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{certData.accuracy}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-amber-400" /> Registry Serial:</span>
                <span className="text-amber-300 font-semibold">{certData.serialHash || `FIGTYP-${certData.id?.slice(-8)}`}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sky-400" /> Date of Issue:</span>
                <span className="text-slate-200">{new Date(certData.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-purple-400" /> Challenge Standard:</span>
                <span className="text-slate-200 truncate max-w-[150px]">{certData.mode}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-rose-400" /> Authority Signatory:</span>
                <span className="text-slate-200">{certData.signature || 'Md Moshiur Rahaman Riat'}</span>
              </div>
            </div>

            {/* Verification Seal Footer */}
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
              <p className="text-[11px] text-amber-300/90 leading-relaxed font-sans">
                🔒 This electronic certificate has been verified directly against FigTyp's cryptographic registry. The speed and accuracy parameters are guaranteed genuine.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onViewDiploma && (
                <button
                  onClick={() => onViewDiploma(certData)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white font-mono text-xs font-semibold cursor-pointer transition shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" /> View Full Diploma Card
                </button>
              )}
              <button
                onClick={onClose}
                className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 cursor-pointer transition"
              >
                Close Verification
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
