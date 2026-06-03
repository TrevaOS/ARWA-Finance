import React from 'react';
import { DATA, CAT_COLORS } from '../data.js';
import { Icon, Card, Button, Badge, SectionTitle, Stepper, Modal, Field, TextInput, TextArea, Select, Segmented, FileDrop, EmptyState, fmtDate, fmtShortDate, claimTone, claimStatusLabel } from '../ui/components.jsx';

function catMeta(key) {
  const c = DATA.CATEGORIES.find((x) => x.key === key) || {};
  return { label: c.label || key, icon: c.icon || 'tool', color: CAT_COLORS[key] || '#999' };
}

const CLAIM_DEADLINE_DAYS = 5;
const CLAIM_WARNING_DAYS = 2;

function claimDaysOpen(claim) {
  if (!claim.date || claim.status !== 'open') return null;
  const raised = new Date(claim.date + 'T00:00:00');
  const today = new Date(DATA.TODAY + 'T00:00:00');
  return Math.floor((today - raised) / 86400000);
}

export function ClaimsView({ claims, role, onApprove, onReject, openId, setOpenId, openNew, setOpenNew, openSponsor, setOpenSponsor, onNewClaim, onSponsor, onMoveClaimStage, onVoidClaim, currentUser }) {
  const roleMeta = DATA.ROLES.find((r) => r.key === role) || DATA.ROLES[0];
  const displayName = currentUser?.name || roleMeta.label;
  const roleIdx = DATA.STAGE_KEYS.indexOf(role);
  const [tab, setTab] = React.useState('all');
  const [viewMode, setViewMode] = React.useState('list');
  const [filterCat, setFilterCat] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [catMenuOpen, setCatMenuOpen] = React.useState(false);
  const catMenuRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (catMenuRef.current && !catMenuRef.current.contains(e.target)) setCatMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const open = claims.filter((c) => c.status === 'open');
  const mine = open.filter((c) => c.stageIndex === roleIdx);
  const resolved = claims.filter((c) => c.status !== 'open');
  const lists = { mine, all: open, resolved };
  let shown = lists[tab] || [];

  if (filterCat !== 'all') shown = shown.filter((c) => c.category === filterCat);
  if (filterStatus !== 'all') shown = shown.filter((c) => filterStatus === 'disbursed' ? c.status === 'disbursed' : filterStatus === 'rejected' ? c.status === 'rejected' : c.stageIndex === DATA.STAGE_KEYS.indexOf(filterStatus));

  const active = claims.find((c) => c.id === openId);
  const activeCatLabel = filterCat === 'all' ? null : DATA.CATEGORIES.find(c => c.key === filterCat)?.label;

  return (
    <div className="view">
      <div className="role-banner">
        <div className="rb-left">
          <div className="rb-avatar"><Icon name="user" size={22} /></div>
          <div>
            <div className="rb-role">Reviewing as <b>{roleMeta.label}</b>{roleMeta.final && <span className="final-tag">final approver</span>}</div>
            <div className="rb-name">{displayName} &middot; {mine.length} item{mine.length !== 1 ? 's' : ''} awaiting your action</div>
          </div>
        </div>
        <div className="rb-actions">
          <Button variant="ghost" icon="heart" onClick={() => setOpenSponsor(true)}>Raise sponsorship</Button>
          <Button variant="primary" icon="plus" onClick={() => setOpenNew(true)}>New claim</Button>
        </div>
      </div>

      <div className="claims-toolbar">
        <div className="tabs" style={{ borderBottom: 'none', flex: 1 }}>
          <button className={'tab' + (tab === 'all' ? ' on' : '')} onClick={() => setTab('all')}>
            All open<span className="tab-count">{open.length}</span>
          </button>
          <button className={'tab' + (tab === 'mine' ? ' on' : '')} onClick={() => setTab('mine')}>
            {roleMeta.final ? 'Final approval' : 'Needs my action'}<span className="tab-count">{mine.length}</span>
          </button>
          <button className={'tab' + (tab === 'resolved' ? ' on' : '')} onClick={() => setTab('resolved')}>
            Resolved<span className="tab-count">{resolved.length}</span>
          </button>
        </div>
        <div className="claims-view-switch">
          {[['list','menu'],['card','overview'],['kanban','claims']].map(([mode, icon]) => (
            <button key={mode} className={'cvs-btn' + (viewMode === mode ? ' on' : '')} onClick={() => setViewMode(mode)} title={mode.charAt(0).toUpperCase() + mode.slice(1) + ' view'}>
              <Icon name={icon} size={16} />
            </button>
          ))}
        </div>
      </div>

      <div className="claims-filters">
        <div className="cf-group">
          <Icon name="filter" size={14} />
          <span>Category:</span>
          <div ref={catMenuRef} className="cf-dropdown">
            <button className={'cf-dropdown-btn' + (filterCat !== 'all' ? ' has-filter' : '')} onClick={() => setCatMenuOpen(v => !v)}>
              <Icon name={filterCat === 'all' ? 'filter' : (DATA.CATEGORIES.find(c => c.key === filterCat)?.icon || 'filter')} size={13} />
              {activeCatLabel || 'All categories'}
              <Icon name="chevdown" size={12} />
            </button>
            {catMenuOpen && (
              <div className="cf-dropdown-menu">
                <button className={'cf-dropdown-item' + (filterCat === 'all' ? ' on' : '')} onClick={() => { setFilterCat('all'); setCatMenuOpen(false); }}>
                  <Icon name="filter" size={14} />All categories
                </button>
                {DATA.CATEGORIES.map((c) => (
                  <button key={c.key} className={'cf-dropdown-item' + (filterCat === c.key ? ' on' : '')} onClick={() => { setFilterCat(filterCat === c.key ? 'all' : c.key); setCatMenuOpen(false); }}>
                    <Icon name={c.icon} size={14} />{c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deadline warnings for open claims approaching expiry */}
      {tab !== 'resolved' && open.filter(c => {
        const d = claimDaysOpen(c);
        return d !== null && d >= (CLAIM_DEADLINE_DAYS - CLAIM_WARNING_DAYS);
      }).map(c => {
        const d = claimDaysOpen(c);
        const daysLeft = CLAIM_DEADLINE_DAYS - d;
        const isExpired = daysLeft <= 0;
        return (
          <div key={c.id} style={{background: isExpired ? 'var(--danger-bg)' : 'var(--amber-bg)', border: '1px solid ' + (isExpired ? 'var(--danger)' : '#e8c96a'), borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'}}>
            <Icon name="clock" size={16} style={{color: isExpired ? 'var(--danger)' : 'var(--amber)', flexShrink:0}}/>
            <div style={{flex:1}}>
              <span style={{fontWeight:700,fontSize:13.5,color: isExpired ? 'var(--danger)' : 'var(--amber)'}}>{c.id} — {c.title}</span>
              <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>
                {isExpired
                  ? 'Claim window expired — no response in 5 days. Pending void.'
                  : `${daysLeft} day${daysLeft!==1?'s':''} left before this claim is automatically voided (5-day window)`}
              </div>
            </div>
            {isExpired && onVoidClaim && (
              <Button size="sm" variant="soft-danger" icon="x" onClick={() => onVoidClaim(c.id)}>Void claim</Button>
            )}
          </div>
        );
      })}

      {shown.length === 0 ? (
        <Card><EmptyState icon="check" title="Nothing here right now" sub="No claims match the current filter. Try switching tabs or clearing filters." /></Card>
      ) : viewMode === 'list' ? (
        <div className="claim-list">
          {shown.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} roleIdx={roleIdx} onOpen={() => setOpenId(claim.id)} onApprove={() => onApprove(claim.id)} onReject={() => setOpenId(claim.id)} />
          ))}
        </div>
      ) : viewMode === 'card' ? (
        <div className="claim-card-grid">
          {shown.map((claim) => (
            <ClaimCardGrid key={claim.id} claim={claim} roleIdx={roleIdx} onOpen={() => setOpenId(claim.id)} onApprove={() => onApprove(claim.id)} onReject={() => setOpenId(claim.id)} />
          ))}
        </div>
      ) : (
        <KanbanView claims={shown} roleIdx={roleIdx} onOpen={(id) => setOpenId(id)} onApprove={onApprove} onReject={(id) => setOpenId(id)} onMoveStage={onMoveClaimStage} />
      )}

      {active && (
        <ClaimDetail claim={active} roleIdx={roleIdx} onClose={() => setOpenId(null)} onApprove={onApprove} onReject={onReject} />
      )}

      <NewClaimForm open={openNew} onClose={() => setOpenNew(false)} onSubmit={onNewClaim} />
      <SponsorForm open={openSponsor} onClose={() => setOpenSponsor(false)} onSubmit={onSponsor} />
    </div>
  );
}

/* ---------- List view (original) ---------- */
function ClaimCard({ claim, roleIdx, onOpen, onApprove, onReject }) {
  const cm = catMeta(claim.category);
  const canAct = claim.status === 'open' && claim.stageIndex === roleIdx;
  return (
    <div className="claim-card">
      <div className="cc-main" onClick={onOpen}>
        <span className="cc-cat" style={{ background: cm.color + '1f', color: cm.color }}><Icon name={cm.icon} size={18} /></span>
        <div className="cc-body">
          <div className="cc-top">
            <span className="cc-id">{claim.id}</span>
            <Badge tone={claimTone(claim)}>{claimStatusLabel(claim)}</Badge>
            <span className={'cc-type ' + claim.type}>{claim.type === 'recurring' ? 'Recurring' : 'One-time'}</span>
          </div>
          <h4 className="cc-title">{claim.title}</h4>
          <div className="cc-meta">
            <span>{cm.label}</span><i>&middot;</i><span>by {claim.raisedBy}</span><i>&middot;</i><span>{fmtDate(claim.date)}</span>
            {claim.hasInvoice && <span className="cc-attach"><Icon name="clip" size={13} />Invoice</span>}
            {claim.hasImage && <span className="cc-attach"><Icon name="image" size={13} />Photo</span>}
          </div>
        </div>
        <div className="cc-amt">{DATA.inr(claim.amount)}</div>
      </div>
      <div className="cc-foot">
        <Stepper claim={claim} compact />
        {canAct ? (
          <div className="cc-actions">
            <Button size="sm" variant="soft-danger" icon="x" onClick={onReject}>Return</Button>
            <Button size="sm" variant="primary" icon="check" onClick={onApprove}>{roleIdx >= 4 ? 'Approve & release' : 'Approve'}</Button>
          </div>
        ) : (
          <button className="cc-view" onClick={onOpen}>View<Icon name="chevright" size={15} /></button>
        )}
      </div>
    </div>
  );
}

/* ---------- Card grid view ---------- */
function ClaimCardGrid({ claim, roleIdx, onOpen, onApprove, onReject }) {
  const cm = catMeta(claim.category);
  const canAct = claim.status === 'open' && claim.stageIndex === roleIdx;
  return (
    <div className="ccg-card" onClick={onOpen}>
      <div className="ccg-top" style={{ background: cm.color + '18' }}>
        <span className="ccg-ico" style={{ color: cm.color }}><Icon name={cm.icon} size={22} /></span>
        <Badge tone={claimTone(claim)}>{claimStatusLabel(claim)}</Badge>
      </div>
      <div className="ccg-body">
        <div className="ccg-id">{claim.id}</div>
        <h4 className="ccg-title">{claim.title}</h4>
        <div className="ccg-meta">{cm.label} &middot; {fmtShortDate(claim.date)}</div>
        <div className="ccg-amt">{DATA.inr(claim.amount)}</div>
        <Stepper claim={claim} compact />
      </div>
      {canAct && (
        <div className="ccg-foot" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="soft-danger" icon="x" onClick={onReject}>Return</Button>
          <Button size="sm" variant="primary" icon="check" onClick={onApprove}>Approve</Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Kanban pipeline view ---------- */
const KANBAN_COLS = [
  { key: 'js',   label: 'Joint Secretary', stageIdx: 0 },
  { key: 'sec',  label: 'Secretary',       stageIdx: 1 },
  { key: 'vp',   label: 'Vice President',  stageIdx: 2 },
  { key: 'pres', label: 'President',       stageIdx: 3 },
  { key: 'tre',  label: 'Treasurer',       stageIdx: 4 },
  { key: 'done', label: 'Disbursed',       stageIdx: 5 },
];

function KanbanView({ claims, roleIdx, onOpen, onApprove, onReject, onMoveStage }) {
  const [draggingId, setDraggingId] = React.useState(null);
  const [overCol, setOverCol] = React.useState(null);

  const handleDragStart = (e, claimId) => {
    setDraggingId(claimId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('claimId', claimId);
  };
  const handleDragEnd = () => { setDraggingId(null); setOverCol(null); };
  const handleDragOver = (e, colKey) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(colKey); };
  const handleDrop = (e, col) => {
    e.preventDefault();
    const claimId = e.dataTransfer.getData('claimId');
    if (claimId && col.key !== 'done' && onMoveStage) {
      onMoveStage(claimId, col.stageIdx);
    }
    setDraggingId(null);
    setOverCol(null);
  };

  return (
    <div className="kanban-board">
      {KANBAN_COLS.map((col) => {
        const cards = col.key === 'done'
          ? claims.filter((c) => c.status === 'disbursed')
          : claims.filter((c) => c.status === 'open' && c.stageIndex === col.stageIdx);
        const isMyCol = col.stageIdx === roleIdx;
        const isDragOver = overCol === col.key;
        return (
          <div key={col.key}
            className={'kanban-col' + (isMyCol ? ' kanban-mine' : '') + (isDragOver && col.key !== 'done' ? ' kanban-drag-over' : '')}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="kanban-col-head">
              <span className="kanban-col-title">{col.label}</span>
              <span className={'kanban-count' + (cards.length && isMyCol ? ' has' : '')}>{cards.length}</span>
            </div>
            <div className="kanban-cards">
              {cards.length === 0 && <div className={'kanban-empty' + (isDragOver && col.key !== 'done' ? ' kanban-drop-target' : '')}>
                {isDragOver && col.key !== 'done' ? 'Drop here' : 'No claims'}
              </div>}
              {cards.map((c) => {
                const cm = catMeta(c.category);
                const canAct = c.status === 'open' && c.stageIndex === roleIdx;
                const isDragging = draggingId === c.id;
                return (
                  <div key={c.id}
                    className={'kanban-card' + (isDragging ? ' kanban-dragging' : '')}
                    draggable={c.status === 'open'}
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isDragging && onOpen(c.id)}
                    title={c.status === 'open' ? 'Drag to move to another stage' : ''}
                  >
                    <div className="kc-top">
                      <span className="kc-ico" style={{ background: cm.color + '20', color: cm.color }}><Icon name={cm.icon} size={14} /></span>
                      <span className="kc-id">{c.id}</span>
                      {c.status === 'open' && <span className="kc-drag-handle" title="Drag to move"><Icon name="menu" size={12} style={{ color: 'var(--ink-4)', cursor: 'grab' }} /></span>}
                      {c.hasInvoice && <Icon name="clip" size={12} style={{ color: 'var(--ink-3)', marginLeft: 'auto' }} />}
                    </div>
                    <div className="kc-title">{c.title}</div>
                    <div className="kc-meta">{DATA.inr(c.amount)} &middot; {fmtShortDate(c.date)}</div>
                    {canAct && (
                      <div className="kc-actions" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="soft-danger" icon="x" onClick={() => onReject(c.id)}>Return</Button>
                        <Button size="sm" variant="primary" icon="check" onClick={() => onApprove(c.id)}>Approve</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Detail modal ---------- */
function ClaimDetail({ claim, roleIdx, onClose, onApprove, onReject }) {
  const cm = catMeta(claim.category);
  const canAct = claim.status === 'open' && claim.stageIndex === roleIdx;
  const [mode, setMode] = React.useState(null);
  const [note, setNote] = React.useState('');

  const timeline = [];
  timeline.push({ kind: 'raised', name: claim.raisedBy, date: claim.date });
  claim.approvals.forEach((a) => timeline.push({ kind: 'approved', ...a }));
  if (claim.rejected) timeline.push({ kind: 'rejected', ...claim.rejected });
  if (claim.status === 'disbursed') timeline.push({ kind: 'disbursed', name: 'Treasurer', date: claim.disbursedDate });

  const footer = canAct ? (
    mode ? (
      <div className="detail-act-bar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        {mode === 'reject' ? (
          <div className="revision-comment-box">
            <div className="rcb-label">Reason for returning (required)</div>
            <textarea className="rcb-input" autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe what needs to be corrected or added before re-submission..." rows={3} />
          </div>
        ) : (
          <TextInput autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an approval note (optional)" />
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => { setMode(null); setNote(''); }}>Cancel</Button>
          {mode === 'approve' ? (
            <Button variant="primary" icon="check" onClick={() => onApprove(claim.id, note)}>{roleIdx >= 4 ? 'Approve & release funds' : 'Confirm approval'}</Button>
          ) : (
            <Button variant="danger" icon="x" disabled={!note.trim()} onClick={() => onReject(claim.id, note)}>Return claim</Button>
          )}
        </div>
      </div>
    ) : (
      <div className="detail-act-bar">
        <span className="dab-note"><Icon name="info" size={15} />You are the <b>{DATA.ROLES[roleIdx].label}</b> on this claim.</span>
        <Button variant="soft-danger" icon="x" onClick={() => setMode('reject')}>Return for revision</Button>
        <Button variant="primary" icon="check" onClick={() => setMode('approve')}>{roleIdx >= 4 ? 'Approve & release' : 'Approve & forward'}</Button>
      </div>
    )
  ) : claim.status === 'rejected' ? (
    <div className="detail-act-bar">
      <span className="dab-note" style={{ color: 'var(--danger)' }}><Icon name="x" size={15} />This claim was returned for revision.</span>
    </div>
  ) : null;

  return (
    <Modal open onClose={onClose} wide title={claim.title} sub={claim.id + ' · raised by ' + claim.raisedBy + ' (' + claim.raisedFlat + ') · ' + claim.date} footer={footer}>
      <div className="detail-grid">
        <div className="detail-left">
          <div className="detail-tags">
            <Badge tone={claimTone(claim)}>{claimStatusLabel(claim)}</Badge>
            <span className="d-tag" style={{ color: cm.color, background: cm.color + '1f' }}><Icon name={cm.icon} size={14} />{cm.label}</span>
            <span className="d-tag plain">{claim.type === 'recurring' ? 'Recurring cost' : 'One-time cost'}</span>
          </div>
          <div className="detail-amt">{DATA.inr(claim.amount)}</div>
          <p className="detail-desc">{claim.desc}</p>
          <div className="attach-row">
            <Attachment kind="image" present={claim.hasImage} label="Site / item photo" dataUrl={claim.imageDataUrl} />
            <Attachment kind="invoice" present={claim.hasInvoice} label="Vendor invoice / quote" dataUrl={claim.invoiceDataUrl} />
          </div>
          <SectionTitle kicker="RBAS chain">Approval progress</SectionTitle>
          <div className="detail-stepper"><Stepper claim={claim} /></div>
        </div>
        <div className="detail-right">
          <SectionTitle kicker="History">Timeline</SectionTitle>
          <div className="timeline">
            {timeline.map((t, i) => (
              <div className={'tl-item tl-' + t.kind} key={i}>
                <span className="tl-node"><Icon name={t.kind === 'rejected' ? 'x' : t.kind === 'raised' ? 'plus' : t.kind === 'disbursed' ? 'rupee' : 'check'} size={13} stroke={2.4} /></span>
                <div className="tl-body">
                  <div className="tl-head"><b>{t.name}</b><span className="tl-date">{fmtDate(t.date)}</span></div>
                  <div className="tl-role">
                    {t.kind === 'raised' ? 'Raised this claim'
                      : t.kind === 'disbursed' ? 'Released the funds'
                      : t.kind === 'rejected' ? (DATA.ROLES.find((r) => r.key === t.role)?.label || 'Reviewer') + ' · returned'
                      : (DATA.ROLES.find((r) => r.key === t.role)?.label || 'Reviewer') + ' · approved'}
                  </div>
                  {t.note && <div className="tl-note">"{t.note}"</div>}
                  {t.reason && <div className="tl-note bad">"{t.reason}"</div>}
                </div>
              </div>
            ))}
            {claim.status === 'open' && (
              <div className="tl-item tl-pending">
                <span className="tl-node"><Icon name="clock" size={13} /></span>
                <div className="tl-body">
                  <div className="tl-head"><b>{DATA.ROLES[claim.stageIndex]?.name}</b></div>
                  <div className="tl-role">{DATA.ROLES[claim.stageIndex]?.label} · awaiting decision</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Attachment({ kind, present, label, dataUrl }) {
  const [preview, setPreview] = React.useState(false);
  const isImage = dataUrl && dataUrl.startsWith('data:image');
  return (
    <>
      <div className={'attach' + (present ? '' : ' missing')} style={present && dataUrl ? { cursor: 'pointer' } : {}} onClick={() => present && dataUrl && setPreview(true)}>
        <div className="attach-thumb" style={isImage ? { overflow: 'hidden', padding: 0 } : {}}>
          {isImage
            ? <img src={dataUrl} alt="attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : present ? <Icon name={kind === 'image' ? 'image' : 'receipt'} size={26} />
            : <span className="attach-none">none</span>}
        </div>
        <div className="attach-meta">
          <span className="attach-label">{label}</span>
          <span className="attach-state">{present ? (dataUrl ? 'View attached' : 'Attached') : 'Not provided'}</span>
        </div>
        {present && dataUrl && <Icon name="chevright" size={14} style={{ color: 'var(--ink-3)', marginLeft: 'auto' }} />}
      </div>
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(false)} style={{ zIndex: 200 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-head">
              <h2>{label}</h2>
              <button className="icon-btn" onClick={() => setPreview(false)}><Icon name="x" size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: 12 }}>
              <img src={dataUrl} alt={label} style={{ width: '100%', borderRadius: 10, maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NewClaimForm({ open, onClose, onSubmit }) {
  const blank = { title: '', desc: '', type: 'one-time', category: '', customCategory: '', amount: '', hasImage: false, hasInvoice: false, imageFile: null, invoiceFile: null, imageDataUrl: null, invoiceDataUrl: null };
  const [form, setForm] = React.useState(blank);
  const [customInput, setCustomInput] = React.useState('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  React.useEffect(() => { if (open) { setForm(blank); setCustomInput(''); setShowCustomInput(false); } }, [open]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCategorySelect = (key) => {
    if (key === '__custom__') { setShowCustomInput(true); }
    else { set('category', key); setShowCustomInput(false); setCustomInput(''); }
  };

  const handleCustomSave = () => {
    if (customInput.trim()) {
      set('category', '__custom__');
      set('customCategory', customInput.trim());
      setShowCustomInput(false);
    }
  };

  const effectiveCategoryLabel = form.category === '__custom__' ? form.customCategory : catMeta(form.category).label;
  const valid = form.title.trim() && form.amount && Number(form.amount) > 0 &&
    (form.category && (form.category !== '__custom__' || form.customCategory.trim()));

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { set('imageDataUrl', e.target.result); set('hasImage', true); };
    reader.readAsDataURL(file);
    set('imageFile', { name: file.name, size: file.size, type: file.type });
  };

  const handleInvoiceUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { set('invoiceDataUrl', e.target.result); set('hasInvoice', true); };
    reader.readAsDataURL(file);
    set('invoiceFile', { name: file.name, size: file.size, type: file.type });
  };

  return (
    <Modal open={open} onClose={onClose} wide title="Raise a new claim" sub="Submitted claims start at the Joint Secretary and move up the chain." footer={
      <div className="form-foot">
        <div className="ff-btns">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" disabled={!valid} onClick={() => onSubmit({ ...form, category: form.category === '__custom__' ? form.customCategory.trim().toLowerCase().replace(/\s+/g, '_') : form.category, categoryLabel: effectiveCategoryLabel })}>Submit claim</Button>
        </div>
      </div>
    }>
      <div className="form-grid">
        <Field label="Claim heading" required>
          <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Replace Block C gate camera" />
        </Field>
        <Field label="Description" hint="What is needed and why. Mention vendor / urgency.">
          <TextArea rows={3} value={form.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Describe the requirement..." />
        </Field>
        <div className="form-2">
          <Field label="Claim type" required>
            <Segmented value={form.type} onChange={(value) => set('type', value)} options={[{ value: 'one-time', label: 'One-time cost' }, { value: 'recurring', label: 'Recurring' }]} />
          </Field>
          <Field label="Amount (Rs.)" required>
            <TextInput type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Category" required>
          <Select value={form.category === '__custom__' ? '__custom__' : form.category} onChange={(e) => handleCategorySelect(e.target.value)}>
            <option value="">Select a category...</option>
            {DATA.CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            <option value="__custom__">+ Custom category...</option>
          </Select>
          {showCustomInput && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <TextInput style={{ flex: 1 }} value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Type your category name..." autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSave(); }} />
              <Button variant="primary" size="sm" icon="check" disabled={!customInput.trim()} onClick={handleCustomSave}>Save</Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowCustomInput(false); setCustomInput(''); }}>Cancel</Button>
            </div>
          )}
          {form.category === '__custom__' && form.customCategory && !showCustomInput && (
            <div style={{ marginTop: 6, fontSize: 13, color: '#6B4EAA', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="tag" size={14} />Custom: <b>{form.customCategory}</b>
              <button type="button" style={{ marginLeft: 4, background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 13 }} onClick={() => { setCustomInput(form.customCategory); setShowCustomInput(true); set('category', ''); set('customCategory', ''); }}>Edit</button>
            </div>
          )}
        </Field>
        <div className="form-2">
          <Field label="Item / site photo" hint="Helps reviewers verify the need.">
            <FileDropWithPreview icon="image" label="Attach photo" accept="image/*"
              filename={form.imageFile?.name || (form.hasImage ? 'site-photo.jpg' : null)}
              dataUrl={form.imageDataUrl}
              onUpload={handleImageUpload}
              onRemove={() => { set('hasImage', false); set('imageFile', null); set('imageDataUrl', null); }} />
          </Field>
          <Field label="Invoice / quotation" hint="Required before disbursal.">
            <FileDropWithPreview icon="receipt" label="Attach invoice" accept="image/*,application/pdf"
              filename={form.invoiceFile?.name || (form.hasInvoice ? 'vendor-quote.pdf' : null)}
              dataUrl={form.invoiceDataUrl}
              onUpload={handleInvoiceUpload}
              onRemove={() => { set('hasInvoice', false); set('invoiceFile', null); set('invoiceDataUrl', null); }} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function FileDropWithPreview({ label, icon, accept, filename, dataUrl, onUpload, onRemove }) {
  const inputRef = React.useRef(null);
  const handleFile = (e) => { const f = e.target.files?.[0]; if (f) onUpload(f); };
  const isImage = dataUrl && dataUrl.startsWith('data:image');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input ref={inputRef} type="file" hidden accept={accept} onChange={handleFile} />
      {dataUrl && isImage && (
        <div style={{ position: 'relative', width: '100%', maxHeight: 120, overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border)' }}>
          <img src={dataUrl} alt="preview" style={{ width: '100%', objectFit: 'cover', maxHeight: 120 }} />
          <button type="button" onClick={onRemove} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: '50%', color: '#fff', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={12} /></button>
        </div>
      )}
      {filename && !isImage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
          <Icon name="receipt" size={15} style={{ color: 'var(--green)' }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</span>
          <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Icon name="x" size={14} /></button>
        </div>
      )}
      <button type="button" className={"filedrop" + (filename ? " filled" : "")} onClick={() => inputRef.current?.click()}>
        <Icon name={filename ? "check" : icon} size={18} />
        <span>{filename ? 'Replace file' : label}</span>
      </button>
    </div>
  );
}

function SponsorForm({ open, onClose, onSubmit }) {
  const blank = { name: '', type: 'Local Business', customType: '', objective: '', amount: '' };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const valid = form.name.trim() && form.amount && Number(form.amount) > 0 && form.objective.trim() &&
    (form.type !== '__custom__' || form.customType.trim());
  const effectiveType = form.type === '__custom__' ? form.customType : form.type;

  return (
    <Modal open={open} onClose={onClose} wide title="Raise a sponsorship" sub="Any executive member can bring a sponsor in to raise funds for the association." footer={
      <div className="form-foot">
        <span className="ff-note"><Icon name="heart" size={15} />Sponsorship inflow is logged to the association ledger.</span>
        <div className="ff-btns">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" disabled={!valid} onClick={() => onSubmit({ ...form, type: effectiveType })}>Record sponsorship</Button>
        </div>
      </div>
    }>
      <div className="sponsor-grid">
        <div>
          <Field label="Sponsor name" required>
            <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sri Lakshmi Hardware" />
          </Field>
          <Field label="Type of sponsor" required>
            <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
              {['Local Business', 'Corporate', 'Individual / Professional', 'NGO / Trust', 'Resident family'].map((option) => <option key={option} value={option}>{option}</option>)}
              <option value="__custom__">+ Add custom type...</option>
            </Select>
          </Field>
          {form.type === '__custom__' && (
            <Field label="Custom type name" required>
              <TextInput value={form.customType} onChange={(e) => set('customType', e.target.value)} placeholder="e.g. Religious Trust" autoFocus />
            </Field>
          )}
          <Field label="Sponsorship objective" required hint="What the funds are intended to support.">
            <TextArea rows={3} value={form.objective} onChange={(e) => set('objective', e.target.value)} placeholder="e.g. Ganesha festival decorations & cultural program" />
          </Field>
          <Field label="Amount (Rs.)" required hint="Custom amount agreed with the sponsor.">
            <TextInput type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="qr-panel">
          <div className="qr-title">Collection QR</div>
          <div className="qr-box"><QrArt /></div>
          <div className="qr-vpa">attiguppe.rwa@upi</div>
          <div className="qr-amt">{form.amount ? DATA.inr(Number(form.amount)) : 'Enter amount'}</div>
          <p className="qr-note">Share this UPI QR with the sponsor to collect directly to the association account.</p>
        </div>
      </div>
    </Modal>
  );
}

function QrArt() {
  const cells = [];
  const size = 21;
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const finder = (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8);
      const on = finder ? ((x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5))) : rnd() > 0.55;
      if (on) cells.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" />);
    }
  }
  return <svg viewBox={'0 0 ' + size + ' ' + size} className="qr-svg">{cells}</svg>;
}
