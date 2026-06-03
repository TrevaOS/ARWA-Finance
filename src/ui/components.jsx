import React, { useRef } from 'react';
import { DATA, MONTHS } from '../data.js';

const { ROLES } = DATA;

const ICON_PATHS = {
  overview: '<path d="M4 13h7V4H4zM13 20h7v-9h-7zM4 20h7v-4H4zM13 9h7V4h-7z"/>',
  claims: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M9 12h6M9 16h6"/>',
  members: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M15 20a6 6 0 0 1 6-6"/>',
  finances: '<path d="M3 6h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zM3 9h18M16 14h2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chevdown: '<path d="m6 9 6 6 6-6"/>',
  chevright: '<path d="m9 6 6 6-6 6"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  clip: '<path d="M21 11.5 12 20a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17a1.5 1.5 0 0 1-2-2l8-8"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L5 21"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',
  sparkle: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 16-9 0 9-4 16-9 16zM4 20c4-7 8-9 12-10"/>',
  road: '<path d="M6 21 9 3M18 21 15 3M12 6v2M12 12v2M12 18v2"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  cctv: '<path d="M3 7l14-3 1 4-14 3zM3 7l-1 4 4 1M5 12v5a2 2 0 0 0 2 2h3M18 8l3-1"/>',
  tool: '<path d="M14 7a4 4 0 0 1-5 5L4 17l3 3 5-5a4 4 0 0 1 5-5l-3-3z"/>',
  tag: '<path d="M3 3h7l11 11-7 7L3 10zM7 7h.01"/>',
  arrowup: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowdown: '<path d="M12 5v14M5 12l7 7 7-7"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/>',
  heart: '<path d="M12 21S4 14 4 8.5A4 4 0 0 1 12 6a4 4 0 0 1 8 2.5C20 14 12 21 12 21z"/>',
  edit: '<path d="M12 20h9M16 4l4 4L8 20H4v-4z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  rupee: '<path d="M7 4h10M7 8h10M14 4c3 6-2 8-5 8l6 8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
  receipt: '<path d="M5 3v18l3-2 2 2 2-2 2 2 2-2 3 2V3zM9 8h6M9 12h6"/>',
  swap: '<path d="M7 4v13M4 14l3 3 3-3M17 20V7M20 10l-3-3-3 3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M17.9 17.4A10 10 0 0 1 12 19c-6 0-10-7-10-7a16.7 16.7 0 0 1 4.5-5.3M6.5 6.5A10 10 0 0 1 12 5c6 0 10 7 10 7a16.8 16.8 0 0 1-2.4 3.1M3 3l18 18"/><circle cx="12" cy="12" r="3"/>',
};

export function Icon({ name, size = 20, stroke = 1.7, className = "", style }) {
  return (
    <svg className={"icon " + className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" style={style}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }} />
  );
}

export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

export function fmtShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.getDate() + " " + MONTHS[d.getMonth()];
}

export function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AV_TONES = ["av-a", "av-b", "av-c", "av-d", "av-e"];
export function avTone(name) {
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return AV_TONES[s % AV_TONES.length];
}

export function Avatar({ name, size = 34 }) {
  return (
    <span className={"avatar " + avTone(name)} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  );
}

export function Badge({ children, tone = "neutral", soft = true, icon }) {
  return (
    <span className={"badge " + tone + (soft ? " soft" : "")}>
      {icon && <Icon name={icon} size={13} stroke={2} />}
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", size = "md", icon, iconRight, onClick, type = "button", disabled, full }) {
  const variantClass = variant === "ghost" ? "btn-ghost" : variant === "soft" ? "btn-soft" : variant === "danger" ? "btn-danger" : variant === "soft-danger" ? "btn-soft-danger" : "btn-primary";
  const sizeClass = size === "sm" ? "btn-sm" : "btn-md";
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`btn ${variantClass} ${sizeClass}${full ? " btn-full" : ""}`}>
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} stroke={2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 15 : 17} stroke={2} />}
    </button>
  );
}

export function Card({ children, className = "", pad = true, onClick, style }) {
  return (
    <div className={"card " + (pad ? "card-pad " : "") + className} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, kicker, action }) {
  return (
    <div className="sec-title">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h3>{children}</h3>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, trend, trendDir, icon, accent }) {
  return (
    <Card className={"stat" + (accent ? " stat-accent" : "")}> 
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-ico"><Icon name={icon} size={17} /></span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        {trend != null && (
          <span className={"trend " + (trendDir === "down" ? "down" : "up")}>
            <Icon name={trendDir === "down" ? "arrowdown" : "arrowup"} size={13} stroke={2.4} />
            {trend}
          </span>
        )}
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </Card>
  );
}

