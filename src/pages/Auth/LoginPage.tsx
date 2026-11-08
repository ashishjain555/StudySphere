import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onSuccess }) => {
  const { login, resendVerification, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      sessionStorage.setItem('studysphere_play_book_transition', '1');
      const res = await loginWithGoogle();
      if (!res.success) {
        sessionStorage.removeItem('studysphere_play_book_transition');
        setErrorMessage(res.error || 'Failed to initialize Google Sign-In.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      sessionStorage.removeItem('studysphere_play_book_transition');
      setErrorMessage(err?.message || 'Unexpected error with Google Sign-In.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsEmailUnconfirmed(false);
    setResendStatus(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(cleanEmail, password);
      if (res.success) {
        onSuccess();
      } else {
        setIsEmailUnconfirmed(Boolean(res.isEmailUnconfirmed));
        setErrorMessage(res.error || 'Invalid email address or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setResendStatus({ message: 'Please enter your email address first.', isError: true });
      return;
    }
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerification(cleanEmail);
      if (res.success) {
        setResendStatus({
          message: 'Verification link sent! Please check your inbox and spam folder.',
          isError: false,
        });
      } else {
        const isRateLimit = res.error?.toLowerCase().includes('rate limit');
        setResendStatus({
          message: isRateLimit
            ? 'Supabase free email limit reached (max 3/hr). Please use the Auto Confirm fix below!'
            : res.error || 'Failed to send confirmation email.',
          isError: true,
        });
      }
    } catch (err: any) {
      setResendStatus({ message: err?.message || 'Error sending confirmation.', isError: true });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="w-full max-w-md bg-slate-900/90 p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 animate-fadeIn backdrop-blur-xl">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <BrandLogo size="md" />
            <span className="text-xl font-medium text-white tracking-tight">StudySphere</span>
          </div>
          <h2 className="text-2xl font-medium text-slate-100">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1 font-normal">Sign in to your personalized study workspace</p>
        </div>

        {/* Error Alert with special Unconfirmed Email assistance */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col gap-3 text-xs animate-fadeIn">
            <div className="flex items-start gap-2.5 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block text-rose-200">
                  {isEmailUnconfirmed ? 'Email Not Confirmed' : 'Sign In Error'}
                </span>
                <span className="leading-relaxed text-slate-300 mt-0.5 block">
                  {errorMessage}
                </span>
              </div>
            </div>

            {isEmailUnconfirmed && (
              <div className="pt-2.5 border-t border-rose-500/20 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isResending ? 'Sending email...' : 'Resend Confirmation Email'}
                  </button>
                  {resendStatus && (
                    <span
                      className={`text-[11px] ${
                        resendStatus.isError ? 'text-rose-400' : 'text-emerald-400 font-medium'
                      }`}
                    >
                      {resendStatus.message}
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-amber-300 block mb-0.5">Quick Fix for instant login without verification:</strong>
                  In Supabase Dashboard &rarr; <span className="text-slate-200">Authentication &rarr; Providers &rarr; Email</span>, turn <span className="text-amber-200 font-semibold">"Confirm email" OFF</span>, and in <span className="text-slate-200">Users</span> click <span className="text-amber-200 font-semibold">"Auto confirm"</span> on your email.
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-xs text-blue-400 hover:text-blue-300 font-normal transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500/50 cursor-pointer"
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/10"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In to Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
            Or continue with
          </span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 text-slate-200 hover:text-white font-medium text-xs border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Footer Navigation */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('/register')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
          >
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
};
