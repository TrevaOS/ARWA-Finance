import { supabase } from './supabase.js';

// ============================================================
// TREVA SUPER-ADMIN (hardcoded, never stored in Supabase)
// ============================================================
const TREVA_EMAIL = (import.meta.env.VITE_TREVA_EMAIL || 'tech@treva.in').toLowerCase();
const TREVA_PASS  =  import.meta.env.VITE_TREVA_PASS  || 'treva@superadmin2026';
const TREVA_NAME  =  import.meta.env.VITE_TREVA_NAME  || 'Treva Admin';

// ============================================================
// LOGIN
// ============================================================
export async function loginByEmailAsync(email, password) {
  const e = email.toLowerCase().trim();

  if (e === TREVA_EMAIL && password === TREVA_PASS) {
    return { name: TREVA_NAME, email: TREVA_EMAIL, role: 'superadmin', memberId: '' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
  if (error) return null;

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

// ============================================================
// LOGOUT
// ============================================================
export async function logoutAsync() {
  await supabase.auth.signOut();
}

// ============================================================
// PORTAL USERS — read from Supabase
// ============================================================
export async function loadPortalUsersAsync() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, member_id');
  if (error) { console.error('loadPortalUsers:', error); return []; }
  return (data || []).map(u => ({
    id:       u.id,
    name:     u.name,
    email:    u.email,
    role:     u.role,
    memberId: u.member_id || '',
  }));
}

// ============================================================
// CREATE USER — Supabase Auth signUp + users table insert
// ============================================================
export async function createSupabaseUser(user) {
  // 1. Create auth user
  const { data, error: authErr } = await supabase.auth.signUp({
    email:    user.email,
    password: user.pass,
  });
  if (authErr) return { ok: false, error: authErr };

  const uid = data.user?.id;
  if (!uid) return { ok: false, error: new Error('No user ID returned') };

  // 2. Insert profile row
  const { error: dbErr } = await supabase.from('users').insert({
    id:        uid,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    member_id: user.memberId || null,
  });
  if (dbErr) return { ok: false, error: dbErr };

  return { ok: true, id: uid };
}

// ============================================================
// REMOVE USER — delete from users table (auth user stays but
// cannot log in without a profile row)
// ============================================================
export async function removeSupabaseUser(email) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);
  if (error) console.error('removeSupabaseUser:', error);
  return { ok: !error };
}

// ============================================================
// UPDATE ROLE
// ============================================================
export async function updateSupabaseUserRole(email, newRole) {
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('email', email);
  if (error) console.error('updateSupabaseUserRole:', error);
  return { ok: !error };
}

// ============================================================
// SESSION — sessionStorage
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

// ============================================================
// MEMBER ID LOGIN — look up email from users table, then sign in
// ============================================================
export async function loginByMemberId(memberId, password) {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('member_id', memberId.trim())
    .single();
  if (error || !data?.email) return null;
  return loginByEmailAsync(data.email, password);
}

// Legacy no-ops kept so any stray imports don't break at runtime
export function loadPortalUsers() { return []; }
export function getPortalUsers()  { return []; }
export function addPortalUser()   {}
export function removePortalUser(){}