export function claimTone(c) {
  if (c.status === "rejected") return "danger";
  if (c.status === "disbursed" || c.status === "approved") return "success";
  if (c.stageIndex >= 4) return "gold";
  return "amber";
}

export function claimStatusLabel(c) {
  if (c.status === "rejected") return "Returned";
  if (c.status === "disbursed") return "Disbursed";
  if (c.status === "approved") return "Approved";
  if (c.stageIndex >= 4) return "Final approval";
  return "In review";
}

export function Stepper({ claim, compact }) {
  return (
    <div className={"stepper" + (compact ? " stepper-compact" : "")}>
      {ROLES.map((r, i) => {
        const done = claim.approvals.some((a) => a.role === r.key) || claim.status === "disbursed" || claim.status === "approved";
        const isRejectedHere = claim.status === "rejected" && claim.rejected && claim.rejected.role === r.key;
        const active = claim.status === "open" && i === claim.stageIndex;
        let state = "todo";
        if (done) state = "done";
        if (isRejectedHere) state = "rejected";
        if (active) state = "active";
        return (
          <div className={"step st-" + state} key={r.key}>
            <span className="step-node">
              {state === "done" ? <Icon name="check" size={13} stroke={2.6} />
                : state === "rejected" ? <Icon name="x" size={13} stroke={2.6} />
                : <span className="step-num">{i + 1}</span>}
            </span>
            {!compact && <span className="step-label">{r.label}{r.final ? " ★" : ""}</span>}
            {i < ROLES.length - 1 && <span className="step-bar" />}
          </div>
        );
      })}
    </div>
  );
}

export function Donut({ data, size = 200, thickness = 26, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="donut">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const len = frac * c;
            const seg = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${c}`} strokeDashoffset={-offset}
                strokeLinecap="butt" />
            );
            offset += len;
            return seg;
          })}
        </g>
      </svg>
      <div className="donut-center">
        <div className="donut-value">{centerValue}</div>
        <div className="donut-label">{centerLabel}</div>
      </div>
    </div>
  );
}

export function StackBars({ rows, series, max, height = 170, fmt }) {
  const top = max || Math.max(...rows.map((r) => series.reduce((s, k) => s + r[k.key], 0)), 1);
  return (
    <div className="stackbars" style={{ height }}>
      {rows.map((row, i) => {
        const total = series.reduce((s, k) => s + row[k.key], 0);
        return (
          <div className="sb-col" key={i}>
            <div className="sb-stack" title={fmt ? fmt(total) : total}>
              {series.map((k) => {
                const h = (row[k.key] / top) * 100;
                if (row[k.key] <= 0) return null;
                return <div key={k.key} className="sb-seg" style={{ height: h + "%", background: k.color }} />;
              })}
            </div>
            <div className="sb-label">{row.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, children, title, sub, wide, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={"modal" + (wide ? " modal-wide" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {sub && <p className="modal-sub">{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint, required }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required && <em>*</em>}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextInput(props) { return <input className="input" {...props} />; }

export function PasswordInput({ value, onChange, placeholder, ...rest }) {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 40 }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: 'var(--ink-3)', display: 'grid', placeItems: 'center',
        }}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <Icon name={show ? 'eyeoff' : 'eye'} size={17} />
      </button>
    </div>
  );
}
export function TextArea(props) { return <textarea className="input textarea" {...props} />; }
export function Select({ children, ...rest }) {
  return (
    <div className="select-wrap">
      <select className="input select" {...rest}>{children}</select>
      <Icon name="chevdown" size={16} className="select-chev" />
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} className={"seg" + (value === o.value ? " on" : "")}
          onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={15} />}{o.label}
        </button>
      ))}
    </div>
  );
}

export function FileDrop({ label, icon = "clip", filename, onPick, onUpload }) {
  const inputRef = useRef(null);
  const handlePick = () => {
    inputRef.current?.click();
    if (onPick) onPick();
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file && onUpload) onUpload(file);
    if (file && onPick) onPick(file);
  };

  return (
    <>
      <input ref={inputRef} type="file" hidden accept="image/*" onChange={handleFile} />
      <button type="button" className={"filedrop" + (filename ? " filled" : "")} onClick={handlePick}>
        <Icon name={filename ? "check" : icon} size={18} />
        <span>{filename || label}</span>
      </button>
    </>
  );
}

export function EmptyState({ icon = "check", title, sub }) {
  return (
    <div className="empty">
      <span className="empty-ico"><Icon name={icon} size={26} /></span>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={"toast toast-" + (toast.tone || "success")}>
      <Icon name={toast.icon || "check"} size={17} stroke={2.2} />
      <span>{toast.msg}</span>
    </div>
  );
}
