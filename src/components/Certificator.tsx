import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { Award, CheckCircle2, ShieldCheck, Printer, RefreshCw, Loader2, QrCode, Eye } from 'lucide-react';
import { Certificate, TypingAttempt, User } from '../types';
import QRCode from 'qrcode';

interface Props {
  userToken: string;
  currentUser: User;
  onCertificateIssued: () => void;
}

const CHALLENGE_TEXT = "FigTyp certification confirms professional typing mastery and accurate kinetic telemetry measurement.";

export default function Certificator({ userToken, currentUser, onCertificateIssued }: Props) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState<TypingAttempt[]>([]);
  const [overallAvgWpm, setOverallAvgWpm] = useState(0);
  const [overallAvgAccuracy, setOverallAvgAccuracy] = useState(100);
  const [activeDaysInLast7, setActiveDaysInLast7] = useState(0);
  
  // Validation form
  const [inputText, setInputText] = useState('');
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpmCalculated, setWpmCalculated] = useState(0);
  const [accuracyCalculated, setAccuracyCalculated] = useState(100);
  const [finished, setFinished] = useState(false);
  
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  
  // Dynamic Admin Settings
  const [adminSignature, setAdminSignature] = useState('');
  const [systemLogo, setSystemLogo] = useState('');

  useEffect(() => {
    fetchMyCertificates();
    fetchMyAttempts();
    fetchAdminSettings();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const logoRes = await fetch(API_URL + '/api/settings/logo');
      if (logoRes.ok) {
        const logoData = await logoRes.json();
        setSystemLogo(logoData.websiteLogo || '');
      }
      const sigRes = await fetch(API_URL + '/api/settings/admin-signature');
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        setAdminSignature(sigData.adminSignaturePic || '');
      }
    } catch (e) {
      console.warn("Could not retrieve system branding assets:", e);
    }
  };

  const fetchMyCertificates = async () => {
    try {
      const res = await fetch(API_URL + '/api/certificates', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCerts(data);
      }
    } catch (e) {
      console.warn("Could not load certificates:", e);
    }
  };

  const fetchMyAttempts = async () => {
    try {
      const res = await fetch(API_URL + '/api/attempts', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttempts(data);

        const validAttempts = data.filter((attempt: TypingAttempt) => attempt.wpm > 0 && attempt.accuracy >= 0);
        const totalRecords = validAttempts.length;
        if (totalRecords > 0) {
          const avgWpm = Math.round(validAttempts.reduce((sum: number, attempt: TypingAttempt) => sum + attempt.wpm, 0) / totalRecords);
          const avgAccuracy = Number((validAttempts.reduce((sum: number, attempt: TypingAttempt) => sum + attempt.accuracy, 0) / totalRecords).toFixed(1));
          setOverallAvgWpm(avgWpm);
          setOverallAvgAccuracy(avgAccuracy);
        } else {
          setOverallAvgWpm(0);
          setOverallAvgAccuracy(100);
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const daysSet = new Set<string>();
        validAttempts.forEach((attempt: TypingAttempt) => {
          const date = new Date(attempt.createdAt);
          if (!Number.isNaN(date.getTime()) && date >= sevenDaysAgo) {
            daysSet.add(date.toISOString().split('T')[0]);
          }
        });
        setActiveDaysInLast7(daysSet.size);
      }
    } catch (e) {
      console.warn('Could not load attempts for certificate analytics:', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (!started && value.length > 0) {
      setStarted(true);
      setStartTime(Date.now());
    }

    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === CHALLENGE_TEXT[i]) correct++;
    }
    const currentAcc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    setAccuracyCalculated(currentAcc);

    if (value.length >= CHALLENGE_TEXT.length) {
      setFinished(true);
      const secondsElapsed = startTime ? (Date.now() - startTime) / 1000 : 15;
      const speed = secondsElapsed > 0 ? Math.round((correct / 5) / (secondsElapsed / 60)) : 40;
      setWpmCalculated(speed);
      setAccuracyCalculated(currentAcc);
    }
  };

  const submitCertificateClaim = async () => {
    if (wpmCalculated < 20) return setErrorMsg('Speed benchmark must be at least 20 WPM.');
    if (accuracyCalculated < 90) return setErrorMsg('Accuracy scoring must be at least 90.0%.');
    if (activeDaysInLast7 < 7) return setErrorMsg('You must be active for at least 7 days in the last week.');

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch(API_URL + '/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          wpm: wpmCalculated,
          accuracy: accuracyCalculated,
          challengeMode: 'FigTyp Professional Typing Certification',
          fullName: currentUser.fullName || currentUser.username
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveCert(data.certificate);
        fetchMyCertificates();
        onCertificateIssued();
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || 'Failed to file certificate registry entry.');
      }
    } catch (err) {
      setErrorMsg('Network gateway timeout.');
    } finally {
      setLoading(false);
    }
  };

  const resetChallenge = () => {
    setInputText('');
    setStarted(false);
    setStartTime(null);
    setWpmCalculated(0);
    setAccuracyCalculated(100);
    setFinished(false);
    setErrorMsg('');
  };

  const generateCertificateQRCode = async (cert: Certificate): Promise<string> => {
    try {
      const verificationUrl = `${window.location.origin}/verify?id=${cert.id}`;
      return await QRCode.toDataURL(verificationUrl, {
        width: 400, margin: 1, color: { dark: '#0f172a', light: '#fcfaf5' }, errorCorrectionLevel: 'H'
      });
    } catch (e) {
      return '';
    }
  };

  const openCertificatePreview = async (cert: Certificate) => {
    const qrImage = await generateCertificateQRCode(cert);
    setQrCodeImage(qrImage);
    setPreviewCert(cert);
  };

  const getProgressBarClass = (percent: number) => {
    const normalized = Math.min(100, Math.max(0, Math.round(percent / 10) * 10));
    return `prog-width-${normalized}`;
  };

  // =======================================================
  // OUTSTANDING PROFESSIONAL PDF CERTIFICATE GENERATOR
  // =======================================================
  const downloadCertificatePdf = async (cert: Certificate) => {
    const preloadImage = (src: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const logoImg = systemLogo ? await preloadImage(systemLogo) : null;
    const sigImg = adminSignature ? await preloadImage(adminSignature) : null;
    const qrImage = await generateCertificateQRCode(cert);

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const width = 297;
      const height = 210;
      const centerX = width / 2;

      doc.setFillColor(246, 243, 233);
      doc.rect(0, 0, width, height, 'F');

      doc.setFillColor(20, 27, 44);
      doc.rect(12, 12, 16, height - 24, 'F');

      doc.setFillColor(185, 155, 74);
      doc.rect(30, 20, width - 60, 4, 'F');

      doc.setDrawColor(20, 27, 44);
      doc.setLineWidth(1.6);
      doc.rect(12, 12, width - 24, height - 24);

      doc.setDrawColor(185, 155, 74);
      doc.setLineWidth(0.5);
      doc.rect(16, 16, width - 32, height - 32);

      doc.setFont('times', 'bold');
      doc.setFontSize(100);
      doc.setTextColor(233, 228, 212);
      doc.text('FIGTYP', centerX + 10, height / 2 + 30, { align: 'center' });

      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 35, 22, 24, 24);
      } else {
        doc.setFillColor(20, 27, 44);
        doc.circle(47, 34, 10, 'F');
        doc.setTextColor(185, 155, 74);
        doc.setFont('times', 'bold');
        doc.setFontSize(14);
        doc.text('M', 47, 36, { align: 'center' });
      }

      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20, 27, 44);
      doc.text('FIGTYP ARENA', 70, 30);
      doc.setFont('times', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 118, 136);
      doc.text('In partnership with M-Square Devs Group', 70, 36);

      doc.setFont('times', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(20, 27, 44);
      doc.text('CERTIFICATE OF ACHIEVEMENT', centerX, 64, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(96, 104, 118);
      doc.text('This certificate is proudly awarded to', centerX, 78, { align: 'center' });

      const displayName = cert.fullName || currentUser.fullName || currentUser.username;
      doc.setFont('times', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(185, 155, 74);
      doc.text(String(displayName).toUpperCase(), centerX, 98, { align: 'center' });

      doc.setDrawColor(20, 27, 44);
      doc.setLineWidth(0.4);
      doc.line(centerX - 75, 103, centerX + 75, 103);

      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(96, 104, 118);
      doc.text('For outstanding achievement in typing performance, precision, and professional accuracy.', centerX, 112, { align: 'center' });
      doc.text(String(cert.mode || 'FIGTYP PROFESSIONAL TYPING STANDARD').toUpperCase(), centerX, 118, { align: 'center' });

      doc.setDrawColor(185, 155, 74);
      doc.setLineWidth(0.45);
      doc.line(45, 130, width - 45, 130);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(20, 27, 44);
      doc.text(`${cert.wpm} WPM`, centerX - 38, 146, { align: 'center' });
      doc.text(`${cert.accuracy}% ACC`, centerX + 38, 146, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(96, 104, 118);
      doc.text('typing speed', centerX - 38, 151, { align: 'center' });
      doc.text('accuracy score', centerX + 38, 151, { align: 'center' });

      const footerY = 176;
      doc.setDrawColor(110, 118, 136);
      doc.setLineWidth(0.55);
      doc.line(45, footerY, 110, footerY);
      doc.line(width - 110, footerY, width - 45, footerY);

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(20, 27, 44);
      doc.text(String(new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })), 77.5, footerY - 4, { align: 'center' });
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(96, 104, 118);
      doc.text('Date of issue', 77.5, footerY + 3, { align: 'center' });

      if (sigImg) {
        doc.addImage(sigImg, 'PNG', width - 94, footerY - 18, 40, 16);
      } else {
        doc.setFont('times', 'italic');
        doc.setFontSize(16);
        doc.setTextColor(20, 27, 44);
        doc.text('Md Moshiur', width - 77.5, footerY - 2, { align: 'center' });
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 27, 44);
      doc.text(String(cert.signature || 'Md Moshiur Rahaman Riat'), width - 77.5, footerY + 7, { align: 'center' });
      doc.setFont('times', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(96, 104, 118);
      doc.text('Platform architect & founder', width - 77.5, footerY + 11, { align: 'center' });

      if (qrImage) {
        doc.addImage(qrImage, 'PNG', width - 46, 38, 24, 24);
      }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(130, 138, 151);
      doc.text(`Reference: ACAD-REG-${cert.id}-${Math.floor(100000 + Math.random() * 900000)}`, centerX, height - 12, { align: 'center' });
      doc.text('Issued by FigTyp Arena with professional typing standards certification', centerX, height - 7, { align: 'center' });

      doc.save(`FigTyp_Certificate_${cert.id}.pdf`);
    } catch (err) {
      alert('Encountered compilation errors compiling your digital PDF certificate card.');
      console.error(err);
    }
  };

  // Guest Access Restriction
  if (currentUser.role === 'GUEST') {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-6 max-w-md mx-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500/50 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Guest Cannot Access PDF Certificates</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Certificate downloads require a <span className="font-semibold text-cyan-300">registered account</span> and validated course completion.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left">
            <p className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-widest font-bold">Requirements:</p>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span> Login/Create Account
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span> Complete Course 100%
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span> Validation Challenge
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Download Sealed PDF
              </li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 transition font-semibold text-sm"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="certs-container" className="space-y-8 max-w-5xl mx-auto px-4 pt-1 pb-6">
      
      <div id="certs-intro" className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101b2c] to-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 md:w-2/3">
          <span className="text-[10px] font-mono tracking-widest text-[#00FF95] uppercase px-3 py-1 bg-[#00FF95]/10 rounded-full">
            Standard Certifications & Verification System
          </span>
          <h2 className="text-2xl font-display font-medium text-white flex items-center gap-2">
            Typing Proficiency Credentials
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Obtain a globally accessible, mathematically signed digital PDF verification validating your kinetic speed.
          </p>
          <div className="flex flex-col gap-3 pt-1 font-mono text-[10px] text-slate-500">
            <div className="flex flex-wrap gap-4">
              <span>🚀 Minimum Speed: <strong className="text-[#00FF95]">20 WPM</strong></span>
              <span>🎯 Minimum Accuracy: <strong className="text-[#00FF95]">90.0%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs font-mono text-center rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D]">
          ⚠️ {errorMsg}
        </div>
      )}

      <div id="certs-split" className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        
        {/* Certificate Validation Test form */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#00FF95]" /> Active Validation Box
            </h3>
            {started && !finished && (
              <span className="text-xs font-mono text-[#00FF95] animate-pulse">STOPWATCH ACTIVE...</span>
            )}
          </div>

          <div className="space-y-3 font-sans">
            <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500">Duplication Challenge Passage</span>
            <blockquote className="p-4 bg-slate-950 border-l-2 border-[#00FF95] text-white text-xs md:text-sm leading-relaxed rounded-r-xl select-none">
              {CHALLENGE_TEXT}
            </blockquote>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Audit Entry Workspace</label>
              <textarea
                disabled={finished}
                value={inputText}
                onChange={handleInputChange}
                rows={3}
                placeholder="Type duplication passage above..."
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 focus:border-[#00FF95] outline-none rounded-xl p-4 text-white transition focus:ring-1 focus:ring-[#00FF95]/30 resize-none"
              />
            </div>
          </div>

          {started && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-4">
              <div className="flex items-center justify-around text-center gap-4 sm:gap-6">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Character Progress</span>
                  <span className="text-sm font-bold text-white font-mono">{inputText.length} / {CHALLENGE_TEXT.length}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Live Accuracy</span>
                  <span className={`text-sm font-bold font-mono ${accuracyCalculated >= 90 ? 'text-[#00FF95]' : 'text-[#FF4D6D]'}`}>
                    {accuracyCalculated}%
                  </span>
                </div>
                {finished && (
                  <>
                    <div className="w-px h-8 bg-slate-800" />
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Speed Run Rate</span>
                      <span className="text-sm font-bold text-[#00F3FF] font-mono">{wpmCalculated} WPM</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {finished && (
            <div className="p-4 bg-[#00FF95]/5 border border-[#00FF95]/20 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#00FF95]" />
                <span className="text-slate-300">Audited parameters filed successfully!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={resetChallenge}
                  className="py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Start Over
                </button>
                <button
                  onClick={submitCertificateClaim}
                  disabled={loading || wpmCalculated < 20 || accuracyCalculated < 90}
                  className="py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-4 animate-spin" /> : null}
                  Claim Certificate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Certificate Display and Historical Catalog */}
        <div className="space-y-6">
          {activeCert ? (
            <div id="print-area-cert" className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-slate-900 to-slate-950 p-6 space-y-6 relative overflow-hidden text-slate-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center py-4 space-y-3 border-y border-slate-800">
                <h3 className="text-xl font-display font-semibold tracking-wide text-white">{activeCert.fullName || currentUser.fullName || currentUser.username}</h3>
                <p className="text-slate-400 text-xs px-4">
                  has completed the audited challenges with the following parameters:
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-2 font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Speed Rate</span>
                    <span className="text-lg font-bold text-emerald-400">{activeCert.wpm} WPM</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Accuracy</span>
                    <span className="text-lg font-bold text-emerald-400">{activeCert.accuracy}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-4">
                <button
                  onClick={() => openCertificatePreview(activeCert)}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-700 to-purple-700 text-white font-mono text-xs rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => downloadCertificatePdf(activeCert)}
                  className="flex-1 py-2 bg-gradient-to-r from-teal-700 to-indigo-700 text-white font-mono text-xs rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/20 border border-slate-800 p-6 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00FF95]" /> Official Digital Stamp Ledger
              </h4>

              {certs.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-10">
                  No verified certificates issued yet.
                </div>
              ) : (
                <div className="space-y-3 font-mono">
                  {certs.map((cert) => (
                    <div key={cert.id} className="p-3 bg-slate-950 border border-slate-850 hover:border-emerald-500/40 rounded-xl flex items-center justify-between gap-4 transition">
                      <div className="flex-1 space-y-0.5">
                        <span className="text-white text-xs font-semibold block">{cert.mode}</span>
                        <span className="text-[9px] text-slate-500 block">{new Date(cert.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <span className="text-emerald-400 font-bold block">{cert.wpm} WPM</span>
                        <span className="text-slate-500 block text-[10px]">{cert.accuracy}% Acc</span>
                      </div>
                      <button
                        onClick={() => openCertificatePreview(cert)}
                        className="px-3 py-1.5 bg-blue-950 border border-blue-800 text-blue-300 text-xs rounded cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between p-4 border-b border-slate-800">
              <h3 className="text-white font-semibold">Certificate Preview</h3>
              <button onClick={() => setPreviewCert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">CERTIFICATE OF ACHIEVEMENT</h2>
              <p className="text-slate-400">Awarded to</p>
              <h3 className="text-3xl text-[#d4af37] font-bold font-serif tracking-wide">{previewCert.fullName || currentUser.fullName || currentUser.username}</h3>
              <p className="text-slate-400">For achieving <strong className="text-white">{previewCert.wpm} WPM</strong> with <strong className="text-white">{previewCert.accuracy}% Accuracy</strong></p>
              {qrCodeImage && <img src={qrCodeImage} alt="QR" className="w-24 h-24 mx-auto border border-slate-700 p-1 bg-white rounded-lg mt-4" />}
            </div>
            <div className="flex gap-4 p-4 border-t border-slate-800">
              <button onClick={() => downloadCertificatePdf(previewCert)} className="flex-1 py-3 bg-gradient-to-r from-teal-700 to-emerald-700 text-white font-bold tracking-wider rounded-lg flex items-center justify-center gap-2">
                <Printer className="w-4 h-4"/> Download High-Res PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}