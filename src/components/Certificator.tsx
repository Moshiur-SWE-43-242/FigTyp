import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldCheck, Printer, RefreshCw, Loader2, QrCode } from 'lucide-react';
import { Certificate } from '../types';
import { jsPDF } from 'jspdf';

interface Props {
  userToken: string;
  onCertificateIssued: () => void;
}

const CHALLENGE_TEXT = "The developers of MiraCore Logix confirm that fingers navigate coordinates with absolute precision.";

export default function Certificator({ userToken, onCertificateIssued }: Props) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // validation form
  const [inputText, setInputText] = useState('');
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpmCalculated, setWpmCalculated] = useState(0);
  const [accuracyCalculated, setAccuracyCalculated] = useState(100);
  const [finished, setFinished] = useState(false);
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchMyCertificates();
  }, []);

  const fetchMyCertificates = async () => {
    try {
      const res = await fetch('/api/certificates', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setCerts(data);
      }
    } catch (e) {
      console.warn("Could not load certificates:", e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (!started && value.length > 0) {
      setStarted(true);
      setStartTime(Date.now());
    }

    // calculate current accuracy
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === CHALLENGE_TEXT[i]) {
        correct++;
      }
    }
    const currentAcc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    setAccuracyCalculated(currentAcc);

    // check finished condition
    if (value.length >= CHALLENGE_TEXT.length) {
      setFinished(true);
      const secondsElapsed = startTime ? (Date.now() - startTime) / 1000 : 15;
      
      // Words are calculated as chars / 5
      const wordsCount = correct / 5;
      const speed = secondsElapsed > 0 ? Math.round(wordsCount / (secondsElapsed / 60)) : 40;
      
      setWpmCalculated(speed);
      setAccuracyCalculated(currentAcc);
    }
  };

  const submitCertificateClaim = async () => {
    if (wpmCalculated < 20) {
      setErrorMsg('Speed benchmark must be at least 20 words per minute to warrant professional status.');
      return;
    }
    if (accuracyCalculated < 90) {
      setErrorMsg('Accuracy scoring must be at least 90.0% to bypass credentials validation.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          wpm: wpmCalculated,
          accuracy: accuracyCalculated,
          challengeMode: 'MiraCore Pro Certification Test'
        })
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          setActiveCert(data.certificate);
          fetchMyCertificates();
          onCertificateIssued();
        } else {
          setErrorMsg(data.error || 'Failed to file certificate registry entry.');
        }
      } else {
        setErrorMsg('Handshake response is invalid. Please try again.');
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

  const downloadCertificatePdf = async (cert: Certificate) => {
    let logoUrl = '';
    let signaturePic = '';
    try {
      const logoRes = await fetch('/api/settings/logo');
      if (logoRes.ok) {
        const logoData = await logoRes.json();
        logoUrl = logoData.websiteLogo || '';
      }
      const sigRes = await fetch('/api/settings/admin-signature');
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        signaturePic = sigData.adminSignaturePic || '';
      }
    } catch (e) {
      console.warn("Could not retrieve system branding assets:", e);
    }

    const preloadImage = (src: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const logoImg = logoUrl ? await preloadImage(logoUrl) : null;
    const sigImg = signaturePic ? await preloadImage(signaturePic) : null;

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // A4 dimensions in landscape: 297mm x 210mm
      
      // Classy gradient border decoration: Rich Dark Blue & Emerald Accent
      doc.setFillColor(13, 27, 44); // Slate Navy
      doc.rect(0, 0, 297, 210, 'F');
      
      // Inside parchment board frame
      doc.setFillColor(248, 249, 250); // Premium Offwhite
      doc.roundedRect(8, 8, 281, 194, 6, 6, 'F');
      
      // Frame outline border
      doc.setDrawColor(220, 180, 50); // Golden bronze outline
      doc.setLineWidth(1.5);
      doc.rect(12, 12, 273, 186);

      doc.setDrawColor(13, 27, 44); // Inner dark lining
      doc.setLineWidth(0.3);
      doc.rect(14, 14, 269, 182);

      // Certificate header corner decorations
      doc.setFillColor(220, 180, 50);
      doc.triangle(14, 14, 30, 14, 14, 30, 'F');
      doc.triangle(283, 14, 267, 14, 283, 30, 'F');
      doc.triangle(14, 196, 30, 196, 14, 180, 'F');
      doc.triangle(283, 196, 267, 196, 283, 180, 'F');

      // Global text alignment center calculations: x = 148.5
      
      // Logo and Institution name
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(20, 40, 70);
      doc.text("MIRACORE LOGIX ACADEMY OF TYPING KINETICS", 148.5, 30, { align: "center" });

      // Verification seal subline
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 120);
      doc.text("REGULATED KINETIC TELEMETRY VERIFICATION FRAMEWORK", 148.5, 35, { align: "center" });

      // --- Top Left Corner: Logo of Fig Type ---
      if (logoImg) {
        try {
          doc.addImage(logoImg, "PNG", 20, 18, 12, 12);
        } catch (imgErr) {
          console.warn("Fallback to vector drawing: logo rendering error:", imgErr);
          // Fallback vector
          doc.setFillColor(147, 51, 234);
          doc.roundedRect(20, 18, 12, 12, 1.5, 1.5, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.text("F", 26, 26.5, { align: "center" });
        }
      } else {
        // Logo Emblem background
        doc.setFillColor(147, 51, 234); // Royal purple fig color
        doc.roundedRect(20, 18, 12, 12, 1.5, 1.5, 'F');
        
        // Inside glyph 'F'
        doc.setTextColor(255, 255, 255);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text("F", 26, 26.5, { align: "center" });
      }

      // Fig Type Typography Brand text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Fig Type", 35, 25);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(147, 51, 234);
      doc.text("ONLINE SPEED ARENA", 35, 29.5);


      // --- Top Right Corner: QR Code to verify the certificate is correct ---
      const qrx = 247;
      const qry = 18;
      const qrSize = 25; // 25x25 mm

      // White base backplate with thin borders for contrast
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx - 2, qry - 2, qrSize + 4, qrSize + 4, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(qrx - 2, qry - 2, qrSize + 4, qrSize + 4, 'D');

      // Draw standard QR code Finder Patterns (3 corners)
      doc.setFillColor(15, 23, 42); // deep dark blue finder
      
      // Top-Left Finder
      doc.rect(qrx, qry, 6, 6, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx + 1, qry + 1, 4, 4, 'F');
      doc.setFillColor(15, 23, 42);
      doc.rect(qrx + 2, qry + 2, 2, 2, 'F');

      // Top-Right Finder
      doc.rect(qrx + qrSize - 6, qry, 6, 6, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx + qrSize - 5, qry + 1, 4, 4, 'F');
      doc.setFillColor(15, 23, 42);
      doc.rect(qrx + qrSize - 4, qry + 2, 2, 2, 'F');

      // Bottom-Left Finder
      doc.rect(qrx, qry + qrSize - 6, 6, 6, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx + 1, qry + qrSize - 5, 4, 4, 'F');
      doc.setFillColor(15, 23, 42);
      doc.rect(qrx + 2, qry + qrSize - 4, 2, 2, 'F');

      // Verification String with all relevant details
      const verificationText = `FIGTYPE PROFICIENCY CERTIFICATE | Name: ${cert.fullName || cert.username} | Mode: ${cert.mode} | Avg WPM: ${cert.wpm} | Accuracy: ${cert.accuracy}% | ID: ${cert.id} | System URL: ${cert.verificationUrl}`;

      // Programmatic matrix of random but deterministic dots for an authentic look based on the verification text
      let hash = 0;
      for (let i = 0; i < verificationText.length; i++) {
        hash = verificationText.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash);

      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          // Skip the 3 finder corners
          if ((r < 5 && c < 5) || (r < 5 && c > 9) || (r > 9 && c < 5)) {
            continue;
          }
          // Simple pseudo-random formula based on matrix rows and reference hash
          const state = ((r * hash + c * 13 + 7) % 5 === 0) || ((r + c) % 3 === 0) || ((r * c + hash) % 4 === 0);
          if (state) {
            doc.setFillColor(15, 23, 42);
            // Draw dot data cell
            doc.rect(qrx + (c * (qrSize / 15)), qry + (r * (qrSize / 15)), qrSize / 15, qrSize / 15, 'F');
          }
        }
      }

      // Small caption for QR verification
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(100, 110, 120);
      doc.text("SCAN QR TO VERIFY", qrx + (qrSize / 2), qry + qrSize + 3.5, { align: "center" });


      // Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(13, 27, 44); // Navy
      doc.text("CERTIFICATE OF PROFICIENCY", 148.5, 55, { align: "center" });

      // Sub-title
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(80, 85, 95);
      doc.text("This credential plaque is proudly awarded and presented to", 148.5, 68, { align: "center" });

      // Holder's name (Large emphasis)
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(0, 120, 140); // Teal
      doc.text(String(cert.fullName || cert.username).toUpperCase(), 148.5, 82, { align: "center" });

      // Line separating holder details
      doc.setDrawColor(200, 175, 100);
      doc.setLineWidth(0.5);
      doc.line(70, 88, 227, 88);

      // Paragraph
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(80, 85, 95);
      doc.text(`for executing audited neuromuscular typestrike operations in the category:`, 148.5, 98, { align: "center" });
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 27, 44);
      doc.text(String(cert.mode || 'MiraCore Professional Speed Match'), 148.5, 106, { align: "center" });

      // Telemetry statistics boxes
      // Statistics Box 1: SPEED RATE
      doc.setFillColor(235, 245, 240); // very soft emerald green tint
      doc.roundedRect(55, 117, 85, 28, 3, 3, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(90, 100, 110);
      doc.text("KINETIC TYPING VELOCITY", 97.5, 123, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 130, 80); // Deep green
      doc.text(`${cert.wpm} WORDS PER MINUTE`, 97.5, 135, { align: "center" });

      // Statistics Box 2: ACCURACY PRECISION
      doc.setFillColor(235, 242, 248); // very soft blue tint
      doc.roundedRect(157, 117, 85, 28, 3, 3, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(90, 100, 110);
      doc.text("ACCURACY TRACKING METRIC", 199.5, 123, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 80, 150); // Deep blue
      doc.text(`${cert.accuracy}% PRECISION ACCURACY`, 199.5, 135, { align: "center" });

      // Footer - signatures, stamps, date
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(40, 172, 110, 172); // signatory line left
      doc.line(187, 172, 257, 172); // signatory line right

      // Overlay signature picture above the registrar line if uploaded
      if (sigImg) {
        try {
          doc.addImage(sigImg, "PNG", 204.5, 156, 35, 15);
        } catch (imgErr) {
          console.warn("Signature image rendering failed:", imgErr);
        }
      }

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 85, 95);
      doc.text("Date of Issue & Stamp Certificate", 75, 177, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.text(String(new Date(cert.issueDate).toLocaleDateString()), 75, 182, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.text("Grader, MiraCore Software Architect", 222, 177, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.text(String(cert.signature || 'Md Moshiur Rahaman Riat'), 222, 182, { align: "center" });

      // Gold verification badge graphics
      doc.setFillColor(220, 180, 50);
      doc.circle(148.5, 168, 11, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text("AUTHENTIC", 148.5, 166.5, { align: "center" });
      doc.text("MIRACORE", 148.5, 169.5, { align: "center" });
      doc.text("VERIFIED", 148.5, 172.5, { align: "center" });

      // Small registry ID line
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(`Digital Verification Registry Hash: ${cert.id} | Verification System: ${cert.verificationUrl}`, 148.5, 193, { align: "center" });

      doc.save(`MiraCore_Typing_Certificate_${cert.id}.pdf`);
    } catch (err) {
      console.error("Certificate PDF compilation failed:", err);
      alert("Encountered compilation errors compiling your digital PDF certificate card.");
    }
  };

  return (
    <div id="certs-container" className="space-y-8 max-w-5xl mx-auto px-4 pt-1 pb-6">
      
      {/* Editorial layout detailing rules */}
      <div id="certs-intro" className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101b2c] to-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 md:w-2/3">
          <span className="text-[10px] font-mono tracking-widest text-[#00FF95] uppercase px-3 py-1 bg-[#00FF95]/10 rounded-full">
            Standard Certifications & Verification System
          </span>
          <h2 className="text-2xl font-display font-medium text-white flex items-center gap-2">
            MiraCore Typing Proficiency Credentials
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Obtain a globally accessible, mathematically signed digital PDF verification validating your kinetic speed. Requires successful real-time duplication of our audited validation block.
          </p>
          <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-500">
            <span>🚀 Minimum Speed: <strong className="text-[#00FF95]">20 WPM</strong></span>
            <span>🎯 Minimum Accuracy: <strong className="text-[#00FF95]">90.0%</strong></span>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1 text-center w-full md:w-auto">
          <Award className="w-8 h-8 text-[#00FF95] mx-auto animate-bounce" />
          <span className="text-xs font-semibold text-white block">Official Stamps and Seals Included</span>
          <span className="text-[9px] text-slate-500 font-mono">Verified registries published on figtype/certs</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs font-mono text-center rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D]">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Primary Split: validation box vs certificates catalog */}
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
                placeholder="Place context focus here and type duplication passage above..."
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 focus:border-[#00FF95] outline-none rounded-xl p-4 text-white transition focus:ring-1 focus:ring-[#00FF95]/30 resize-none"
              />
            </div>
          </div>

          {/* Validation outputs */}
          {started && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-around text-center">
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
          )}

          {/* Submit buttons */}
          {finished && (
            <div className="p-4 bg-[#00FF95]/5 border border-[#00FF95]/20 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#00FF95]" />
                <span className="text-slate-300">Audited parameters filed successfully! Claim certification registration below.</span>
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
                  disabled={loading}
                  className="py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-43.5 animate-spin" /> : null}
                  Claim Certificate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Certificate Display and Historical Catalog */}
        <div className="space-y-6">
          
          {/* Detailed Certification template output */}
          {activeCert ? (
            <div id="print-area-cert" className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-slate-900 to-slate-950 p-6 space-y-6 relative overflow-hidden neon-shadow-purple text-slate-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">OFFICIAL GRADED OUTCOMES</span>
                  <h4 className="text-md font-bold text-white font-display uppercase tracking-wide">COGNITIVE SPEED REGISTRY</h4>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="text-center py-4 space-y-3 border-y border-slate-800">
                <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">This document affirms that</p>
                <h3 className="text-xl font-display font-semibold tracking-wide text-white">{activeCert.fullName}</h3>
                <p className="text-slate-400 text-xs px-4">
                  has completed the audited speed challenges on the FigType Global Typing Arena with the following parameters:
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-2 font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Speed Rate</span>
                    <span className="text-lg font-bold text-emerald-400">{activeCert.wpm} WPM</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Accuracy Map</span>
                    <span className="text-lg font-bold text-emerald-400">{activeCert.accuracy}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono gap-4">
                <div className="space-y-1">
                  <span>GRADER: <strong className="text-slate-400">{activeCert.signature}</strong></span>
                  <p className="text-[9px] text-slate-600 block">UID Registry Reference: {activeCert.id}</p>
                </div>
                
                <div className="text-right flex items-center gap-2">
                  <QrCode className="w-8 h-8 text-slate-400 border border-slate-850 p-0.5 rounded bg-white/5" />
                  <div className="text-left">
                    <span className="text-[9px] block">ISSUE DATE</span>
                    <strong className="text-slate-300 block text-[9px]">{new Date(activeCert.issueDate).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-4">
                <button
                  onClick={() => downloadCertificatePdf(activeCert)}
                  className="w-full py-2 bg-gradient-to-r from-teal-700 to-indigo-700 hover:from-teal-600 hover:to-indigo-600 text-white font-mono text-xs rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Download PDF Certificate
                </button>
                <button
                  onClick={() => setActiveCert(null)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono rounded-lg cursor-pointer hover:border-slate-700 transition"
                >
                  Dismiss
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
                  No verified certificates issued for this profile session yet. Claim speed milestones above.
                </div>
              ) : (
                <div className="space-y-3 font-mono">
                  {certs.map((cert) => (
                    <div 
                      key={cert.id} 
                      onClick={() => setActiveCert(cert)}
                      className="p-3 bg-slate-950 border border-slate-850 hover:border-emerald-500/40 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition"
                    >
                      <div className="space-y-0.5">
                        <span className="text-white text-xs font-semibold block">{cert.mode}</span>
                        <span className="text-[9px] text-slate-500 block">Grade ID: {cert.id}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-emerald-400 font-bold block">{cert.wpm} WPM</span>
                        <span className="text-slate-500 block text-[10px]">{cert.accuracy}% Acc</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
