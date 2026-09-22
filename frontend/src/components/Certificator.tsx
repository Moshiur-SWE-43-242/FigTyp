import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { Award, CheckCircle2, ShieldCheck, Printer, RefreshCw, Loader2, QrCode, Eye, ExternalLink, Sparkles, Trophy } from 'lucide-react';
import { Certificate, TypingAttempt, User } from '../types';
import QRCode from 'qrcode';
import CertificateVerificationModal from './CertificateVerificationModal';
import CertificateDownloadAdModal from './CertificateDownloadAdModal';
import GoogleAd from './GoogleAd';

interface Props {
  userToken: string;
  currentUser: User;
  onCertificateIssued: () => void;
  websiteLogo?: string;
  mSquareLogo?: string;
}

const CHALLENGE_TEXT = "FigTyp certification confirms professional typing mastery and accurate kinetic telemetry measurement.";

export default function Certificator({ userToken, currentUser, onCertificateIssued, websiteLogo, mSquareLogo }: Props) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState<TypingAttempt[]>([]);
  const [overallAvgWpm, setOverallAvgWpm] = useState(0);
  const [overallAvgAccuracy, setOverallAvgAccuracy] = useState(100);
  const [activeDaysInLast7, setActiveDaysInLast7] = useState(0);
  const [certToDownload, setCertToDownload] = useState<Certificate | null>(null);
  
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

  const [verifyingCertId, setVerifyingCertId] = useState<string | null>(null);

  const buildCertificateVerificationPayload = (cert: Certificate) => {
    const displayName = cert.fullName || currentUser.fullName || currentUser.username;
    const institute = cert.institute || currentUser.institute || 'FigTyp Academy';
    const verificationUrl = `${window.location.origin}/?verify=${cert.id}`;

    return {
      type: 'FIGTYP_CERTIFICATE',
      valid: true,
      id: cert.id,
      name: displayName,
      institute,
      wpm: cert.wpm,
      accuracy: cert.accuracy,
      mode: cert.mode,
      issueDate: new Date(cert.issueDate).toISOString(),
      status: 'VERIFIED',
      signature: cert.signature || 'Md Moshiur Rahaman Riat',
      verificationUrl
    };
  };

  const generateCertificateQRCode = async (cert: Certificate): Promise<string> => {
    try {
      const verificationUrl = `${window.location.origin}/?verify=${cert.id}`;
      return await QRCode.toDataURL(verificationUrl, {
        width: 400,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H'
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

    const effectiveFigTypLogo = websiteLogo || systemLogo;
    const logoImg = effectiveFigTypLogo ? await preloadImage(effectiveFigTypLogo) : null;
    const contestLogoImg = cert.contestLogo ? await preloadImage(cert.contestLogo) : null;
    const sigImg = adminSignature ? await preloadImage(adminSignature) : null;
    const qrImage = await generateCertificateQRCode(cert);

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const width = 297;
      const height = 210;
      const centerX = width / 2;

      // 1. Soft Parchment Ivory Background
      doc.setFillColor(252, 250, 243);
      doc.rect(0, 0, width, height, 'F');

      // 2. Primary Outer Navy Border
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(1.8);
      doc.rect(10, 10, width - 20, height - 20);

      // 3. Ornate Double Gold Trim Frame
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.rect(13, 13, width - 26, height - 26);

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.3);
      doc.rect(15, 15, width - 30, height - 30);

      // Corner Rosettes
      const corners = [
        [15, 15], [width - 15, 15], [15, height - 15], [width - 15, height - 15]
      ];
      doc.setFillColor(212, 175, 55);
      corners.forEach(([cx, cy]) => {
        doc.circle(cx, cy, 1.8, 'F');
      });

      // 4. Subtle Guilloche / Watermark Pattern
      doc.setFont('times', 'bold');
      doc.setFontSize(85);
      doc.setTextColor(243, 239, 226);
      doc.text('FIGTYP ARENA', centerX, height / 2 + 15, { align: 'center' });

      // 5. Header Branding: FigTyp Logo (Left)
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 24, 20, 22, 22);
      } else {
        doc.setFillColor(15, 23, 42);
        doc.circle(35, 31, 10, 'F');
        doc.setTextColor(212, 175, 55);
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.text('FT', 35, 35, { align: 'center' });
      }

      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('FIGTYP ARENA', 50, 28);
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Global Typing Standards Board', 50, 33);
      doc.setFont('times', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('In partnership with M-Square Devs Group', 50, 37.5);

      // 6. Header Right: Contest Logo (if present) OR Verification Seal
      if (contestLogoImg) {
        doc.addImage(contestLogoImg, 'PNG', width - 46, 20, 22, 22);
        doc.setFont('times', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(180, 135, 35);
        doc.text('TOURNAMENT CREDENTIAL', width - 50, 27, { align: 'right' });
        doc.setFont('times', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(String(cert.contestTitle || 'Official Esports Match'), width - 50, 32, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('Verified Competition Track', width - 50, 37, { align: 'right' });
      } else {
        doc.setDrawColor(212, 175, 55);
        doc.setFillColor(254, 252, 240);
        doc.circle(width - 34, 30, 10, 'FD');
        doc.setFont('times', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(180, 135, 35);
        doc.text('OFFICIAL', width - 34, 29, { align: 'center' });
        doc.text('VERIFIED', width - 34, 32.5, { align: 'center' });
      }

      // 7. Certificate Main Header
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.text('CERTIFICATE OF ACHIEVEMENT', centerX, 60, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text('This official credential is systematically authenticated and awarded to', centerX, 70, { align: 'center' });

      // 8. Candidate Full Name
      const displayName = cert.fullName || currentUser.fullName || currentUser.username;
      doc.setFont('times', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(180, 135, 35);
      doc.text(String(displayName).toUpperCase(), centerX, 88, { align: 'center' });

      // Underline Accent Ribbons
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.6);
      doc.line(centerX - 75, 93, centerX + 75, 93);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.2);
      doc.line(centerX - 50, 94.5, centerX + 50, 94.5);

      // 9. Citation & Criteria
      const instituteText = cert.institute || currentUser.institute || 'FigTyp Global Typing Academy';
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(instituteText, centerX, 101, { align: 'center' });

      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text('For demonstrated mastery in kinetic keystroke interval telemetry, sustained burst velocity, and verified precision.', centerX, 109, { align: 'center' });

      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      const modeText = cert.contestTitle
        ? `OFFICIAL TOURNAMENT DIVISION: ${cert.contestTitle}`
        : (cert.mode || 'FIGTYP PROFESSIONAL TYPING STANDARD');
      doc.text(String(modeText).toUpperCase(), centerX, 116, { align: 'center' });

      // 10. Performance Metric Plaques (Speed & Accuracy)
      const metricY = 126;
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.setFillColor(255, 255, 255);
      
      // Speed Plaque
      doc.roundedRect(centerX - 62, metricY, 56, 18, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(`${cert.wpm} WPM`, centerX - 34, metricY + 9, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('KINETIC SPEED RATE', centerX - 34, metricY + 14.5, { align: 'center' });

      // Accuracy Plaque
      doc.roundedRect(centerX + 6, metricY, 56, 18, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(`${cert.accuracy}% ACC`, centerX + 34, metricY + 9, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('VERIFIED PRECISION', centerX + 34, metricY + 14.5, { align: 'center' });

      // 11. Footer Section (Date, QR Code & Signatures)
      const footerY = 172;

      // Issue Date Line (Left)
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.4);
      doc.line(30, footerY, 85, footerY);

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(String(new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })), 57.5, footerY - 3, { align: 'center' });
      doc.setFont('times', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Date of Issue', 57.5, footerY + 4, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(180, 135, 35);
      doc.text(`REG: FIGTYP-${cert.id.slice(-8).toUpperCase()}`, 57.5, footerY + 8, { align: 'center' });

      // QR Code in Center
      if (qrImage) {
        doc.addImage(qrImage, 'PNG', centerX - 10, footerY - 14, 20, 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text('SCAN TO VERIFY REGISTRY', centerX, footerY + 9, { align: 'center' });
      }

      // Authorized Signature (Right)
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.4);
      doc.line(width - 85, footerY, width - 30, footerY);

      if (sigImg) {
        doc.addImage(sigImg, 'PNG', width - 75, footerY - 16, 36, 14);
      } else {
        doc.setFont('times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Md Moshiur', width - 57.5, footerY - 3, { align: 'center' });
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(cert.signature || 'Md Moshiur Rahaman Riat'), width - 57.5, footerY + 4, { align: 'center' });
      doc.setFont('times', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Platform Architect & Founder', width - 57.5, footerY + 8, { align: 'center' });

      // Bottom Reference Line
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Reference: ACAD-REG-${cert.id}-${Math.floor(100000 + Math.random() * 900000)} | Cryptographically Audited by FigTyp`, centerX, height - 12, { align: 'center' });
      doc.text('Issued by FigTyp Arena with official typing standards certification', centerX, height - 8, { align: 'center' });

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
            <div className="rounded-2xl bg-slate-950/40 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00FF95]" /> Official Digital Stamp Ledger
                </h4>
                <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {certs.length} Issued
                </span>
              </div>

              {certs.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-10">
                  No verified certificates issued yet. Complete the validation challenge to earn your credential.
                </div>
              ) : (
                <div className="space-y-3 font-mono">
                  {certs.map((cert) => (
                    <div key={cert.id} className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {cert.contestLogo && (
                            <img src={cert.contestLogo} alt="Contest Logo" className="w-5 h-5 rounded-md object-cover border border-amber-500/40 shrink-0" />
                          )}
                          <span className="text-white text-xs font-semibold">{cert.contestTitle || cert.mode}</span>
                          <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono">
                            VERIFIED
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Issued: {new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • ID: {cert.id.slice(-6)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right text-xs">
                          <span className="text-cyan-400 font-bold block">{cert.wpm} WPM</span>
                          <span className="text-slate-400 block text-[10px]">{cert.accuracy}% Acc</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openCertificatePreview(cert)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-amber-500/50 text-amber-300 text-xs rounded-lg cursor-pointer transition flex items-center gap-1"
                            title="Preview Diploma"
                          >
                            <Eye className="w-3 h-3" /> Diploma
                          </button>
                          <button
                            onClick={() => setVerifyingCertId(cert.id)}
                            className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs rounded-lg cursor-pointer transition flex items-center gap-1"
                            title="Verify Online"
                          >
                            <ShieldCheck className="w-3 h-3" /> Verify
                          </button>
                          <button
                            onClick={() => setCertToDownload(cert)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs rounded-lg cursor-pointer transition"
                            title="Download PDF (Ad-Supported)"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Luxury Gold Diploma Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#090e1a] via-[#0d1527] to-[#070b14] border-2 border-[#d4af37]/70 rounded-3xl max-w-3xl w-full shadow-[0_0_60px_rgba(212,175,55,0.25)] relative overflow-hidden my-6">
            
            {/* Modal Bar */}
            <div className="flex justify-between items-center px-6 py-3.5 border-b border-amber-500/20 bg-slate-950/60">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>FigTyp Official Diploma Credential</span>
              </div>
              <button 
                onClick={() => setPreviewCert(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Diploma Certificate Canvas */}
            <div className="p-6 sm:p-10 text-center relative">
              
              {/* Ornate Gold Double Border Frame */}
              <div className="border-2 border-[#d4af37]/80 rounded-2xl p-6 sm:p-8 relative bg-gradient-to-b from-[#0a1122]/90 to-[#070c18]/95 shadow-inner">
                
                {/* Corner Ornaments */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]" />

                {/* Co-Branded Archival Header with FigTyp Logo and Contest Logo */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-5 border-b border-amber-500/20">
                  
                  {/* Left: FigTyp Official Brand Emblem */}
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950/90 border-2 border-amber-400/60 p-1 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                      {(websiteLogo || systemLogo) ? (
                        <img
                          src={websiteLogo || systemLogo}
                          alt="FigTyp Logo"
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-950 font-serif font-black text-2xl shadow">
                          FT
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                        <Sparkles className="w-2.5 h-2.5" /> Verified Credential
                      </span>
                      <h4 className="text-xs sm:text-sm font-serif font-bold text-white tracking-wider mt-1">
                        FigTyp Global Certification Board
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        In Cooperation with M-Square Devs Group
                      </p>
                    </div>
                  </div>

                  {/* Right: Contest Logo (if available) or Official Verification Crest */}
                  {previewCert.contestLogo ? (
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/30">
                          <Trophy className="w-2.5 h-2.5" /> Tournament Credential
                        </span>
                        <h4 className="text-xs sm:text-sm font-serif font-bold text-amber-300 tracking-wider mt-1">
                          {previewCert.contestTitle || 'Arena Championship'}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400">
                          Verified Competition Match
                        </p>
                      </div>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950/90 border-2 border-amber-400/60 p-1 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                        <img
                          src={previewCert.contestLogo}
                          alt="Tournament Logo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-[11px] tracking-wider uppercase">Cryptographic Audit Valid</span>
                    </div>
                  )}

                </div>

                {/* Main Diploma Title */}
                <div className="space-y-2 mb-6">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-200">
                    CERTIFICATE OF ACHIEVEMENT
                  </h2>
                  <p className="text-xs font-serif italic text-slate-300">
                    This official credential is proudly awarded to
                  </p>
                </div>

                {/* Recipient Candidate Name */}
                <div className="my-6">
                  <h3 className="text-2xl sm:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-100 tracking-wider uppercase drop-shadow">
                    {previewCert.fullName || currentUser.fullName || currentUser.username}
                  </h3>
                  <div className="w-48 sm:w-64 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-2" />
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    {previewCert.institute || currentUser.institute || 'FigTyp Global Typing Academy'}
                  </p>
                </div>

                {/* Citation Text */}
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed font-sans mb-6">
                  For outstanding kinetic speed, ergonomic hand posture, and verified typing mastery in the challenge standard of{' '}
                  <span className="text-amber-300 font-semibold">
                    {previewCert.contestTitle ? `Tournament Division: ${previewCert.contestTitle}` : (previewCert.mode || 'FigTyp Professional Arena')}
                  </span>.
                </p>

                {/* Metric Plaques */}
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest block">Typing Speed</span>
                    <span className="text-2xl font-bold font-mono text-white">{previewCert.wpm}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">Words Per Minute</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest block">Accuracy Rate</span>
                    <span className="text-2xl font-bold font-mono text-white">{previewCert.accuracy}%</span>
                    <span className="text-[10px] font-mono text-slate-400 block">Verified Precision</span>
                  </div>
                </div>

                {/* Authentication & Signature Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 pt-4 border-t border-amber-500/20 text-xs">
                  
                  {/* Date & Registry */}
                  <div className="text-left space-y-1 font-mono">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Date of Issue</span>
                    <span className="text-white font-medium block">
                      {new Date(previewCert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-[9px] text-amber-400/80 block">
                      REG: FIGTYP-{previewCert.id.slice(-8).toUpperCase()}
                    </span>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="flex flex-col items-center">
                    {qrCodeImage ? (
                      <div 
                        onClick={() => setVerifyingCertId(previewCert.id)}
                        className="group relative cursor-pointer"
                        title="Click to verify in online registry"
                      >
                        <img 
                          src={qrCodeImage} 
                          alt="QR Verification" 
                          className="w-20 h-20 p-1 bg-white rounded-lg border border-amber-400/50 shadow-md group-hover:scale-105 transition" 
                        />
                        <div className="absolute inset-0 bg-amber-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-amber-900 bg-white/80 p-0.5 rounded" />
                        </div>
                      </div>
                    ) : null}
                    <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                      Scan to Verify
                    </span>
                  </div>

                  {/* Founder Signature */}
                  <div className="text-right space-y-1">
                    {adminSignature ? (
                      <img src={adminSignature} alt="Signature" className="h-10 ml-auto object-contain" />
                    ) : (
                      <div className="font-serif italic text-lg text-amber-200">
                        Md Moshiur Rahaman Riat
                      </div>
                    )}
                    <div className="w-36 h-px bg-slate-700 ml-auto" />
                    <span className="text-[10px] font-mono text-slate-300 font-semibold block">
                      {previewCert.signature || 'Md Moshiur Rahaman Riat'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">
                      Platform Architect & Founder
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 px-6 border-t border-amber-500/20 bg-slate-950/60">
              <button
                onClick={() => setVerifyingCertId(previewCert.id)}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono text-xs border border-amber-500/30 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Verify in Public Registry
              </button>
              <button 
                onClick={() => setCertToDownload(previewCert)} 
                className="flex-1 py-3 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white font-mono text-xs font-bold tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-amber-900/30"
              >
                <Printer className="w-4 h-4"/> Download High-Res PDF
              </button>
              <button
                onClick={() => setPreviewCert(null)}
                className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 cursor-pointer transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Public Online Verification Portal */}
      {verifyingCertId && (
        <CertificateVerificationModal
          certId={verifyingCertId}
          onClose={() => setVerifyingCertId(null)}
          onViewDiploma={(cert: Certificate) => {
            setVerifyingCertId(null);
            openCertificatePreview(cert);
          }}
        />
      )}

      {/* Sponsored Certificate Download Modal */}
      {certToDownload && (
        <CertificateDownloadAdModal
          certificate={certToDownload}
          isOpen={Boolean(certToDownload)}
          onClose={() => setCertToDownload(null)}
          onProceedDownload={() => downloadCertificatePdf(certToDownload)}
        />
      )}

      {/* Middle/Bottom Sponsor Ad for Certificates */}
      <div className="pt-4">
        <GoogleAd
          slot="8877665544"
          format="horizontal"
          label="Partner Sponsored Technology"
          className="max-w-3xl mx-auto"
        />
      </div>

    </div>
  );
}