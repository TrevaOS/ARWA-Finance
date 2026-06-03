import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { DATA } from './data.js';
import { OverviewView } from './pages/Overview.jsx';
import { ClaimsView } from './pages/Claims.jsx';
import { MembersView } from './pages/Members.jsx';
import { FinancesView } from './pages/Finances.jsx';
import { AdministrationView } from './pages/Administration.jsx';
import { MemberPortalView } from './pages/MemberPortal.jsx';
import { SponsorshipsView } from './pages/Sponsorships.jsx';
import { LoginPage } from './pages/Login.jsx';
import { Icon, Avatar, Button, Toast, Field } from './ui/components.jsx';
import { exportLedgerPdf, exportMembersPdf } from './utils/pdf.js';
import { loadSession, saveSession, clearSession, loadPortalUsers, addPortalUser, removePortalUser, getPortalUsers } from './auth.js';
import logoSrc from './assets/logo.png';

const NAV = [
  { key: 'overview',        label: 'Overview',        icon: 'overview' },
  { key: 'claims',          label: 'Claims',          icon: 'claims' },
  { key: 'members',         label: 'Members',         icon: 'members' },
  { key: 'finances',        label: 'Finances',        icon: 'finances' },
  { key: 'sponsorships',    label: 'Sponsorships',    icon: 'heart' },
  { key: 'administration',  label: 'Admin',           icon: 'shield' },
  { key: 'member-portal',   label: 'My Portal',       icon: 'user' },
];

const PAGE_TITLE = {
  overview:       ['Association Overview',       'Available funds, inflow and where money goes'],
  claims:         ['Claims & Approvals',         'Raise, review and approve through the RBAS chain'],
  members:        ['Members',                    'Onboarding, payment status and membership lists'],
  finances:       ['Finances',                   'Inflow ledger, spend analytics and membership charges'],
  sponsorships:   ['Sponsorships',               'Track sponsors, payment pipeline and receipts'],
  administration: ['Administration',             'Inflow management, member records and exports'],
  'member-portal':['Member Portal',              'Your profile, claims and digital ID card'],
};

function now() {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
  };
}

