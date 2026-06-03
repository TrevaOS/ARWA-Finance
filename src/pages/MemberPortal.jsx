import React from 'react';
import { DATA, CAT_COLORS, computeEndDate, fmtEndDate } from '../data.js';
import logoSrc from '../assets/logo.png';
import { Icon, Card, Button, Badge, SectionTitle, Modal, Field, TextInput, TextArea, Select, Segmented, FileDrop, EmptyState, Avatar, fmtDate, claimTone, claimStatusLabel, Stepper } from '../ui/components.jsx';

function catMeta(key) {
  const c = DATA.CATEGORIES.find((x) => x.key === key) || {};
  return { label: c.label || key, icon: c.icon || 'tool', color: CAT_COLORS[key] || '#999' };
}

export function MemberPortalView({ claims, members, role, onNewClaim, onSponsor, currentUser, onUpdateProfile, onRenewMembership }) {
  const [openNew, setOpenNew] = React.useState(false);
  const [openSponsor, setOpenSponsor] = React.useState(false);
  const [portalTab, setPortalTab] = React.useState('claims');
  const roleMeta = DATA.ROLES.find((r) => r.key === role) || DATA.ROLES[0];
  const myName = roleMeta.name;
  const memberData = members.find(m => m.name === myName) || {};
  const myClaims = claims.filter((c) => c.raisedBy === myName);

  return (
    <div className="view">
      <div className="member-portal-header">
        <div>
          <div className="mp-title">My Portal</div>
          <div className="mp-sub">Your profile, claims, and association membership details.</div>
        </div>
      </div>

      <div className="tabs">
        {[['claims','claims','My Claims'],['profile','user','My Profile'],['idcard','qr','ID Card']].map(([k,icon,label]) => (
          <button key={k} className={'tab'+(portalTab===k?' on':'')} onClick={()=>setPortalTab(k)}>
            <Icon name={icon} size={14}/>{label}
          </button>
        ))}
      </div>

      {portalTab === 'claims' && (
        <>
          <div className="stat-row">
            <div className="card card-pad stat">
              <div className="stat-top"><span className="stat-label">My Claims</span><span className="stat-ico"><Icon name="claims" size={17} /></span></div>
              <div className="stat-value">{myClaims.length}</div>
              <div className="stat-sub">{myClaims.filter(c => c.status === 'open').length} open</div>
            </div>
            <div className="card card-pad stat">
              <div className="stat-top"><span className="stat-label">Approved</span><span className="stat-ico"><Icon name="check" size={17} /></span></div>
              <div className="stat-value">{myClaims.filter(c => c.status === 'disbursed').length}</div>
              <div className="stat-sub">disbursed</div>
            </div>
            <div className="card card-pad stat">
              <div className="stat-top"><span className="stat-label">Pending</span><span className="stat-ico"><Icon name="clock" size={17} /></span></div>
              <div className="stat-value">{myClaims.filter(c => c.status === 'open').length}</div>
              <div className="stat-sub">awaiting review</div>
            </div>
            <div className="card card-pad stat">
              <div className="stat-top"><span className="stat-label">Returned</span><span className="stat-ico"><Icon name="x" size={17} /></span></div>
              <div className="stat-value">{myClaims.filter(c => c.status === 'rejected').length}</div>
              <div className="stat-sub">for revision</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="primary" icon="plus" onClick={() => setOpenNew(true)}>Raise New Claim</Button>
            <Button variant="ghost" icon="heart" onClick={() => setOpenSponsor(true)}>Raise Sponsorship</Button>
          </div>
          <Card>
            <SectionTitle kicker="My submissions">My Claims</SectionTitle>
            {myClaims.length === 0 ? (
              <EmptyState icon="claims" title="No claims yet" sub="Raise a claim to get started. It will go through the approval chain." />
            ) : (
              <div className="my-claims-list">
                {myClaims.map((claim) => <MyClaimRow key={claim.id} claim={claim} />)}
              </div>
            )}
          </Card>
        </>
      )}

      {portalTab === 'profile' && (
        <ProfileTab member={memberData} roleMeta={roleMeta} currentUser={currentUser} onUpdateProfile={onUpdateProfile} onRenewMembership={onRenewMembership} />
      )}

      {portalTab === 'idcard' && (
        <IdCardTab member={memberData} roleMeta={roleMeta} />
      )}

      <NewClaimFormPortal open={openNew} onClose={() => setOpenNew(false)} onSubmit={(form) => { onNewClaim(form); setOpenNew(false); }} />
      <SponsorFormPortal open={openSponsor} onClose={() => setOpenSponsor(false)} onSubmit={(form) => { onSponsor(form); setOpenSponsor(false); }} />
    </div>
  );
}

