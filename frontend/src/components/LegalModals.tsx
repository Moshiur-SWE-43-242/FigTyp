import React, { useState } from 'react';
import { X, Shield, FileText, Mail, Phone, MapPin, Send, CheckCircle, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';
import BlogHub from './BlogHub';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteLogo?: string;
  mSquareLogo?: string;
}

/**
 * 1. PRIVACY POLICY MODAL
 * Tailored for Google AdSense & GDPR/CCPA Compliance
 */
export function PrivacyPolicyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#090d18] border-2 border-black dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-black dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b-2 border-black/10 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-black dark:text-white">Privacy Policy</h2>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-slate-400">Effective Date: January 1, 2026 | Last Updated: March 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Policy Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm font-sans leading-relaxed text-zinc-700 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-900 dark:text-cyan-200 text-xs font-mono">
            <strong>Quick Summary:</strong> FigTyp (&ldquo;we&rdquo;, &ldquo;our&rdquo;) prioritizes typist privacy. We process keystroke telemetry solely for calculating your WPM, accuracy, and typing analytics. We display contextual advertisements via Google AdSense under strict non-adult family-safe filters.
          </div>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">1.</span> Information We Collect
            </h3>
            <p>
              When you use FigTyp, we may collect the following categories of information:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Username, email address, password hashes (encrypted via bcrypt), and profile avatar URLs.</li>
              <li><strong>Typing Telemetry:</strong> Keystroke timings, words-per-minute (WPM), raw characters typed, accuracy rates, and error heatmaps used exclusively for educational training.</li>
              <li><strong>Technical Metadata:</strong> IP addresses, browser user agent strings, screen resolution, and session timestamps to protect against unauthorized bots or DDoS attacks.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">2.</span> Google AdSense & Third-Party Advertising
            </h3>
            <p>
              We partner with Google AdSense to serve contextual and interest-based advertisements across our free typing tools.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google and third-party vendors use <strong>cookies</strong> (such as the DoubleClick DART cookie) to serve ads based on your visit to FigTyp and other websites on the Internet.</li>
              <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 underline inline-flex items-center gap-0.5">Google Ad Settings <ExternalLink className="w-3 h-3" /></a> or <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 underline inline-flex items-center gap-0.5">aboutads.info <ExternalLink className="w-3 h-3" /></a>.</li>
              <li><strong>Content Safety Commitment:</strong> All ad placements enforce strict family-safe filters. Nudity, pornography, 18+ adult content, and explicit dating services are strictly excluded from our ad network configurations.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">3.</span> Cookies & Local Storage
            </h3>
            <p>
              FigTyp uses LocalStorage and browser cookies strictly to remember your active theme (Dark/Light mode), user authentication JWT token, and custom sound/caret preferences. We do not sell your personal data to data brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">4.</span> Your Rights (GDPR & CCPA)
            </h3>
            <p>
              Depending on your location, you have the right to request access to your stored typing attempts, request account deletion, or export your typing history. To exercise any of these rights, email our Data Protection Officer at <a href="mailto:m2devs.support@gmail.com" className="text-cyan-600 dark:text-cyan-400 underline">m2devs.support@gmail.com</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">5.</span> Data Security & Retention
            </h3>
            <p>
              We implement industry-standard HTTPS TLS encryption, salted bcrypt password hashing, and role-based access control. Inactive test attempts older than 12 months may be automatically aggregated or purged.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-black/10 dark:border-slate-800 bg-zinc-50 dark:bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-cyan-500 dark:text-slate-950 font-bold font-mono text-xs hover:opacity-90 transition cursor-pointer"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * 2. TERMS AND CONDITIONS MODAL
 */