function App() {
  const [session, setSession] = React.useState(() => loadSession());
  const [view, setView] = React.useState('overview');
  const [role, setRole] = React.useState(() => loadSession()?.role || 'secretary');
  const [claims, setClaims] = React.useState(() => DATA.CLAIMS.map((c) => ({ ...c, approvals: [...c.approvals] })));
  const [members, setMembers] = React.useState(() => DATA.MEMBERS.map((m) => ({ ...m })));
  const [charges, setCharges] = React.useState({ ...DATA.CHARGES });
  const [inflow, setInflow] = React.useState(() => [...DATA.INFLOW]);
  const [sponsors, setSponsors] = React.useState(() => [...DATA.SPONSORS]);
  const [pendingInflows, setPendingInflows] = React.useState([]);
  const [availableFunds, setAvailableFunds] = React.useState(DATA.FUNDS.available);
  const [changelog, setChangelog] = React.useState([]);
  const [openId, setOpenId] = React.useState(null);
  const [openNew, setOpenNew] = React.useState(false);
  const [openSponsor, setOpenSponsor] = React.useState(false);
  const [openOnboard, setOpenOnboard] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [roleMenu, setRoleMenu] = React.useState(false);
  const [openExportDialog, setOpenExportDialog] = React.useState(false);
  const [fundsVisible, setFundsVisible] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [notifPanelOpen, setNotifPanelOpen] = React.useState(false);
  const notifRef = React.useRef(null);
  const [portalUsers, setPortalUsers] = React.useState(() => loadPortalUsers());

  // Reload portal users from localStorage on mount
  React.useEffect(() => { setPortalUsers(loadPortalUsers()); }, []);

  const onAddPortalUser = (user) => {
    addPortalUser(user);
    setPortalUsers([...getPortalUsers()]);
    log('member_added', `Portal user created: ${user.name} (${user.email}) — role: ${user.role}`);
    notify(`New user created: ${user.name} (${user.email}) with role ${user.role}`, 'success', 'user');
    flash(`${user.name} added as ${user.role}`, 'success', 'user');
  };

  const onRemovePortalUser = (email) => {
    const u = getPortalUsers().find(u => u.email === email);
    removePortalUser(email);
    setPortalUsers([...getPortalUsers()]);
    log('member_status', `Portal user removed: ${email}`);
    notify(`User removed: ${email}`, 'warning', 'x');
    flash(`User removed`, 'danger', 'x');
  };

  const onUpdatePortalUserRole = (email, newRole) => {
    const users = getPortalUsers();
    const updated = users.map(u => u.email === email ? { ...u, role: newRole } : u);
    updated.forEach(u => addPortalUser(u));
    setPortalUsers([...getPortalUsers()]);
    log('member_status', `Portal user ${email} role changed to ${newRole}`);
    notify(`User ${email} role updated to ${newRole}`, 'info', 'edit');
    flash(`Role updated to ${newRole}`, 'success', 'check');
  };

  // Treva super-admin email
  const TREVA_EMAIL = 'tech@treva.in';
  const isTreva = session?.email?.toLowerCase() === TREVA_EMAIL;
  // Only Treva sees Administration panel
  const canSeeAdmin = isTreva;
  // President/VP can manage members and roles
  const ADMIN_ROLES = ['president', 'vice_president'];
  const canChangeRoles = ADMIN_ROLES.includes(session?.role);
  const sessionRole = session?.role || 'member';

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Close notif panel on outside click
  React.useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifPanelOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const flash = (msg, tone = 'success', icon = 'check') => setToast({ msg, tone, icon });

  const notify = (message, type = 'info', icon = 'bell') => {
    const { date, time } = now();
    setNotifications(prev => [{ id: Date.now(), message, type, icon, date, time, read: false }, ...prev]);
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const unreadCount = notifications.filter(n => !n.read).length;

  const log = (type, message, extras = {}) => {
    const { date, time } = now();
    const actor = session?.name || 'System';
    setChangelog(prev => [{ type, message, actor, date, time, ...extras }, ...prev]);
  };

  const roleMeta = DATA.ROLES.find((r) => r.key === role) || DATA.ROLES[0];
  const roleIdx = DATA.STAGE_KEYS.indexOf(role);
  const myPending = claims.filter((c) => c.status === 'open' && c.stageIndex === roleIdx).length;

  // Build visible nav based on session role
  const visibleNav = React.useMemo(() => {
    if (isTreva) return [{ key: 'administration', label: 'Admin', icon: 'shield' }];
    return NAV.filter(item => {
      if (item.key === 'administration') return canSeeAdmin;
      return true;
    });
  }, [isTreva, canSeeAdmin]);

  const go = (next) => { setView(next); setOpenId(null); window.scrollTo(0, 0); };

  /* ---- auth ---- */
  const handleLogin = (user) => {
    saveSession(user);
    setSession(user);
    if (user.email?.toLowerCase() === TREVA_EMAIL) {
      setRole('president');
      go('administration');
    } else {
      setRole(user.role === 'member' ? 'joint_secretary' : user.role === 'superadmin' ? 'president' : user.role);
      go('overview');
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setRole('secretary');
    go('overview');
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const onApprove = (claimId, note = '') => {
    let disbursedAmount = 0;
    const actorName = session?.name || roleMeta.label;
    setClaims((prev) => prev.map((c) => {
      if (c.id !== claimId) return c;
      const actor = DATA.ROLES[c.stageIndex] || {};
      const approvals = [...c.approvals, { role: actor.key, name: actorName, date: DATA.TODAY, note }];
      if (c.stageIndex >= DATA.STAGE_KEYS.length - 1) {
        disbursedAmount = c.amount;
        log('claim_disbursed', `${claimId} disbursed by Treasurer — ${DATA.inr(c.amount)} released`, { amount: c.amount });
        return { ...c, approvals, status: 'disbursed', disbursedDate: DATA.TODAY, stageIndex: c.stageIndex + 1 };
      }
      log('claim_approved', `${claimId} approved by ${actor.label || actor.key}`);
      return { ...c, approvals, stageIndex: c.stageIndex + 1 };
    }));
    if (disbursedAmount > 0) {
      setAvailableFunds(prev => {
        const newBalance = prev - disbursedAmount;
        log('funds_updated', `Available funds reduced by ${DATA.inr(disbursedAmount)} after claim ${claimId} disbursal`, { amount: newBalance });
        return newBalance;
      });
      notify(`${claimId} disbursed — ${DATA.inr(disbursedAmount)} released from funds`, 'success', 'rupee');
    } else {
      notify(`${claimId} approved and forwarded to next reviewer`, 'success', 'check');
    }
    setOpenId(null);
    flash(disbursedAmount > 0 ? `Claim disbursed — ${DATA.inr(disbursedAmount)} deducted from funds` : 'Claim approved', 'success', 'check');
  };

  const onReject = (claimId, reason) => {
    const actorName = session?.name || roleMeta.label;
    setClaims((prev) => prev.map((c) => {
      if (c.id !== claimId) return c;
      const actor = DATA.ROLES[c.stageIndex] || {};
      log('claim_rejected', `${claimId} returned by ${actor.label || actor.key} — ${reason}`);
      return { ...c, status: 'rejected', rejected: { role: actor.key, name: actorName, date: DATA.TODAY, reason } };
    }));
    notify(`${claimId} returned for revision — "${reason}"`, 'danger', 'x');
    setOpenId(null);
    flash('Claim returned', 'danger', 'x');
  };

  const onNewClaim = (form) => {
    // Find next sequential claim number from all existing claims
    const nums = claims.map(c => parseInt(c.id.replace('CLM-', ''), 10)).filter(n => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const nextId = 'CLM-' + String(nextNum).padStart(3, '0');
    const flat = members.find((m) => m.name === roleMeta.name)?.flat || 'A-101';
    const claim = {
      id: nextId,
      title: form.title.trim(),
      desc: form.desc?.trim() || 'No additional details provided.',
      type: form.type,
      category: form.category,
      categoryLabel: form.categoryLabel,
      amount: Number(form.amount),
      raisedBy: roleMeta.name,
      raisedFlat: flat,
      date: DATA.TODAY,
      stageIndex: 0,
      status: 'open',
      hasImage: form.hasImage,
      hasInvoice: form.hasInvoice,
      approvals: [],
    };
    setClaims((prev) => [claim, ...prev]);
    log('claim_raised', `${nextId} raised: ${claim.title}`, { amount: claim.amount });
    notify(`New claim ${nextId} raised: "${claim.title}" — ${DATA.inr(claim.amount)}`, 'info', 'plus');
    setOpenNew(false);
    flash(nextId + ' raised', 'success', 'plus');
  };

  const onSponsor = (form) => {
    const nums = sponsors.map(s => parseInt(s.id.replace('SP-', ''), 10)).filter(n => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const sp = {
      id: 'SP-' + String(nextNum).padStart(3, '0'),
      name: form.name.trim(),
      type: form.type,
      objective: form.objective.trim(),
      amount: Number(form.amount),
      date: DATA.TODAY,
      status: 'pledged',
    };
    setSponsors((prev) => [sp, ...prev]);
    log('sponsor_added', `Sponsorship from ${sp.name} recorded`, { amount: sp.amount });
    notify(`Sponsorship recorded: ${sp.name} — ${DATA.inr(sp.amount)} (${sp.status})`, 'info', 'heart');
    flash('Sponsorship recorded', 'success', 'heart');
  };

  const onUpdateSponsorStatus = (id, status, paymentInfo) => {
    setSponsors(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, status };
      if (paymentInfo) {
        updated.paymentHistory = [...(s.paymentHistory || []), { ...paymentInfo, amount: s.amount, date: paymentInfo.date || DATA.TODAY }];
      }
      return updated;
    }));
    log('sponsor_status', `Sponsorship ${id} moved to ${status}`);
    const sp = sponsors.find(s => s.id === id);
    if (status === 'received' && sp) notify(`Payment received from ${sp.name} — ${DATA.inr(sp.amount)}${paymentInfo?.ref ? ' · Ref: ' + paymentInfo.ref : ''}`, 'success', 'rupee');
    flash('Sponsorship updated', 'success', 'check');
  };

  const onAddMember = (form) => {
    // Find next sequential member number from all existing members
    const nums = members.map(m => parseInt(m.id.replace('M-', ''), 10)).filter(n => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const member = {
      id: 'M-' + String(nextNum).padStart(3, '0'),
      name: form.name.trim(),
      phone: form.phone,
      family: form.family,
      flat: form.residence,
      residence: form.residence,
      photo: form.photo,
      relationship: form.relationship,
      type: form.type || 'annual',
      since: DATA.TODAY,
      joined: DATA.TODAY,
      status: 'pending',
      notes: form.notes,
    };
    setMembers((prev) => [member, ...prev]);
    log('member_added', `${member.name} added as ${member.type} member`);
    notify(`New member added: ${member.name} (${member.id}) — ${member.type} member, ${member.flat}`, 'info', 'user');
    flash(member.name + ' added', 'success', 'user');
  };

  const onUpdateMemberStatus = (memberId, status) => {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, status } : m));
    log('member_status', `Member ${memberId} status changed to ${status}`);
    flash('Member status updated', 'success', 'check');
  };

  // Unique roles — only one person can hold each
  const UNIQUE_ROLES = ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer'];

  const onUpdateMemberRole = (memberId, newRole) => {
    const isUnique = UNIQUE_ROLES.includes(newRole);
    const currentHolder = isUnique ? members.find(m => m.id !== memberId && m.role === newRole) : null;
    if (currentHolder) {
      // Swap: remove role from current holder first, then assign to new
      setMembers(prev => prev.map(m => {
        if (m.id === currentHolder.id) return { ...m, role: undefined };
        if (m.id === memberId) return { ...m, role: newRole };
        return m;
      }));
      log('member_status', `${newRole} transferred from ${currentHolder.name} to ${members.find(m=>m.id===memberId)?.name}`);
      notify(`Role transfer: ${newRole} moved from ${currentHolder.name} to ${members.find(m=>m.id===memberId)?.name}`, 'warning', 'swap');
      flash(`${newRole} transferred from ${currentHolder.name}`, 'success', 'swap');
    } else {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole === 'Member' ? undefined : newRole } : m));
      log('member_status', `Member ${memberId} role changed to ${newRole}`);
      notify(`${members.find(m=>m.id===memberId)?.name} assigned as ${newRole}`, 'info', 'user');
      flash(`Role updated to ${newRole}`, 'success', 'check');
    }
  };

  const onUpdateProfile = (updated) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    log('member_status', `Profile updated for ${updated.name}`);
    flash('Profile saved', 'success', 'check');
  };

  const onRenewMembership = (memberId, txnInfo = {}) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return { ...m, status: 'paid', renewedDate: DATA.TODAY, renewalTxn: txnInfo };
    }));
    const member = members.find(m => m.id === memberId);
    if (member) {
      const existing = inflow.find(r => r.month === DATA.TODAY.slice(0, 7));
      if (existing) {
        setInflow(prev => prev.map(r => r.month === DATA.TODAY.slice(0, 7) ? { ...r, annual: (r.annual || 0) + DATA.CHARGES.annual } : r));
      } else {
        const monthNum = parseInt(DATA.TODAY.slice(5, 7), 10);
        const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        setInflow(prev => [...prev, { month: DATA.TODAY.slice(0, 7), label: MONTHS_SHORT[monthNum - 1], annual: DATA.CHARGES.annual, lifetime: 0, sponsorship: 0 }]);
      }
      const txnNote = txnInfo.txnRef ? ` · ${txnInfo.txnMode || 'UPI'} ref: ${txnInfo.txnRef}` : '';
      log('inflow_added', `Annual renewal — ${member.name}${txnNote}`, { amount: DATA.CHARGES.annual });
    }
    flash('Renewal submitted — pending committee verification', 'success', 'check');
  };

  const onUpdateCharges = (payload) => {
    setCharges(payload);
    log('funds_updated', `Membership charges updated: Annual ₹${payload.annual}, Lifetime ₹${payload.lifetime}`);
    flash('Charges updated', 'success', 'check');
  };

  const onUpdateFunds = (val) => {
    const old = availableFunds;
    setAvailableFunds(val);
    log('funds_updated', `Available funds updated from ₹${old.toLocaleString('en-IN')} to ₹${val.toLocaleString('en-IN')}`, { amount: val });
    flash('Available funds updated', 'success', 'check');
  };

  const onAddInflow = (form) => {
    if (form.status === 'pending') {
      const item = { ...form, id: 'INF-' + Date.now() };
      setPendingInflows((prev) => [item, ...prev]);
      flash('Inflow submitted for review', 'success', 'check');
      return;
    }
    const key = form.sourceKey || 'donation';
    const existing = inflow.find((r) => r.month === form.month);
    if (existing) {
      setInflow((prev) => prev.map((r) => r.month === form.month
        ? { ...r, [key]: (r[key] || 0) + Number(form.amount) }
        : r));
    } else {
      const monthLabel = form.label || form.month?.slice(5, 7);
      setInflow((prev) => [...prev, { month: form.month, label: monthLabel, annual: 0, lifetime: 0, sponsorship: 0, [key]: Number(form.amount) }]);
    }
    log('inflow_added', `Inflow of ₹${form.amount} (${form.source || key}) recorded from ${form.fromName || 'unknown'}`, { amount: Number(form.amount) });
    flash('Inflow added', 'success', 'plus');
  };

  const onApproveInflow = (id) => {
    const item = pendingInflows.find((x) => x.id === id);
    if (!item) return;
    setPendingInflows((prev) => prev.filter((x) => x.id !== id));
    onAddInflow({ ...item, status: 'approved' });
    log('inflow_approved', `Inflow ${id} approved`);
    flash('Inflow approved', 'success', 'check');
  };

  const onRejectInflow = (id) => {
    setPendingInflows((prev) => prev.filter((x) => x.id !== id));
    log('inflow_rejected', `Inflow ${id} rejected`);
    flash('Inflow rejected', 'danger', 'x');
  };

  const onVoidClaim = (claimId) => {
    setClaims((prev) => prev.map((c) => {
      if (c.id !== claimId) return c;
      log('claim_rejected', `${claimId} voided — 5-day window expired with no action`);
      return { ...c, status: 'rejected', rejected: { role: 'system', name: 'System', date: DATA.TODAY, reason: 'Automatically voided — no response within 5-day window.' } };
    }));
    notify(`Claim ${claimId} voided — 5-day window expired with no action taken`, 'danger', 'clock');
    flash('Claim voided — 5-day window expired', 'danger', 'x');
  };

  const onForceClaimStatus = (claimId, action, stageIdx) => {
    setClaims((prev) => prev.map((c) => {
      if (c.id !== claimId) return c;
      if (action === 'disbursed') {
        log('claim_disbursed', `${claimId} force-disbursed by admin`, { amount: c.amount });
        return { ...c, status: 'disbursed', disbursedDate: DATA.TODAY, stageIndex: DATA.STAGE_KEYS.length };
      }
      if (action === 'rejected') {
        log('claim_rejected', `${claimId} force-rejected by admin`);
        return { ...c, status: 'rejected', rejected: { role: 'president', name: 'Krishna Murthy', date: DATA.TODAY, reason: 'Overridden by President' } };
      }
      if (action === 'reopen') {
        log('claim_approved', `${claimId} reopened`);
        return { ...c, status: 'open', stageIndex: 0, rejected: undefined, disbursedDate: undefined };
      }
      if (action === 'stage') {
        log('claim_approved', `${claimId} moved to stage ${DATA.ROLES[stageIdx]?.label || stageIdx}`);
        return { ...c, status: 'open', stageIndex: stageIdx };
      }
      return c;
    }));
    notify(`Claim ${claimId} status overridden to "${action}" by super admin`, 'warning', 'shield');
    flash('Claim status updated', 'success', 'edit');
  };

  const onExportLedger = (opts) => {
    exportLedgerPdf(inflow, claims, { ...DATA.FUNDS, available: availableFunds }, DATA.TODAY, opts);
    log('inflow_added', `Ledger PDF exported`);
    flash('Ledger PDF opened', 'success', 'download');
  };

  const onExportMembers = (opts) => {
    // Normalize: support both joinedMonth (legacy) and joinedStart/joinedEnd
    exportMembersPdf(members, DATA.TODAY, opts);
    flash('Members PDF opened', 'success', 'download');
  };

  const [title, subtitle] = PAGE_TITLE[view] || ['Portal', ''];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <img src={logoSrc} alt="Attiguppe RWA" />
          </div>
          <div className="brand-text">
            <span className="brand-name">Attiguppe RWA</span>
            <span className="brand-sub">Residents Portal</span>
          </div>
        </div>
        <nav className="nav">
          {visibleNav.map((item) => (
            <button key={item.key} className={'nav-item' + (view === item.key ? ' on' : '')} onClick={() => go(item.key)}>
              <Icon name={item.icon} size={19} />
              <span className="ni-text"><span className="ni-label">{item.label}</span></span>
              {item.key === 'claims' && myPending > 0 && <span className="ni-badge">{myPending}</span>}
              {item.key === 'administration' && pendingInflows.length > 0 && <span className="ni-badge">{pendingInflows.length}</span>}
            </button>
          ))}
        </nav>
        {!isTreva && (
          <div className="side-funds">
            <span className="sf-label">Available funds</span>
            <div className="sf-amt-wrap">
              <span className="sf-amt">{fundsVisible ? DATA.inr(availableFunds) : <span className="sf-hidden">₹ ••••••</span>}</span>
              <button className="sf-eye" onClick={() => setFundsVisible(v => !v)} title={fundsVisible ? 'Hide balance' : 'Show balance'}>
                <Icon name={fundsVisible ? 'eyeoff' : 'eye'} size={16} />
              </button>
            </div>
            <span className="sf-sub">FY 2026–27 · {DATA.TODAY}</span>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <Icon name="x" size={15} />Sign out
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="tb-title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="tb-right">
            {!isTreva && (
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className="icon-btn ghost" onClick={() => { setNotifPanelOpen(v => !v); if (!notifPanelOpen) markAllRead(); }}>
                  <Icon name="bell" size={19} />
                  {unreadCount > 0 && <span className="bell-dot" style={{ position:'absolute',top:7,right:8 }} />}
                </button>
                {notifPanelOpen && (
                  <div className="notif-panel">
                    <div className="notif-head">
                      <span>Notifications</span>
                      {notifications.length > 0 && <button className="notif-clear" onClick={() => setNotifications([])}>Clear all</button>}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="notif-empty"><Icon name="bell" size={22} /><span>No notifications yet</span></div>
                    ) : (
                      <div className="notif-list">
                        {notifications.slice(0, 30).map(n => (
                          <div key={n.id} className={'notif-item' + (n.read ? '' : ' notif-unread')}>
                            <span className={'notif-ico notif-ico-' + n.type}><Icon name={n.icon || 'bell'} size={14} /></span>
                            <div className="notif-body">
                              <div className="notif-msg">{n.message}</div>
                              <div className="notif-time">{n.date} · {n.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="role-switch">
              <button className="rs-trigger" onClick={() => setRoleMenu((v) => !v)}>
                <Avatar name={isTreva ? 'Treva Admin' : roleMeta.name} size={32} />
                <span className="rs-meta">
                  <span className="rs-role">{isTreva ? 'Super Admin' : roleMeta.label}</span>
                  <span className="rs-name">{isTreva ? 'Treva' : roleMeta.name}</span>
                </span>
                <Icon name="chevdown" size={16} className="rs-chev" />
              </button>
              {roleMenu && (
                <>
                  <div className="rs-backdrop" onClick={() => setRoleMenu(false)} />
                  <div className="rs-menu">
                    {isTreva ? (
                      <>
                        <div className="rs-menu-head">Super Admin <span>TREVA</span></div>
                        <div className="rs-opt" style={{ padding: '9px 10px', fontSize: 13, color: 'var(--ink-3)' }}>
                          Logged in as admin@treva.in
                        </div>
                      </>
                    ) : canChangeRoles ? (
                      <>
                        <div className="rs-menu-head">Logged in as</div>
                        <div className="rs-opt on" style={{ pointerEvents: 'none' }}>
                          <Avatar name={roleMeta.name} size={30} />
                          <span className="rs-opt-meta">
                            <span className="rs-opt-role">{roleMeta.label}</span>
                            <span className="rs-opt-name">{roleMeta.name}</span>
                          </span>
                          <Icon name="check" size={15} className="rs-check" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rs-menu-head">Logged in as</div>
                        <div className="rs-opt on" style={{ pointerEvents: 'none' }}>
                          <Avatar name={roleMeta.name} size={30} />
                          <span className="rs-opt-meta">
                            <span className="rs-opt-role">{roleMeta.label}</span>
                            <span className="rs-opt-name">{roleMeta.name}</span>
                          </span>
                        </div>
                      </>
                    )}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', margin: '4px 0' }} />
                    <button className="rs-opt" style={{ color: '#f87171' }} onClick={handleLogout}>
                      <Icon name="x" size={18} />
                      <span className="rs-opt-meta"><span className="rs-opt-role">Sign out</span><span className="rs-opt-name">{session.email}</span></span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {view === 'overview' && (
            <OverviewView claims={claims} go={go} setRole={setRole} inflow={inflow} members={members} availableFunds={availableFunds} />
          )}
          {view === 'claims' && (
            <ClaimsView
              claims={claims} role={role}
              onApprove={onApprove} onReject={onReject}
              openId={openId} setOpenId={setOpenId}
              openNew={openNew} setOpenNew={setOpenNew}
              openSponsor={openSponsor} setOpenSponsor={setOpenSponsor}
              onNewClaim={onNewClaim} onSponsor={onSponsor}
              onMoveClaimStage={(claimId, stageIdx) => onForceClaimStatus(claimId, 'stage', stageIdx)}
              onVoidClaim={onVoidClaim}
              currentUser={session}
            />
          )}
          {view === 'members' && (
            <MembersView
              members={members}
              role={role}
              onAddMember={onAddMember}
              onUpdateMemberStatus={onUpdateMemberStatus}
              onUpdateMemberRole={onUpdateMemberRole}
              onExportMembersPdf={() => setOpenExportDialog('members')}
            />
          )}
          {view === 'finances' && (
            <FinancesView
              charges={charges}
              onUpdateCharges={onUpdateCharges}
              claims={claims}
              inflow={inflow}
              members={members}
              sponsors={sponsors}
              onAddInflow={(item) => { onAddInflow({ ...item, status: 'approved' }); }}
              onExportPdf={() => setOpenExportDialog('ledger')}
            />
          )}
          {view === 'sponsorships' && (
            <SponsorshipsView
              sponsors={sponsors}
              onNewSponsor={onSponsor}
              onUpdateStatus={onUpdateSponsorStatus}
            />
          )}
          {view === 'administration' && (
            <AdministrationView
              members={members}
              inflow={inflow}
              claims={claims}
              onAddInflow={onAddInflow}
              pendingInflows={pendingInflows}
              onApproveInflow={onApproveInflow}
              onRejectInflow={onRejectInflow}
              onExportLedger={() => setOpenExportDialog('ledger')}
              onExportMembers={() => setOpenExportDialog('members')}
              onForceClaimStatus={onForceClaimStatus}
              availableFunds={availableFunds}
              onUpdateFunds={onUpdateFunds}
              changelog={changelog}
              onNewClaim={onNewClaim}
              onSponsor={onSponsor}
              onUpdateMemberRole={onUpdateMemberRole}
              session={session}
              portalUsers={portalUsers}
              onAddPortalUser={onAddPortalUser}
              onRemovePortalUser={onRemovePortalUser}
              onUpdatePortalUserRole={onUpdatePortalUserRole}
            />
          )}
          {view === 'member-portal' && (
            <MemberPortalView
              claims={claims}
              members={members}
              role={role}
              onNewClaim={onNewClaim}
              onSponsor={onSponsor}
              currentUser={session}
              onUpdateProfile={onUpdateProfile}
              onRenewMembership={onRenewMembership}
            />
          )}
        </div>
      </div>

      <nav className="botnav">
        {visibleNav.slice(0, 5).map((item) => (
          <button key={item.key} className={'bn-item' + (view === item.key ? ' on' : '')} onClick={() => go(item.key)}>
            <Icon name={item.icon} size={21} />
            <span>{item.label}</span>
            {item.key === 'claims' && myPending > 0 && <span className="bn-badge">{myPending}</span>}
          </button>
        ))}
      </nav>

      <Toast toast={toast} />

      {openExportDialog && (
        <ExportDialog
          type={openExportDialog}
          members={members}
          inflow={inflow}
          onClose={() => setOpenExportDialog(false)}
          onExportLedger={onExportLedger}
          onExportMembers={onExportMembers}
        />
      )}
    </div>
  );
}

/* ---------- Export dialog ---------- */
function ExportDialog({ type, members, inflow, onClose, onExportLedger, onExportMembers }) {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [ledgerRange, setLedgerRange] = React.useState('all');
  const [memberType, setMemberType] = React.useState('all');
  const [joinedStart, setJoinedStart] = React.useState('');
  const [joinedEnd, setJoinedEnd] = React.useState('');

  const handleExport = () => {
    if (type === 'ledger') {
      if (ledgerRange === 'all') {
        onExportLedger({ startDate: '', endDate: '' });
      } else {
        onExportLedger({ startDate, endDate });
      }
    } else {
      onExportMembers({ memberType, joinedStart, joinedEnd });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{type === 'ledger' ? 'Export Ledger PDF' : 'Export Members PDF'}</h2>
            <p className="modal-sub">Choose what to include in the export</p>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>
        <div className="modal-body">
          {type === 'ledger' ? (
            <div className="form-grid">
              <Field label="Date range">
                <select className="select" value={ledgerRange} onChange={e => setLedgerRange(e.target.value)}>
                  <option value="all">All time (full ledger)</option>
                  <option value="custom">Custom date range</option>
                </select>
              </Field>
              {ledgerRange === 'custom' && (
                <div className="form-2">
                  <Field label="From date">
                    <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate || undefined} />
                  </Field>
                  <Field label="To date">
                    <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || undefined} />
                  </Field>
                </div>
              )}
            </div>
          ) : (
            <div className="form-grid">
              <Field label="Member type">
                <select className="select" value={memberType} onChange={e => setMemberType(e.target.value)}>
                  <option value="all">All members</option>
                  <option value="annual">Annual members only</option>
                  <option value="lifetime">Lifetime members only</option>
                </select>
              </Field>
              <Field label="Joined between (optional)" hint="Select a date range to filter by join date">
                <div className="form-2">
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>From</label>
                    <input type="date" className="input" value={joinedStart} onChange={e => setJoinedStart(e.target.value)} max={joinedEnd || undefined} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>To</label>
                    <input type="date" className="input" value={joinedEnd} onChange={e => setJoinedEnd(e.target.value)} min={joinedStart || undefined} />
                  </div>
                </div>
                {(!joinedStart && !joinedEnd) && <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '4px 0 0' }}>Leave blank to include all join dates</p>}
              </Field>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <div className="ff-btns">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" icon="download" onClick={handleExport}>Export PDF</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
