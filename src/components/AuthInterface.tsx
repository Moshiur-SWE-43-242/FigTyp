import React, { useState } from 'react';
import { Mail, CheckCircle2, User, KeyRound, Loader2, Zap } from 'lucide-react';
import { User as UserType } from '../types';

interface Props {
  onAuthenticated: (user: UserType, token: string) => void;
  websiteLogo?: string;
}

type AuthStep = 'EMAIL' | 'OTP' | 'PROFILE' | 'PASSWORD' | 'FORGOT_EMAIL' | 'FORGOT_OTP' | 'RESET_PASSWORD';

export default function AuthInterface({ onAuthenticated, websiteLogo }: Props) {
  const [step, setStep] = useState<AuthStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [receivedToken, setReceivedToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setInfoMsg('');
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to request email OTP.');
        return;
      }

      setStep('OTP');
      setSuccessMsg('OTP sent to your email. Please enter the code to continue.');
      if (data.sandboxOtp) {
        setInfoMsg(`Sandbox OTP: ${data.sandboxOtp}`);
      }
    } catch (err) {
      setErrorMsg('Unable to reach the authentication gateway.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!otp) {
      setErrorMsg('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'OTP verification failed.');
        return;
      }

      setReceivedToken(data.token);
      if (data.isNewUser) {
        setStep('PROFILE');
        setSuccessMsg('Email verified. Complete registration to set your password.');
      } else {
        onAuthenticated(data.user, data.token);
      }
    } catch (err) {
      setErrorMsg('The authentication gateway returned an unexpected response.');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!username || !fullName || !password || password.length < 8 || password !== confirmPassword) {
      setErrorMsg('Please enter your full name, username, a strong password, and confirm it correctly.');
      return;
    }

    if (!receivedToken) {
      setErrorMsg('Your registration session has expired. Please request a new OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receivedToken}`
        },
        body: JSON.stringify({ username, fullName, phoneNumber, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to complete registration.');
        return;
      }

      setStep('PASSWORD');
      setSuccessMsg(data.message || 'Registration complete. Log in with your email and password.');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (err) {
      setErrorMsg('Registration gateway returned an unexpected response.');
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Password login failed.');
        return;
      }

      onAuthenticated(data.user, data.token);
    } catch (err) {
      setErrorMsg('Unable to contact the password login endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to request password reset OTP.');
        return;
      }

      setStep('FORGOT_OTP');
      setSuccessMsg('Password reset OTP sent to your email.');
      if (data.sandboxOtp) {
        setInfoMsg(`Sandbox OTP: ${data.sandboxOtp}`);
      }
    } catch (err) {
      setErrorMsg('Unable to reach password reset endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const submitVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!resetOtp) {
      setErrorMsg('Please enter the password reset OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: resetOtp })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Password reset OTP verification failed.');
        return;
      }

      setResetToken(data.resetToken);
      setStep('RESET_PASSWORD');
      setSuccessMsg('OTP verified. Enter your new password.');
    } catch (err) {
      setErrorMsg('Password reset verification failed unexpectedly.');
    } finally {
      setLoading(false);
    }
  };

  const submitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!password || !confirmPassword || password.length < 8 || password !== confirmPassword) {
      setErrorMsg('Please set a strong password and confirm it correctly.');
      return;
    }
    if (!resetToken) {
      setErrorMsg('Password reset session has expired. Request a new OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to reset password.');
        return;
      }

      setStep('PASSWORD');
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg(data.message || 'Password updated successfully. Log in with your new password.');
    } catch (err) {
      setErrorMsg('Unable to complete password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-box" className="w-full max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        {websiteLogo ? (
          <img
            src={websiteLogo}
            alt="FigTyp Brand Logo"
            className="mx-auto max-h-16 max-w-[200px] object-contain rounded-xl border border-slate-800 p-2 bg-slate-950/40 neon-shadow-blue"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] rounded-xl flex items-center justify-center neon-shadow-blue">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
        )}
        <h2 className="text-2xl font-semibold text-white tracking-tight font-display">
          Welcome to <span className="text-[#00F3FF]">FigTyp</span>
        </h2>
        <p className="text-slate-400 text-xs font-sans">
          Secure Email OTP & Password Authentication Gateway
        </p>
      </div>

      {errorMsg ? (
        <div className="p-3 text-[11px] font-mono text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/35 rounded-lg text-center animate-shake">
          ?? {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="p-3 text-[11px] font-mono text-[#00FF95] bg-[#0f4f30]/10 border border-[#00FF95]/30 rounded-lg text-center">
          ? {successMsg}
        </div>
      ) : null}

      {infoMsg ? (
        <div className="p-3 text-[11px] font-mono text-[#8B5CF6] bg-[#1e1b36]/90 border border-[#8B5CF6]/20 rounded-lg text-center">
          {infoMsg}
        </div>
      ) : null}

      {step === 'EMAIL' && (
        <form onSubmit={submitEmail} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Request OTP
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();
              setStep('PASSWORD');
            }}
            className="w-full py-3 border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white rounded-xl font-mono text-xs transition"
          >
            Login with Email & Password
          </button>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={submitOtp} className="space-y-4">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <p className="text-[11px] text-slate-400 text-center">
              A verification code has been sent to <strong className="text-white">{email}</strong>.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">6-Digit OTP</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white tracking-widest text-center transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setStep('EMAIL');
                setOtp('');
              }}
              className="py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs rounded-xl cursor-pointer transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verify OTP
            </button>
          </div>
        </form>
      )}

      {step === 'PROFILE' && (
        <form onSubmit={submitRegister} className="space-y-4">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00FF95]" />
            <span className="text-[10px] text-slate-300 font-sans">
              Complete registration to lock in your profile and password.
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="profile-email" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Email</label>
              <input
                id="profile-email"
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Md Moshiur"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="MoshiurSWE"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +8801712345678"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Complete Registration
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();
              setStep('PASSWORD');
            }}
            className="w-full py-2 border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white rounded-xl font-mono text-xs transition"
          >
            Skip registration and login with password
          </button>
        </form>
      )}

      {step === 'PASSWORD' && (
        <form onSubmit={submitPasswordLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@example.com"
              className="w-full px-3 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Login with Password
          </button>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setStep('FORGOT_EMAIL');
              }}
              className="w-full py-3 border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white rounded-xl font-mono text-xs transition"
            >
              Forgot Password
            </button>
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setStep('EMAIL');
              }}
              className="w-full py-3 border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white rounded-xl font-mono text-xs transition"
            >
              Request OTP Instead
            </button>
          </div>
        </form>
      )}

      {step === 'FORGOT_EMAIL' && (
        <form onSubmit={submitForgotPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@example.com"
              className="w-full px-3 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Request Password Reset OTP
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();
              setStep('PASSWORD');
            }}
            className="w-full py-3 border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white rounded-xl font-mono text-xs transition"
          >
            Back to Login
          </button>
        </form>
      )}

      {step === 'FORGOT_OTP' && (
        <form onSubmit={submitVerifyResetOtp} className="space-y-4">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-400 text-center">
              Enter the reset code sent to <strong className="text-white">{email}</strong>.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Reset OTP</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                maxLength={6}
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white tracking-widest text-center transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setStep('FORGOT_EMAIL');
                setResetOtp('');
              }}
              className="py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs rounded-xl cursor-pointer transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verify Reset Code
            </button>
          </div>
        </form>
      )}

      {step === 'RESET_PASSWORD' && (
        <form onSubmit={submitResetPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-3 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Reset Password
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();
              setStep('PASSWORD');
              setPassword('');
              setConfirmPassword('');
            }}
            className="w-full py-3 border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white rounded-xl font-mono text-xs transition"
          >
            Back to Login
          </button>
        </form>
      )}

      <div className="pt-4 border-t border-slate-950 text-center">
        <span className="text-[10px] text-slate-600 font-sans block">Want to preview the system first?</span>
        <button
          onClick={() => {
            onAuthenticated(
              {
                id: 'guest-' + Math.random().toString(36).substr(2, 5),
                email: 'guest@figtyp.ai',
                username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
                fullName: 'Guest Observer',
                role: 'GUEST',
                xp: 0,
                level: 1,
                coins: 0,
                streak: 0,
                lastActive: new Date().toISOString(),
                createdAt: new Date().toISOString()
              },
              ''
            );
          }}
          className="text-[11px] underline font-semibold text-[#00F3FF] hover:text-[#0077FF] hover:cursor-pointer mt-1"
        >
          Enter Workspace as Guest Visitor ?
        </button>
      </div>
    </div>
  );
}