/* ---------- Profile tab ---------- */
function ProfileTab({ member, roleMeta, currentUser, onUpdateProfile, onRenewMembership }) {
  const [editing, setEditing] = React.useState(false);
  const [showRenew, setShowRenew] = React.useState(false);
  const [form, setForm] = React.useState({ name: member.name||'', phone: member.phone||'', flat: member.flat||'', notes: member.notes||'' });
  const [photoPreview, setPhotoPreview] = React.useState(member.photo || null);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSave = () => {
    onUpdateProfile && onUpdateProfile({ ...member, ...form, photo: photoPreview });
    setEditing(false);
  };

  const joinedDate = member.joined || member.since || null;
  const memberSince = joinedDate ? (() => { const d = new Date(joinedDate + 'T00:00:00'); return d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getFullYear(); })() : '—';

  const isAnnual = member.type === 'annual';
  const renewalYear = isAnnual && joinedDate ? (() => {
    const d = new Date(joinedDate + 'T00:00:00');
    const today = new Date('2026-06-02');
    let renewYear = d.getFullYear();
    while (new Date(renewYear, d.getMonth(), d.getDate()) <= today) renewYear++;
    return new Date(renewYear, d.getMonth(), d.getDate());
  })() : null;
  const daysToRenewal = renewalYear ? Math.ceil((renewalYear - new Date('2026-06-02')) / 86400000) : null;
  const renewalNear = daysToRenewal !== null && daysToRenewal <= 60;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {renewalNear && !showRenew && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="clock" size={18} style={{ color: '#B45309', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#92400E', fontSize: 14 }}>Membership renewal due in {daysToRenewal} day{daysToRenewal !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: 13, color: '#B45309' }}>Your annual membership expires on {renewalYear.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Renew to stay active.</div>
          </div>
          <Button variant="primary" size="sm" icon="check" onClick={() => setShowRenew(true)}>Renew now</Button>
        </div>
      )}
      {showRenew && (
        <RenewalModal member={member} daysToRenewal={daysToRenewal} renewalDate={renewalYear} onClose={() => setShowRenew(false)}
          onConfirm={(txnInfo) => { onRenewMembership && onRenewMembership(member.id, txnInfo); }} />
      )}
      <Card>
        <div className="profile-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-large">
              {photoPreview
                ? <img src={photoPreview} alt={member.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                : <Avatar name={member.name||'?'} size={80} />
              }
            </div>
            {editing && (
              <label className="profile-photo-btn">
                <Icon name="edit" size={14}/> Change photo
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                  const f=e.target.files[0]; if(!f) return;
                  const r=new FileReader(); r.onload=ev=>setPhotoPreview(ev.target.result); r.readAsDataURL(f);
                }}/>
              </label>
            )}
          </div>
          <div className="profile-info">
            {editing ? (
              <div style={{display:'flex',flexDirection:'column',gap:10,flex:1}}>
                <Field label="Full name"><TextInput value={form.name} onChange={e=>set('name',e.target.value)}/></Field>
                <Field label="Phone"><TextInput value={form.phone} onChange={e=>set('phone',e.target.value)}/></Field>
                <Field label="Flat / Address"><TextInput value={form.flat} onChange={e=>set('flat',e.target.value)}/></Field>
                <Field label="Notes"><TextArea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}/></Field>
                <div style={{display:'flex',gap:8}}>
                  <Button variant="ghost" onClick={()=>setEditing(false)}>Cancel</Button>
                  <Button variant="primary" icon="check" onClick={handleSave}>Save profile</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="profile-name">{member.name || roleMeta.name}</div>
                <div className="profile-role">{roleMeta.label}</div>
                <div className="profile-meta">
                  {member.flat && <span><Icon name="user" size={14}/>{member.flat}</span>}
                  {member.phone && <span><Icon name="bell" size={14}/>{member.phone}</span>}
                  <span><Icon name="calendar" size={14}/>Member since {memberSince}</span>
                </div>
                <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                  <Badge tone={member.status==='paid'?'success':member.status==='overdue'?'danger':'amber'}>
                    {member.status==='paid'?'Dues paid':member.status==='overdue'?'Overdue':member.status==='pending'?'Pending':'Due'}
                  </Badge>
                  <Badge tone="neutral">{member.type==='lifetime'?'Lifetime member':'Annual member'}</Badge>
                  {member.id && <Badge tone="neutral">{member.id}</Badge>}
                  {isAnnual && daysToRenewal !== null && (
                    <Badge tone={renewalNear ? 'amber' : 'neutral'}>
                      {renewalNear ? `Renewal in ${daysToRenewal}d` : `Valid till ${renewalYear.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                    </Badge>
                  )}
                </div>
                <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                  <Button variant="ghost" icon="edit" onClick={()=>setEditing(true)}>Edit profile</Button>
                  {isAnnual && <Button variant="ghost" icon="calendar" onClick={() => setShowRenew(true)}>Renew membership</Button>}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- UPI QR art (deterministic) ---------- */
function QrArtRenewal({ amount }) {
  const cells = [];
  const size = 25;
  let seed = 42 + amount;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const finder = (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8);
      const on = finder ? (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5)) : rnd() > 0.52;
      if (on) cells.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" fill="#1A2A1E" />);
    }
  }
  return (
    <svg viewBox={'0 0 ' + size + ' ' + size} style={{ width: 180, height: 180, border: '8px solid #fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}>
      <rect width={size} height={size} fill="#fff" />
      {cells}
    </svg>
  );
}

/* ---------- Step indicator ---------- */
function StepDots({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 99, background: i === step ? 'var(--green)' : i < step ? 'var(--green-l)' : 'var(--line-2)', transition: '.2s' }} />
      ))}
    </div>
  );
}

function RenewalModal({ member, daysToRenewal, renewalDate, onClose, onConfirm }) {
  const [step, setStep] = React.useState(0); // 0=details, 1=pay, 2=confirm txn, 3=done
  const [txnRef, setTxnRef] = React.useState('');
  const [txnMode, setTxnMode] = React.useState('UPI');
  const [screenshotDataUrl, setScreenshotDataUrl] = React.useState(null);
  const [screenshotName, setScreenshotName] = React.useState('');
  const screenshotRef = React.useRef(null);
  const amount = DATA.CHARGES.annual;

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const canConfirm = txnRef.trim().length >= 4;

  const handleFinalConfirm = () => {
    onConfirm({ txnRef: txnRef.trim(), txnMode, screenshotDataUrl });
    setStep(3);
  };

  const STEPS = ['Details', 'Scan & Pay', 'Confirm', 'Done'];

  return (
    <div className="modal-overlay" onClick={step === 3 ? onClose : undefined}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <div>
            <h2>Renew Annual Membership</h2>
            <p className="modal-sub">{member.name} · {DATA.inr(amount)}</p>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ paddingTop: 8 }}>
          <StepDots step={step} total={4} />

          {/* ---- Step 0: Details ---- */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <div className="renewal-summary-box">
                <div className="rsb-row"><span>Member</span><b>{member.name}</b></div>
                <div className="rsb-row"><span>Flat</span><b>{member.flat || '—'}</b></div>
                <div className="rsb-row"><span>Member ID</span><b>{member.id || '—'}</b></div>
                <div className="rsb-row"><span>Membership type</span><b>Annual</b></div>
                <div className="rsb-row"><span>Current expiry</span><b style={{ color: daysToRenewal <= 30 ? 'var(--danger)' : 'var(--amber)' }}>{renewalDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b></div>
                <div className="rsb-row rsb-highlight"><span>Renewal fee</span><b style={{ color: 'var(--green)', fontSize: 18 }}>{DATA.inr(amount)}</b></div>
              </div>
              <div className="rsb-info"><Icon name="info" size={14} />Renewal extends your membership by one year from the current expiry date. Payment is collected via UPI.</div>
            </div>
          )}

          {/* ---- Step 1: Scan & Pay ---- */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', margin: 0 }}>Scan the QR with any UPI app (PhonePe, GPay, Paytm, BHIM) to pay the renewal fee.</p>
              <QrArtRenewal amount={amount} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>attiguppe.rwa@upi</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>Attiguppe Residents Welfare Association</div>
              </div>
              <div style={{ background: 'var(--green)', color: '#fff', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 18, fontFamily: 'var(--fd)' }}>{DATA.inr(amount)}</div>
              <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E', textAlign: 'center', width: '100%' }}>
                <Icon name="bell" size={14} style={{ marginRight: 6 }} />After paying, keep your <b>transaction ID / UTR number</b> handy — you'll enter it in the next step.
              </div>
            </div>
          )}

          {/* ---- Step 2: Confirm txn ---- */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Enter the transaction details from your UPI app to confirm payment.</p>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Payment mode</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['UPI', 'NEFT / RTGS', 'IMPS', 'Cheque', 'Cash'].map(m => (
                    <button key={m} type="button"
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid', fontSize: 13, fontWeight: txnMode === m ? 700 : 400, borderColor: txnMode === m ? 'var(--green)' : 'var(--line)', color: txnMode === m ? 'var(--green)' : 'var(--ink-2)', background: txnMode === m ? 'var(--green-bg)' : 'transparent', cursor: 'pointer' }}
                      onClick={() => setTxnMode(m)}>{m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Transaction / Reference No. *</label>
                <input
                  className="input"
                  value={txnRef}
                  onChange={e => setTxnRef(e.target.value)}
                  placeholder={txnMode === 'UPI' ? 'e.g. UPI/2026/123456789012' : txnMode === 'Cheque' ? 'Cheque number' : 'Reference / UTR number'}
                  autoFocus
                  style={{ width: '100%' }}
                />
                {txnRef.trim() && txnRef.trim().length < 4 && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Please enter a valid reference number.</div>}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Payment screenshot <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input ref={screenshotRef} type="file" accept="image/*" hidden onChange={handleScreenshot} />
                {screenshotDataUrl ? (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', maxHeight: 160 }}>
                    <img src={screenshotDataUrl} alt="screenshot" style={{ width: '100%', objectFit: 'cover', maxHeight: 160 }} />
                    <button type="button" onClick={() => { setScreenshotDataUrl(null); setScreenshotName(''); }}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: '50%', color: '#fff', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="x" size={13} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 11, padding: '4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{screenshotName}</div>
                  </div>
                ) : (
                  <button type="button" className="filedrop" onClick={() => screenshotRef.current?.click()} style={{ width: '100%' }}>
                    <Icon name="image" size={18} /><span>Attach payment screenshot</span>
                  </button>
                )}
              </div>

              <div className="rsb-info" style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}><Icon name="check" size={14} style={{ color: '#166534' }} /><span style={{ color: '#166534' }}>Your renewal will be confirmed once the committee verifies the payment.</span></div>
            </div>
          )}

          {/* ---- Step 3: Done ---- */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={32} style={{ color: '#166534' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--fd)', color: 'var(--ink)' }}>Renewal submitted!</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>Your payment of <b>{DATA.inr(amount)}</b> has been recorded.</div>
                {txnRef && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>Ref: <b>{txnRef}</b> · {txnMode}</div>}
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E', textAlign: 'center' }}>
                The committee will verify and activate your renewal within 1–2 business days.
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {step === 0 && (
            <div className="ff-btns">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" icon="qr" onClick={() => setStep(1)}>Proceed to pay — {DATA.inr(amount)}</Button>
            </div>
          )}
          {step === 1 && (
            <div className="ff-btns">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button variant="primary" icon="check" onClick={() => setStep(2)}>I've paid — Enter details</Button>
            </div>
          )}
          {step === 2 && (
            <div className="ff-btns">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" icon="check" disabled={!canConfirm} onClick={handleFinalConfirm}>Confirm payment</Button>
            </div>
          )}
          {step === 3 && (
            <div className="ff-btns">
              <Button variant="primary" icon="check" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Digital ID card tab ---------- */
function IdCardTab({ member, roleMeta }) {
  const name    = member.name || roleMeta.name;
  const memberId = member.id || '—';
  const flat    = member.flat || '—';
  const phone   = member.phone || '—';
  const validTill = member.type === 'lifetime' ? 'Lifetime' : fmtEndDate(member);

  const cardRef = React.useRef(null);

  const handlePrint = () => {
    const card = cardRef.current;
    if (!card) return;
    card.classList.add('id-print-root');
    window.print();
    setTimeout(() => card.classList.remove('id-print-root'), 500);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20,alignItems:'center'}}>
      <p style={{color:'var(--ink-3)',fontSize:13,textAlign:'center'}}>Your official Attiguppe RWA digital membership card</p>
      <div ref={cardRef} className="digital-id-card">
        <div className="did-header">
          <img src={logoSrc} alt="Attiguppe RWA" className="did-logo" />
          <div className="did-header-text">
            <div className="did-reg">Reg. No. DRB4/SOR/226/2025-2026</div>
            <div className="did-org">ATTIGUPPE RESIDENTS WELFARE ASSOCIATION</div>
            <div className="did-addr">No. 135, "KASHI", 8th E Cross, Weavers Society, Attiguppe, Vijayanagar, Bengaluru – 560040</div>
            <div className="did-email">+91 9986020447 &middot; info@treva.in</div>
          </div>
        </div>
        <div className="did-body">
          <div className="did-photo-box">
            {member.photo
              ? <img src={member.photo} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <Icon name="user" size={36} style={{color:'#bbb'}}/>
            }
          </div>
          <div className="did-fields">
            <div className="did-row"><span className="did-label">Name</span><span className="did-colon">:</span><span className="did-val">{name}</span></div>
            <div className="did-row"><span className="did-label">Member ID</span><span className="did-colon">:</span><span className="did-val">{memberId}</span></div>
            <div className="did-row"><span className="did-label">Address</span><span className="did-colon">:</span><span className="did-val">{flat}, Attiguppe, Bengaluru – 560040</span></div>
            <div className="did-row"><span className="did-label">Contact</span><span className="did-colon">:</span><span className="did-val">{phone}</span></div>
          </div>
        </div>
        <div className="did-footer">
          <span className="did-type">RESIDENT MEMBER</span>
          <span className="did-valid">Valid Till : <b>{validTill}</b></span>
          <div className="did-sign">
            <span className="did-sign-text">Chandana M</span>
            <span className="did-sign-label">President</span>
          </div>
        </div>
      </div>
      <Button variant="ghost" icon="download" onClick={handlePrint}>Print / Save ID card</Button>
    </div>
  );
}

function MyClaimRow({ claim }) {
  const [open, setOpen] = React.useState(false);
  const cm = catMeta(claim.category);
  return (
    <>
      <div className="claim-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <div className="cc-main">
          <span className="cc-cat" style={{ background: cm.color + '1f', color: cm.color }}><Icon name={cm.icon} size={18} /></span>
          <div className="cc-body">
            <div className="cc-top">
              <span className="cc-id">{claim.id}</span>
              <Badge tone={claimTone(claim)}>{claimStatusLabel(claim)}</Badge>
              <span className={'cc-type ' + claim.type}>{claim.type === 'recurring' ? 'Recurring' : 'One-time'}</span>
            </div>
            <h4 className="cc-title">{claim.title}</h4>
            <div className="cc-meta">
              <span>{cm.label}</span><i>·</i><span>{fmtDate(claim.date)}</span>
              {claim.hasInvoice && <span className="cc-attach"><Icon name="clip" size={13} />Invoice</span>}
              {claim.hasImage && <span className="cc-attach"><Icon name="image" size={13} />Photo</span>}
            </div>
          </div>
          <div className="cc-amt">{DATA.inr(claim.amount)}</div>
        </div>
        <div className="cc-foot">
          <Stepper claim={claim} compact />
          <button className="cc-view">View<Icon name="chevright" size={15} /></button>
        </div>
      </div>
      {open && (
        <ClaimDetailPortal claim={claim} cm={cm} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ClaimDetailPortal({ claim, cm, onClose }) {
  const [comment, setComment] = React.useState('');
  return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{claim.title}</h2>
                <p className="modal-sub">{claim.id} · {fmtDate(claim.date)} · {DATA.inr(claim.amount)}</p>
              </div>
              <button className="icon-btn" onClick={onClose}><Icon name="x" size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-left">
                  <div className="detail-tags">
                    <Badge tone={claimTone(claim)}>{claimStatusLabel(claim)}</Badge>
                    <span className="d-tag" style={{ color: cm.color, background: cm.color + '1f' }}><Icon name={cm.icon} size={14} />{cm.label}</span>
                  </div>
                  <div className="detail-amt">{DATA.inr(claim.amount)}</div>
                  <p className="detail-desc">{claim.desc}</p>
                  {claim.status === 'rejected' && claim.rejected && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 30%, #fff)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Returned for revision</div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--danger)' }}>"{claim.rejected.reason}"</p>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>— {claim.rejected.name} · {fmtDate(claim.rejected.date)}</div>
                      <div style={{ marginTop: 10 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4 }}>Add a response / note</label>
                        <textarea className="rcb-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Explain what you've updated or clarified..." rows={3} />
                      </div>
                    </div>
                  )}
                  <SectionTitle kicker="Approval chain">Progress</SectionTitle>
                  <Stepper claim={claim} />
                </div>
                <div className="detail-right">
                  <SectionTitle kicker="Timeline">Activity</SectionTitle>
                  <div className="timeline">
                    <div className="tl-item tl-raised">
                      <span className="tl-node"><Icon name="plus" size={13} /></span>
                      <div className="tl-body">
                        <div className="tl-head"><b>{claim.raisedBy}</b><span className="tl-date">{fmtDate(claim.date)}</span></div>
                        <div className="tl-role">Raised this claim</div>
                      </div>
                    </div>
                    {claim.approvals.map((a, i) => (
                      <div className="tl-item" key={i}>
                        <span className="tl-node"><Icon name="check" size={13} /></span>
                        <div className="tl-body">
                          <div className="tl-head"><b>{a.name}</b><span className="tl-date">{fmtDate(a.date)}</span></div>
                          <div className="tl-role">{DATA.ROLES.find(r => r.key === a.role)?.label || 'Reviewer'} · approved</div>
                          {a.note && <div className="tl-note">"{a.note}"</div>}
                        </div>
                      </div>
                    ))}
                    {claim.status === 'rejected' && claim.rejected && (
                      <div className="tl-item tl-rejected">
                        <span className="tl-node"><Icon name="x" size={13} /></span>
                        <div className="tl-body">
                          <div className="tl-head"><b>{claim.rejected.name}</b><span className="tl-date">{fmtDate(claim.rejected.date)}</span></div>
                          <div className="tl-role">Returned for revision</div>
                          {claim.rejected.reason && <div className="tl-note bad">"{claim.rejected.reason}"</div>}
                        </div>
                      </div>
                    )}
                    {claim.status === 'disbursed' && (
                      <div className="tl-item tl-disbursed">
                        <span className="tl-node"><Icon name="rupee" size={13} /></span>
                        <div className="tl-body">
                          <div className="tl-head"><b>Treasurer</b><span className="tl-date">{fmtDate(claim.disbursedDate)}</span></div>
                          <div className="tl-role">Funds released</div>
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

function NewClaimFormPortal({ open, onClose, onSubmit }) {
  const blank = { title: '', desc: '', type: 'one-time', category: '', customCategory: '', amount: '', hasImage: false, hasInvoice: false, imageFile: null, invoiceFile: null, imageDataUrl: null, invoiceDataUrl: null };
  const [form, setForm] = React.useState(blank);
  const [customInput, setCustomInput] = React.useState('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  React.useEffect(() => { if (open) { setForm(blank); setCustomInput(''); setShowCustomInput(false); } }, [open]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleCategorySelect = (key) => {
    if (key === '__custom__') { setShowCustomInput(true); }
    else { set('category', key); setShowCustomInput(false); setCustomInput(''); }
  };
  const handleCustomSave = () => {
    if (customInput.trim()) { set('category', '__custom__'); set('customCategory', customInput.trim()); setShowCustomInput(false); }
  };

  const valid = form.title.trim() && form.amount && Number(form.amount) > 0 && form.category && (form.category !== '__custom__' || form.customCategory.trim());

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
    <Modal open={open} onClose={onClose} wide title="Raise a new claim" sub="Submitted claims go to Joint Secretary and move up the approval chain." footer={
      <div className="form-foot">
        <div className="ff-btns">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" disabled={!valid} onClick={() => onSubmit({ ...form, category: form.category === '__custom__' ? form.customCategory.trim().toLowerCase().replace(/\s+/g, '_') : form.category, categoryLabel: form.category === '__custom__' ? form.customCategory : catMeta(form.category).label })}>Submit claim</Button>
        </div>
      </div>
    }>
      <div className="form-grid">
        <Field label="Claim heading" required>
          <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Replace Block C gate camera" />
        </Field>
        <Field label="Description" hint="What is needed and why. Mention vendor / urgency.">
          <TextArea rows={3} value={form.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Describe the requirement…" />
        </Field>
        <div className="form-2">
          <Field label="Claim type" required>
            <Segmented value={form.type} onChange={(v) => set('type', v)} options={[{ value: 'one-time', label: 'One-time' }, { value: 'recurring', label: 'Recurring' }]} />
          </Field>
          <Field label="Amount (₹)" required>
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
          <Field label="Item / site photo" hint="Attach photo of the item or site.">
            <FileDropWithPreview icon="image" label="Attach photo" accept="image/*"
              filename={form.imageFile?.name || (form.hasImage ? 'photo.jpg' : null)}
              dataUrl={form.imageDataUrl}
              onUpload={handleImageUpload}
              onRemove={() => { set('hasImage', false); set('imageFile', null); set('imageDataUrl', null); }} />
          </Field>
          <Field label="Invoice / quotation" hint="Required before disbursal.">
            <FileDropWithPreview icon="receipt" label="Attach invoice" accept="image/*,application/pdf"
              filename={form.invoiceFile?.name || (form.hasInvoice ? 'invoice.pdf' : null)}
              dataUrl={form.invoiceDataUrl}
              onUpload={handleInvoiceUpload}
              onRemove={() => { set('hasInvoice', false); set('invoiceFile', null); set('invoiceDataUrl', null); }} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function SponsorFormPortal({ open, onClose, onSubmit }) {
  const blank = { name: '', type: 'Local Business', customType: '', objective: '', amount: '' };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.name.trim() && form.amount && Number(form.amount) > 0 && form.objective.trim() &&
    (form.type !== '__custom__' || form.customType.trim());
  const effectiveType = form.type === '__custom__' ? form.customType : form.type;

  return (
    <Modal open={open} onClose={onClose} wide title="Raise a sponsorship" sub="Bring a sponsor in to raise funds for the association." footer={
      <div className="form-foot">
        <span className="ff-note"><Icon name="heart" size={15} />Sponsorship is logged to the association ledger.</span>
        <div className="ff-btns">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" disabled={!valid} onClick={() => onSubmit({ ...form, type: effectiveType })}>Record sponsorship</Button>
        </div>
      </div>
    }>
      <div className="form-grid">
        <Field label="Sponsor name" required>
          <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sri Lakshmi Hardware" />
        </Field>
        <Field label="Type of sponsor" required>
          <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
            {['Local Business', 'Corporate', 'Individual / Professional', 'NGO / Trust', 'Resident family'].map((o) => <option key={o}>{o}</option>)}
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
        <Field label="Amount (₹)" required>
          <TextInput type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
        </Field>
      </div>
    </Modal>
  );
}
