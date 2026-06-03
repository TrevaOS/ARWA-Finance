import React from 'react';
import { DATA, CAT_COLORS } from '../data.js';
import { Icon, Card, Button, Badge, SectionTitle, StatCard, Select, Donut, StackBars, Modal, Field, TextInput, fmtShortDate } from '../ui/components.jsx';

export function FinancesView({ charges, onUpdateCharges, claims, inflow, members, sponsors, onAddInflow, onExportPdf }) {
  const [month, setMonth] = React.useState('all');
  const [editCharges, setEditCharges] = React.useState(false);
  const [openInflow, setOpenInflow] = React.useState(false);

  const filtered = month === 'all' ? inflow : inflow.filter((m) => m.month === month);
  const sum = (key) => filtered.reduce((total, item) => total + (item[key] || 0), 0);
  const annual = sum('annual');
  const lifetime = sum('lifetime');
  const sponsor = sum('sponsorship');
  const total = annual + lifetime + sponsor;
  const spendTotal = DATA.SPEND.reduce((s, x) => s + x.amount, 0);
  const series = [
    { key: 'annual', color: '#2F5D4A' },
    { key: 'lifetime', color: '#6B8F71' },
    { key: 'sponsorship', color: '#C2622D' },
  ];
  const periodLabel = month === 'all' ? 'Jan–Jun 2026' : (inflow.find((m) => m.month === month) || {}).label + ' 2026';

  const allMembers = members || DATA.MEMBERS;
  const annualMembers = allMembers.filter(m => m.type === 'annual');
  const lifetimeMembers = allMembers.filter(m => m.type === 'lifetime');
  const annualPaid = annualMembers.filter(m => m.status === 'paid').length;
  const lifetimePaid = lifetimeMembers.filter(m => m.status === 'paid').length;
  const annualDue = annualMembers.filter(m => m.status === 'due' || m.status === 'overdue').length;
  const annualRevenue = Math.round(annual / (charges.annual || DATA.CHARGES.annual)) * (charges.annual || DATA.CHARGES.annual);
  const lifetimeRevenue = Math.round(lifetime / (charges.lifetime || DATA.CHARGES.lifetime)) * (charges.lifetime || DATA.CHARGES.lifetime);
  const annualCount = Math.round(annual / (charges.annual || DATA.CHARGES.annual));
  const lifetimeCount = Math.round(lifetime / (charges.lifetime || DATA.CHARGES.lifetime));

  return (
    <div className="view">
      <div className="fin-filter">
        <div className="ff-left">
          <Icon name="filter" size={16} />
          <span>Showing inflow for</span>
          <div className="month-select">
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">All months (FY to date)</option>
              {inflow.slice().reverse().map((m) => <option key={m.month} value={m.month}>{m.label} 2026</option>)}
            </Select>
          </div>
        </div>
        <div className="ff-right">
          <Button variant="ghost" icon="download" onClick={onExportPdf}>Export ledger</Button>
          <Button variant="primary" icon="plus" onClick={() => setOpenInflow(true)}>New inflow</Button>
        </div>
      </div>

      <div className="stat-row">
        <StatCard label="Total inflow" value={DATA.inr(total)} sub={periodLabel} icon="arrowdown" accent />
        <StatCard label="Annual dues" value={DATA.inr(annual)} sub={annualCount + ' payment' + (annualCount !== 1 ? 's' : '')} icon="calendar" />
        <StatCard label="Lifetime fees" value={DATA.inr(lifetime)} sub={lifetimeCount + ' member' + (lifetimeCount !== 1 ? 's' : '')} icon="shield" />
        <StatCard label="Sponsorships" value={DATA.inr(sponsor)} sub="custom inflow" icon="heart" />
      </div>

      <div className="two-col">
        <Card>
          <SectionTitle kicker="Annual membership">Annual member breakdown</SectionTitle>
          <div className="membership-breakdown">
            <div className="mb-row">
              <div className="mb-item">
                <div className="mb-val">{annualMembers.length}</div>
                <div className="mb-lbl">Total annual members</div>
              </div>
              <div className="mb-item">
                <div className="mb-val" style={{ color: 'var(--success)' }}>{annualPaid}</div>
                <div className="mb-lbl">Paid up</div>
              </div>
              <div className="mb-item">
                <div className="mb-val" style={{ color: 'var(--amber)' }}>{annualDue}</div>
                <div className="mb-lbl">Due / Overdue</div>
              </div>
              <div className="mb-item">
                <div className="mb-val" style={{ color: 'var(--green)' }}>{DATA.inr(annual)}</div>
                <div className="mb-lbl">Collected ({periodLabel})</div>
              </div>
            </div>
            <div className="mb-progress-wrap">
              <div className="mb-progress-label">
                <span>Collection rate</span>
                <span>{annualMembers.length > 0 ? Math.round((annualPaid / annualMembers.length) * 100) : 0}%</span>
              </div>
              <div className="mb-progress-bar">
                <div className="mb-progress-fill" style={{ width: annualMembers.length > 0 ? (annualPaid / annualMembers.length * 100) + '%' : '0%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle kicker="Lifetime membership">Lifetime member breakdown</SectionTitle>
          <div className="membership-breakdown">
            <div className="mb-row">
              <div className="mb-item">
                <div className="mb-val">{lifetimeMembers.length}</div>
                <div className="mb-lbl">Total lifetime members</div>
              </div>
              <div className="mb-item">
                <div className="mb-val" style={{ color: 'var(--success)' }}>{lifetimePaid}</div>
                <div className="mb-lbl">Active</div>
              </div>
              <div className="mb-item">
                <div className="mb-val" style={{ color: 'var(--green)' }}>{DATA.inr(lifetime)}</div>
                <div className="mb-lbl">Collected ({periodLabel})</div>
              </div>
              <div className="mb-item">
                <div className="mb-val" style={{ color: 'var(--ink-3)' }}>{DATA.inr(charges.lifetime)}</div>
                <div className="mb-lbl">Fee per member</div>
              </div>
            </div>
            <div className="mb-note"><Icon name="info" size={14} />Lifetime members pay once. No annual renewal required.</div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <SectionTitle kicker="Cash in" action={<span className="period-pill">{periodLabel}</span>}>Inflow by source</SectionTitle>
          <StackBars rows={filtered} series={series} height={180} fmt={DATA.inr} />
          <div className="legend">
            <span className="lg"><i style={{ background: '#2F5D4A' }} />Annual dues</span>
            <span className="lg"><i style={{ background: '#6B8F71' }} />Lifetime fees</span>
            <span className="lg"><i style={{ background: '#C2622D' }} />Sponsorships</span>
          </div>
        </Card>

        <Card>
          <SectionTitle kicker="Cash out" action={<span className="period-pill">FY to date</span>}>Spend by category</SectionTitle>
          <div className="spend-split">
            <Donut data={DATA.SPEND.map((x) => ({ value: x.amount, color: CAT_COLORS[x.key] }))}
              size={160} thickness={22} centerValue={DATA.inrShort(spendTotal)} centerLabel="total spend" />
            <div className="cat-legend">
              {DATA.SPEND.map((x) => {
                const pct = Math.round((x.amount / spendTotal) * 100);
                return (
                  <div className="cl-row" key={x.key}>
                    <span className="cl-dot" style={{ background: CAT_COLORS[x.key] }} />
                    <span className="cl-name">{DATA.catLabel(x.key)}</span>
                    <span className="cl-pct">{pct}%</span>
                    <span className="cl-val">{DATA.inr(x.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col col-65">
        <Card>
          <SectionTitle kicker="Fundraising" action={<Badge tone="gold">{(sponsors || DATA.SPONSORS).length} on record</Badge>}>Sponsorships</SectionTitle>
          <div className="sponsor-list">
            {[...(sponsors || DATA.SPONSORS)].map((s) => (
              <div className="sp-row" key={s.id}>
                <span className="sp-ico"><Icon name="heart" size={16} /></span>
                <div className="sp-body">
                  <div className="sp-top">
                    <b>{s.name}</b>
                    <span className="sp-type">{s.type}</span>
                    {s.status === 'pledged'
                      ? <Badge tone="amber" icon="clock">Pledged</Badge>
                      : <Badge tone="success" icon="check">Received</Badge>}
                  </div>
                  <span className="sp-obj">{s.objective}</span>
                </div>
                <div className="sp-right">
                  <span className="sp-amt">{DATA.inr(s.amount)}</span>
                  <span className="sp-date">{fmtShortDate(s.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="charges-card">
          <SectionTitle kicker="Configuration" action={<Button size="sm" variant="ghost" icon="edit" onClick={() => setEditCharges(true)}>Edit</Button>}>Membership charges</SectionTitle>
          <div className="charge-row">
            <div className="ch-meta"><span className="ch-name">Annual membership</span><span className="ch-sub">Renewed every year</span></div>
            <span className="ch-amt">{DATA.inr(charges.annual)}<em>/yr</em></span>
          </div>
          <div className="charge-row">
            <div className="ch-meta"><span className="ch-name">Lifetime membership</span><span className="ch-sub">One-time payment</span></div>
            <span className="ch-amt">{DATA.inr(charges.lifetime)}</span>
          </div>
          <div className="charge-row">
            <div className="ch-meta"><span className="ch-name">Sponsorship</span><span className="ch-sub">Custom amount via UPI QR</span></div>
            <span className="ch-amt custom">Custom</span>
          </div>
          <p className="charge-note"><Icon name="info" size={14} />Changing a charge applies to new onboardings and renewals only.</p>
        </Card>
      </div>

      <ChargesForm open={editCharges} charges={charges} onClose={() => setEditCharges(false)} onSubmit={onUpdateCharges} />
      <InflowForm open={openInflow} onClose={() => setOpenInflow(false)} onSubmit={onAddInflow} />
    </div>
  );
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function InflowForm({ open, onClose, onSubmit }) {
  const blank = { month: '2026-06', annual: '', lifetime: '', sponsorship: '' };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => { if (open) setForm(blank); }, [open]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const valid = form.month && (Number(form.annual) > 0 || Number(form.lifetime) > 0 || Number(form.sponsorship) > 0);
  const label = form.month ? MONTH_LABELS[parseInt(form.month.slice(5, 7), 10) - 1] : '';
  return (
    <Modal open={open} onClose={onClose} title="Record new inflow" sub="Add inflow figures for a given month" wide footer={
      <div className="form-foot">
        <div className="ff-btns">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" disabled={!valid} onClick={() => onSubmit({ ...form, label, annual: Number(form.annual) || 0, lifetime: Number(form.lifetime) || 0, sponsorship: Number(form.sponsorship) || 0 })}>Save inflow</Button>
        </div>
      </div>
    }>
      <div className="form-grid">
        <Field label="Month" required hint="Select the month this inflow belongs to">
          <TextInput type="month" value={form.month} onChange={(e) => set('month', e.target.value)} />
        </Field>
        <Field label="Annual dues (₹)">
          <TextInput type="number" value={form.annual} onChange={(e) => set('annual', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Lifetime fees (₹)">
          <TextInput type="number" value={form.lifetime} onChange={(e) => set('lifetime', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Sponsorships (₹)">
          <TextInput type="number" value={form.sponsorship} onChange={(e) => set('sponsorship', e.target.value)} placeholder="0" />
        </Field>
      </div>
    </Modal>
  );
}

function ChargesForm({ open, charges, onClose, onSubmit }) {
  const [form, setForm] = React.useState(charges);
  React.useEffect(() => { if (open) setForm(charges); }, [open, charges]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <Modal open={open} onClose={onClose} title="Edit membership charges" sub="Set the standard dues for the association." footer={
      <div className="ff-btns">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={() => onSubmit({ ...form, annual: Number(form.annual), lifetime: Number(form.lifetime) })}>Save charges</Button>
      </div>
    }>
      <div className="form-grid">
        <Field label="Annual membership (₹ / year)" required>
          <TextInput type="number" value={form.annual} onChange={(e) => set('annual', e.target.value)} />
        </Field>
        <Field label="Lifetime membership (₹ one-time)" required>
          <TextInput type="number" value={form.lifetime} onChange={(e) => set('lifetime', e.target.value)} />
        </Field>
        <div className="charge-info"><Icon name="info" size={15} />Sponsorships stay a custom amount agreed per sponsor and are collected via the association UPI QR.</div>
      </div>
    </Modal>
  );
}
