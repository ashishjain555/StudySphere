import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = 'signin',
  onError,
}) => {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      sessionStorage.setItem('studysphere_play_book_transition', '1');
      const res = await loginWithGoogle();
      if (!res.success) {
        sessionStorage.removeItem('studysphere_play_book_transition');
        onError?.(res.error || 'Failed to initialize Google Sign-In.');
        setIsLoading(false);
      }
      // On success, browser redirects to Google's consent screen with StudySphere AI branding & confirmation
    } catch (err: any) {
      sessionStorage.removeItem('studysphere_play_book_transition');
      onError?.(err?.message || 'Unexpected error during Google Sign-In.');
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
      className="group relative w-full h-11 px-4 rounded-xl bg-gradient-to-r from-slate-900/95 via-slate-950/90 to-slate-900/95 hover:from-slate-850 hover:via-slate-900 hover:to-slate-850 text-slate-200 hover:text-white border border-slate-700/80 hover:border-blue-500/50 flex items-center justify-center gap-3 transition-all duration-200 ease-out cursor-pointer shadow-md shadow-black/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
    >
      {/* Subtle hover gradient glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {isLoading ? (
        <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          <span>Connecting to Google...</span>
        </div>
      ) : (
        <>
          {/* Official Google 4-Color Icon */}
          <div className="w-5 h-5 shrink-0 flex items-center justify-center p-0.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
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
          </div>

          <span className="text-xs font-semibold text-slate-200 group-hover:text-white tracking-wide transition-colors">
            {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
          </span>
        </>
      )}
    </button>
  );
};
