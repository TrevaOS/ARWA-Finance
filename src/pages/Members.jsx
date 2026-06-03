import React from 'react';
import { DATA, computeEndDate, fmtEndDate } from '../data.js';
import { Icon, Card, Button, Badge, Avatar, Field, TextInput, TextArea, Select, Modal, FileDrop, SectionTitle } from '../ui/components.jsx';

const TODAY = new Date(DATA.TODAY + 'T00:00:00');

function daysLeft(member) {
  const end = computeEndDate(member);
  if (!end) return null;
  return Math.ceil((end - TODAY) / 86400000);
}

function EndDateCell({ member }) {
  if (member.type === 'lifetime') return <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>Lifetime</span>;
  const end = computeEndDate(member);
  if (!end) return <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>—</span>;
  const days = Math.ceil((end - TODAY) / 86400000);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = end.getDate() + ' ' + MONTHS[end.getMonth()] + ' ' + end.getFullYear();
  const urgent = days <= 30;
  const warning = days <= 60;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: urgent ? 'var(--danger)' : warning ? 'var(--amber)' : 'var(--ink-2)' }}>{dateStr}</span>
      <span style={{ fontSize: 11, color: urgent ? 'var(--danger)' : warning ? 'var(--amber)' : 'var(--ink-3)' }}>
        {days <= 0 ? 'Expired' : `${days}d left`}
      </span>
    </div>
  );
}

const UNIQUE_ROLES_LIST = ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer'];
const ALL_ROLES_LIST = [...UNIQUE_ROLES_LIST, 'Member'];

