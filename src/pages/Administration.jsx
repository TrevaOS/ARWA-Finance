import React from 'react';
import { DATA, CAT_COLORS } from '../data.js';
import { Icon, Card, Button, Badge, SectionTitle, StatCard, Modal, Field, TextInput, TextArea, Select, FileDrop, Segmented, fmtDate, fmtShortDate, Avatar, claimTone, claimStatusLabel, Stepper } from '../ui/components.jsx';

const MONTHS_LIST = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function AdministrationView({ members, inflow, claims, onAddInflow, pendingInflows, onApproveInflow, onRejectInflow, onExportLedger, onExportMembers, onForceClaimStatus, availableFunds, onUpdateFunds, changelog, onNewClaim, onSponsor, onUpdateMemberRole, session, portalUsers, onAddPortalUser, onRemovePortalUser, onUpdatePortalUserRole }) {
  const [tab, setTab] = React.useState('overview');
  const [openInflow, setOpenInflow] = React.useState(false);
  const [openFunds, setOpenFunds] = React.useState(false);
  const [openNewClaim, setOpenNewClaim] = React.useState(false);
  const [openNewSponsor, setOpenNewSponsor] = React.useState(false);

  const thisMonth = DATA.TODAY.slice(0, 7);
  const thisMonthInflow = inflow.filter((r) => r.month === thisMonth);
  const thisMonthTotal = thisMonthInflow.reduce((s, r) => s + (r.annual || 0) + (r.lifetime || 0) + (r.sponsorship || 0) + (r.donation || 0), 0);

  const openClaims   = claims.filter((c) => c.status === 'open');
  const raisedThis   = claims.filter((c) => c.date?.startsWith(thisMonth));
  const clearedThis  = claims.filter((c) => c.status === 'disbursed' && c.disbursedDate?.startsWith(thisMonth));
  const rejectedThis = claims.filter((c) => c.status === 'rejected' && c.rejected?.date?.startsWith(thisMonth));
  const awaitingFinal = openClaims.filter((c) => c.stageIndex >= 4);
  const totalOpenValue = openClaims.reduce((s, c) => s + c.amount, 0);
  const totalClearedValue = clearedThis.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="view">
      <div className="admin-header">
        <div>
          <div className="admin-title">Treva Administration</div>
          <div className="admin-sub">Super admin controls — full portal oversight, member management, claim override and exports.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="ghost" icon="download" onClick={onExportLedger} style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>Export Ledger</Button>
          <Button variant="ghost" icon="download" onClick={onExportMembers} style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>Export Members</Button>
          <Button variant="ghost" icon="edit" onClick={() => setOpenFunds(true)} style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>Update Funds</Button>
          <Button variant="ghost" icon="claims" onClick={() => setOpenNewClaim(true)} style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>New Claim</Button>
          <Button variant="ghost" icon="heart" onClick={() => setOpenNewSponsor(true)} style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>New Sponsor</Button>
          <Button variant="primary" icon="plus" onClick={() => setOpenInflow(true)}>Add Inflow</Button>
        </div>
      </div>

      {pendingInflows && pendingInflows.length > 0 && (
        <div className="inflow-review">
          <div className="ir-header">
            <Icon name="clock" size={18} />
            {pendingInflows.length} inflow record{pendingInflows.length !== 1 ? 's' : ''} pending committee review
          </div>
          <div className="ir-items">
            {pendingInflows.map((item) => (
              <div className="ir-item" key={item.id}>
                <div className="ir-meta">
                  <div className="ir-title">{item.fromName} — {item.source}</div>
                  <div className="ir-sub">{item.mode}{item.txnRef ? ' · Ref: ' + item.txnRef : ''} · {fmtDate(item.date)}</div>
                  {item.notes && <div className="ir-sub">{item.notes}</div>}
                </div>
                <div className="ir-amt">{DATA.inr(item.amount)}</div>
                <div className="ir-actions">
                  <Button size="sm" variant="soft-danger" icon="x" onClick={() => onRejectInflow(item.id)}>Reject</Button>
                  <Button size="sm" variant="primary" icon="check" onClick={() => onApproveInflow(item.id)}>Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tabs">
        {[
          ['overview',  'overview',  'Overview'],
          ['users',     'shield',    'Users'],
          ['claims',    'claims',    'Claims'],
          ['ledger',    'finances',  'Inflow Ledger'],
          ['members',   'members',   'Member List'],
          ['changelog', 'clock',     'Change Log'],
          ['settings',  'user',      'My Profile'],
        ].map(([key, icon, label]) => (
          <button key={key} className={'tab' + (tab === key ? ' on' : '')} onClick={() => setTab(key)}>
            <Icon name={icon} size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <AdminDashboard
        thisMonthTotal={thisMonthTotal}
        openClaims={openClaims}
        raisedThis={raisedThis}
        clearedThis={clearedThis}
        rejectedThis={rejectedThis}
        awaitingFinal={awaitingFinal}
        totalOpenValue={totalOpenValue}
        totalClearedValue={totalClearedValue}
        members={members}
        claims={claims}
        onForceClaimStatus={onForceClaimStatus}
        availableFunds={availableFunds}
        inflow={inflow}
      />}
      {tab === 'users' && <UserManagement portalUsers={portalUsers || []} onAddPortalUser={onAddPortalUser} onRemovePortalUser={onRemovePortalUser} onUpdatePortalUserRole={onUpdatePortalUserRole} members={members} />}
      {tab === 'claims' && <AdminClaimsTable claims={claims} onForceClaimStatus={onForceClaimStatus} />}
      {tab === 'ledger' && <InflowLedger inflow={inflow} onExportLedger={onExportLedger} />}
      {tab === 'members' && <MemberTable members={members} onUpdateMemberRole={onUpdateMemberRole} />}
      {tab === 'changelog' && <ChangeLog changelog={changelog || []} />}
      {tab === 'settings' && <TrevaProfileSettings session={session} />}

      <AddInflowForm open={openInflow} onClose={() => setOpenInflow(false)} onSubmit={(form) => { onAddInflow(form); setOpenInflow(false); }} />
      <UpdateFundsForm open={openFunds} current={availableFunds} onClose={() => setOpenFunds(false)} onSubmit={(val) => { onUpdateFunds(val); setOpenFunds(false); }} />
      {openNewClaim && onNewClaim && <AdminNewClaimForm open={openNewClaim} onClose={() => setOpenNewClaim(false)} onSubmit={(form) => { onNewClaim(form); setOpenNewClaim(false); }} members={members} />}
      {openNewSponsor && onSponsor && <AdminNewSponsorForm open={openNewSponsor} onClose={() => setOpenNewSponsor(false)} onSubmit={(form) => { onSponsor(form); setOpenNewSponsor(false); }} />}
    </div>
  );
}

/* ---------- Dashboard tab ---------- */
function AdminDashboard({ thisMonthTotal, openClaims, raisedThis, clearedThis, rejectedThis, awaitingFinal, totalOpenValue, totalClearedValue, members, claims, onForceClaimStatus, availableFunds, inflow }) {
  const paidCount = members.filter((m) => m.status === 'paid').length;
  const dueCount = members.filter((m) => m.status === 'due' || m.status === 'overdue').length;
  const totalInflowFY = inflow ? inflow.reduce((s, r) => s + (r.annual||0)+(r.lifetime||0)+(r.sponsorship||0)+(r.donation||0), 0) : 0;
  const totalDisbursed = claims ? claims.filter(c=>c.status==='disbursed').reduce((s,c)=>s+c.amount,0) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Treva overview balance summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
        <div style={{background:'linear-gradient(135deg,#1B4D33,#0F2E1E)',borderRadius:14,padding:'18px 20px',color:'#fff'}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'rgba(200,240,200,.7)',marginBottom:6}}>Available Funds</div>
          <div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:28,letterSpacing:'-.02em'}}>{DATA.inr(availableFunds||0)}</div>
          <div style={{fontSize:11,color:'rgba(200,240,200,.55)',marginTop:4}}>FY 2026–27 · as of {DATA.TODAY}</div>
        </div>
        <div style={{background:'var(--green-bg)',border:'1px solid var(--line)',borderRadius:14,padding:'18px 20px'}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--ink-3)',marginBottom:6}}>Total Inflow (FY)</div>
          <div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:28,color:'var(--green)',letterSpacing:'-.02em'}}>{DATA.inr(totalInflowFY)}</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>All sources combined</div>
        </div>
        <div style={{background:'var(--terra-bg)',border:'1px solid var(--line)',borderRadius:14,padding:'18px 20px'}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--ink-3)',marginBottom:6}}>Total Disbursed (FY)</div>
          <div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:28,color:'var(--terra)',letterSpacing:'-.02em'}}>{DATA.inr(totalDisbursed)}</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>Claims paid out</div>
        </div>
      </div>

      <div className="sec-title" style={{ marginBottom: 0 }}>
        <div><div className="kicker">This Month</div><h3>June 2026 at a glance</h3></div>
      </div>

      <div className="stat-row">
        <StatCard label="Inflow this month" value={DATA.inr(thisMonthTotal)} sub="all sources" icon="arrowdown" accent />
        <StatCard label="Claims raised" value={raisedThis.length} sub="this month" icon="plus" />
        <StatCard label="Claims cleared" value={clearedThis.length} sub={DATA.inr(totalClearedValue) + ' disbursed'} icon="check" />
        <StatCard label="Returned" value={rejectedThis.length} sub="for revision" icon="x" />
      </div>

      <div className="stat-row">
        <StatCard label="Open claims" value={openClaims.length} sub={DATA.inr(totalOpenValue) + ' pending'} icon="clock" />
        <StatCard label="Final approval" value={awaitingFinal.length} sub="at Treasurer" icon="shield" />
        <StatCard label="Members paid" value={paidCount} sub={'of ' + members.length + ' total'} icon="members" />
        <StatCard label="Dues pending" value={dueCount} sub="members" icon="calendar" />
      </div>

      <div className="two-col">
        <Card>
          <SectionTitle kicker="Needs attention">Claims awaiting final approval</SectionTitle>
          {awaitingFinal.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>
              <span className="empty-ico"><Icon name="check" size={22} /></span>
              <div className="empty-title">All clear</div>
              <div className="empty-sub">No claims pending final approval right now.</div>
            </div>
          ) : awaitingFinal.map((c) => (
            <AdminClaimRow key={c.id} claim={c} onForceStatus={onForceClaimStatus} />
          ))}
        </Card>

        <Card>
          <SectionTitle kicker="This month">Claims pipeline</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DATA.ROLES.map((r, idx) => {
              const cnt = openClaims.filter((c) => c.stageIndex === idx).length;
              return (
                <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <Avatar name={r.name} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.label}{r.final && <em className="final-tag">final</em>}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.name}</div>
                  </div>
                  <span style={{ minWidth: 28, height: 28, borderRadius: 8, background: cnt ? 'var(--amber-bg)' : 'var(--paper-2)', color: cnt ? 'var(--amber)' : 'var(--ink-3)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle kicker="All open">Open claims — quick override</SectionTitle>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>As President you can move any open claim's status directly. Use with care.</p>
        {openClaims.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '12px 0' }}>No open claims right now.</div>
        ) : openClaims.map((c) => (
          <AdminClaimRow key={c.id} claim={c} onForceStatus={onForceClaimStatus} showFullControls />
        ))}
      </Card>
    </div>
  );
}