export function TermsConditionsModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#090d18] border-2 border-black dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-black dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b-2 border-black/10 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-black dark:text-white">Terms and Conditions</h2>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-slate-400">FigTyp Platform User Agreement & Esports Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm font-sans leading-relaxed text-zinc-700 dark:text-slate-300">
          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white">1. Acceptance of Terms</h3>
            <p>
              By accessing, browsing, or using FigTyp (&ldquo;figtyp.com&rdquo;, &ldquo;Platform&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, you must discontinue using the platform immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white">2. Competitive Integrity & Anti-Cheat Policy</h3>
            <p>
              FigTyp hosts real-time multiplayer esports contests, global speed leaderboards, and accredited certificate programs. To protect fair competition:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The use of automated keystroke injection scripts, typing bots, macros, browser extensions that manipulate DOM inputs, or auto-clickers is strictly prohibited.</li>
              <li>Our backend performs heuristic analysis on keystroke delta timings. Anomalously uniform keystrokes (e.g. constant 15ms intervals) will lead to immediate score invalidation and permanent ban.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white">3. Certificates & Proof of Performance</h3>
            <p>
              Certificates issued by FigTyp reflect verifiable typing sessions stored in our cryptographic audit log. Organizations and employers may verify certificate validity at any time via certificate ID lookup. Alteration or falsification of certificates is unlawful.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white">4. Intellectual Property</h3>
            <p>
              The FigTyp logo, typing engine algorithms, visual branding, training curriculum, and original blog publications are the intellectual property of Md Moshiur Rahaman Riat and M-Square Devs. You may not reproduce, redistribute, or reverse engineer any part of the system without prior written consent.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold font-display text-black dark:text-white">5. Disclaimer of Warranties</h3>
            <p>
              The platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind. FigTyp shall not be liable for any temporary service disruptions, browser compatibility issues, or loss of unsaved local session records.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-black/10 dark:border-slate-800 bg-zinc-50 dark:bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-amber-500 dark:text-slate-950 font-bold font-mono text-xs hover:opacity-90 transition cursor-pointer"
          >
            Agree & Continue
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * 3. CONTACT US MODAL
 */
export function ContactUsModal({ isOpen, onClose }: ModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate sending message or POST to API
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#090d18] border-2 border-black dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-black dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b-2 border-black/10 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-black dark:text-white">Contact Us</h2>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-slate-400">Get in touch with the FigTyp Founder & Engineering Team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Direct Contact Card 1 */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-slate-900/50 border border-black/10 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs font-mono">
                <Mail className="w-4 h-4" />
                <span>Support Desk</span>
              </div>
              <p className="text-xs text-zinc-800 dark:text-slate-200 font-mono font-medium">m2devs.support@gmail.com</p>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400">24/7 Response for technical bugs</p>
            </div>

            {/* Direct Contact Card 2 */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-slate-900/50 border border-black/10 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs font-mono">
                <MapPin className="w-4 h-4" />
                <span>Founder Office</span>
              </div>
              <p className="text-xs text-zinc-800 dark:text-slate-200 font-medium">Daffodil Int. University</p>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400">Ashulia, Dhaka, Bangladesh</p>
            </div>

            {/* Direct Contact Card 3 */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-slate-900/50 border border-black/10 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Enterprise & Ads</span>
              </div>
              <p className="text-xs text-zinc-800 dark:text-slate-200 font-medium">M-Square Devs Lab</p>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400">Custom esports contests & API</p>
            </div>

          </div>

          {submitted ? (
            <div className="p-8 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-display">Message Sent Successfully!</h3>
              <p className="text-xs text-zinc-600 dark:text-slate-400 max-w-md mx-auto">
                Thank you for reaching out to FigTyp. Our engineering team has received your message and will respond to <strong>{email}</strong> within 24 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                className="mt-3 px-5 py-2 rounded-xl bg-black text-white dark:bg-slate-800 dark:text-white font-mono text-xs font-bold transition cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-700 dark:text-slate-400 font-bold mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black/15 dark:border-slate-800 bg-white dark:bg-slate-950 text-black dark:text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-slate-400 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black/15 dark:border-slate-800 bg-white dark:bg-slate-950 text-black dark:text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-slate-400 font-bold mb-1">Subject / Inquiry Type</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Bug Report, Contest Sponsorship, Feedback"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black/15 dark:border-slate-800 bg-white dark:bg-slate-950 text-black dark:text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-slate-400 font-bold mb-1">Message Details</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry, bug description, or partnership proposal..."
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black/15 dark:border-slate-800 bg-white dark:bg-slate-950 text-black dark:text-white focus:border-cyan-500 outline-none resize-none font-sans text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold font-mono text-xs flex items-center gap-2 cursor-pointer shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Sending Message...' : 'Transmit Message'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}

/**
 * 4. TYPING ACADEMY & GUIDES MODAL
 */
export function TypingAcademyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-6xl bg-white dark:bg-[#070b14] border-2 border-black dark:border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-black dark:text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-black/10 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-900/60 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xl font-bold">
              📚
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-black dark:text-white">FigTyp Typing Academy & Guide Blogs</h2>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-cyan-400">Master touch typing, ergonomic techniques & mechanical keyboard science</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Academy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body hosting BlogHub */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#04060d]">
          <BlogHub onBackToApp={onClose} showAd={true} />
        </div>
      </div>
    </div>
  );
}