export function MembersView({ members, onAddMember, onUpdateMemberStatus, onExportMembersPdf, role, onUpdateMemberRole }) {
  const [showOnboard, setShowOnboard] = React.useState(false);
  const [screen, setScreen] = React.useState('all');
  const [filterType, setFilterType] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [editRoleId, setEditRoleId] = React.useState(null);

  const canAddMember = role === 'president' || role === 'vice_president';
  const canEditRoles = role === 'president' || role === 'vice_president';
  const TOTAL_DAYS = 5;
  const WARNING_DAYS = 2;

  const paid = members.filter((m) => m.status === 'paid');
  const due = members.filter((m) => m.status === 'due' || m.status === 'overdue');
  const pending = members.filter((m) => m.status === 'pending');

  let base = screen === 'paid' ? paid : screen === 'due' ? due : screen === 'pending' ? pending : members;
  if (filterType !== 'all') base = base.filter((m) => m.type === filterType);
  const shown = search.trim()
    ? base.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.flat?.toLowerCase().includes(search.toLowerCase()))
    : base;

  const annualCount = members.filter(m => m.type === 'annual').length;
  const lifetimeCount = members.filter(m => m.type === 'lifetime').length;
  const expiringCount = members.filter(m => { const d = daysLeft(m); return d !== null && d <= 60; }).length;

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h2 className="section-heading">Members</h2>
          <p className="page-meta">Resident registration, payment status and membership list.</p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" icon="download" onClick={onExportMembersPdf}>Export PDF</Button>
          {canAddMember && (
            <Button variant="primary" icon="plus" onClick={() => setShowOnboard(true)}>Add member</Button>
          )}
        </div>
      </div>

      <div className="member-stats-row">
        <div className="ms-box"><span className="ms-val">{members.length}</span><span className="ms-lbl">Total</span></div>
        <div className="ms-box ms-paid"><span className="ms-val">{paid.length}</span><span className="ms-lbl">Paid</span></div>
        <div className="ms-box ms-due"><span className="ms-val">{due.length}</span><span className="ms-lbl">Due / Overdue</span></div>
        <div className="ms-box ms-pending"><span className="ms-val">{pending.length}</span><span className="ms-lbl">Pending</span></div>
        {expiringCount > 0 && (
          <div className="ms-box" style={{ borderColor: 'var(--amber)', background: 'var(--amber-bg)' }}>
            <span className="ms-val" style={{ color: 'var(--amber)' }}>{expiringCount}</span>
            <span className="ms-lbl">Expiring soon</span>
          </div>
        )}
      </div>

      <div className="members-toolbar">
        <div className="tabs tabs-sm" style={{ borderBottom: 'none' }}>
          {[['all', 'All', members.length], ['paid', 'Paid', paid.length], ['due', 'Due/Overdue', due.length], ['pending', 'Pending', pending.length]].map(([key, label, count]) => (
            <button key={key} className={'tab' + (screen === key ? ' on' : '')} onClick={() => setScreen(key)}>
              {label}<span className="tab-count">{count}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="cf-chips">
            <button className={'cf-chip' + (filterType === 'all' ? ' on' : '')} onClick={() => setFilterType('all')}>All types</button>
            <button className={'cf-chip' + (filterType === 'annual' ? ' on' : '')} onClick={() => setFilterType(filterType === 'annual' ? 'all' : 'annual')}>
              Annual <span style={{ opacity: .65 }}>({annualCount})</span>
            </button>
            <button className={'cf-chip' + (filterType === 'lifetime' ? ' on' : '')} onClick={() => setFilterType(filterType === 'lifetime' ? 'all' : 'lifetime')}>
              Lifetime <span style={{ opacity: .65 }}>({lifetimeCount})</span>
            </button>
          </div>
          <div className="search">
            <Icon name="search" size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or flat…" />
          </div>
        </div>
      </div>

      {/* Pending member deadline warnings */}
      {pending.filter(m => {
        const since = m.since || m.joined;
        if (!since) return false;
        const created = new Date(since + 'T00:00:00');
        const daysElapsed = Math.floor((TODAY - created) / 86400000);
        return daysElapsed >= (TOTAL_DAYS - WARNING_DAYS);
      }).map(m => {
        const since = m.since || m.joined;
        const daysElapsed = Math.floor((TODAY - new Date(since + 'T00:00:00')) / 86400000);
        const daysLeft = TOTAL_DAYS - daysElapsed;
        const isUrgent = daysLeft <= 0;
        return (
          <div key={m.id} className={'member-deadline-banner' + (isUrgent ? ' urgent' : '')}>
            <Icon name={isUrgent ? 'x' : 'clock'} size={18} style={{ color: isUrgent ? 'var(--danger)' : 'var(--amber)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: isUrgent ? 'var(--danger)' : 'var(--amber)' }}>
                {isUrgent ? `${m.name} — membership not completed, will be removed today` : `${m.name} — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to complete onboarding`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.flat} · Pending since {since}</div>
            </div>
            {canAddMember && isUrgent && (
              <Button size="sm" variant="soft-danger" icon="x" onClick={() => onUpdateMemberStatus(m.id, 'removed')}>Remove</Button>
            )}
          </div>
        );
      })}

      <div className="mtable">
        <div className="mt-head" style={{gridTemplateColumns: canEditRoles ? '0.55fr 1.8fr 0.6fr 0.65fr 1fr 0.85fr 0.9fr 0.75fr' : '0.55fr 1.8fr 0.6fr 0.65fr 0.85fr 0.9fr 0.75fr'}}>
          <span>ID</span>
          <span>Member</span>
          <span>Flat</span>
          <span>Type</span>
          {canEditRoles && <span>Position</span>}
          <span>Joined</span>
          <span>End date</span>
          <span>Status</span>
        </div>
        {shown.length === 0 ? (
          <div className="empty" style={{ padding: '40px 0' }}>
            <span className="empty-ico"><Icon name="members" size={26} /></span>
            <div className="empty-title">No members found</div>
          </div>
        ) : shown.map((m) => (
          <div className="mt-row" key={m.id} style={{gridTemplateColumns: canEditRoles ? '0.55fr 1.8fr 0.6fr 0.65fr 1fr 0.85fr 0.9fr 0.75fr' : '0.55fr 1.8fr 0.6fr 0.65fr 0.85fr 0.9fr 0.75fr'}}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums', letterSpacing: '.01em' }}>{m.id}</span>
            <div className="mt-member">
              <Avatar name={m.name} size={34} />
              <div className="mt-meta">
                <span className="mt-name">{m.name}</span>
                <span className="mt-sub">{m.phone}</span>
              </div>
            </div>
            <span className="mt-date">{m.flat}</span>
            <span className={'type-tag ' + m.type}>{m.type === 'lifetime' ? 'Lifetime' : 'Annual'}</span>
            {canEditRoles && (
              <span>
                {editRoleId === m.id ? (
                  <div style={{display:'flex',gap:5,alignItems:'center'}}>
                    <select className="select" style={{fontSize:12,padding:'3px 8px'}}
                      value={m.role || 'Member'}
                      onChange={e => { onUpdateMemberRole && onUpdateMemberRole(m.id, e.target.value); setEditRoleId(null); }}>
                      {ALL_ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button type="button" onClick={() => setEditRoleId(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--ink-3)',padding:2}}><Icon name="x" size={13}/></button>
                  </div>
                ) : (
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    {m.role ? <span className="role-pill">{m.role}</span> : <span style={{fontSize:12,color:'var(--ink-3)'}}>Member</span>}
                    <button type="button" onClick={() => setEditRoleId(m.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--green)',opacity:.65,padding:2}} title="Change position">
                      <Icon name="edit" size={13}/>
                    </button>
                  </div>
                )}
              </span>
            )}
            <span className="mt-date" style={{ fontSize: 12 }}>{m.joined || m.since || '—'}</span>
            <span><EndDateCell member={m} /></span>
            <span>
              <Badge tone={m.status === 'paid' ? 'success' : m.status === 'overdue' ? 'danger' : m.status === 'pending' ? 'amber' : 'amber'}>
                {m.status === 'paid' ? 'Paid' : m.status === 'overdue' ? 'Overdue' : m.status === 'pending' ? 'Pending' : 'Due'}
              </Badge>
            </span>
          </div>
        ))}
      </div>

      <MemberOnboardForm open={showOnboard} onClose={() => setShowOnboard(false)} onSubmit={onAddMember} />
    </div>
  );
}

function MemberOnboardForm({ open, onClose, onSubmit }) {
  const blank = { name: '', phone: '', family: '', residence: '', photo: null, relationship: 'Primary', type: 'annual', notes: '' };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const valid = form.name && form.phone && form.residence;

  return (
    <Modal open={open} onClose={onClose} title="Add new member" sub="Collect resident details and upload a profile image." footer={
      <div className="form-foot">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" disabled={!valid} onClick={() => { onSubmit(form); onClose(); }}>Submit</Button>
      </div>
    }>
      <div className="form-grid">
        <Field label="Full name" required>
          <TextInput value={form.name} onChange={(e) => change('name', e.target.value)} placeholder="e.g. Suresh Kumar" />
        </Field>
        <Field label="Phone number" required>
          <TextInput value={form.phone} onChange={(e) => change('phone', e.target.value)} placeholder="Enter contact number" />
        </Field>
        <div className="form-2">
          <Field label="Residence / Flat" required>
            <TextInput value={form.residence} onChange={(e) => change('residence', e.target.value)} placeholder="e.g. A-201" />
          </Field>
          <Field label="Family name">
            <TextInput value={form.family} onChange={(e) => change('family', e.target.value)} placeholder="Household name" />
          </Field>
        </div>
        <div className="form-2">
          <Field label="Membership type">
            <Select value={form.type} onChange={(e) => change('type', e.target.value)}>
              <option value="annual">Annual</option>
              <option value="lifetime">Lifetime</option>
            </Select>
          </Field>
          <Field label="Relationship">
            <Select value={form.relationship} onChange={(e) => change('relationship', e.target.value)}>
              <option>Primary</option>
              <option>Spouse</option>
              <option>Child</option>
              <option>Parent</option>
              <option>Other</option>
            </Select>
          </Field>
        </div>
        <Field label="Profile photo">
          <FileDrop label={form.photo ? 'Photo attached' : 'Drop JPG/PNG or click to choose'} filename={form.photo ? 'profile-photo.png' : null} onUpload={(file) => change('photo', file ? URL.createObjectURL(file) : null)} />
        </Field>
        <Field label="Notes">
          <TextArea value={form.notes} onChange={(e) => change('notes', e.target.value)} placeholder="Any additional details..." />
        </Field>
      </div>
    </Modal>
  );
}
