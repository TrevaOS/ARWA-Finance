import React from 'react';
import { DATA, CAT_COLORS } from '../data.js';
import { Icon, Card, StatCard, SectionTitle, Button, Avatar, Donut, StackBars, fmtDate, fmtShortDate } from '../ui/components.jsx';

const PERIOD_OPTIONS = [
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'half',    label: 'Last 6 Months' },
  { value: 'year',    label: 'Full Year (FY)' },
  { value: '2026-01', label: 'January 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-06', label: 'June 2026' },
];

function filterInflowByPeriod(inflow, period) {
  if (period === 'month') return inflow.filter((r) => r.month === DATA.TODAY.slice(0, 7));
  if (period === 'quarter') {
    const m = parseInt(DATA.TODAY.slice(5, 7), 10);
    const qStart = m <= 3 ? 1 : m <= 6 ? 4 : m <= 9 ? 7 : 10;
    return inflow.filter((r) => {
      const rm = parseInt(r.month.slice(5, 7), 10);
      return rm >= qStart && rm < qStart + 3;
    });
  }
  if (period === 'half') return inflow;
  if (period === 'year') return inflow;
  return inflow.filter((r) => r.month === period);
}

export function OverviewView({ claims, go, setRole, inflow, members, availableFunds }) {
  const [period, setPeriod] = React.useState('month');
  const [rangeStart, setRangeStart] = React.useState('');
  const [rangeEnd, setRangeEnd]     = React.useState('');
  const [useRange, setUseRange]     = React.useState(false);
  const allInflow = inflow || DATA.INFLOW;

  const filtered = React.useMemo(() => {
    if (useRange && rangeStart && rangeEnd) {
      return allInflow.filter(r => r.month >= rangeStart.slice(0,7) && r.month <= rangeEnd.slice(0,7));
    }
    return filterInflowByPeriod(allInflow, period);
  }, [useRange, rangeStart, rangeEnd, allInflow, period]);

  const sumInflow = (key) => filtered.reduce((s, r) => s + (r[key] || 0), 0);
  const totalInflow = sumInflow('annual') + sumInflow('lifetime') + sumInflow('sponsorship') + sumInflow('donation');

  const open = claims.filter((c) => c.status === 'open');
  const pendingValue = open.reduce((sum, c) => sum + c.amount, 0);
  const awaiting = open.filter((c) => c.stageIndex >= 4);
  const awaitingValue = awaiting.reduce((sum, c) => sum + c.amount, 0);

  const periodLabel = useRange && rangeStart && rangeEnd
    ? rangeStart.slice(0,7) + ' → ' + rangeEnd.slice(0,7)
    : PERIOD_OPTIONS.find((o) => o.value === period)?.label || period;
  // Build spend from disbursed claims filtered to the current period
  const filteredMonths = new Set(filtered.map(r => r.month));
  const disbursedInPeriod = claims.filter(c => {
    if (c.status !== 'disbursed' || !c.disbursedDate) return false;
    if (period === 'year' || period === 'half') return true;
    return filteredMonths.has(c.disbursedDate.slice(0, 7));
  });
  const spendByCategory = {};
  disbursedInPeriod.forEach(c => {
    const key = c.category || 'equipment';
    spendByCategory[key] = (spendByCategory[key] || 0) + c.amount;
  });
  // Fallback to static DATA.SPEND if no period-filtered data exists
  const hasFilteredSpend = Object.keys(spendByCategory).length > 0;
  const spendData = hasFilteredSpend
    ? DATA.CATEGORIES.map(cat => ({ key: cat.key, amount: spendByCategory[cat.key] || 0 })).filter(x => x.amount > 0)
    : DATA.SPEND;
  const spendTotal = spendData.reduce((sum, x) => sum + x.amount, 0) || DATA.SPEND.reduce((sum, x) => sum + x.amount, 0);
  const donutData = (spendTotal > 0 ? spendData : DATA.SPEND).map((x) => ({ value: x.amount, color: CAT_COLORS[x.key], key: x.key }));
  const series = [
    { key: 'annual',      color: '#2C6E49' },
    { key: 'lifetime',    color: '#4CAD3F' },
    { key: 'sponsorship', color: '#C2622D' },
  ];

  const today = new Date(DATA.TODAY + 'T00:00:00');
  const renewingSoon = (members || DATA.MEMBERS).filter(m => {
    if (m.type !== 'annual' || !m.joined) return false;
    const joined = new Date(m.joined + 'T00:00:00');
    let renewYear = joined.getFullYear();
    while (new Date(renewYear, joined.getMonth(), joined.getDate()) <= today) renewYear++;
    const renewal = new Date(renewYear, joined.getMonth(), joined.getDate());
    const days = Math.ceil((renewal - today) / 86400000);
    return days <= 60;
  }).map(m => {
    const joined = new Date(m.joined + 'T00:00:00');
    let renewYear = joined.getFullYear();
    while (new Date(renewYear, joined.getMonth(), joined.getDate()) <= today) renewYear++;
    const renewal = new Date(renewYear, joined.getMonth(), joined.getDate());
    const days = Math.ceil((renewal - today) / 86400000);
    return { ...m, daysToRenewal: days, renewalDate: renewal };
  }).sort((a, b) => a.daysToRenewal - b.daysToRenewal);

  const overdueMembers = (members || DATA.MEMBERS).filter(m => m.status === 'overdue' || m.status === 'due');

  const feed = [];
  claims.forEach((c) => {
    if (c.status === 'disbursed') feed.push({ date: c.disbursedDate, type: 'disbursed', c });
    else if (c.status === 'rejected') feed.push({ date: c.rejected?.date, type: 'rejected', c });
    else if (c.approvals.length) feed.push({ date: c.approvals[c.approvals.length - 1].date, type: 'approved', c });
    else feed.push({ date: c.date, type: 'raised', c });
  });
  DATA.SPONSORS.forEach((s) => feed.push({ date: s.date, type: 'sponsor', s }));
  feed.sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = feed.slice(0, 7);
  const balancePoints = [410000, 455000, 470000, 540000, 600000, 642300];

  return (
    <div className="view">

      {/* Period selector bar */}
      <div className="period-bar">
        <div className="pb-left">
          <Icon name="calendar" size={16} style={{ color: 'var(--green)' }} />
          <span className="pb-label">Showing data for</span>
        </div>
        <div className="pb-pills">
          {!useRange && PERIOD_OPTIONS.slice(0, 4).map((o) => (
            <button key={o.value} className={'pb-pill' + (period === o.value ? ' on' : '')} onClick={() => { setPeriod(o.value); setUseRange(false); }}>{o.label}</button>
          ))}
          {!useRange && <>
            <div className="pb-divider" />
            <select className="pb-select" value={PERIOD_OPTIONS.slice(4).find(o => o.value === period) ? period : ''} onChange={(e) => { if (e.target.value) { setPeriod(e.target.value); setUseRange(false); } }}>
              <option value="">Specific month...</option>
              {PERIOD_OPTIONS.slice(4).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </>}
          <div className="pb-divider" />
          <button className={'pb-pill' + (useRange ? ' on' : '')} onClick={() => setUseRange(v => !v)}>
            <Icon name="calendar" size={13} />Date range
          </button>
          {useRange && (
            <div className="pb-range">
              <input type="date" className="pb-date-input" value={rangeStart} onChange={e => setRangeStart(e.target.value)} max={rangeEnd || undefined} />
              <span style={{color:'var(--ink-3)',fontSize:13}}>to</span>
              <input type="date" className="pb-date-input" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} min={rangeStart || undefined} />
            </div>
          )}
        </div>
      </div>

      <div className="overview-grid">
        <Card className="hero-balance" pad={false}>
          <div className="hero-inner">
            <div className="hero-top">
              <div>
                <div className="kicker light">Association available funds</div>
                <div className="hero-amt">{DATA.inr(availableFunds != null ? availableFunds : DATA.FUNDS.available)}</div>
                <div className="hero-sub">As of {fmtDate(DATA.TODAY)} &middot; FY 2026-27</div>
              </div>
              <span className="hero-seal">
                <img src="/src/assets/logo.png" alt="logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
              </span>
            </div>
            <Sparkline points={balancePoints} />
            <div className="hero-foot">
              <div className="hf-item">
                <span className="hf-label">Inflow ({periodLabel})</span>
                <span className="hf-val up"><Icon name="arrowup" size={13} stroke={2.4} />{DATA.inr(totalInflow)}</span>
              </div>
              <div className="hf-item">
                <span className="hf-label">FY spend</span>
                <span className="hf-val down"><Icon name="arrowdown" size={13} stroke={2.4} />{DATA.inr(spendTotal)}</span>
              </div>
              <div className="hf-item">
                <span className="hf-label">Pending claims</span>
                <span className="hf-val">{DATA.inr(pendingValue)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="stat-row">
          <StatCard label={'Inflow · ' + periodLabel} value={DATA.inr(totalInflow)} sub="all sources" icon="arrowdown" />
          <StatCard label="Open claims" value={open.length} sub={DATA.inr(pendingValue) + ' in review'} icon="claims" />
          <StatCard label="Awaiting disbursal" value={DATA.inr(awaitingValue)} sub={awaiting.length + ' at Treasurer'} icon="clock" accent />
          <StatCard label="New members" value={'+' + DATA.MEMBER_STATS.newThisMonth} sub="this month" icon="members" />
        </div>
      </div>

      <div className="two-col">
        <Card>
          <SectionTitle kicker="Cash in" action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="period-pill">{periodLabel}</span>
              <Button size="sm" variant="ghost" iconRight="chevright" onClick={() => go('finances')}>Ledger</Button>
            </div>
          }>Inflow breakdown</SectionTitle>
          <StackBars rows={filtered.length ? filtered : allInflow} series={series} height={180} fmt={DATA.inr} />
          <div className="legend">
            <span className="lg"><i style={{ background: '#2C6E49' }} />Annual dues</span>
            <span className="lg"><i style={{ background: '#4CAD3F' }} />Lifetime fees</span>
            <span className="lg"><i style={{ background: '#C2622D' }} />Sponsorships</span>
          </div>
        </Card>

        <Card>
          <SectionTitle kicker="Cash out" action={<span className="period-pill">{periodLabel}</span>}>Where spends went</SectionTitle>
          <div className="spend-split">
            <Donut data={donutData} size={168} thickness={24} centerValue={DATA.inrShort(spendTotal)} centerLabel="total spend" />
            <div className="cat-legend">
              {(spendTotal > 0 ? spendData : DATA.SPEND).map((x) => {
                const pct = spendTotal > 0 ? Math.round((x.amount / spendTotal) * 100) : 0;
                return (
                  <div className="cl-row" key={x.key}>
                    <span className="cl-dot" style={{ background: CAT_COLORS[x.key] }} />
                    <span className="cl-name">{DATA.catLabel(x.key)}</span>
                    <span className="cl-bar"><i style={{ width: pct + '%', background: CAT_COLORS[x.key] }} /></span>
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
          <SectionTitle kicker="Audit trail" action={<Button size="sm" variant="ghost" iconRight="chevright" onClick={() => go('claims')}>All claims</Button>}>Recent activity</SectionTitle>
          <div className="feed">
            {recent.map((item, index) => <FeedRow key={index} f={item} go={go} />)}
          </div>
        </Card>

        <Card className="soft-panel">
          <SectionTitle kicker="Your desk">Pipeline at a glance</SectionTitle>
          <div className="pipeline-mini">
            {DATA.ROLES.map((r) => {
              const cnt = open.filter((c) => c.stageIndex === DATA.STAGE_KEYS.indexOf(r.key)).length;
              return (
                <button className="pm-row" key={r.key} onClick={() => { setRole(r.key); go('claims'); }}>
                  <Avatar name={r.name} size={30} />
                  <div className="pm-meta">
                    <span className="pm-role">{r.label}{r.final && <em className="final-tag">final</em>}</span>
                    <span className="pm-name">{r.name}</span>
                  </div>
                  <span className={'pm-count' + (cnt ? ' has' : '')}>{cnt}</span>
                </button>
              );
            })}
          </div>
          <p className="pm-note"><Icon name="info" size={14} /> Claims flow lowest role upward. Treasurer gives the final release.</p>
        </Card>
      </div>

      {(renewingSoon.length > 0 || overdueMembers.length > 0) && (
        <div className="two-col">
          {renewingSoon.length > 0 && (
            <Card>
              <SectionTitle kicker="Attention needed" action={<Button size="sm" variant="ghost" iconRight="chevright" onClick={() => go('members')}>All members</Button>}>Membership renewals due soon</SectionTitle>
              <div className="renewal-list">
                {renewingSoon.slice(0, 5).map(m => (
                  <div className="renewal-row" key={m.id}>
                    <Avatar name={m.name} size={30} />
                    <div className="renewal-body">
                      <div className="renewal-name">{m.name}</div>
                      <div className="renewal-sub">{m.flat} &middot; Annual member</div>
                    </div>
                    <div className="renewal-right">
                      <span className={'renewal-days' + (m.daysToRenewal <= 14 ? ' urgent' : '')}>{m.daysToRenewal}d</span>
                      <span className="renewal-date">{m.renewalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
                {renewingSoon.length > 5 && <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', paddingTop: 4 }}>+{renewingSoon.length - 5} more</div>}
              </div>
            </Card>
          )}
          {overdueMembers.length > 0 && (
            <Card>
              <SectionTitle kicker="Payment overdue" action={<Button size="sm" variant="ghost" iconRight="chevright" onClick={() => go('members')}>All members</Button>}>Members with pending dues</SectionTitle>
              <div className="renewal-list">
                {overdueMembers.slice(0, 5).map(m => (
                  <div className="renewal-row" key={m.id}>
                    <Avatar name={m.name} size={30} />
                    <div className="renewal-body">
                      <div className="renewal-name">{m.name}</div>
                      <div className="renewal-sub">{m.flat} &middot; {m.type === 'lifetime' ? 'Lifetime' : 'Annual'}</div>
                    </div>
                    <span className={'badge ' + (m.status === 'overdue' ? 'danger soft' : 'amber soft')} style={{ fontSize: 11 }}>{m.status === 'overdue' ? 'Overdue' : 'Due'}</span>
                  </div>
                ))}
                {overdueMembers.length > 5 && <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', paddingTop: 4 }}>+{overdueMembers.length - 5} more</div>}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Sparkline({ points }) {
  const w = 320, h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((p) => h - ((p - min) / (max - min || 1)) * (h - 8) - 4);
  const d = xs.map((x, i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + ys[i].toFixed(1)).join(' ');
  const area = d + ' L ' + w + ' ' + (h - 4) + ' L 0 ' + (h - 4) + ' Z';
  return (
    <svg className="spark" viewBox={'0 0 ' + w + ' ' + h} preserveAspectRatio="none">
      <path d={area} className="spark-area" />
      <path d={d} className="spark-line" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" className="spark-dot" />
    </svg>
  );
}

function FeedRow({ f, go }) {
  if (f.type === 'sponsor') {
    return (
      <div className="feed-row">
        <span className="feed-ico ok"><Icon name="heart" size={15} /></span>
        <div className="feed-body">
          <span className="feed-main"><b>{f.s.name}</b> {f.s.status === 'pledged' ? 'pledged' : 'sponsored'} {DATA.inr(f.s.amount)}</span>
          <span className="feed-sub">{f.s.objective}</span>
        </div>
        <span className="feed-date">{fmtShortDate(f.date)}</span>
      </div>
    );
  }
  const map = {
    disbursed: { ico: 'rupee', tone: 'ok', txt: 'was disbursed' },
    rejected:  { ico: 'x',     tone: 'bad', txt: 'was returned' },
    approved:  { ico: 'check', tone: 'ok', txt: 'advanced in approval' },
    raised:    { ico: 'plus',  tone: 'neutral', txt: 'was raised' },
  }[f.type];

  return (
    <div className="feed-row" onClick={() => go('claims', f.c?.id)} style={{ cursor: 'pointer' }}>
      <span className={'feed-ico ' + map.tone}><Icon name={map.ico} size={15} /></span>
      <div className="feed-body">
        <span className="feed-main"><b>{f.c?.id}</b> {map.txt}</span>
        <span className="feed-sub">{f.c?.title}</span>
      </div>
      <span className="feed-amt">{DATA.inr(f.c?.amount)}</span>
      <span className="feed-date">{fmtShortDate(f.date)}</span>
    </div>
  );
}
