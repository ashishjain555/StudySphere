import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, GraduationCap, Check, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onSuccess }) => {
  const { register, verifyRegisterOtp, resendVerification, loginWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredNeedsConfirmation, setRegisteredNeedsConfirmation] = useState(false);

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to initialize Google Sign-In.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error with Google Sign-In.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName || !cleanEmail || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(cleanFullName, cleanEmail, password, role);
      if (res.success) {
        if (res.needsEmailConfirmation) {
          setRegisteredNeedsConfirmation(true);
        } else {
          onSuccess();
        }
      } else {
        setErrorMessage(res.error || 'Registration failed. An account with this email may already exist.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setOtpError('Please enter the 6-digit confirmation code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyRegisterOtp(email, cleanCode);
      if (res.success) {
        onSuccess();
      } else {
        setOtpError(res.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    setResendNotice('');
    setOtpError('');
    try {
      const res = await resendVerification(email);
      if (res.success) {
        setResendNotice('Fresh verification code sent to your email!');
      } else {
        setOtpError(res.error || 'Failed to resend verification code.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Could not resend code.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="w-full max-w-md bg-slate-900/90 p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 animate-fadeIn backdrop-blur-xl">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium text-white tracking-tight">StudySphere</span>
          </div>
          <h2 className="text-2xl font-medium text-slate-100">
            {registeredNeedsConfirmation ? 'Verify Email' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-normal">
            {registeredNeedsConfirmation
              ? 'Enter the 6-digit confirmation code sent to your email'
              : 'Set up your personalized learning workspace'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && !registeredNeedsConfirmation && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* OTP Error Alert */}
        {otpError && registeredNeedsConfirmation && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{otpError}</span>
          </div>
        )}

        {registeredNeedsConfirmation ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Code dispatched to <strong className="text-white font-mono">{email}</strong>
              </span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-slate-100 placeholder-slate-600 text-center text-xl font-mono tracking-widest focus:outline-none transition-all"
                  />
                </div>
              </div>

              {resendNotice && (
                <p className="text-xs text-emerald-400 text-center font-medium">{resendNotice}</p>
              )}

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length < 6}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/10"
              >
                {isVerifyingOtp ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm & Complete Registration
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendingOtp}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isResendingOtp ? 'animate-spin' : ''}`} />
                  {isResendingOtp ? 'Sending...' : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => setRegisteredNeedsConfirmation(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Change Email
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <span className="text-[11px] text-slate-500">Min. 6 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
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

          {/* Confirm Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Confirm Password
              </label>
              {passwordsMatch && (
                <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </span>
              )}
              {passwordsMismatch && (
                <span className="text-[11px] text-rose-400">
                  Passwords do not match
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password to confirm"
                required
                className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all ${
                  passwordsMismatch 
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50' 
                    : passwordsMatch
                    ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50'
                    : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs border border-blue-400/30 flex items-center justify-center gap-2 transition-all mt-3 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/10"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
            Or sign up with
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
        </>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
