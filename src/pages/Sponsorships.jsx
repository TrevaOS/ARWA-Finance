import React from 'react';
import { DATA } from '../data.js';
import { Icon, Card, Button, Badge, SectionTitle, Modal, Field, TextInput, TextArea, Select, EmptyState, fmtDate, fmtShortDate } from '../ui/components.jsx';

const STATUS_COLS = [
  { key: 'pledged',  label: 'Pledged',        color: '#B07A1B', bg: '#F7EFDD' },
  { key: 'received', label: 'Payment Received', color: '#2C7A4E', bg: '#E6F1E9' },
  { key: 'invoiced', label: 'Invoice Raised',   color: '#1E7DB8', bg: '#E0F0FA' },
  { key: 'closed',   label: 'Closed',           color: '#7A9081', bg: '#F2F6F3' },
];

const SPONSOR_TYPES_DEFAULT = ['Local Business', 'Corporate', 'Individual / Professional', 'NGO / Trust', 'Resident family'];

function statusMeta(s) { return STATUS_COLS.find((c) => c.key === s) || STATUS_COLS[0]; }

export function SponsorshipsView({ sponsors, onNewSponsor, onUpdateStatus, onAddPayment }) {
  const [viewMode, setViewMode] = React.useState('list');
  const [openForm, setOpenForm] = React.useState(false);
  const [activeId, setActiveId] = React.useState(null);
  const [filterStatus, setFilterStatus] = React.useState('all');

  const shown = filterStatus === 'all' ? sponsors : sponsors.filter((s) => s.status === filterStatus);
  const totalPledged  = sponsors.filter(s => s.status === 'pledged').reduce((a, s) => a + s.amount, 0);
  const totalReceived = sponsors.filter(s => s.status === 'received' || s.status === 'closed').reduce((a, s) => a + s.amount, 0);
  const active = sponsors.find((s) => s.id === activeId);

  return (
    <div className="view">
      <div className="spons-header">
        <div>
          <div className="spons-title">Sponsorships</div>
          <div className="spons-sub">Track sponsors, payment status, and receipts.</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setOpenForm(true)}>New Sponsorship</Button>
      </div>

      <div className="stat-row">
        <div className="card card-pad stat">
          <div className="stat-top"><span className="stat-label">Total</span><span className="stat-ico"><Icon name="heart" size={17}/></span></div>
          <div className="stat-value">{sponsors.length}</div>
          <div className="stat-sub">sponsors on record</div>
        </div>
        <div className="card card-pad stat">
          <div className="stat-top"><span className="stat-label">Pledged</span><span className="stat-ico"><Icon name="clock" size={17}/></span></div>
          <div className="stat-value">{DATA.inr(totalPledged)}</div>
          <div className="stat-sub">{sponsors.filter(s=>s.status==='pledged').length} pending</div>
        </div>
        <div className="card card-pad stat">
          <div className="stat-top"><span className="stat-label">Received</span><span className="stat-ico"><Icon name="check" size={17}/></span></div>
          <div className="stat-value">{DATA.inr(totalReceived)}</div>
          <div className="stat-sub">confirmed payments</div>
        </div>
        <div className="card card-pad stat">
          <div className="stat-top"><span className="stat-label">This FY</span><span className="stat-ico"><Icon name="rupee" size={17}/></span></div>
          <div className="stat-value">{DATA.inr(totalPledged + totalReceived)}</div>
          <div className="stat-sub">total raised</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="spons-toolbar">
        <div className="cf-chips">
          <button className={'cf-chip' + (filterStatus==='all'?' on':'')} onClick={()=>setFilterStatus('all')}>All</button>
          {STATUS_COLS.map(c=>(
            <button key={c.key} className={'cf-chip' + (filterStatus===c.key?' on':'')} onClick={()=>setFilterStatus(filterStatus===c.key?'all':c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="claims-view-switch">
          {[['list','menu'],['kanban','claims']].map(([m,icon])=>(
            <button key={m} className={'cvs-btn'+(viewMode===m?' on':'')} onClick={()=>setViewMode(m)} title={m}>
              <Icon name={icon} size={16}/>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'list' ? (
        shown.length === 0
          ? <Card><EmptyState icon="heart" title="No sponsorships" sub="Add the first one with the New Sponsorship button." /></Card>
          : <div className="sponsor-list-view">
              {shown.map(s=>(
                <SponsorCard key={s.id} sp={s} onClick={()=>setActiveId(s.id)} onUpdateStatus={onUpdateStatus} />
              ))}
            </div>
      ) : (
        <SponsorKanban sponsors={shown} onOpen={(id)=>setActiveId(id)} onUpdateStatus={onUpdateStatus} />
      )}

      {active && (
        <SponsorDetail sp={active} onClose={()=>setActiveId(null)} onUpdateStatus={onUpdateStatus} onAddPayment={onAddPayment} />
      )}

      <NewSponsorForm open={openForm} onClose={()=>setOpenForm(false)} onSubmit={(form)=>{ onNewSponsor(form); setOpenForm(false); }} />
    </div>
  );
}

function SponsorCard({ sp, onClick, onUpdateStatus }) {
  const sm = statusMeta(sp.status);
  return (
    <div className="spons-card" onClick={onClick}>
      <div className="sc-left">
        <span className="sc-ico"><Icon name="heart" size={20}/></span>
        <div className="sc-body">
          <div className="sc-name">{sp.name}</div>
          <div className="sc-meta">{sp.type} &middot; {fmtDate(sp.date)}</div>
          <div className="sc-obj">{sp.objective}</div>
        </div>
      </div>
      <div className="sc-right">
        <div className="sc-amt">{DATA.inr(sp.amount)}</div>
        <span className="sc-status" style={{background: sm.bg, color: sm.color}}>{sm.label}</span>
        {sp.status === 'pledged' && (
          <Button size="sm" variant="primary" icon="check" onClick={(e)=>{e.stopPropagation(); onUpdateStatus(sp.id,'received');}}>Mark Received</Button>
        )}
      </div>
    </div>
  );
}

function SponsorKanban({ sponsors, onOpen, onUpdateStatus }) {
  return (
    <div className="kanban-board" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
      {STATUS_COLS.map(col=>{
        const cards = sponsors.filter(s=>s.status===col.key);
        return (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-head">
              <span className="kanban-col-title" style={{color:col.color}}>{col.label}</span>
              <span className="kanban-count">{cards.length}</span>
            </div>
            <div className="kanban-cards">
              {cards.length===0 && <div className="kanban-empty">None</div>}
              {cards.map(s=>(
                <div key={s.id} className="kanban-card" onClick={()=>onOpen(s.id)}>
                  <div className="kc-title">{s.name}</div>
                  <div className="kc-meta">{s.type}</div>
                  <div className="kc-meta" style={{fontWeight:700,color:'var(--green)'}}>{DATA.inr(s.amount)}</div>
                  <div className="kc-meta">{fmtShortDate(s.date)}</div>
                  {s.status==='pledged' && (
                    <div className="kc-actions" onClick={e=>e.stopPropagation()}>
                      <Button size="sm" variant="primary" icon="check" onClick={()=>onUpdateStatus(s.id,'received')}>Received</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SponsorDetail({ sp, onClose, onUpdateStatus, onAddPayment }) {
  const sm = statusMeta(sp.status);
  const [payMode, setPayMode] = React.useState('');
  const [payRef, setPayRef] = React.useState('');
  const [payScreenshot, setPayScreenshot] = React.useState(null);
  const [payScreenshotName, setPayScreenshotName] = React.useState('');
  const [showPayForm, setShowPayForm] = React.useState(false);
  const [previewImg, setPreviewImg] = React.useState(null);
  const screenshotRef = React.useRef(null);

  const DEADLINE_DAYS = 5;
  const WARNING_DAYS = 2;
  const today = new Date(DATA.TODAY + 'T00:00:00');
  const pledgedDate = sp.date ? new Date(sp.date + 'T00:00:00') : null;
  const daysElapsed = pledgedDate ? Math.floor((today - pledgedDate) / 86400000) : 0;
  const daysLeft = DEADLINE_DAYS - daysElapsed;
  const showDeadlineWarning = sp.status === 'pledged' && daysLeft <= DEADLINE_DAYS;
  const isOverdue = sp.status === 'pledged' && daysLeft <= 0;

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPayScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setPayScreenshot(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleMarkPaid = () => {
    onUpdateStatus(sp.id, 'received', { mode: payMode, ref: payRef, screenshot: payScreenshot, screenshotName: payScreenshotName, date: DATA.TODAY });
    setShowPayForm(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{sp.name}</h2>
            <p className="modal-sub">{sp.id} &middot; {sp.type} &middot; {fmtDate(sp.date)}</p>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20}/></button>
        </div>
        <div className="modal-body">
          {showDeadlineWarning && (
            <div style={{background: isOverdue ? 'var(--danger-bg)' : 'var(--amber-bg)', border: '1px solid ' + (isOverdue ? 'var(--danger)' : '#e8c96a'), borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10}}>
              <Icon name="clock" size={16} style={{color: isOverdue ? 'var(--danger)' : 'var(--amber)', flexShrink:0}} />
              <div style={{fontSize: 13, color: isOverdue ? 'var(--danger)' : 'var(--amber)', fontWeight: 600}}>
                {isOverdue ? 'Payment overdue — pledge window has passed' : `Payment expected within ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (5-day pledge window)`}
              </div>
            </div>
          )}
          <div className="detail-grid">
            <div className="detail-left">
              <div className="detail-tags" style={{marginBottom:12}}>
                <span className="sc-status" style={{background:sm.bg,color:sm.color,padding:'4px 12px',borderRadius:99,fontSize:13,fontWeight:600}}>{sm.label}</span>
                <span style={{fontSize:12,color:'var(--ink-3)',background:'var(--paper)',padding:'4px 10px',borderRadius:99}}>{sp.type}</span>
              </div>
              <div className="detail-amt">{DATA.inr(sp.amount)}</div>
              <p className="detail-desc">{sp.objective}</p>

              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16}}>
                {sp.status==='pledged' && (
                  <Button variant="primary" icon="check" onClick={()=>setShowPayForm(v=>!v)}>Mark as Received</Button>
                )}
                {sp.status==='received' && (
                  <Button variant="ghost" icon="receipt" onClick={()=>onUpdateStatus(sp.id,'invoiced')}>Raise Invoice</Button>
                )}
                {(sp.status==='received'||sp.status==='invoiced') && (
                  <Button variant="ghost" icon="check" onClick={()=>onUpdateStatus(sp.id,'closed')}>Close</Button>
                )}
              </div>

              {showPayForm && (
                <div style={{marginTop:16,padding:16,background:'var(--paper)',borderRadius:12,display:'flex',flexDirection:'column',gap:12}}>
                  <div className="kicker" style={{marginBottom:0}}>Payment details</div>
                  <Field label="Mode of payment">
                    <Select value={payMode} onChange={e=>setPayMode(e.target.value)}>
                      <option value="">Select mode</option>
                      {['UPI','NEFT / RTGS','Cheque','Cash','IMPS'].map(o=><option key={o}>{o}</option>)}
                    </Select>
                  </Field>
                  <Field label="Reference / Transaction no." hint="UTR, UPI ID or cheque number">
                    <TextInput value={payRef} onChange={e=>setPayRef(e.target.value)} placeholder="e.g. UPI/2026/123456789" />
                  </Field>
                  <Field label="Payment screenshot (optional)">
                    <input ref={screenshotRef} type="file" accept="image/*" hidden onChange={handleScreenshot} />
                    {payScreenshot ? (
                      <div style={{position:'relative',borderRadius:8,overflow:'hidden',border:'1px solid var(--line)',maxHeight:140}}>
                        <img src={payScreenshot} alt="payment" style={{width:'100%',objectFit:'cover',maxHeight:140}} />
                        <button type="button" onClick={()=>{setPayScreenshot(null);setPayScreenshotName('');}}
                          style={{position:'absolute',top:5,right:5,background:'rgba(0,0,0,.55)',border:'none',borderRadius:'50%',color:'#fff',width:22,height:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <Icon name="x" size={12}/>
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="filedrop" onClick={()=>screenshotRef.current?.click()}>
                        <Icon name="image" size={16}/><span>Attach payment screenshot</span>
                      </button>
                    )}
                  </Field>
                  <div style={{display:'flex',gap:8}}>
                    <Button variant="ghost" onClick={()=>setShowPayForm(false)}>Cancel</Button>
                    <Button variant="primary" icon="check" disabled={!payRef.trim() || !payMode} onClick={handleMarkPaid}>Confirm Payment</Button>
                  </div>
                </div>
              )}

              {sp.paymentHistory && sp.paymentHistory.length > 0 && (
                <div style={{marginTop:16}}>
                  <SectionTitle kicker="Payments">Payment history</SectionTitle>
                  {sp.paymentHistory.map((p,i)=>(
                    <div key={i} className="spons-pay-detail" style={{marginTop:0}}>
                      <div className="spd-row"><span className="spd-label">Amount</span><span className="spd-val">{DATA.inr(p.amount||sp.amount)}</span></div>
                      <div className="spd-row"><span className="spd-label">Mode</span><span className="spd-val">{p.mode || '—'}</span></div>
                      {p.ref && <div className="spd-row"><span className="spd-label">Reference</span><span className="spd-val" style={{fontFamily:'monospace',fontSize:12}}>{p.ref}</span></div>}
                      <div className="spd-row"><span className="spd-label">Date</span><span className="spd-val">{fmtDate(p.date)}</span></div>
                      {p.screenshot && (
                        <div>
                          <div className="spd-label" style={{marginBottom:6}}>Payment screenshot</div>
                          <img src={p.screenshot} alt="payment screenshot" className="spd-screenshot" onClick={()=>setPreviewImg(p.screenshot)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="detail-right">
              {/* Show QR only when payment not yet received */}
              {sp.status === 'pledged' ? (
                <>
                  <SectionTitle kicker="Collection">Payment QR</SectionTitle>
                  <div className="qr-panel" style={{border:'none',padding:0}}>
                    <div className="qr-box" style={{margin:'0 0 8px'}}><QrArt /></div>
                    <div className="qr-vpa">attiguppe.rwa@upi</div>
                    <div className="qr-amt">{DATA.inr(sp.amount)}</div>
                    <p className="qr-note">Share with {sp.name} to collect via UPI.</p>
                  </div>
                </>
              ) : (
                /* Payment received — show confirmation badge */
                <div style={{background:'var(--success-bg)',border:'1px solid #86efac',borderRadius:12,padding:'16px',display:'flex',flexDirection:'column',gap:10,alignItems:'center',textAlign:'center'}}>
                  <div style={{width:48,height:48,borderRadius:'50%',background:'var(--success)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Icon name="check" size={26} style={{color:'#fff'}}/>
                  </div>
                  <div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:17,color:'var(--success)'}}>Payment Confirmed</div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--fd)',color:'var(--ink)'}}>{DATA.inr(sp.amount)}</div>
                  {sp.paymentHistory?.[0] && (
                    <div style={{width:'100%',display:'flex',flexDirection:'column',gap:6,background:'#fff',borderRadius:10,padding:'12px',border:'1px solid #86efac'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'var(--ink-3)'}}>Mode</span><b>{sp.paymentHistory[0].mode||'—'}</b></div>
                      {sp.paymentHistory[0].ref && <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'var(--ink-3)'}}>Ref No.</span><b style={{fontFamily:'monospace',fontSize:12}}>{sp.paymentHistory[0].ref}</b></div>}
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'var(--ink-3)'}}>Date</span><b>{fmtDate(sp.paymentHistory[0].date)}</b></div>
                    </div>
                  )}
                  {sp.paymentHistory?.[0]?.screenshot && (
                    <div style={{width:'100%'}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Payment Screenshot</div>
                      <img src={sp.paymentHistory[0].screenshot} alt="payment proof" style={{width:'100%',borderRadius:8,border:'1px solid #86efac',cursor:'pointer',maxHeight:200,objectFit:'cover'}} onClick={()=>setPreviewImg(sp.paymentHistory[0].screenshot)} />
                    </div>
                  )}
                </div>
              )}
              <div style={{marginTop:12,background:'var(--paper)',borderRadius:10,padding:'12px 14px',display:'flex',flexDirection:'column',gap:6}}>
                <div className="kicker" style={{marginBottom:4}}>Sponsor details</div>
                <div style={{fontSize:13,display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--ink-3)'}}>Sponsor</span><b>{sp.name}</b></div>
                <div style={{fontSize:13,display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--ink-3)'}}>Type</span><span>{sp.type}</span></div>
                <div style={{fontSize:13,display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--ink-3)'}}>Pledged on</span><span>{fmtDate(sp.date)}</span></div>
                <div style={{fontSize:13,display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--ink-3)'}}>Amount</span><b style={{color:'var(--green)'}}>{DATA.inr(sp.amount)}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {previewImg && (
        <div className="modal-overlay" style={{zIndex:200}} onClick={()=>setPreviewImg(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:700}}>
            <div className="modal-head"><h2>Payment screenshot</h2><button className="icon-btn" onClick={()=>setPreviewImg(null)}><Icon name="x" size={20}/></button></div>
            <div className="modal-body" style={{padding:12}}><img src={previewImg} alt="screenshot" style={{width:'100%',borderRadius:10,maxHeight:'70vh',objectFit:'contain'}}/></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NewSponsorForm({ open, onClose, onSubmit }) {
  const blank = { name: '', type: 'Local Business', customType: '', objective: '', amount: '' };
  const [form, setForm] = React.useState(blank);
  const [customTypeList] = React.useState(SPONSOR_TYPES_DEFAULT);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.name.trim() && form.amount && Number(form.amount) > 0 && form.objective.trim();
  const effectiveType = form.type === '__custom__' ? form.customType : form.type;

  return (
    <Modal open={open} onClose={onClose} wide title="New Sponsorship" sub="Record a new sponsor. A payment receipt can be raised once funds are confirmed."
      footer={
        <div className="form-foot">
          <span className="ff-note"><Icon name="heart" size={15}/>Sponsorship logged to the association ledger.</span>
          <div className="ff-btns">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" icon="check" disabled={!valid} onClick={()=>onSubmit({...form, type: effectiveType})}>Record Sponsorship</Button>
          </div>
        </div>
      }>
      <div className="sponsor-grid">
        <div>
          <Field label="Sponsor name" required>
            <TextInput value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Sri Lakshmi Hardware" />
          </Field>
          <Field label="Type of sponsor" required>
            <Select value={form.type} onChange={e=>set('type',e.target.value)}>
              {customTypeList.map(o=><option key={o} value={o}>{o}</option>)}
              <option value="__custom__">+ Add custom type...</option>
            </Select>
          </Field>
          {form.type === '__custom__' && (
            <Field label="Custom sponsor type" required>
              <TextInput value={form.customType} onChange={e=>set('customType',e.target.value)} placeholder="e.g. Religious Trust" autoFocus />
            </Field>
          )}
          <Field label="Sponsorship objective" required hint="What the funds are intended to support.">
            <TextArea rows={3} value={form.objective} onChange={e=>set('objective',e.target.value)} placeholder="e.g. Ganesha festival decorations" />
          </Field>
          <Field label="Amount (₹)" required>
            <TextInput type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="qr-panel">
          <div className="qr-title">Collection QR</div>
          <div className="qr-box"><QrArt /></div>
          <div className="qr-vpa">attiguppe.rwa@upi</div>
          <div className="qr-amt">{form.amount ? DATA.inr(Number(form.amount)) : 'Enter amount'}</div>
          <p className="qr-note">Share this UPI QR with the sponsor to collect directly.</p>
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
