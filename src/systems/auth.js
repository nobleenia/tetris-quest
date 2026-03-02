/**
 * Stackr Quest — Auth System
 *
 * Manages authentication lifecycle:
 *   - Anonymous sign-in on first launch (no user action required)
 *   - Optional upgrade to email/password or Google OAuth
 *   - Profile persistence (display name, avatar)
 *   - Session state reactivity
 *
 * Works offline-first: all features degrade gracefully without Supabase.
 */

import { getSupabase, isSupabaseConfigured } from './supabase.js';

const LOCAL_PROFILE_KEY = 'stackr_profile';

// ─── State ───────────────────────────────────────────────────────────

/** @type {import('@supabase/supabase-js').User | null} */
let _currentUser = null;

/** @type {{ displayName: string, avatarUrl: string | null, isAnonymous: boolean }} */
let _profile = null;

/** @type {Array<(user: object|null, profile: object|null) => void>} */
const _listeners = [];

// ─── Local profile fallback ──────────────────────────────────────────

function loadLocalProfile() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { displayName: 'Player', avatarUrl: null, isAnonymous: true };
}

function saveLocalProfile(profile) {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}

// ─── Initialise ──────────────────────────────────────────────────────

/**
 * Initialise auth. Call once at app startup.
 * - If Supabase is configured, attempts anonymous sign-in.
 * - Otherwise falls back to local profile.
 */
export async function initAuth() {
  if (!isSupabaseConfigured) {
    _profile = loadLocalProfile();
    _notifyListeners();
    return;
  }

  const sb = getSupabase();
  if (!sb) return;

  // Listen for auth state changes
  sb.auth.onAuthStateChange(async (_event, session) => {
    _currentUser = session?.user ?? null;
    if (_currentUser) {
      await _loadOrCreateProfile();
    } else {
      _profile = loadLocalProfile();
    }
    _notifyListeners();
  });

  // Check existing session
  const { data: { session } } = await sb.auth.getSession();

  if (session?.user) {
    _currentUser = session.user;
    await _loadOrCreateProfile();
  } else {
    // Auto sign-in anonymously
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) {
      console.warn('[auth] Anonymous sign-in failed:', error.message);
      _profile = loadLocalProfile();
    } else {
      _currentUser = data?.user ?? null;
      if (_currentUser) await _loadOrCreateProfile();
    }
  }

  _notifyListeners();
}

// ─── Profile management ──────────────────────────────────────────────

async function _loadOrCreateProfile() {
  const sb = getSupabase();
  if (!sb || !_currentUser) {
    _profile = loadLocalProfile();
    return;
  }

  const { data, error } = await sb
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', _currentUser.id)
    .single();

  if (error || !data) {
    // Profile doesn't exist yet — create it
    const isAnon = !_currentUser.email;
    const defaultName = isAnon ? 'Player' : _currentUser.email.split('@')[0];

    const { error: insertError } = await sb.from('profiles').upsert({
      id: _currentUser.id,
      display_name: defaultName,
      avatar_url: null,
      total_stars: 0,
      highest_world: 1,
      highest_level: 1,
    });

    if (insertError) console.warn('[auth] Profile create failed:', insertError.message);

    _profile = { displayName: defaultName, avatarUrl: null, isAnonymous: isAnon };
  } else {
    _profile = {
      displayName: data.display_name || 'Player',
      avatarUrl: data.avatar_url,
      isAnonymous: !_currentUser.email,
    };
  }

  saveLocalProfile(_profile);
}

// ─── Public API ──────────────────────────────────────────────────────

/** Get current user ID (Supabase UUID or 'local'). */
export function getUserId() {
  return _currentUser?.id ?? 'local';
}

/** Get profile data. */
export function getProfile() {
  return _profile ?? loadLocalProfile();
}

/** Whether the user is authenticated (even anonymously). */
export function isAuthenticated() {
  return !!_currentUser;
}

/** Whether the user has a real account (not anonymous). */
export function hasRealAccount() {
  return !!_currentUser?.email;
}

/**
 * Update display name.
 * @param {string} name
 */
export async function updateDisplayName(name) {
  const trimmed = name.trim().slice(0, 30);
  if (!trimmed) return false;

  if (_profile) {
    _profile.displayName = trimmed;
    saveLocalProfile(_profile);
  }

  const sb = getSupabase();
  if (sb && _currentUser) {
    const { error } = await sb
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', _currentUser.id);
    if (error) console.warn('[auth] Update name failed:', error.message);
  }

  _notifyListeners();
  return true;
}

/**
 * Sign up / link email + password to the current anonymous account.
 * @param {string} email
 * @param {string} password
 */
export async function linkEmailPassword(email, password) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };

  const { data, error } = await sb.auth.updateUser({ email, password });
  if (error) return { error: error.message };

  _currentUser = data?.user ?? _currentUser;
  if (_profile) _profile.isAnonymous = false;
  saveLocalProfile(_profile);
  _notifyListeners();
  return { error: null };
}

/**
 * Sign in with Google OAuth.
 */
export async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };

  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Sign out (reverts to anonymous).
 */
export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;

  await sb.auth.signOut();
  _currentUser = null;
  _profile = { displayName: 'Player', avatarUrl: null, isAnonymous: true };
  saveLocalProfile(_profile);
  _notifyListeners();

  // Re-sign-in anonymously
  await sb.auth.signInAnonymously();
}

// ─── Auth state listeners ────────────────────────────────────────────

/**
 * Subscribe to auth state changes.
 * @param {(user: object|null, profile: object|null) => void} fn
 * @returns {() => void} unsubscribe function
 */
export function onAuthChange(fn) {
  _listeners.push(fn);
  // Immediately call with current state
  fn(_currentUser, _profile);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

function _notifyListeners() {
  for (const fn of _listeners) {
    try { fn(_currentUser, _profile); } catch { /* ignore */ }
  }
}
