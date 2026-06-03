export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const inr = (n) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const inrShort = (n) => {
  const a = Math.abs(n);
  if (a >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (a >= 100000)   return "₹" + (n / 100000).toFixed(2) + " L";
  if (a >= 1000)     return "₹" + (n / 1000).toFixed(1) + "k";
  return "₹" + Math.round(n);
};

const ROLES = [
  { key: "joint_secretary", label: "Joint Secretary", name: "Joint Secretary", short: "JS" },
  { key: "secretary",       label: "Secretary",       name: "Secretary",       short: "Sec" },
  { key: "vice_president",  label: "Vice President",  name: "Vice President",  short: "VP" },
  { key: "president",       label: "President",       name: "President",       short: "Pres" },
  { key: "treasurer",       label: "Treasurer",       name: "Treasurer",       short: "Tre", final: true },
];
const STAGE_KEYS = ROLES.map((r) => r.key);

const CATEGORIES = [
  { key: "equipment",    label: "Equipment & Gears",     icon: "tool" },
  { key: "roads",        label: "Roads",                  icon: "road" },
  { key: "garbage",      label: "Garbage",                icon: "trash" },
  { key: "surveillance", label: "Surveillance",           icon: "cctv" },
  { key: "social",       label: "Public Social Activity", icon: "leaf" },
  { key: "events",       label: "Events",                 icon: "sparkle" },
  { key: "merchandise",  label: "Merchandise",            icon: "tag" },
];
const catLabel = (k) => (CATEGORIES.find((c) => c.key === k) || {}).label || k;

export const CAT_COLORS = {
  equipment:    "#6B8F71",
  roads:        "#C2622D",
  garbage:      "#8A6D3B",
  surveillance: "#2F5D4A",
  social:       "#7FA66A",
  events:       "#B98A2E",
  merchandise:  "#9C5B4E",
};

export const CHARGES = { annual: 500, lifetime: 5000, sponsorship: null };

// Empty — all data will be created through the portal by Treva admin
export const MEMBERS = [];

export const MEMBER_STATS = {
  total: 0,
  lifetime: 0,
  annual: 0,
  newThisMonth: 0,
  duesCollected: 0,
  duesPending: 0,
  duesPaidCount: 0,
  duesDueCount: 0,
};

export const INFLOW = [];

export const SPEND = [];

export const SPONSORS = [];

export const FUNDS = {
  available: 0,
  openingFY: 0,
  totalInflowFY: 0,
  totalOutflowFY: 0,
  pendingClaimsValue: 0,
};

export const CLAIMS = [];

export const TODAY = new Date().toISOString().slice(0, 10);

export function computeEndDate(member) {
  if (member.type !== 'annual') return null;
  const base = member.renewedDate || member.joined || member.since;
  if (!base) return null;
  const d = new Date(base + 'T00:00:00');
  const today = new Date(TODAY + 'T00:00:00');
  let year = d.getFullYear();
  while (new Date(year, d.getMonth(), d.getDate()) <= today) year++;
  return new Date(year, d.getMonth(), d.getDate());
}

export function fmtEndDate(member) {
  const end = computeEndDate(member);
  if (!end) return 'Lifetime';
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return end.getDate() + ' ' + M[end.getMonth()] + ' ' + end.getFullYear();
}

export const DATA = {
  inr,
  inrShort,
  ROLES,
  STAGE_KEYS,
  CATEGORIES,
  catLabel,
  CHARGES,
  MEMBERS,
  MEMBER_STATS,
  INFLOW,
  SPEND,
  SPONSORS,
  FUNDS,
  CLAIMS,
  TODAY,
  CAT_COLORS,
  computeEndDate,
  fmtEndDate,
};

export default DATA;
