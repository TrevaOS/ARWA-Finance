// Auth — uses Supabase Auth when configured, falls back to localStorage for local dev.
import { supabase, isSupabaseReady } from './supabase.js';

// ============================================================
// TREVA SUPER-ADMIN (hardcoded fallback, never stored in DB)
// ============================================================
const TREVA_EMAIL = (import.meta.env.VITE_TREVA_EMAIL || 'tech@treva.in').toLowerCase();
const TREVA_PASS  =  import.meta.env.VITE_TREVA_PASS  || 'treva@superadmin2026';
const TREVA_NAME  =  import.meta.env.VITE_TREVA_NAME  || 'Treva Admin';

// ============================================================
// LOCAL USER STORE (used when Supabase is not connected)
// ============================================================
let LOCAL_USERS = [];

function persistLocalUsers() {
  try { localStorage.setItem('attigupperwa_users', JSON.stringify(LOCAL_USERS)); } catch {}
}

export function loadPortalUsers() {
  try {
    const raw = localStorage.getItem('attigupperwa_users');
    if (raw) LOCAL_USERS = JSON.parse(raw);
  } catch {}
  return LOCAL_USERS;
}

export function getPortalUsers() {
  return LOCAL_USERS;
}

export function addPortalUser(user) {
  LOCAL_USERS = LOCAL_USERS.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
  LOCAL_USERS.push(user);
  persistLocalUsers();
}

export function removePortalUser(email) {
  LOCAL_USERS = LOCAL_USERS.filter(u => u.email.toLowerCase() !== email.toLowerCase());
  persistLocalUsers();
}

// ============================================================
// LOGIN — Supabase Auth first, then local fallback
// ============================================================
export async function loginByEmailAsync(email, password) {
  const e = email.toLowerCase().trim();

  // Treva super-admin — never goes through Supabase
  if (e === TREVA_EMAIL && password === TREVA_PASS) {
    return { name: TREVA_NAME, email: TREVA_EMAIL, role: 'superadmin', memberId: '' };
  }

  if (isSupabaseReady) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
    if (error) return null;
    // Fetch role from users table
    const { data: profile } = await supabase
      .from('users')
      .select('name, role, member_id')
      .eq('id', data.user.id)
      .single();
    if (!profile) return null;
    return {
      id:       data.user.id,
      name:     profile.name,
      email:    e,
      role:     profile.role,
      memberId: profile.member_id || '',
    };
  }

  // Local fallback
  const u = LOCAL_USERS.find(u => u.email.toLowerCase() === e && u.pass === password);
  return u ? { name: u.name, email: u.email, role: u.role, memberId: u.memberId || '' } : null;
}

// Synchronous version for legacy callers (local-only, no Supabase)
export function loginByEmail(email, password) {
  const e = email.toLowerCase().trim();
  if (e === TREVA_EMAIL && password === TREVA_PASS) {
    return { name: TREVA_NAME, email: TREVA_EMAIL, role: 'superadmin', memberId: '' };
  }
  const u = LOCAL_USERS.find(u => u.email.toLowerCase() === e && u.pass === password);
  return u ? { name: u.name, email: u.email, role: u.role, memberId: u.memberId || '' } : null;
}

export function loginByMemberId(memberId, password) {
  const u = LOCAL_USERS.find(u => u.memberId === memberId.trim() && u.pass === password);
  return u ? { name: u.name, email: u.email, role: u.role, memberId: u.memberId } : null;
}

// ============================================================
// LOGOUT
// ============================================================
export async function logoutAsync() {
  if (isSupabaseReady) {
    await supabase.auth.signOut();
  }
}

// ============================================================
// CREATE PORTAL USER (Supabase Admin or local)
// ============================================================
export async function createSupabaseUser(user) {
  if (!isSupabaseReady) {
    addPortalUser(user);
    return { ok: true };
  }
  // Invite / create user via Supabase Auth (uses admin API — requires service role key)
  // For now, store in local table only; Supabase Auth user creation done in Supabase dashboard
  const { error } = await supabase.from('users').upsert({
    id: user.supabaseId || undefined,
    name: user.name,
    email: user.email,
    role: user.role,
    member_id: user.memberId || null,
  });
  if (error) {
    console.error('Supabase upsert error:', error);
    addPortalUser(user); // fallback to local
  }
  return { ok: !error, error };
}

// ============================================================
// SESSION — sessionStorage (works with both modes)
// ============================================================
const SESSION_KEY = 'attigupperwa_session';

export function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
