import { supabase, supabaseAdmin } from './supabase.js';

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
// PORTAL USERS — read from Supabase (admin client bypasses RLS)
// ============================================================
export async function loadPortalUsersAsync() {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
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
// CREATE USER — uses service role key to skip email confirmation
// ============================================================
export async function createSupabaseUser(user) {
  if (!supabaseAdmin) {
    return { ok: false, error: new Error('Service key not configured — add VITE_SUPABASE_SERVICE_KEY') };
  }

  // 1. Create auth user (email_confirm: true skips the confirmation email)
  const { data, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email:         user.email,
    password:      user.pass,
    email_confirm: true,
  });
  if (authErr) return { ok: false, error: authErr };

  const uid = data.user?.id;
  if (!uid) return { ok: false, error: new Error('No user ID returned') };

  // 2. Insert profile row
  const { error: dbErr } = await supabaseAdmin.from('users').insert({
    id:        uid,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    member_id: user.memberId || null,
  });
  if (dbErr) {
    await supabaseAdmin.auth.admin.deleteUser(uid);
    return { ok: false, error: dbErr };
  }

  return { ok: true, id: uid };
}

// ============================================================
// REMOVE USER — deletes auth user + profile row
// ============================================================
export async function removeSupabaseUser(email) {
  const client = supabaseAdmin || supabase;

  // Find the user ID first
  const { data: users } = await client.from('users').select('id').eq('email', email).single();
  const uid = users?.id;

  // Delete profile row
  await client.from('users').delete().eq('email', email);

  // Delete auth user if we have admin access
  if (uid && supabaseAdmin) {
    await supabaseAdmin.auth.admin.deleteUser(uid);
  }

  return { ok: true };
}

// ============================================================
// UPDATE ROLE
// ============================================================
export async function updateSupabaseUserRole(email, newRole) {
  const client = supabaseAdmin || supabase;
  const { error } = await client.from('users').update({ role: newRole }).eq('email', email);
  if (error) console.error('updateSupabaseUserRole:', error);
  return { ok: !error };
}

// ============================================================
// MEMBER ID LOGIN
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

// ============================================================
// SESSION
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

// Legacy no-ops
export function loadPortalUsers() { return []; }
export function getPortalUsers()  { return []; }
export function addPortalUser()   {}
export function removePortalUser(){}