function AdminClaimRow({ claim, onForceStatus, showFullControls }) {
  const [open, setOpen] = React.useState(false);
  const roleAtStage = DATA.ROLES[claim.stageIndex];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{claim.id}</span>
          {claim.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
          {roleAtStage ? 'With ' + roleAtStage.label : 'Completed'} &middot; {fmtDate(claim.date)}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 16 }}>{DATA.inr(claim.amount)}</div>
      <Badge tone={claimTone(claim)}>{claimStatusLabel(claim)}</Badge>
      {showFullControls && onForceStatus && (
        <div style={{ position: 'relative' }}>
          <Button size="sm" variant="ghost" icon="edit" onClick={() => setOpen(!open)}>Override</Button>
          {open && (
            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: 'var(--sh-lg)', padding: 8, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)', padding: '4px 10px 8px' }}>Move to stage</div>
              {DATA.ROLES.map((r, idx) => (
                <button key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13, color: idx === claim.stageIndex ? 'var(--green)' : 'var(--ink)', background: idx === claim.stageIndex ? 'var(--green-bg)' : 'transparent', fontWeight: idx === claim.stageIndex ? 700 : 400 }}
                  onClick={() => { onForceStatus(claim.id, 'stage', idx); setOpen(false); }}>
                  <Icon name={idx === claim.stageIndex ? 'check' : 'dot'} size={13} />{r.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--line)', margin: '4px 0' }} />
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}
                onClick={() => { onForceStatus(claim.id, 'disbursed'); setOpen(false); }}>
                <Icon name="check" size={13} />Mark as Disbursed
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}
                onClick={() => { onForceStatus(claim.id, 'rejected'); setOpen(false); }}>
                <Icon name="x" size={13} />Mark as Rejected
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Claims management table ---------- */
function AdminClaimsTable({ claims, onForceClaimStatus }) {
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [openDetailId, setOpenDetailId] = React.useState(null);
  const shown = filterStatus === 'all' ? claims : filterStatus === 'open' ? claims.filter(c => c.status === 'open') : filterStatus === 'disbursed' ? claims.filter(c => c.status === 'disbursed') : claims.filter(c => c.status === 'rejected');
  const activeClaim = claims.find(c => c.id === openDetailId);

  return (
    <>
      <Card pad={false}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="kicker" style={{ marginBottom: 0 }}>All Claims ({claims.length})</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all','All'],['open','Open'],['disbursed','Disbursed'],['rejected','Returned']].map(([k,l]) => (
              <button key={k} className={'cf-chip' + (filterStatus === k ? ' on' : '')} onClick={() => setFilterStatus(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="admin-claims-table">
          <div className="act-head">
            <span>Claim</span><span>Category</span><span>Amount</span><span>Stage</span><span>Status</span><span>Action</span>
          </div>
          {shown.map((c) => {
            const stage = DATA.ROLES[c.stageIndex];
            return (
              <div className="act-row" key={c.id} style={{cursor:'pointer'}} onClick={() => setOpenDetailId(c.id)}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.id} &middot; {c.raisedBy} &middot; {fmtShortDate(c.date)}</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{DATA.catLabel(c.category)}</span>
                <span style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 15 }}>{DATA.inr(c.amount)}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{c.status === 'disbursed' ? 'Done' : stage ? stage.label : '-'}</span>
                <Badge tone={claimTone(c)}>{claimStatusLabel(c)}</Badge>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  {c.status === 'open' && <>
                    <Button size="sm" variant="ghost" onClick={() => onForceClaimStatus(c.id, 'disbursed')}>Disburse</Button>
                    <Button size="sm" variant="soft-danger" onClick={() => onForceClaimStatus(c.id, 'rejected')}>Reject</Button>
                  </>}
                  {c.status !== 'open' && <Button size="sm" variant="ghost" onClick={() => onForceClaimStatus(c.id, 'reopen')}>Reopen</Button>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      {activeClaim && (
        <AdminClaimDetailModal claim={activeClaim} onClose={() => setOpenDetailId(null)} onForceClaimStatus={(id, action, idx) => { onForceClaimStatus(id, action, idx); }} />
      )}
    </>
  );
}

/* ---------- Admin claim detail modal (full view with comments + super override) ---------- */
function AdminClaimDetailModal({ claim, onClose, onForceClaimStatus }) {
  const [stageMenuOpen, setStageMenuOpen] = React.useState(false);

  const timeline = [];
  timeline.push({ kind: 'raised', name: claim.raisedBy, date: claim.date, note: null });
  (claim.approvals || []).forEach(a => timeline.push({ kind: 'approved', ...a }));
  if (claim.rejected) timeline.push({ kind: 'rejected', ...claim.rejected, note: claim.rejected.reason });
  if (claim.status === 'disbursed') timeline.push({ kind: 'disbursed', name: 'Treasurer', date: claim.disbursedDate });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{claim.title}</h2>
            <p className="modal-sub">{claim.id} &middot; raised by {claim.raisedBy} ({claim.raisedFlat}) &middot; {fmtDate(claim.date)}</p>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20}/></button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-left">
              <div className="detail-tags">
                <Badge tone={claimTone(claim)}>{claimStatusLabel(claim)}</Badge>
                <span className="d-tag plain">{DATA.catLabel(claim.category)}</span>
                <span className="d-tag plain">{claim.type === 'recurring' ? 'Recurring' : 'One-time'}</span>
              </div>
              <div className="detail-amt">{DATA.inr(claim.amount)}</div>
              <p className="detail-desc">{claim.desc}</p>

              {/* Attachment previews */}
              <div className="attach-row" style={{marginBottom:18}}>
                <div className={'attach'+(claim.hasImage?'':' missing')}>
                  <div className="attach-thumb" style={claim.imageDataUrl?{overflow:'hidden',padding:0}:{}}>
                    {claim.imageDataUrl ? <img src={claim.imageDataUrl} alt="site" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <Icon name="image" size={22}/>}
                  </div>
                  <div className="attach-meta"><span className="attach-label">Site / item photo</span><span className="attach-state">{claim.hasImage?'Attached':'Not provided'}</span></div>
                </div>
                <div className={'attach'+(claim.hasInvoice?'':' missing')}>
                  <div className="attach-thumb" style={claim.invoiceDataUrl&&claim.invoiceDataUrl.startsWith('data:image')?{overflow:'hidden',padding:0}:{}}>
                    {claim.invoiceDataUrl&&claim.invoiceDataUrl.startsWith('data:image') ? <img src={claim.invoiceDataUrl} alt="invoice" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <Icon name="receipt" size={22}/>}
                  </div>
                  <div className="attach-meta"><span className="attach-label">Vendor invoice / quote</span><span className="attach-state">{claim.hasInvoice?'Attached':'Not provided'}</span></div>
                </div>
              </div>

              {/* RBAS approval chain */}
              <SectionTitle kicker="RBAS chain">Approval progress</SectionTitle>
              <div className="detail-stepper"><Stepper claim={claim} /></div>

              {/* Super admin override */}
              <div style={{marginTop:20,padding:14,background:'var(--terra-bg)',border:'1px solid color-mix(in srgb,var(--terra) 30%,#fff)',borderRadius:12}}>
                <div style={{fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--terra)',marginBottom:10}}>
                  <Icon name="shield" size={13} style={{verticalAlign:'middle',marginRight:5}}/>Super admin override
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                  <div style={{position:'relative'}}>
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => setStageMenuOpen(v=>!v)}>Move stage</Button>
                    {stageMenuOpen && (
                      <div style={{position:'absolute',top:'100%',left:0,zIndex:50,background:'var(--card)',border:'1px solid var(--line)',borderRadius:12,boxShadow:'var(--sh-lg)',padding:6,minWidth:190,marginTop:4}}>
                        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--ink-3)',padding:'4px 8px 6px'}}>Move to stage</div>
                        {DATA.ROLES.map((r,idx)=>(
                          <button key={r.key} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 10px',borderRadius:8,fontSize:13,color:idx===claim.stageIndex?'var(--green)':'var(--ink)',background:idx===claim.stageIndex?'var(--green-bg)':'transparent',fontWeight:idx===claim.stageIndex?700:400}}
                            onClick={()=>{onForceClaimStatus(claim.id,'stage',idx);setStageMenuOpen(false);onClose();}}>
                            <Icon name={idx===claim.stageIndex?'check':'dot'} size={13}/>{r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {claim.status==='open' && <>
                    <Button size="sm" variant="primary" icon="check" onClick={()=>{onForceClaimStatus(claim.id,'disbursed');onClose();}}>Disburse now</Button>
                    <Button size="sm" variant="soft-danger" icon="x" onClick={()=>{onForceClaimStatus(claim.id,'rejected');onClose();}}>Reject</Button>
                  </>}
                  {claim.status!=='open' && <Button size="sm" variant="ghost" icon="arrowup" onClick={()=>{onForceClaimStatus(claim.id,'reopen');onClose();}}>Reopen</Button>}
                </div>
              </div>
            </div>

            <div className="detail-right">
              <SectionTitle kicker="History">Timeline & comments</SectionTitle>
              <div className="timeline">
                {timeline.map((t, i) => (
                  <div className={'tl-item tl-' + t.kind} key={i}>
                    <span className="tl-node"><Icon name={t.kind==='rejected'?'x':t.kind==='raised'?'plus':t.kind==='disbursed'?'rupee':'check'} size={13} stroke={2.4}/></span>
                    <div className="tl-body">
                      <div className="tl-head"><b>{t.name}</b><span className="tl-date">{fmtDate(t.date)}</span></div>
                      <div className="tl-role">
                        {t.kind==='raised' ? 'Raised this claim'
                          : t.kind==='disbursed' ? 'Released the funds'
                          : t.kind==='rejected' ? (DATA.ROLES.find(r=>r.key===t.role)?.label||'Reviewer')+' · returned'
                          : (DATA.ROLES.find(r=>r.key===t.role)?.label||'Reviewer')+' · approved'}
                      </div>
                      {t.note && <div className={'tl-note'+(t.kind==='rejected'?' bad':'')}>&ldquo;{t.note}&rdquo;</div>}
                    </div>
                  </div>
                ))}
                {claim.status==='open' && (
                  <div className="tl-item tl-pending">
                    <span className="tl-node"><Icon name="clock" size={13}/></span>
                    <div className="tl-body">
                      <div className="tl-head"><b>{DATA.ROLES[claim.stageIndex]?.name}</b></div>
                      <div className="tl-role">{DATA.ROLES[claim.stageIndex]?.label} · awaiting decision</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inflow ledger ---------- */
function InflowLedger({ inflow, onExportLedger }) {
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!fromDate && !toDate) return inflow;
    return inflow.filter(r => {
      if (fromDate && r.month < fromDate.slice(0,7)) return false;
      if (toDate && r.month > toDate.slice(0,7)) return false;
      return true;
    });
  }, [inflow, fromDate, toDate]);

  const total = filtered.reduce((s, x) => s + (x.annual || 0) + (x.lifetime || 0) + (x.sponsorship || 0) + (x.donation || 0), 0);

  return (
    <div className="card card-pad">
      <div className="sec-title">
        <div><div className="kicker">Cash In</div><h3>Inflow Ledger</h3></div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 20 }}>{DATA.inr(total)}</span>
          {onExportLedger && <Button size="sm" variant="ghost" icon="download" onClick={() => onExportLedger({startDate: fromDate, endDate: toDate})}>Export PDF</Button>}
        </div>
      </div>
      {/* Date range filter */}
      <div style={{display:'flex',gap:10,alignItems:'center',padding:'10px 0 16px',flexWrap:'wrap'}}>
        <Icon name="calendar" size={15} style={{color:'var(--green)'}}/>
        <span style={{fontSize:13,color:'var(--ink-2)',fontWeight:600}}>Filter by date:</span>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <div>
            <label style={{fontSize:11,color:'var(--ink-3)',display:'block',marginBottom:2}}>From</label>
            <input type="date" className="input" style={{fontSize:13,padding:'6px 10px'}} value={fromDate} onChange={e=>setFromDate(e.target.value)} max={toDate||undefined}/>
          </div>
          <span style={{color:'var(--ink-3)',fontSize:13,marginTop:14}}>—</span>
          <div>
            <label style={{fontSize:11,color:'var(--ink-3)',display:'block',marginBottom:2}}>To</label>
            <input type="date" className="input" style={{fontSize:13,padding:'6px 10px'}} value={toDate} onChange={e=>setToDate(e.target.value)} min={fromDate||undefined}/>
          </div>
          {(fromDate||toDate) && <Button size="sm" variant="ghost" onClick={()=>{setFromDate('');setToDate('');}}>Clear</Button>}
        </div>
        {(fromDate||toDate) && <span style={{fontSize:12,color:'var(--ink-3)'}}>Showing {filtered.length} of {inflow.length} months</span>}
      </div>
      <div className="inflow-ledger">
        <div className="il-head">
          <span>Month</span><span>Tags</span><span>Annual</span><span>Lifetime</span><span>Sponsorship</span><span>Total</span>
        </div>
        {[...filtered].reverse().map((row, i) => {
          const rowTotal = (row.annual || 0) + (row.lifetime || 0) + (row.sponsorship || 0) + (row.donation || 0);
          return (
            <div className="il-row" key={i}>
              <span style={{ fontWeight: 600 }}>{row.label} {row.month?.slice(0, 4)}</span>
              <span>
                {row.annual > 0 && <span className="il-tag annual">Annual</span>}{' '}
                {row.lifetime > 0 && <span className="il-tag lifetime">Lifetime</span>}{' '}
                {row.sponsorship > 0 && <span className="il-tag sponsorship">Sponsor</span>}
                {row.donation > 0 && <span className="il-tag donation">Donation</span>}
              </span>
              <span className="il-amt">{row.annual > 0 ? DATA.inr(row.annual) : '-'}</span>
              <span className="il-amt">{row.lifetime > 0 ? DATA.inr(row.lifetime) : '-'}</span>
              <span className="il-amt">{row.sponsorship > 0 ? DATA.inr(row.sponsorship) : '-'}</span>
              <span className="il-amt" style={{ color: 'var(--green)', fontWeight: 700 }}>{DATA.inr(rowTotal)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Member table (Treva — with role editor) ---------- */
const ASSIGNABLE_ROLES = ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Member'];

function MemberTable({ members, onUpdateMemberRole }) {
  const [editingId, setEditingId] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const shown = search.trim() ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.flat?.toLowerCase().includes(search.toLowerCase()) || m.id?.toLowerCase().includes(search.toLowerCase())) : members;

  return (
    <div className="card card-pad">
      <div className="sec-title" style={{marginBottom:12}}>
        <div><div className="kicker">Directory</div><h3>All Members ({members.length})</h3></div>
        <div className="search" style={{minWidth:220}}>
          <Icon name="search" size={15}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, flat or ID…" />
        </div>
      </div>
      <div className="mtable">
        <div className="mt-head" style={{gridTemplateColumns:'0.6fr 2fr 0.6fr 0.7fr 1.2fr 0.8fr 0.8fr'}}>
          <span>ID</span><span>Member</span><span>Flat</span><span>Type</span><span>Committee role</span><span>Since</span><span>Status</span>
        </div>
        {shown.map((m) => (
          <div className="mt-row" key={m.id} style={{gridTemplateColumns:'0.6fr 2fr 0.6fr 0.7fr 1.2fr 0.8fr 0.8fr'}}>
            <span style={{fontSize:11.5,fontWeight:700,color:'var(--green)'}}>{m.id}</span>
            <div className="mt-member">
              <Avatar name={m.name} size={32} />
              <div className="mt-meta">
                <span className="mt-name">{m.name}</span>
                <span className="mt-sub">{m.phone}</span>
              </div>
            </div>
            <span className="mt-date">{m.flat}</span>
            <span className={'type-tag ' + (m.type || 'annual')}>{m.type === 'lifetime' ? 'Lifetime' : 'Annual'}</span>
            <span>
              {editingId === m.id ? (
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <select className="select" style={{fontSize:12,padding:'4px 8px'}}
                    value={m.role || 'Member'}
                    onChange={e => { onUpdateMemberRole && onUpdateMemberRole(m.id, e.target.value); setEditingId(null); }}>
                    {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="button" onClick={()=>setEditingId(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--ink-3)'}}><Icon name="x" size={14}/></button>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {m.role ? <span className="role-pill">{m.role}</span> : <span style={{fontSize:12,color:'var(--ink-3)'}}>Member</span>}
                  <button type="button" onClick={()=>setEditingId(m.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--green)',opacity:.7}} title="Change role">
                    <Icon name="edit" size={13}/>
                  </button>
                </div>
              )}
            </span>
            <span className="mt-date" style={{ fontSize: 12 }}>{m.joined || m.since || '-'}</span>
            <Badge tone={m.status === 'paid' ? 'success' : m.status === 'overdue' ? 'danger' : 'amber'}>
              {m.status === 'paid' ? 'Paid' : m.status === 'overdue' ? 'Overdue' : m.status === 'pending' ? 'Pending' : 'Due'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Change log ---------- */
function ChangeLog({ changelog }) {
  const ICONS = { claim_approved: 'check', claim_rejected: 'x', claim_disbursed: 'rupee', inflow_added: 'arrowdown', inflow_approved: 'check', inflow_rejected: 'x', member_added: 'user', member_status: 'edit', funds_updated: 'shield', sponsor_added: 'heart', sponsor_status: 'check', default: 'clock' };
  const TONES = { claim_approved:'ok', claim_rejected:'bad', claim_disbursed:'ok', inflow_added:'neutral', inflow_approved:'ok', inflow_rejected:'bad', member_added:'neutral', funds_updated:'ok', sponsor_added:'neutral', default:'neutral' };
  return (
    <div className="card card-pad">
      <div className="sec-title">
        <div><div className="kicker">Audit Trail</div><h3>All Changes ({changelog.length})</h3></div>
      </div>
      {changelog.length === 0 ? (
        <div style={{ color: 'var(--ink-3)', padding: '24px 0', textAlign: 'center' }}>No changes recorded yet. Actions appear here as they happen.</div>
      ) : (
        <div className="changelog-list">
          {[...changelog].reverse().map((entry, i) => (
            <div key={i} className="cl-entry">
              <span className={'feed-ico ' + (TONES[entry.type] || 'neutral')} style={{ width: 30, height: 30, borderRadius: 99, display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name={ICONS[entry.type] || ICONS.default} size={14} />
              </span>
              <div className="cl-body">
                <div className="cl-msg">{entry.message}</div>
                <div className="cl-meta">
                  <span>{entry.actor}</span>
                  <i>·</i>
                  <span>{fmtDate(entry.date?.slice(0,10))}</span>
                  {entry.time && <><i>·</i><span>{entry.time}</span></>}
                </div>
              </div>
              {entry.amount && <span style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 15, color: 'var(--green)', flex: 'none' }}>{DATA.inr(entry.amount)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Update available funds form ---------- */
function UpdateFundsForm({ open, current, onClose, onSubmit }) {
  const [val, setVal] = React.useState(String(current || 0));
  React.useEffect(() => { if (open) setVal(String(current || 0)); }, [open, current]);
  const valid = val && Number(val) >= 0;
  return (
    <Modal open={open} onClose={onClose} title="Update Available Funds" sub="Set the current available balance for the association." footer={
      <div className="ff-btns">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" disabled={!valid} onClick={() => onSubmit(Number(val))}>Update Balance</Button>
      </div>
    }>
      <div className="form-grid">
        <Field label="Available funds (₹)" required hint="This is the balance shown on the dashboard.">
          <TextInput type="number" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
        </Field>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Current balance: <b>{DATA.inr(current || 0)}</b></p>
      </div>
    </Modal>
  );
}

/* ---------- Admin raise new claim form (on behalf of any member) ---------- */
function AdminNewClaimForm({ open, onClose, onSubmit, members }) {
  const memberList = members || [];
  const blank = { title: '', desc: '', type: 'one-time', category: '', amount: '', raisedFor: memberList[0]?.name || '', hasImage: false, hasInvoice: false, imageDataUrl: null, invoiceDataUrl: null, imageFile: null, invoiceFile: null };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.title.trim() && form.amount && Number(form.amount) > 0 && form.category && form.raisedFor;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { set('imageDataUrl', ev.target.result); set('hasImage', true); };
    reader.readAsDataURL(file);
    set('imageFile', { name: file.name });
  };
  const handleInvoiceUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { set('invoiceDataUrl', ev.target.result); set('hasInvoice', true); };
    reader.readAsDataURL(file);
    set('invoiceFile', { name: file.name });
  };

  return (
    <Modal open={open} onClose={onClose} wide title="Raise a new claim" sub="As super admin you can raise a claim on behalf of any member." footer={
      <div className="ff-btns">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" disabled={!valid} onClick={() => {
          const selectedMember = memberList.find(m => m.name === form.raisedFor);
          onSubmit({ ...form, raisedBy: form.raisedFor, raisedFlat: selectedMember?.flat || '', category: form.category, categoryLabel: DATA.CATEGORIES.find(c => c.key === form.category)?.label || form.category });
          onClose();
        }}>Submit claim</Button>
      </div>
    }>
      <div className="form-grid">
        <Field label="Raise on behalf of" required hint="Select the member this claim is being raised for">
          <Select value={form.raisedFor} onChange={e => set('raisedFor', e.target.value)}>
            <option value="">Select member…</option>
            {memberList.map(m => <option key={m.id} value={m.name}>{m.name} ({m.id}) — {m.flat}</option>)}
          </Select>
        </Field>
        <Field label="Claim heading" required>
          <TextInput value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Replace Block C gate camera" />
        </Field>
        <Field label="Description" hint="What is needed and why.">
          <TextArea rows={3} value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="Describe the requirement…" />
        </Field>
        <div className="form-2">
          <Field label="Claim type" required>
            <Segmented value={form.type} onChange={v => set('type', v)} options={[{value:'one-time',label:'One-time'},{value:'recurring',label:'Recurring'}]} />
          </Field>
          <Field label="Amount (₹)" required>
            <TextInput type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Category" required>
          <Select value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">Select a category...</option>
            {DATA.CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </Select>
        </Field>
        <div className="form-2">
          <Field label="Item / site photo">
            <input type="file" accept="image/*" hidden id="admin-claim-img" onChange={handleImageUpload} />
            <label htmlFor="admin-claim-img" className={'filedrop' + (form.hasImage ? ' filled' : '')} style={{cursor:'pointer'}}>
              <Icon name={form.hasImage ? 'check' : 'image'} size={16} />
              <span>{form.imageFile?.name || 'Attach photo'}</span>
            </label>
          </Field>
          <Field label="Invoice / quotation">
            <input type="file" accept="image/*,application/pdf" hidden id="admin-claim-inv" onChange={handleInvoiceUpload} />
            <label htmlFor="admin-claim-inv" className={'filedrop' + (form.hasInvoice ? ' filled' : '')} style={{cursor:'pointer'}}>
              <Icon name={form.hasInvoice ? 'check' : 'receipt'} size={16} />
              <span>{form.invoiceFile?.name || 'Attach invoice'}</span>
            </label>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Add inflow form ---------- */
function AddInflowForm({ open, onClose, onSubmit }) {
  const today = DATA.TODAY;
  const m = parseInt(today.slice(5, 7), 10);
  const blank = { fromName: '', source: 'Annual Dues', amount: '', mode: 'UPI', txnRef: '', date: today, notes: '', month: today.slice(0, 7), label: MONTHS_LIST[m - 1].slice(0, 3) };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.fromName.trim() && form.amount && Number(form.amount) > 0;

  const sourceToKey = { 'Annual Dues': 'annual', 'Lifetime Membership': 'lifetime', 'Sponsorship': 'sponsorship', 'Donation': 'donation', 'Other': 'donation' };

  return (
    <Modal open={open} onClose={onClose} wide title="Record Inflow" sub="Add a new fund inflow entry. It will be sent for committee review." footer={
      <div className="form-foot">
        <span className="ff-note"><Icon name="shield" size={15} />Inflow records go to core committee for confirmation.</span>
        <div className="ff-btns">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" disabled={!valid} onClick={() => onSubmit({ ...form, amount: Number(form.amount), sourceKey: sourceToKey[form.source] || 'donation', status: 'pending' })}>Submit for Review</Button>
        </div>
      </div>
    }>
      <div className="form-grid">
        <Field label="Received from (name)" required>
          <TextInput value={form.fromName} onChange={(e) => set('fromName', e.target.value)} placeholder="e.g. Suresh Kumar / Sri Lakshmi Hardware" />
        </Field>
        <div className="form-2">
          <Field label="Source / Type" required>
            <Select value={form.source} onChange={(e) => set('source', e.target.value)}>
              {['Annual Dues', 'Lifetime Membership', 'Sponsorship', 'Donation', 'Other'].map((o) => <option key={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Amount (Rs.)" required>
            <TextInput type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="form-2">
          <Field label="Mode of Payment" required>
            <Select value={form.mode} onChange={(e) => set('mode', e.target.value)}>
              {['UPI', 'NEFT / RTGS', 'Cheque', 'Cash', 'IMPS', 'Other'].map((o) => <option key={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Transaction / Reference No." hint="UPI UTR, cheque no., etc.">
            <TextInput value={form.txnRef} onChange={(e) => set('txnRef', e.target.value)} placeholder="e.g. UPI/2026/123456" />
          </Field>
        </div>
        <div className="form-2">
          <Field label="Date Received" required>
            <TextInput type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Month (YYYY-MM)" required>
            <TextInput value={form.month} onChange={(e) => set('month', e.target.value)} placeholder="2026-06" />
          </Field>
        </div>
        <Field label="Notes / Description">
          <TextArea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Purpose, context, or any details..." />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------- Admin raise new sponsorship form (Treva on behalf of anyone) ---------- */
function AdminNewSponsorForm({ open, onClose, onSubmit }) {
  const blank = { name: '', type: 'Local Business', objective: '', amount: '' };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.name.trim() && form.amount && Number(form.amount) > 0 && form.objective.trim();
  return (
    <Modal open={open} onClose={onClose} title="Record New Sponsorship" sub="Super admin: record a sponsorship on behalf of the association." footer={
      <div className="ff-btns">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" disabled={!valid} onClick={() => { onSubmit({ ...form, amount: Number(form.amount) }); onClose(); }}>Record Sponsorship</Button>
      </div>
    }>
      <div className="form-grid">
        <Field label="Sponsor name" required><TextInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sri Lakshmi Hardware" /></Field>
        <Field label="Type of sponsor" required>
          <Select value={form.type} onChange={e => set('type', e.target.value)}>
            {['Local Business','Corporate','Individual / Professional','NGO / Trust','Resident family'].map(o=><option key={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label="Sponsorship objective" required><TextArea rows={3} value={form.objective} onChange={e => set('objective', e.target.value)} placeholder="e.g. Ganesha festival" /></Field>
        <Field label="Amount (₹)" required><TextInput type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></Field>
      </div>
    </Modal>
  );
}

/* ---------- User management (Treva only) ---------- */
const PORTAL_ROLES = [
  { value: 'president',       label: 'President' },
  { value: 'vice_president',  label: 'Vice President' },
  { value: 'secretary',       label: 'Secretary' },
  { value: 'joint_secretary', label: 'Joint Secretary' },
  { value: 'treasurer',       label: 'Treasurer' },
  { value: 'member',          label: 'Member' },
];

function UserManagement({ portalUsers, onAddPortalUser, onRemovePortalUser, onUpdatePortalUserRole, members }) {
  const blank = { name: '', email: '', pass: '', role: 'member', memberId: '' };
  const [form, setForm] = React.useState(blank);
  const [showForm, setShowForm] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.name.trim() && form.email.trim() && form.pass.trim().length >= 6 && form.role;

  const handleAdd = () => {
    onAddPortalUser({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
    setForm(blank);
    setShowForm(false);
  };

  const roleLabel = (r) => PORTAL_ROLES.find(x => x.value === r)?.label || r;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="kicker">Access control</div>
            <h3 style={{ margin: 0 }}>Portal Users ({portalUsers.length})</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>All committee members and residents who can log in to the portal.</p>
          </div>
          <Button variant="primary" icon="plus" onClick={() => setShowForm(v => !v)}>Add user</Button>
        </div>

        {/* Add user form */}
        {showForm && (
          <div style={{ background: 'var(--paper)', borderRadius: 12, padding: 16, marginBottom: 18, border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kicker" style={{ marginBottom: 0 }}>New user details</div>
            <div className="form-2">
              <Field label="Full name" required>
                <TextInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Chandana M" autoFocus />
              </Field>
              <Field label="Email address" required>
                <TextInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@email.com" />
              </Field>
            </div>
            <div className="form-2">
              <Field label="Password" required hint="Min 6 characters">
                <TextInput type="password" value={form.pass} onChange={e => set('pass', e.target.value)} placeholder="Set a password" />
              </Field>
              <Field label="Portal role" required>
                <Select value={form.role} onChange={e => set('role', e.target.value)}>
                  {PORTAL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Member ID (optional)" hint="Link to a member record e.g. M-001">
              <TextInput value={form.memberId} onChange={e => set('memberId', e.target.value)} placeholder="M-001" />
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" onClick={() => { setShowForm(false); setForm(blank); }}>Cancel</Button>
              <Button variant="primary" icon="check" disabled={!valid} onClick={handleAdd}>Create user</Button>
            </div>
            {form.pass && form.pass.length < 6 && <div style={{ fontSize: 12, color: 'var(--danger)' }}>Password must be at least 6 characters.</div>}
          </div>
        )}

        {portalUsers.length === 0 ? (
          <div className="empty" style={{ padding: '32px 0' }}>
            <span className="empty-ico"><Icon name="user" size={24} /></span>
            <div className="empty-title">No users yet</div>
            <div className="empty-sub">Click "Add user" to create the first committee member or resident account.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.9fr 0.5fr', gap: 12, padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-3)', background: 'var(--paper)', borderRadius: 8, marginBottom: 4 }}>
              <span>Name / Email</span><span>Member ID</span><span>Role</span><span>Change role</span><span></span>
            </div>
            {portalUsers.map(u => (
              <div key={u.email} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1fr 0.9fr 0.5fr', gap: 12, padding: '11px 12px', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{u.email}</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{u.memberId || '—'}</span>
                <span>
                  <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--green-bg)', color: 'var(--green)', padding: '3px 9px', borderRadius: 8 }}>{roleLabel(u.role)}</span>
                </span>
                <span>
                  <Select value={u.role} onChange={e => onUpdatePortalUserRole(u.email, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {PORTAL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                </span>
                <span style={{ textAlign: 'right' }}>
                  {confirmRemove === u.email ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button size="sm" variant="danger" icon="x" onClick={() => { onRemovePortalUser(u.email); setConfirmRemove(null); }}>Yes</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>No</Button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmRemove(u.email)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: .7, padding: 4 }} title="Remove user">
                      <Icon name="x" size={15} />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ background: 'var(--amber-bg)', border: '1px solid #e8c96a', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Icon name="info" size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          <b>User access rules:</b> Credentials are stored locally in this browser. To use Supabase Auth for production, connect via the Supabase SQL schema provided earlier. Each user's role determines what sections they can access.
          <br/>Role caps: only 1 President, 1 Vice President, 1 Secretary, 1 Joint Secretary, 1 Treasurer — unlimited Members.
        </div>
      </div>
    </div>
  );
}

/* ---------- Treva profile settings ---------- */
function TrevaProfileSettings({ session }) {
  const [name, setName] = React.useState(session?.name || 'Treva Admin');
  const [email] = React.useState(session?.email || 'admin@treva.in');
  const [saved, setSaved] = React.useState(false);
  return (
    <div className="card card-pad" style={{maxWidth:520}}>
      <div className="sec-title" style={{marginBottom:16}}>
        <div><div className="kicker">Super Admin</div><h3>My Profile</h3></div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'16px',background:'var(--paper)',borderRadius:12}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,var(--terra),#E07844)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:'var(--fd)',fontWeight:700,fontSize:22}}>
            {(name||'T').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:18}}>{name}</div>
            <div style={{fontSize:13,color:'var(--ink-3)'}}>{email}</div>
            <div style={{marginTop:4}}><span style={{fontSize:11,fontWeight:700,background:'var(--terra-bg)',color:'var(--terra)',padding:'2px 8px',borderRadius:6,textTransform:'uppercase',letterSpacing:'.04em'}}>Super Admin · Treva</span></div>
          </div>
        </div>
        <Field label="Display name"><TextInput value={name} onChange={e=>{setName(e.target.value);setSaved(false);}} /></Field>
        <Field label="Email address" hint="Login email — cannot be changed here"><TextInput value={email} disabled style={{opacity:.6}} /></Field>
        <div style={{background:'var(--paper)',borderRadius:10,padding:'12px 16px'}}>
          <div style={{fontWeight:700,marginBottom:8,fontSize:13,color:'var(--ink-2)'}}>Super admin capabilities</div>
          {['Full portal overview & balance visibility','Override any claim status anytime','Raise claims & sponsorships for any member','Edit member committee roles','Export ledger & members PDF with date filter','Add inflow & update available funds'].map(cap=>(
            <div key={cap} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontSize:12,color:'var(--ink-2)'}}><Icon name="check" size={13} style={{color:'var(--green)',flexShrink:0}}/>{cap}</div>
          ))}
        </div>
        {saved && <div style={{background:'var(--success-bg)',border:'1px solid #86efac',borderRadius:10,padding:'10px 14px',fontSize:13,color:'var(--success)',display:'flex',alignItems:'center',gap:8}}><Icon name="check" size={14}/>Saved</div>}
        <Button variant="primary" icon="check" onClick={()=>setSaved(true)}>Save changes</Button>
      </div>
    </div>
  );
}
