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

  // Social Login states & handlers
  const [agreedToSocialImport, setAgreedToSocialImport] = useState<boolean>(true);
  const [socialModalProvider, setSocialModalProvider] = useState<'google' | 'github' | 'apple' | null>(null);
  const [socialAccountEmail, setSocialAccountEmail] = useState('');
  const [socialAccountName, setSocialAccountName] = useState('');
  const [socialAccountAvatar, setSocialAccountAvatar] = useState('');

  const handleInitiateSocialLogin = (provider: 'google' | 'github' | 'apple') => {
    if (!agreedToSocialImport) {
      setError('Please check the permission box to allow importing your profile details.');
      return;
    }
    clearMessages();
    setSocialModalProvider(provider);
    if (provider === 'google') {
      setSocialAccountName('Google User');
      setSocialAccountEmail('user.google@gmail.com');
      setSocialAccountAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    } else if (provider === 'github') {
      setSocialAccountName('Octocat Dev');
      setSocialAccountEmail('dev.octocat@github.com');
      setSocialAccountAvatar('https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80');
    } else {
      setSocialAccountName('Apple Typist');
      setSocialAccountEmail('typist.icloud@apple.com');
      setSocialAccountAvatar('https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80');
    }
  };

  const handleConfirmSocialLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!socialModalProvider || !socialAccountEmail.trim()) return;
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`${API_BASE_URL}/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: socialModalProvider,
          email: socialAccountEmail.trim(),
          name: socialAccountName.trim(),
          avatarUrl: socialAccountAvatar.trim(),
          agreedToImport: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSocialModalProvider(null);
        onAuthenticated(data.user, data.token);
      } else {
        setError(data.error || 'Social login failed.');
      }
    } catch (err) {
      setError('Network error during social authentication.');
    } finally {
      setLoading(false);
    }
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

          {/* Social Profile Import Permission Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-black/15 dark:border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToSocialImport}
              onChange={(e) => setAgreedToSocialImport(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-2 border-black text-cyan-500 focus:ring-cyan-400 cursor-pointer"
            />
            <span className="text-xs text-black dark:text-slate-300 font-sans leading-relaxed">
              I authorize FigTyp to automatically import my <strong>name, email, and avatar</strong> from my social account to set up my profile.
            </span>
          </label>

          {/* Social Sign-In Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleInitiateSocialLogin('google')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm text-black dark:text-white"
              title="Login with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => handleInitiateSocialLogin('github')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm text-black dark:text-white"
              title="Login with GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </button>

            <button
              type="button"
              onClick={() => handleInitiateSocialLogin('apple')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm text-black dark:text-white"
              title="Login with Apple"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.13.64-2.79 1.42-.58.68-1.1 1.76-.96 2.8 1.08.08 2.12-.6 2.74-1.35z"/>
              </svg>
              Apple
            </button>
          </div>

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

          <div className="flex items-center my-3">
            <div className="flex-1 border-t-2 border-black dark:border-slate-800"></div>
            <span className="px-3 text-xs text-black dark:text-slate-500 uppercase font-mono font-bold">Or Register With</span>
            <div className="flex-1 border-t-2 border-black dark:border-slate-800"></div>
          </div>

          {/* Social Sign-In Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleInitiateSocialLogin('google')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm text-black dark:text-white"
              title="Sign up with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => handleInitiateSocialLogin('github')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm text-black dark:text-white"
              title="Sign up with GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </button>

            <button
              type="button"
              onClick={() => handleInitiateSocialLogin('apple')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-black dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm text-black dark:text-white"
              title="Sign up with Apple"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.13.64-2.79 1.42-.58.68-1.1 1.76-.96 2.8 1.08.08 2.12-.6 2.74-1.35z"/>
              </svg>
              Apple
            </button>
          </div>

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

      {/* Interactive Social Login Confirmation Modal */}
      {socialModalProvider && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-black dark:text-white space-y-5 animate-zoomIn">
            
            <div className="flex items-center justify-between pb-3 border-b-2 border-black/10 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {socialModalProvider === 'google' ? '🌐' : socialModalProvider === 'github' ? '🐙' : '🍏'}
                </span>
                <h3 className="font-bold text-lg capitalize font-display">
                  Sign In with {socialModalProvider}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSocialModalProvider(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Confirm your account credentials. Your name, email, and avatar will be automatically imported into your <strong>FigTyp Profile</strong>.
              </p>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-black/15 dark:border-slate-800">
                <img
                  src={socialAccountAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt="Avatar preview"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-black dark:border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-bold text-sm truncate text-black dark:text-white">
                    {socialAccountName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate font-mono">
                    {socialAccountEmail}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  Display Full Name (Auto-Extracted)
                </label>
                <input
                  type="text"
                  value={socialAccountName}
                  onChange={(e) => setSocialAccountName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  Account Email (Auto-Extracted)
                </label>
                <input
                  type="email"
                  value={socialAccountEmail}
                  onChange={(e) => setSocialAccountEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  Profile Avatar Image URL (Auto-Extracted)
                </label>
                <input
                  type="text"
                  value={socialAccountAvatar}
                  onChange={(e) => setSocialAccountAvatar(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border-2 border-black dark:border-slate-800 rounded-xl px-3 py-2 text-black dark:text-white outline-none text-[11px] font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSocialModalProvider(null)}
                className="flex-1 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-black dark:text-white rounded-xl font-bold font-mono text-xs cursor-pointer border-2 border-black dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSocialLogin()}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold font-mono text-xs rounded-xl cursor-pointer shadow-md border-2 border-black dark:border-transparent disabled:opacity-50"
              >
                {loading ? 'Extracting & Logging in...' : 'Authorize & Sign In'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}