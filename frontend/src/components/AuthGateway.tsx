import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config';

interface AuthGatewayProps {
  onAuthenticated: (user: any, token: string) => void;
  websiteLogo?: string;
  mSquareLogo?: string;
}

type AuthMode = 'LOGIN' | 'OTP_VERIFY' | 'REGISTER' | 'FORGOT_PWD' | 'RESET_VERIFY' | 'SET_PWD';

export default function AuthGateway({ onAuthenticated, websiteLogo, mSquareLogo }: AuthGatewayProps) {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Registration states
  const [username, setUsername] = useState('');

  // Backend URL configuration
  const API_BASE_URL = `${API_URL}/api/auth`;

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
    setShowRegPassword(false);
    setShowNewPassword(false);
  };

  // --- 1. Password Login ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        onAuthenticated(data.user, data.token);
      } else {
        // If user is not yet verified, redirect directly to OTP verification page
        if (res.status === 403 && data.isVerified === false) {
          setSuccessMsg(data.message || 'A new OTP has been sent to your email. Please verify to login.');
          setMode('OTP_VERIFY');
        } else {
          setError(data.error || data.message || 'Login failed. Incorrect email or password.');
        }
      }
    } catch (err) {
      setError('Network error. Server might be down.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Register Profile ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (res.ok || res.status === 201) {
        setSuccessMsg(data.message || 'OTP sent to your email!');
        setMode('OTP_VERIFY'); 
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Server might be down.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Verify OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        onAuthenticated(data.user, data.token);
      } else {
        setError(data.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('Network error. Server might be down.');
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Forgot Password Flow ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || 'Reset code sent to your email.');
        setMode('RESET_VERIFY');
      } else {
        setError(data.error || 'Failed to send reset code.');
      }
    } catch (err) {
      setError('Network error. Server might be down.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    clearMessages();
    setMode('SET_PWD');
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || 'Password reset successfully! Please login.');
        setMode('LOGIN');
        setPassword(''); 
        setOtp(''); 
      } else {
        setError(data.error || 'Password reset failed.');
        setMode('RESET_VERIFY'); 
      }
    } catch (err) {
      setError('Network error. Server might be down.');
    } finally {
      setLoading(false);
    }
  };

  // --- 5. Guest Login ---
  const handleGuestLogin = () => {
    const mockGuest = {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      username: 'Guest_Typist',
      fullName: 'Guest User',
      role: 'GUEST',
      xp: 0, level: 1, coins: 0, streak: 0, badges: []
    };
    onAuthenticated(mockGuest, '');
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 p-8 rounded-2xl shadow-xl text-black dark:text-white">
      
      {/* --- LOGO SECTION --- */}
      <div className="flex justify-center mb-6">
        {websiteLogo ? (
          <img 
            src={websiteLogo} 
            alt="FigTyp Logo" 
            className="w-28 h-28 object-contain rounded-2xl border-2 border-black dark:border-slate-700 shadow-md dark:shadow-[0_0_25px_rgba(0,243,255,0.3)]" 
          />
        ) : (
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] border-2 border-black dark:border-transparent flex items-center justify-center font-display font-extrabold text-white text-5xl shadow-md dark:shadow-[0_0_25px_rgba(0,243,255,0.3)]">
            FT
          </div>
        )}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">Welcome to FigTyp</h2>
        <p className="text-black dark:text-slate-400 text-sm mt-2 font-medium">Secure Neural Authentication</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border-2 border-red-500 rounded-lg text-red-600 dark:text-red-400 text-sm text-center font-bold">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-500/10 border-2 border-emerald-500 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm text-center font-bold">
          {successMsg}
        </div>
      )}

      {/* ================= MODE: LOGIN ================= */}
      {mode === 'LOGIN' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 font-bold font-mono">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-medium text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="login-password" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 font-bold font-mono">Password</label>
              <button 
                type="button" 
                onClick={() => { setMode('FORGOT_PWD'); clearMessages(); }} 
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder={showPassword ? "Enter password" : "••••••••"}
                className={`w-full pl-4 pr-11 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors text-base font-semibold ${
                  showPassword ? 'font-sans tracking-normal' : 'font-mono tracking-wider password-dots'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black dark:text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md border-2 border-black dark:border-transparent text-base"
          >
            {loading ? 'Authenticating...' : 'Login Securely'}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t-2 border-black dark:border-slate-800"></div>
            <span className="px-3 text-xs text-black dark:text-slate-500 uppercase font-mono font-bold">Or Continue With</span>
            <div className="flex-1 border-t-2 border-black dark:border-slate-800"></div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setMode('REGISTER'); clearMessages(); }}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 dark:bg-[#1e293b] dark:hover:bg-[#334155] border-2 border-black dark:border-slate-700 text-black dark:text-white font-bold py-3 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
            >
              Create New Account
            </button>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full bg-white hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 border-2 border-black dark:border-slate-700 text-black dark:text-slate-300 font-bold py-3 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
            >
              Play as Guest
            </button>
          </div>
        </form>
      )}

      {/* ================= MODE: REGISTER ================= */}
      {mode === 'REGISTER' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-sm text-black dark:text-slate-400 font-semibold">Join the ultimate typing arena.</p>
          </div>
          <div>
            <label htmlFor="reg-user" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 font-bold font-mono">Username</label>
            <input
              id="reg-user"
              type="text"
              required
              placeholder="e.g. typing_master"
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-medium text-base"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 font-bold font-mono">Email Address</label>
            <input
              id="reg-email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-medium text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 font-bold font-mono">Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showRegPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder={showRegPassword ? "Minimum 6 characters" : "••••••••"}
                className={`w-full pl-4 pr-11 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors text-base font-semibold ${
                  showRegPassword ? 'font-sans tracking-normal' : 'font-mono tracking-wider password-dots'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowRegPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black dark:text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer"
                title={showRegPassword ? "Hide password" : "Show password"}
                aria-label="Toggle password visibility"
              >
                {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md border-2 border-black dark:border-transparent text-base"
          >
            {loading ? 'Creating Account...' : 'Register & Send OTP'}
          </button>
          <button type="button" onClick={() => { setMode('LOGIN'); clearMessages(); }} className="w-full text-black dark:text-slate-400 text-sm mt-2 hover:underline font-bold cursor-pointer transition-colors">
            &larr; Back to Login
          </button>
        </form>
      )}

      {/* ================= MODE: OTP VERIFY ================= */}
      {mode === 'OTP_VERIFY' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-sm text-black dark:text-slate-400 font-medium">We've sent a 6-digit code to <br/><span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{email}</span></p>
          </div>
          <div>
            <label htmlFor="auth-otp" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 text-center font-bold font-mono">Enter OTP</label>
            <input
              id="auth-otp"
              type="text"
              required
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-bold"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#8B5CF6] hover:bg-purple-500 text-white font-extrabold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md border-2 border-black dark:border-transparent text-base">
            {loading ? 'Verifying...' : 'Verify OTP & Login'}
          </button>
          <button type="button" onClick={() => { setMode('REGISTER'); clearMessages(); }} className="w-full text-black dark:text-slate-400 text-sm mt-2 hover:underline font-bold cursor-pointer transition-colors">
            &larr; Wrong email? Go back
          </button>
        </form>
      )}

      {/* ================= MODE: FORGOT PASSWORD ================= */}
      {mode === 'FORGOT_PWD' && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-sm text-black dark:text-slate-400 font-semibold">Enter your email to receive a password reset code.</p>
          </div>
          <div>
            <label htmlFor="reset-email" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 font-bold font-mono">Email Address</label>
            <input
              id="reset-email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-medium text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-rose-500 hover:bg-rose-400 text-white font-extrabold py-3 rounded-lg disabled:opacity-50 cursor-pointer shadow-md border-2 border-black dark:border-transparent text-base">
            {loading ? 'Sending...' : 'Send Reset OTP'}
          </button>
          <button type="button" onClick={() => { setMode('LOGIN'); clearMessages(); }} className="w-full text-black dark:text-slate-400 text-sm mt-2 hover:underline font-bold cursor-pointer transition-colors">
            &larr; Back to Login
          </button>
        </form>
      )}

      {/* ================= MODE: RESET VERIFY ================= */}
      {mode === 'RESET_VERIFY' && (
        <form onSubmit={handleVerifyResetOtp} className="space-y-4">
           <div className="text-center mb-2">
            <p className="text-sm text-black dark:text-slate-400 font-medium">Reset code sent to <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{email}</span></p>
          </div>
          <div>
            <label htmlFor="reset-otp" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 font-bold font-mono">Enter Reset OTP</label>
            <input
              id="reset-otp"
              type="text"
              required
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-bold"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#8B5CF6] hover:bg-purple-500 text-white font-extrabold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md border-2 border-black dark:border-transparent text-base">
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}

      {/* ================= MODE: SET NEW PASSWORD ================= */}
      {mode === 'SET_PWD' && (
        <form onSubmit={handleSetNewPassword} className="space-y-4">
          <div>
            <label htmlFor="new-pass" className="block text-xs uppercase tracking-wider text-black dark:text-slate-400 mb-1 font-bold font-mono">Enter New Password</label>
            <div className="relative">
              <input
                id="new-pass"
                type={showNewPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder={showNewPassword ? "Minimum 8 characters" : "••••••••"}
                className={`w-full pl-4 pr-11 py-3 rounded-lg bg-white dark:bg-[#0B0F19] border-2 border-black dark:border-slate-700 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors text-base font-semibold ${
                  showNewPassword ? 'font-sans tracking-normal' : 'font-mono tracking-wider password-dots'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black dark:text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer"
                title={showNewPassword ? "Hide password" : "Show password"}
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold py-3 rounded-lg disabled:opacity-50 cursor-pointer shadow-md border-2 border-black dark:border-transparent text-base">
            {loading ? 'Saving...' : 'Save New Password'}
          </button>
        </form>
      )}

      {/* M-Square Devs Branding Section */}
      <div className="mt-8 pt-6 border-t-2 border-black dark:border-slate-800 flex flex-col items-center gap-4 text-center">
        <p className="text-xs text-black dark:text-slate-500 font-mono font-bold">Powered by</p>
        <div className="flex items-center justify-center gap-3">
          {mSquareLogo ? (
            <img 
              src={mSquareLogo} 
              alt="M-Square Devs Logo" 
              className="h-10 object-contain"
            />
          ) : (
            <div className="text-sm font-bold text-black dark:text-white tracking-wider">
              M-Square Devs
            </div>
          )}
        </div>
        <p className="text-[10px] text-black dark:text-slate-500 font-mono font-medium">Premium Software Development & Consulting</p>
      </div>

    </div>
  );
}