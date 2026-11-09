import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = 'signin',
  onSuccess,
  onError,
}) => {
  const { loginWithGoogleIdToken, loginWithGoogle } = useAuth();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const rawNonceRef = useRef<string | undefined>(undefined);

  // Generate cryptographically secure nonce for replay attack prevention
  const generateNonce = useCallback(async () => {
    try {
      const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      rawNonceRef.current = raw;
      const encoder = new TextEncoder();
      const data = encoder.encode(raw);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashed = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return { raw, hashed };
    } catch {
      return { raw: undefined, hashed: undefined };
    }
  }, []);

  // Handle Google GIS credential response (JWT ID Token)
  const handleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response?.credential) {
        onError?.('No credential received from Google.');
        return;
      }

      setIsLoading(true);
      try {
        sessionStorage.setItem('studysphere_play_book_transition', '1');

        // First attempt with cryptographic nonce
        let res = await loginWithGoogleIdToken(response.credential, rawNonceRef.current);

        // If nonce validation failed or provider expects nonce-less token, retry without nonce
        if (!res.success && res.error && res.error.toLowerCase().includes('nonce')) {
          res = await loginWithGoogleIdToken(response.credential);
        }

        if (res.success) {
          onSuccess();
        } else {
          sessionStorage.removeItem('studysphere_play_book_transition');
          onError?.(res.error || 'Failed to authenticate with Google.');
        }
      } catch (err: any) {
        sessionStorage.removeItem('studysphere_play_book_transition');
        onError?.(err?.message || 'Unexpected error during Google Sign-In.');
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogleIdToken, onSuccess, onError]
  );

  // Initialize and render the official Google Identity Services button
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let attempts = 0;

    const initGoogleGsi = async () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return false;

      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        '972119099040-lc8uocvdec6dljkqhhfs0k0pddrhdhb7.apps.googleusercontent.com';

      const { hashed } = await generateNonce();

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          nonce: hashed,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Clear existing children before rendering
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
        }

        // Measure container width for responsive button
        const containerWidth = googleBtnContainerRef.current?.offsetWidth || 384;
        const clampedWidth = Math.max(220, Math.min(400, containerWidth));

        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: clampedWidth,
        });

        // Optionally prompt One Tap
        try {
          window.google.accounts.id.prompt();
        } catch {
          // Non-blocking
        }

        setIsGsiLoaded(true);
        return true;
      } catch (err) {
        console.warn('Google Identity Services initialization notice:', err);
        return false;
      }
    };

    // Check if script is already ready
    if (window.google?.accounts?.id) {
      initGoogleGsi();
    } else {
      // Poll every 100ms for up to 3 seconds for GIS script to load
      checkInterval = setInterval(async () => {
        attempts++;
        if (window.google?.accounts?.id) {
          const success = await initGoogleGsi();
          if (success && checkInterval) clearInterval(checkInterval);
        } else if (attempts > 30) {
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [mode, handleCredentialResponse, generateNonce]);

  // Fallback OAuth redirect if GSI script is blocked (e.g. adblocker)
  const handleFallbackOAuth = async () => {
    setIsLoading(true);
    try {
      sessionStorage.setItem('studysphere_play_book_transition', '1');
      const res = await loginWithGoogle();
      if (!res.success) {
        sessionStorage.removeItem('studysphere_play_book_transition');
        onError?.(res.error || 'Failed to initialize Google Sign-In.');
        setIsLoading(false);
      }
    } catch (err: any) {
      sessionStorage.removeItem('studysphere_play_book_transition');
      onError?.(err?.message || 'Unexpected error with Google Sign-In.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {isLoading ? (
        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-center gap-2.5 text-xs text-slate-300 font-medium">
          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          <span>Authenticating with StudySphere AI...</span>
        </div>
      ) : (
        <>
          {/* Official Native Google Button Container (Zero supabase.co redirect) */}
          <div
            ref={googleBtnContainerRef}
            className={`w-full flex justify-center items-center overflow-hidden rounded-xl ${
              isGsiLoaded ? 'min-h-[44px]' : 'hidden'
            }`}
          />

          {/* Seamless Fallback Button if GIS script is blocked or still loading */}
          {!isGsiLoaded && (
            <button
              type="button"
              onClick={handleFallbackOAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 text-slate-200 hover:text-white font-medium text-xs border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
            >
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
              <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
