import logoUrl from '../assets/logo.png';
import { computeEndDate } from '../data.js';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtEndDatePdf(member) {
  const end = computeEndDate(member);
  if (!end) return '—';
  return end.getDate() + ' ' + MONTHS_SHORT[end.getMonth()] + ' ' + end.getFullYear();
}

const INR = (n) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n || 0));

function getAbsoluteLogoUrl() {
  if (logoUrl.startsWith('data:') || logoUrl.startsWith('http')) return logoUrl;
  return window.location.origin + (logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl);
}

function printWindow(html) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Please allow popups to export PDF.'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch(e) {} }, 500);
}

function header(title, subtitle) {
  const absLogo = getAbsoluteLogoUrl();
  return `
    <div style="display:flex;align-items:center;gap:18px;padding:24px 32px 18px;border-bottom:3px solid #2C6E49;">
      <img src="${absLogo}" style="width:72px;height:72px;object-fit:contain;" onerror="this.style.display='none'" />
      <div>
        <div style="font-size:22px;font-weight:800;color:#1B4D33;font-family:serif;">Attiguppe Residents Welfare Association</div>
        <div style="font-size:13px;color:#555;margin-top:3px;">By the People, For the People, With the People</div>
        <div style="font-size:14px;font-weight:700;color:#4CAD3F;margin-top:6px;">${title}</div>
        <div style="font-size:12px;color:#777;">${subtitle}</div>
      </div>
    </div>`;
}

const BASE_STYLE = `
  <style>
    *{box-sizing:border-box;}
    body{font-family:'Segoe UI',sans-serif;font-size:13px;color:#1A2A1E;margin:0;padding:0;}
    table{width:100%;border-collapse:collapse;margin-top:14px;}
    th{background:#1B4D33;color:#fff;text-align:left;padding:9px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
    td{padding:8px 12px;border-bottom:1px solid #D8E6DC;}
    tr:hover td{background:#F2F6F3;}
    .total-row td{background:#E8F2EA;font-weight:700;}
    .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;}
    .badge-paid{background:#E6F1E9;color:#2C7A4E;}
    .badge-due{background:#F7EFDD;color:#B07A1B;}
    .badge-overdue{background:#F8E7E2;color:#B23F2E;}
    .badge-pending{background:#F7EFDD;color:#B07A1B;}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 32px;}
    .summary-box{background:#F2F6F3;border:1px solid #D8E6DC;border-radius:10px;padding:14px 16px;}
    .summary-val{font-size:22px;font-weight:800;color:#1B4D33;font-family:serif;}
    .summary-lbl{font-size:11px;color:#7A9081;font-weight:600;margin-top:3px;}
    .section{margin:20px 32px;}
    .section-title{font-size:16px;font-weight:700;color:#1B4D33;margin:0 0 10px;border-bottom:1px solid #D8E6DC;padding-bottom:8px;}
    .footer{text-align:center;font-size:11px;color:#999;padding:18px 32px;border-top:1px solid #D8E6DC;margin-top:24px;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
  </style>`;

