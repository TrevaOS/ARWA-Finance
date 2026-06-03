// Production auth — only Treva super-admin is baked in.
// All other portal users are created and managed by Treva admin through the portal.

const TREVA_USER = {
  name:     import.meta.env.VITE_TREVA_NAME  || 'Treva Admin',
  email:    import.meta.env.VITE_TREVA_EMAIL || 'tech@treva.in',
  pass:     import.meta.env.VITE_TREVA_PASS  || 'treva@superadmin2026',
  role:     'superadmin',
  memberId: '',
};

// Runtime user store — populated when Treva admin creates portal users
let PORTAL_USERS = [];

export function addPortalUser(user) {
  PORTAL_USERS = PORTAL_USERS.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
  PORTAL_USERS.push(user);
  try { localStorage.setItem('attigupperwa_users', JSON.stringify(PORTAL_USERS)); } catch {}
}

export function removePortalUser(email) {
  PORTAL_USERS = PORTAL_USERS.filter(u => u.email.toLowerCase() !== email.toLowerCase());
  try { localStorage.setItem('attigupperwa_users', JSON.stringify(PORTAL_USERS)); } catch {}
}

export function loadPortalUsers() {
  try {
    const raw = localStorage.getItem('attigupperwa_users');
    if (raw) PORTAL_USERS = JSON.parse(raw);
  } catch {}
  return PORTAL_USERS;
}

export function getPortalUsers() {
  return PORTAL_USERS;
}

export function loginByEmail(email, password) {
  const e = email.toLowerCase().trim();
  // Check Treva admin first
  if (e === TREVA_USER.email.toLowerCase() && password === TREVA_USER.pass) return { ...TREVA_USER, pass: undefined };
  // Check portal users (created by Treva admin)
  const u = PORTAL_USERS.find(u => u.email.toLowerCase() === e && u.pass === password);
  if (u) return { ...u, pass: undefined };
  return null;
}

export function loginByMemberId(memberId, password) {
  const u = PORTAL_USERS.find(u => u.memberId === memberId.trim() && u.pass === password);
  return u ? { ...u, pass: undefined } : null;
}

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
