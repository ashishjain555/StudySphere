import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Strips any extraneous subpaths like /rest/v1/ or trailing slashes
 * to guarantee the clean Supabase project root origin (e.g. https://xyz.supabase.co)
 */
const sanitizeSupabaseUrl = (url: string) => {
  const cleaned = url.trim();
  if (!cleaned) return '';
  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
};

const cleanUrl = sanitizeSupabaseUrl(rawUrl);

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !url.includes('placeholder.supabase.co') &&
      !url.includes('your-project-id.supabase.co')
    );
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  cleanUrl &&
  rawKey &&
  cleanUrl !== 'YOUR_SUPABASE_URL' &&
  rawKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  cleanUrl !== 'https://placeholder.supabase.co' &&
  rawKey !== 'placeholder-key' &&
  rawKey !== 'your-supabase-anon-key-here' &&
  isValidUrl(cleanUrl)
);

const validSupabaseUrl = isSupabaseConfigured ? cleanUrl : 'https://placeholder.supabase.co';
const validSupabaseKey = isSupabaseConfigured ? rawKey : 'placeholder-key';

export const supabase = createClient(validSupabaseUrl, validSupabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export const STORAGE_KEYS = {
  USER: 'studysphere_user',
  SUBJECTS: 'studysphere_subjects',
  TOPICS: 'studysphere_topics',
  MATERIALS: 'studysphere_materials',
  QUIZ_ATTEMPTS: 'studysphere_quiz_attempts',
  STUDY_PLANS: 'studysphere_study_plans',
  WEAK_TOPICS: 'studysphere_weak_topics',
  CONVERSATIONS: 'studysphere_conversations',
  ANALYZED_PDFS: 'studysphere_analyzed_pdfs',
  NOTIFICATIONS: 'studysphere_notifications',
};
