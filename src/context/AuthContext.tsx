import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DataStore, DEFAULT_USER } from '../lib/dataStore';
import { autoSeedCurriculumToSupabase } from '../lib/supabaseSync';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; isEmailUnconfirmed?: boolean }>;
  register: (fullName: string, email: string, pass: string, role?: UserRole) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  verifyRegisterOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordResetOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  verifyCurrentPassword: (currentPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleIdToken: (idToken: string, nonce?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps Supabase Auth User object to application UserProfile
 * while preserving any permanent locally configured avatar and personal information.
 */
function mapAuthUserToProfile(authUser: any): UserProfile {
  const metadata = authUser.user_metadata || {};
  const email = (authUser.email || '').trim().toLowerCase();
  const emailKey = email.replace(/[^a-z0-9]/g, '_');

  // Check if we have permanent locally saved profile data for this email
  let savedProfile: Partial<UserProfile> = {};
  try {
    const rawSaved = localStorage.getItem(`studysphere_profile_${emailKey}`);
    if (rawSaved) {
      savedProfile = JSON.parse(rawSaved);
    } else {
      const reg = JSON.parse(localStorage.getItem('studysphere_registered_users') || '{}');
      if (reg[emailKey]) savedProfile = reg[emailKey];
      else if (reg[authUser.id]) savedProfile = reg[authUser.id];
    }
  } catch {}

  const fullName =
    savedProfile.fullName ||
    metadata.full_name ||
    metadata.name ||
    (metadata.given_name ? `${metadata.given_name} ${metadata.family_name || ''}`.trim() : '') ||
    (email ? email.split('@')[0] : 'Student');

  const avatarUrl =
    savedProfile.avatarUrl ||
    metadata.avatar_url ||
    metadata.picture ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || email || 'User')}`;

  const role: UserRole = (savedProfile.role || (metadata.role === 'teacher' ? 'teacher' : 'student'));

  return {
    id: authUser.id,
    email,
    fullName,
    role,
    avatarUrl,
    institution: savedProfile.institution || metadata.institution || '',
    semester: savedProfile.semester || metadata.semester || '',
    major: savedProfile.major || metadata.major || '',
    targetGoal: savedProfile.targetGoal || metadata.target_goal || '',
    createdAt: savedProfile.createdAt || authUser.created_at || new Date().toISOString(),
  };
}

/**
 * Non-blocking profile synchronization for future database readiness.
 * Attempts to upsert to public.profiles if the table exists, but never
 * blocks authentication or throws if the table has not yet been created.
 */
async function trySyncDatabaseProfile(profile: UserProfile): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        role: profile.role,
        avatar_url: profile.avatarUrl,
        created_at: profile.createdAt,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.info('Notice: public.profiles table not ready yet; continuing with auth session identity.');
    }
  } catch {
    // Non-blocking
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => DataStore.getUser());
  const [loading, setLoading] = useState(true);

  // Sync user identity to local state and DataStore workspace
  const handleAuthenticatedUser = (authUser: any) => {
    const profile = mapAuthUserToProfile(authUser);

    // Initialize clean student workspace if new user
    const registered = JSON.parse(localStorage.getItem('studysphere_registered_users') || '{}');
    const emailKey = profile.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    if (!registered[profile.id] && !registered[emailKey]) {
      DataStore.initializeNewUser(profile);
    } else {
      DataStore.setUser(profile);
    }

    setUser(profile);
    trySyncDatabaseProfile(profile);
    // Cloud sync curriculum & workspace records
    autoSeedCurriculumToSupabase().catch(() => {});
    DataStore.syncRemoteData().catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          // 1. Restore current session from Supabase client
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession notice:', error.message);
          } else if (session?.user && isMounted) {
            handleAuthenticatedUser(session.user);
          }

          // Initial background check to ensure curriculum & remote materials are synced
          autoSeedCurriculumToSupabase().catch(() => {});
          DataStore.syncRemoteData().catch(() => {});
        } catch (err) {
          console.warn('Supabase auth initialization error:', err);
        }

        // 2. Subscribe to real-time authentication events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;

          if (event === 'PASSWORD_RECOVERY') {
            window.history.pushState({}, '', '/forgot-password#type=recovery');
            window.dispatchEvent(new PopStateEvent('popstate'));
            return;
          }

          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
            handleAuthenticatedUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            DataStore.clearActiveSession();
          }
        });

        if (isMounted) setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } else {
        // Fallback when Supabase is not configured
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Standard Email & Password Login
   * Strictly authenticates against Supabase Auth, or verifies stored credentials
   * in offline development mode. Never allows access with invalid credentials.
   */
  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; isEmailUnconfirmed?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
        if (error) {
          const isEmailNotConfirmed =
            error.message.toLowerCase().includes('email not confirmed') ||
            ((error as any).status === 400 && error.message.toLowerCase().includes('not confirmed'));

          if (isEmailNotConfirmed) {
            return {
              success: false,
              isEmailUnconfirmed: true,
              error:
                'Email not confirmed. Supabase requires email verification before signing in. Please check your email inbox or disable "Confirm email" in Supabase settings.',
            };
          }

          return {
            success: false,
            error: error.message.toLowerCase().includes('invalid')
              ? 'Invalid email address or password. Please verify your credentials.'
              : error.message,
          };
        }
        if (data.user) {
          handleAuthenticatedUser(data.user);
          return { success: true };
        }
        return { success: false, error: 'Authentication could not be completed.' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Authentication service error.' };
      }
    }

    // Strict Offline / Local Development Verification
    const emailKey = cleanEmail.replace(/[^a-z0-9]/g, '_');
    let localCredentials: Record<string, { password: string; profile: UserProfile }> = {};
    try {
      localCredentials = JSON.parse(localStorage.getItem('studysphere_local_credentials') || '{}');
    } catch (e) {}

    const account = localCredentials[emailKey];
    if (!account) {
      return {
        success: false,
        error: 'No account found with this email address. Please click "Create Free Account" to register.',
      };
    }

    if (account.password !== pass) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your password and try again.',
      };
    }

    // Password verified
    setUser(account.profile);
    DataStore.setUser(account.profile);
    return { success: true };
  };

  /**
   * Resend signup verification email via Supabase Auth
   */
  const resendVerification = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: cleanEmail,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to resend confirmation email.' };
      }
    }
    return { success: true };
  };

  /**
   * Standard Email & Password Registration
   */
  const register = async (
    fullName: string,
    email: string,
    pass: string,
    role: UserRole = 'student'
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    if (!cleanFullName || !cleanEmail || !pass) {
      return { success: false, error: 'Please fill in all required fields.' };
    }

    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: { full_name: cleanFullName, role },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          // If session is already created (auto-confirm enabled), user is ready
          if (data.session) {
            handleAuthenticatedUser(data.user);
            return { success: true, needsEmailConfirmation: false };
          }
          // Supabase has sent confirmation OTP to email
          return {
            success: true,
            needsEmailConfirmation: true,
          };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Registration failed.' };
      }
    }

    // Strict Offline / Local Registration
    const emailKey = cleanEmail.replace(/[^a-z0-9]/g, '_');
    let localCredentials: Record<string, { password: string; profile: UserProfile }> = {};
    try {
      localCredentials = JSON.parse(localStorage.getItem('studysphere_local_credentials') || '{}');
    } catch (e) {}

    if (localCredentials[emailKey]) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    const profile: UserProfile = {
      id: `usr_${emailKey}_${Date.now()}`,
      email: cleanEmail,
      fullName: cleanFullName,
      role,
      createdAt: new Date().toISOString(),
    };

    localCredentials[emailKey] = {
      password: pass,
      profile,
    };
    localStorage.setItem('studysphere_local_credentials', JSON.stringify(localCredentials));

    // Store pending for OTP check in offline mode
    sessionStorage.setItem(
      'studysphere_pending_reg',
      JSON.stringify({ email: cleanEmail, otp: '123456', profile })
    );

    return { success: true, needsEmailConfirmation: true };
  };

  /**
   * Verifies the 6-digit signup OTP token
   */
  const verifyRegisterOtp = async (
    email: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanEmail || !cleanToken) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'signup',
        });

        if (error) {
          // Fallback to email verification type
          const retry = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: 'email',
          });
          if (retry.error) {
            return { success: false, error: retry.error.message || 'Invalid or expired OTP code.' };
          }
          if (retry.data?.user) {
            handleAuthenticatedUser(retry.data.user);
            return { success: true };
          }
        }

        if (data?.user) {
          handleAuthenticatedUser(data.user);
          return { success: true };
        }
        return { success: false, error: 'OTP verification failed. Please try again.' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Verification failed.' };
      }
    }

    // Local / Offline fallback
    const pendingStr = sessionStorage.getItem('studysphere_pending_reg');
    if (pendingStr) {
      const pending = JSON.parse(pendingStr);
      if (pending.email === cleanEmail && (cleanToken === pending.otp || cleanToken === '123456')) {
        const profile = pending.profile;
        DataStore.initializeNewUser(profile);
        setUser(profile);
        sessionStorage.removeItem('studysphere_pending_reg');
        return { success: true };
      }
    }

    if (cleanToken === '123456') {
      return { success: true };
    }

    return { success: false, error: 'Invalid verification code. (Offline testing code: 123456)' };
  };

  /**
   * Sends password reset OTP to user's email
   */
  const sendPasswordResetOtp = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to send password reset code.' };
      }
    }

    // Offline / Local check
    const emailKey = cleanEmail.replace(/[^a-z0-9]/g, '_');
    const localCreds = JSON.parse(localStorage.getItem('studysphere_local_credentials') || '{}');
    if (!localCreds[emailKey] && !DEFAULT_USER) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    sessionStorage.setItem('studysphere_reset_otp', JSON.stringify({ email: cleanEmail, otp: '123456' }));
    return { success: true };
  };

  /**
   * Verifies 6-digit recovery OTP for password reset
   */
  const verifyPasswordResetOtp = async (
    email: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanEmail || !cleanToken) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'recovery',
        });

        if (error) {
          return { success: false, error: error.message || 'Invalid or expired OTP code.' };
        }

        if (data.session || data.user) {
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Verification failed.' };
      }
    }

    // Offline fallback
    const stored = JSON.parse(sessionStorage.getItem('studysphere_reset_otp') || '{}');
    if (stored.email === cleanEmail && (stored.otp === cleanToken || cleanToken === '123456')) {
      return { success: true };
    }

    return { success: false, error: 'Invalid verification code. (Offline testing code: 123456)' };
  };

  /**
   * Updates password in Supabase and local storage
   */
  const updatePassword = async (
    newPassword: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          handleAuthenticatedUser(data.user);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to update password.' };
      }
    }

    // Offline update
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const emailKey = cleanEmail.replace(/[^a-z0-9]/g, '_');
      const localCreds = JSON.parse(localStorage.getItem('studysphere_local_credentials') || '{}');
      if (localCreds[emailKey]) {
        localCreds[emailKey].password = newPassword;
        localStorage.setItem('studysphere_local_credentials', JSON.stringify(localCreds));
      }
    }

    sessionStorage.removeItem('studysphere_reset_otp');
    return { success: true };
  };

  /**
   * Verifies current password against Supabase or offline credentials
   * to prevent unauthorized password updates on unlocked sessions.
   */
  const verifyCurrentPassword = async (
    currentPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentPassword) {
      return { success: false, error: 'Current password is required.' };
    }
    const cleanEmail = (user?.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'User session not found. Please log in again.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: currentPassword,
        });
        if (error) {
          return {
            success: false,
            error: 'Current password is incorrect. Please verify your current password.',
          };
        }
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Current password verification failed.',
        };
      }
    }

    // Offline / Local verification
    const emailKey = cleanEmail.replace(/[^a-z0-9]/g, '_');
    const localCreds = JSON.parse(localStorage.getItem('studysphere_local_credentials') || '{}');
    if (localCreds[emailKey] && localCreds[emailKey].password) {
      if (localCreds[emailKey].password !== currentPassword) {
        return { success: false, error: 'Current password is incorrect.' };
      }
    }
    return { success: true };
  };

  /**
   * Clears authenticated session and workspace
   */
  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore logout network errors
      }
    }
    setUser(null);
    DataStore.clearActiveSession();
  };

  const switchRole = (newRole: UserRole): void => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    DataStore.setUser(updated);

    if (isSupabaseConfigured) {
      supabase.auth.updateUser({ data: { role: newRole } }).catch(() => {});
    }
  };

  /**
   * One-click Google OAuth authentication via Supabase
   */
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/app/dashboard`,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Google sign-in failed.' };
      }
    }
    return { success: false, error: 'Supabase authentication service is not configured.' };
  };

  /**
   * Native Google Identity Services (ID Token) authentication without supabase.co redirect
   */
  const loginWithGoogleIdToken = async (idToken: string, nonce?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      try {
        const credentials: { provider: 'google'; token: string; nonce?: string } = {
          provider: 'google',
          token: idToken,
        };
        if (nonce) {
          credentials.nonce = nonce;
        }
        const { data, error } = await supabase.auth.signInWithIdToken(credentials);
        if (error) {
          return { success: false, error: error.message };
        }
        if (data?.user) {
          handleAuthenticatedUser(data.user);
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Google sign-in failed.' };
      }
    }
    return { success: false, error: 'Supabase authentication service is not configured.' };
  };

  /**
   * Updates user profile fields in local state, DataStore and Supabase
   */
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active session found.' };
    const updated: UserProfile = { ...user, ...updates };
    setUser(updated);
    DataStore.setUser(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').upsert(
          {
            id: updated.id,
            email: updated.email,
            full_name: updated.fullName,
            role: updated.role,
            avatar_url: updated.avatarUrl,
            created_at: updated.createdAt,
            institution: updated.institution || null,
            semester: updated.semester || null,
            major: updated.major || null,
            target_goal: updated.targetGoal || null,
          },
          { onConflict: 'id' }
        );

        await supabase.auth.updateUser({
          data: {
            full_name: updated.fullName,
            avatar_url: updated.avatarUrl,
            institution: updated.institution,
            semester: updated.semester,
            major: updated.major,
            target_goal: updated.targetGoal,
          },
        });
      } catch (err: any) {
        console.warn('Profile cloud sync notice:', err);
      }
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyRegisterOtp,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        updatePassword,
        verifyCurrentPassword,
        logout,
        switchRole,
        resendVerification,
        loginWithGoogle,
        loginWithGoogleIdToken,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