export function exportLedgerPdf(inflow, claims, funds, today, opts = {}) {
  let filteredInflow = inflow;
  if (opts.startDate) filteredInflow = filteredInflow.filter(r => r.month >= opts.startDate.slice(0, 7));
  if (opts.endDate) filteredInflow = filteredInflow.filter(r => r.month <= opts.endDate.slice(0, 7));
  const totalInflow = filteredInflow.reduce((s, r) => s + (r.annual || 0) + (r.lifetime || 0) + (r.sponsorship || 0) + (r.donation || 0), 0);
  const totalAnnual = filteredInflow.reduce((s, r) => s + (r.annual || 0), 0);
  const totalLifetime = filteredInflow.reduce((s, r) => s + (r.lifetime || 0), 0);
  const totalSponsor = filteredInflow.reduce((s, r) => s + (r.sponsorship || 0), 0);
  const totalSpend = claims.filter(c => c.status === 'disbursed').reduce((s, c) => s + c.amount, 0);
  const openClaims = claims.filter(c => c.status === 'open').reduce((s, c) => s + c.amount, 0);

  const rows = [...filteredInflow].reverse().map((r) => {
    const total = (r.annual || 0) + (r.lifetime || 0) + (r.sponsorship || 0) + (r.donation || 0);
    return `<tr>
      <td>${r.label} ${r.month?.slice(0, 4) || ''}</td>
      <td>${r.annual > 0 ? INR(r.annual) : '—'}</td>
      <td>${r.lifetime > 0 ? INR(r.lifetime) : '—'}</td>
      <td>${r.sponsorship > 0 ? INR(r.sponsorship) : '—'}</td>
      <td>${r.donation > 0 ? INR(r.donation) : '—'}</td>
      <td><b>${INR(total)}</b></td>
    </tr>`;
  }).join('');

  const claimRows = claims.filter(c => c.status === 'disbursed').map((c) => `<tr>
    <td>${c.id}</td>
    <td>${c.title}</td>
    <td>${c.raisedBy}</td>
    <td>${c.disbursedDate || ''}</td>
    <td><b>${INR(c.amount)}</b></td>
  </tr>`).join('');

  const periodStr = opts.startDate || opts.endDate ? ((opts.startDate || '') + (opts.startDate && opts.endDate ? ' to ' : '') + (opts.endDate || '')) : 'Full FY 2026–27';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attiguppe RWA — Finance Ledger</title>${BASE_STYLE}</head><body>
    ${header('Finance Ledger Report', 'Generated on ' + today + ' · ' + periodStr)}
    <div class="summary-grid">
      <div class="summary-box"><div class="summary-val">${INR(funds.available)}</div><div class="summary-lbl">Available Funds</div></div>
      <div class="summary-box"><div class="summary-val">${INR(totalInflow)}</div><div class="summary-lbl">Total Inflow</div></div>
      <div class="summary-box"><div class="summary-val">${INR(totalSpend)}</div><div class="summary-lbl">Total Disbursed</div></div>
      <div class="summary-box"><div class="summary-val">${INR(openClaims)}</div><div class="summary-lbl">Open Claims Value</div></div>
    </div>
    <div class="summary-grid" style="margin-top:0;">
      <div class="summary-box"><div class="summary-val" style="font-size:17px">${INR(totalAnnual)}</div><div class="summary-lbl">Annual Dues Collected</div></div>
      <div class="summary-box"><div class="summary-val" style="font-size:17px">${INR(totalLifetime)}</div><div class="summary-lbl">Lifetime Fees Collected</div></div>
      <div class="summary-box"><div class="summary-val" style="font-size:17px">${INR(totalSponsor)}</div><div class="summary-lbl">Sponsorship Received</div></div>
      <div class="summary-box"><div class="summary-val" style="font-size:17px">${INR(totalInflow - totalSpend)}</div><div class="summary-lbl">Net (Inflow − Spend)</div></div>
    </div>
    <div class="section">
      <div class="section-title">Inflow Ledger</div>
      <table>
        <tr><th>Month</th><th>Annual Dues</th><th>Lifetime Fees</th><th>Sponsorship</th><th>Donations</th><th>Total</th></tr>
        ${rows}
        <tr class="total-row"><td><b>Total</b></td><td></td><td></td><td></td><td></td><td><b>${INR(totalInflow)}</b></td></tr>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Disbursed Claims</div>
      <table>
        <tr><th>Claim ID</th><th>Title</th><th>Raised By</th><th>Disbursed Date</th><th>Amount</th></tr>
        ${claimRows || '<tr><td colspan="5" style="text-align:center;color:#999;">No disbursed claims yet</td></tr>'}
        <tr class="total-row"><td colspan="4"><b>Total Disbursed</b></td><td><b>${INR(totalSpend)}</b></td></tr>
      </table>
    </div>
    <div class="footer">Attiguppe Residents Welfare Association · Confidential · Printed ${today}</div>
  </body></html>`;
  printWindow(html);
}

export function exportMembersPdf(members, today, opts = {}) {
  let filtered = members;
  if (opts.memberType && opts.memberType !== 'all') filtered = filtered.filter(m => m.type === opts.memberType);
  if (opts.joinedMonth) filtered = filtered.filter(m => (m.joined || m.since || '').startsWith(opts.joinedMonth));
  const paid = filtered.filter(m => m.status === 'paid').length;
  const due = filtered.filter(m => m.status === 'due' || m.status === 'overdue').length;
  const lifetime = filtered.filter(m => m.type === 'lifetime').length;

  const rows = filtered.map((m, i) => {
    const endDate = fmtEndDatePdf(m);
    const endDateColor = m.type === 'annual' ? (() => {
      const end = computeEndDate(m);
      if (!end) return '';
      const today = new Date();
      const days = Math.ceil((end - today) / 86400000);
      return days <= 30 ? 'color:#B23F2E;font-weight:700;' : days <= 60 ? 'color:#B07A1B;font-weight:600;' : '';
    })() : '';
    return `<tr>
    <td>${i + 1}</td>
    <td><b>${m.name}</b>${m.role ? ' <span style="font-size:11px;background:#E6F1E9;color:#2C6E49;padding:1px 6px;border-radius:4px;">' + m.role + '</span>' : ''}</td>
    <td>${m.flat || '—'}</td>
    <td>${m.phone || '—'}</td>
    <td>${m.type === 'lifetime' ? 'Lifetime' : 'Annual'}</td>
    <td>${m.joined || m.since || '—'}</td>
    <td style="${endDateColor}">${m.type === 'lifetime' ? '<span style="color:#888;">Lifetime</span>' : endDate}</td>
    <td><span class="badge badge-${m.status || 'pending'}">${m.status === 'paid' ? 'Paid' : m.status === 'overdue' ? 'Overdue' : m.status === 'pending' ? 'Pending' : 'Due'}</span></td>
  </tr>`;
  }).join('');

  const filterDesc = [opts.memberType && opts.memberType !== 'all' ? opts.memberType : '', opts.joinedMonth ? 'joined ' + opts.joinedMonth : ''].filter(Boolean).join(', ');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attiguppe RWA — Member List</title>${BASE_STYLE}</head><body>
    ${header('Member Directory', 'Generated on ' + today + ' · ' + filtered.length + ' members' + (filterDesc ? ' · ' + filterDesc : ''))}
    <div class="summary-grid">
      <div class="summary-box"><div class="summary-val">${filtered.length}</div><div class="summary-lbl">Total Members</div></div>
      <div class="summary-box"><div class="summary-val" style="color:#2C7A4E;">${paid}</div><div class="summary-lbl">Paid Up</div></div>
      <div class="summary-box"><div class="summary-val" style="color:#B07A1B;">${due}</div><div class="summary-lbl">Due / Overdue</div></div>
      <div class="summary-box"><div class="summary-val" style="color:#2C6E49;">${lifetime}</div><div class="summary-lbl">Lifetime Members</div></div>
    </div>
    <div class="section">
      <div class="section-title">Member List</div>
      <table>
        <tr><th>#</th><th>Name</th><th>Flat</th><th>Phone</th><th>Type</th><th>Joined</th><th>End Date</th><th>Status</th></tr>
        ${rows}
      </table>
    </div>
    <div class="footer">Attiguppe Residents Welfare Association · Confidential · Printed ${today}</div>
  </body></html>`;
  printWindow(html);
}
