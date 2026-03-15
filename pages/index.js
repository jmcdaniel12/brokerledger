import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

// ═══════════════════════════════════════════════════════════════
//  BROKERLEDGER — Commercial Real Estate Broker P&L Tracker
// ═══════════════════════════════════════════════════════════════

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENT_YEAR = new Date().getFullYear();

const PROPERTY_TYPES = ["Office","Retail","Industrial","Multifamily","Mixed-Use","Land","Hospitality","Medical"];
const DEAL_STAGES = ["Prospecting","Listed","Under Contract","Due Diligence","Closed"];
const EXPENSE_CATEGORIES = [
  "Marketing & Advertising","MLS & Listing Fees","Travel & Auto",
  "Client Entertainment","Office Rent & Utilities","Technology & Software",
  "Professional Development","Insurance (E&O / General)","Brokerage Split / Desk Fee",
  "Administrative / VA","Photography & Staging","Legal & Compliance","Other",
];

const PIE_COLORS = [
  "#4F7CFF","#34D399","#FBBF24","#A78BFA","#22D3EE",
  "#FB7185","#F97316","#10B981","#E879F9","#6EE7B7",
  "#FCD34D","#818CF8","#94A3B8",
];

// ── Theme Definitions ──
const THEMES = {
  midnight: {
    name: "Midnight",
    emoji: "🌙",
    bg: "#0B0F1A",
    bgSecondary: "#111827",
    card: "rgba(26,32,53,0.7)",
    cardSolid: "#1A2035",
    border: "#2A3454",
    inputBg: "#0F1629",
    text: "#F1F3F9",
    textSecondary: "#8892B0",
    textMuted: "#5A6482",
    accent: "#4F7CFF",
    glow1: "rgba(79,124,255,0.07)",
    glow2: "rgba(167,139,250,0.05)",
  },
  charcoal: {
    name: "Charcoal",
    emoji: "🪨",
    bg: "#18181B",
    bgSecondary: "#1F1F23",
    card: "rgba(39,39,42,0.75)",
    cardSolid: "#27272A",
    border: "#3F3F46",
    inputBg: "#1C1C1F",
    text: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
    accent: "#A78BFA",
    glow1: "rgba(167,139,250,0.06)",
    glow2: "rgba(244,114,182,0.04)",
  },
  forest: {
    name: "Forest",
    emoji: "🌲",
    bg: "#0C1A14",
    bgSecondary: "#12261B",
    card: "rgba(18,38,27,0.75)",
    cardSolid: "#163524",
    border: "#234D35",
    inputBg: "#0E1F16",
    text: "#E8F5EE",
    textSecondary: "#7DB898",
    textMuted: "#4E8A6A",
    accent: "#34D399",
    glow1: "rgba(52,211,153,0.07)",
    glow2: "rgba(16,185,129,0.04)",
  },
  navy: {
    name: "Navy",
    emoji: "⚓",
    bg: "#0A1628",
    bgSecondary: "#0F1D32",
    card: "rgba(15,29,50,0.8)",
    cardSolid: "#142640",
    border: "#1E3A5F",
    inputBg: "#0C1825",
    text: "#E2EDFF",
    textSecondary: "#7BA3D4",
    textMuted: "#4A7AAF",
    accent: "#60A5FA",
    glow1: "rgba(96,165,250,0.07)",
    glow2: "rgba(59,130,246,0.04)",
  },
  wine: {
    name: "Wine",
    emoji: "🍷",
    bg: "#1A0C14",
    bgSecondary: "#26121E",
    card: "rgba(38,18,30,0.75)",
    cardSolid: "#321828",
    border: "#4D2A3E",
    inputBg: "#1E0E18",
    text: "#F9E8F2",
    textSecondary: "#C48AAB",
    textMuted: "#8E5A74",
    accent: "#F472B6",
    glow1: "rgba(244,114,182,0.07)",
    glow2: "rgba(236,72,153,0.04)",
  },
  slate: {
    name: "Slate",
    emoji: "🏔️",
    bg: "#151B23",
    bgSecondary: "#1C232D",
    card: "rgba(28,35,45,0.75)",
    cardSolid: "#212A36",
    border: "#33404F",
    inputBg: "#171E27",
    text: "#E8ECF1",
    textSecondary: "#8B99AB",
    textMuted: "#5E7086",
    accent: "#38BDF8",
    glow1: "rgba(56,189,248,0.06)",
    glow2: "rgba(14,165,233,0.04)",
  },
};

// ── Helpers ──
function id() { return Math.random().toString(36).substr(2, 9); }

function currency(n) {
  if (n == null) return "$0";
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? `-$${abs}` : `$${abs}`;
}
function pct(n) { return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`; }

// ── Local Storage ──
const LS_KEY = "brokerledger-data";
const LS_THEME = "brokerledger-theme";

function loadData() {
  if (typeof window === "undefined") return null;
  try { const d = localStorage.getItem(LS_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function saveData(d) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {}
}
function loadTheme() {
  if (typeof window === "undefined") return "midnight";
  try { return localStorage.getItem(LS_THEME) || "midnight"; } catch { return "midnight"; }
}
function saveTheme(t) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_THEME, t); } catch {}
}

function getInitialData() {
  return {
    deals: [],
    expenses: [],
    goals: { monthlyGCI: 50000, annualVolume: 15000000, closedDeals: 24 },
  };
}

function generateDemoData() {
  const demoDeals = [
    // ── Closed deals spread across months ──
    { id: id(), propertyName: "Parkside Office Tower", propertyType: "Office", address: "2100 3rd Ave N, Birmingham, AL 35203", salePrice: 4200000, commission: 126000, commissionRate: 3.0, stage: "Closed", closeMonth: 0, client: "Whitfield Capital Group", sqft: 42000, dealType: "Sale", notes: "Class A office, fully leased, 6.2% cap rate" },
    { id: id(), propertyName: "Magnolia Retail Center", propertyType: "Retail", address: "801 Lakeshore Pkwy, Homewood, AL 35209", salePrice: 2850000, commission: 99750, commissionRate: 3.5, stage: "Closed", closeMonth: 0, client: "Southeast Retail Partners", sqft: 18500, dealType: "Buyer Rep", notes: "Strip center, 92% occupied, NNN leases" },
    { id: id(), propertyName: "Irondale Distribution Hub", propertyType: "Industrial", address: "500 Industrial Ln, Irondale, AL 35210", salePrice: 5600000, commission: 168000, commissionRate: 3.0, stage: "Closed", closeMonth: 1, client: "Alliance Logistics LLC", sqft: 85000, dealType: "Sale", notes: "Cross-dock facility, 28ft clear height" },
    { id: id(), propertyName: "Summit Medical Plaza", propertyType: "Medical", address: "3200 Grandview Pkwy, Birmingham, AL 35243", salePrice: 3400000, commission: 119000, commissionRate: 3.5, stage: "Closed", closeMonth: 1, client: "UAB Health System", sqft: 22000, dealType: "Seller Rep", notes: "Medical office, recently renovated" },
    { id: id(), propertyName: "Riverside Lofts", propertyType: "Multifamily", address: "1440 1st Ave S, Birmingham, AL 35233", salePrice: 7200000, commission: 180000, commissionRate: 2.5, stage: "Closed", closeMonth: 2, client: "Greystone Residential", sqft: 64000, dealType: "Sale", notes: "72-unit, value-add opportunity, historic district" },
    { id: id(), propertyName: "Hoover Crossroads Shopping", propertyType: "Retail", address: "2780 John Hawkins Pkwy, Hoover, AL 35244", salePrice: 1950000, commission: 68250, commissionRate: 3.5, stage: "Closed", closeMonth: 2, client: "Brennan Retail Holdings", sqft: 12000, dealType: "Buyer Rep", notes: "Shadow-anchored by Target" },
    { id: id(), propertyName: "Tech Park Office Lease", propertyType: "Office", address: "4600 Valleydale Rd, Birmingham, AL 35242", salePrice: 890000, commission: 44500, commissionRate: 5.0, stage: "Closed", closeMonth: 3, client: "Innovate Birmingham", sqft: 8500, dealType: "Lease", notes: "5-year NNN lease, tech tenant" },
    { id: id(), propertyName: "Cahaba River Mixed-Use", propertyType: "Mixed-Use", address: "3100 Cahaba Rd, Mountain Brook, AL 35223", salePrice: 6100000, commission: 183000, commissionRate: 3.0, stage: "Closed", closeMonth: 3, client: "Cahaba Development Co", sqft: 35000, dealType: "Sale", notes: "Retail ground floor, 12 residential units above" },
    { id: id(), propertyName: "Airport Industrial Park", propertyType: "Industrial", address: "700 Airway Blvd, Birmingham, AL 35235", salePrice: 3800000, commission: 114000, commissionRate: 3.0, stage: "Closed", closeMonth: 4, client: "Birmingham Air Cargo LLC", sqft: 55000, dealType: "Sale", notes: "Near BHM airport, rail siding access" },
    { id: id(), propertyName: "Vestavia Hills MOB", propertyType: "Medical", address: "1050 Montgomery Hwy, Vestavia Hills, AL 35216", salePrice: 2200000, commission: 77000, commissionRate: 3.5, stage: "Closed", closeMonth: 4, client: "Ascension St. Vincent's", sqft: 15000, dealType: "Seller Rep", notes: "Dental/dermatology tenants, long-term leases" },
    { id: id(), propertyName: "Five Points Retail", propertyType: "Retail", address: "1101 20th St S, Birmingham, AL 35205", salePrice: 1300000, commission: 52000, commissionRate: 4.0, stage: "Closed", closeMonth: 5, client: "Five Points Ventures", sqft: 6800, dealType: "Sale", notes: "Prime Southside location, restaurant tenant" },
    { id: id(), propertyName: "Colonnade Office Sublease", propertyType: "Office", address: "3000 Colonnade Pkwy, Birmingham, AL 35243", salePrice: 420000, commission: 25200, commissionRate: 6.0, stage: "Closed", closeMonth: 5, client: "Regions Financial Corp", sqft: 4200, dealType: "Lease", notes: "3-year sublease, furnished" },

    // ── Active pipeline deals ──
    { id: id(), propertyName: "Trussville Town Center", propertyType: "Retail", address: "5950 Trussville Crossings Pkwy, Trussville, AL 35235", salePrice: 8500000, commission: 255000, commissionRate: 3.0, stage: "Under Contract", closeMonth: 6, client: "National Retail Holdings", sqft: 52000, dealType: "Sale", notes: "Grocery-anchored, 95% leased" },
    { id: id(), propertyName: "Oxmoor Industrial Campus", propertyType: "Industrial", address: "200 Oxmoor Rd, Homewood, AL 35209", salePrice: 12000000, commission: 300000, commissionRate: 2.5, stage: "Due Diligence", closeMonth: 7, client: "Prologis Southeast", sqft: 145000, dealType: "Buyer Rep", notes: "Portfolio deal — 3 buildings, phase 1 environmental cleared" },
    { id: id(), propertyName: "Highland Park Apartments", propertyType: "Multifamily", address: "2800 Highland Ave S, Birmingham, AL 35205", salePrice: 9800000, commission: 245000, commissionRate: 2.5, stage: "Under Contract", closeMonth: 7, client: "Greystar Properties", sqft: 78000, dealType: "Seller Rep", notes: "96-unit garden style, 98% occupied" },
    { id: id(), propertyName: "Lakeview Hospitality Site", propertyType: "Land", address: "2900 7th Ave S, Birmingham, AL 35233", salePrice: 3200000, commission: 128000, commissionRate: 4.0, stage: "Listed", closeMonth: 8, client: "Hilton Development", sqft: 0, dealType: "Seller Rep", notes: "2.4 acres, zoned for hotel, Lakeview entertainment district" },
    { id: id(), propertyName: "Pepper Place Creative Office", propertyType: "Office", address: "2829 2nd Ave S, Birmingham, AL 35233", salePrice: 1750000, commission: 61250, commissionRate: 3.5, stage: "Listed", closeMonth: 8, client: "Bayer Properties", sqft: 11000, dealType: "Sale", notes: "Creative/loft office in Pepper Place, fully renovated" },
    { id: id(), propertyName: "Galleria Tower Lease", propertyType: "Office", address: "3300 Riverchase Galleria, Hoover, AL 35244", salePrice: 1200000, commission: 60000, commissionRate: 5.0, stage: "Prospecting", closeMonth: 9, client: "BBVA Financial Group", sqft: 12000, dealType: "Lease", notes: "10-year lease, build-to-suit TI" },
    { id: id(), propertyName: "Avondale Brewing District", propertyType: "Mixed-Use", address: "201 41st St S, Birmingham, AL 35222", salePrice: 4500000, commission: 135000, commissionRate: 3.0, stage: "Prospecting", closeMonth: 10, client: "Avondale Partners LLC", sqft: 28000, dealType: "Sale", notes: "Brewery + retail + 8 apartments, stabilized" },
    { id: id(), propertyName: "280 Corridor Flex Space", propertyType: "Industrial", address: "4800 US-280, Birmingham, AL 35242", salePrice: 2600000, commission: 91000, commissionRate: 3.5, stage: "Prospecting", closeMonth: 11, client: "Flex Space Investors LLC", sqft: 32000, dealType: "Buyer Rep", notes: "Flex industrial / R&D, 280 corridor growth area" },
  ];

  const recurringExpenses = [
    { category: "Office Rent & Utilities", description: "Downtown office lease — 20th St", amount: 2800 },
    { category: "Technology & Software", description: "CoStar + LoopNet subscription", amount: 450 },
    { category: "Technology & Software", description: "CRM — Salesforce license", amount: 175 },
    { category: "Brokerage Split / Desk Fee", description: "SVN desk fee", amount: 500 },
    { category: "Insurance (E&O / General)", description: "E&O professional liability", amount: 320 },
    { category: "Administrative / VA", description: "Virtual assistant — transaction coordination", amount: 1200 },
    { category: "Marketing & Advertising", description: "Social media management", amount: 600 },
    { category: "Travel & Auto", description: "Auto lease + gas allowance", amount: 750 },
  ];

  const variableExpenses = [
    { category: "Marketing & Advertising", description: "Direct mail campaign — industrial", amount: 1800, months: [0,3] },
    { category: "Marketing & Advertising", description: "Birmingham Business Journal ad", amount: 2200, months: [1,4] },
    { category: "Photography & Staging", description: "Drone photography — Riverside Lofts", amount: 850, months: [1] },
    { category: "Photography & Staging", description: "Matterport 3D tour — Summit Medical", amount: 600, months: [0] },
    { category: "Client Entertainment", description: "Client dinner — Capital Grille", amount: 380, months: [0,2,4] },
    { category: "Client Entertainment", description: "BHM commercial RE roundtable", amount: 275, months: [1,3,5] },
    { category: "Professional Development", description: "CCIM Institute course — CI 101", amount: 1500, months: [2] },
    { category: "Professional Development", description: "ICSC RECon conference", amount: 2800, months: [4] },
    { category: "MLS & Listing Fees", description: "LoopNet premium listing boost", amount: 350, months: [0,1,2,3,4,5] },
    { category: "MLS & Listing Fees", description: "CREXi featured listing", amount: 200, months: [2,5] },
    { category: "Legal & Compliance", description: "Contract review — attorney", amount: 750, months: [1,3] },
    { category: "Legal & Compliance", description: "License renewal + CE credits", amount: 425, months: [5] },
    { category: "Travel & Auto", description: "Client site visits — Trussville portfolio", amount: 180, months: [3,4] },
    { category: "Photography & Staging", description: "Virtual staging — Highland Park listing", amount: 400, months: [5] },
    { category: "Marketing & Advertising", description: "Offering memorandum — print", amount: 650, months: [0,2,4] },
    { category: "Other", description: "Closing gift — crystal paperweight", amount: 120, months: [0,1,2,3,4,5] },
  ];

  const demoExpenses = [];

  // Add recurring for each month (Jan–May = months 0–5)
  for (let mo = 0; mo <= 5; mo++) {
    recurringExpenses.forEach(re => {
      demoExpenses.push({
        id: id(), category: re.category, description: re.description,
        amount: re.amount, month: mo, recurring: true,
      });
    });
  }

  // Add variable
  variableExpenses.forEach(ve => {
    ve.months.forEach(mo => {
      demoExpenses.push({
        id: id(), category: ve.category, description: ve.description,
        amount: ve.amount, month: mo, recurring: false,
      });
    });
  });

  return {
    deals: demoDeals,
    expenses: demoExpenses,
    goals: { monthlyGCI: 60000, annualVolume: 20000000, closedDeals: 30 },
  };
}

// ════════════════════════════════════════════════
//  REUSABLE COMPONENTS
// ════════════════════════════════════════════════

function StatCard({ label, value, sub, color = "blue", icon, t }) {
  const colorMap = {
    blue:   { bg: "rgba(79,124,255,0.1)",  border: "rgba(79,124,255,0.25)",  text: "#4F7CFF" },
    green:  { bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.25)",  text: "#34D399" },
    red:    { bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)", text: "#F87171" },
    amber:  { bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)",  text: "#FBBF24" },
    purple: { bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.25)", text: "#A78BFA" },
    cyan:   { bg: "rgba(34,211,238,0.1)",   border: "rgba(34,211,238,0.25)",  text: "#22D3EE" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div style={{
      background: t.card, border: `1px solid ${c.border}`, borderRadius: 14,
      padding: "20px 22px", flex: "1 1 200px", minWidth: 180,
      backdropFilter: "blur(10px)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${c.bg}`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: "-0.02em", fontFamily: "'Playfair Display', serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide, t }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.cardSolid, border: `1px solid ${t.border}`, borderRadius: 16,
        padding: "28px 32px", width: wide ? 700 : 480, maxWidth: "95vw",
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Playfair Display', serif", color: t.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textSecondary, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, t, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: t.textSecondary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      <input {...props} style={{
        width: "100%", padding: "10px 14px", background: t.inputBg,
        border: `1px solid ${t.border}`, borderRadius: 8, color: t.text,
        fontSize: 14, outline: "none", transition: "border 0.2s",
        fontFamily: "'DM Sans', sans-serif",
        ...(props.style || {}),
      }}
      onFocus={e => e.target.style.borderColor = t.accent}
      onBlur={e => e.target.style.borderColor = t.border}
      />
    </div>
  );
}

function Select({ label, options, t, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: t.textSecondary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      <select {...props} style={{
        width: "100%", padding: "10px 14px", background: t.inputBg,
        border: `1px solid ${t.border}`, borderRadius: 8, color: t.text,
        fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif",
        cursor: "pointer", ...(props.style || {}),
      }}>
        {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, variant = "primary", t, ...props }) {
  const styles = {
    primary:   { background: t?.accent || "#4F7CFF", color: "#fff", border: "none" },
    secondary: { background: "transparent", color: t?.textSecondary || "#8892B0", border: `1px solid ${t?.border || "#2A3454"}` },
    danger:    { background: "rgba(248,113,113,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)" },
    success:   { background: "rgba(52,211,153,0.15)", color: "#34D399", border: "1px solid rgba(52,211,153,0.3)" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button {...props} style={{
      ...s, padding: "10px 20px", borderRadius: 8, fontSize: 14,
      fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
      fontFamily: "'DM Sans', sans-serif", ...(props.style || {}),
    }}>{children}</button>
  );
}

function ProgressBar({ value, max, color = "#4F7CFF" }) {
  const p = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${p}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

function Tab({ tabs, active, onSelect, t }) {
  return (
    <div style={{ display: "flex", gap: 4, background: `${t.inputBg}cc`, borderRadius: 10, padding: 4, border: `1px solid ${t.border}` }}>
      {tabs.map(tb => (
        <button key={tb.key} onClick={() => onSelect(tb.key)} style={{
          padding: "8px 18px", borderRadius: 8, border: "none",
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          background: active === tb.key ? t.accent : "transparent",
          color: active === tb.key ? "#fff" : t.textSecondary,
          transition: "all 0.2s",
        }}>{tb.label}</button>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1A2035", border: "1px solid #2A3454", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#F1F3F9" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span>{p.name}: ${Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Inline Editable Goal ──
function EditableGoal({ label, value, onChange, format = "currency", color = "#4F7CFF", t }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => { setDraft(String(value)); }, [value]);

  function commit() {
    setEditing(false);
    const num = Number(draft.replace(/[^0-9.-]/g, "")) || 0;
    if (num !== value) onChange(num);
  }

  const display = format === "currency" ? currency(value) : String(value);

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(String(value)); setEditing(false); } }}
        style={{
          background: t.inputBg, border: `1px solid ${t.accent}`, borderRadius: 6,
          color: color, fontSize: 14, fontWeight: 700, padding: "4px 8px",
          width: 130, outline: "none", fontFamily: "'DM Sans', sans-serif",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit goal"
      style={{
        color: color, fontWeight: 700, fontSize: 14, cursor: "pointer",
        borderBottom: `1px dashed ${color}55`, paddingBottom: 1,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderBottomColor = color}
      onMouseLeave={e => e.currentTarget.style.borderBottomColor = `${color}55`}
    >
      {display}
    </span>
  );
}


// ════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════

export default function Home() {
  const [data, setData] = useState(getInitialData);
  const [themeKey, setThemeKey] = useState("midnight");
  const [view, setView] = useState("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showDealModal, setShowDealModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const t = THEMES[themeKey] || THEMES.midnight;

  function loadDemo() {
    setData(generateDemoData());
    setIsDemo(true);
    setSelectedMonth(3); // April — good mid-year view with data
    setView("dashboard");
  }

  function clearDemo() {
    setData(getInitialData());
    setIsDemo(false);
    setSelectedMonth(new Date().getMonth());
  }

  // ── Load persisted data ──
  useEffect(() => {
    const saved = loadData();
    if (saved) {
      setData(prev => ({ ...prev, ...saved }));
      // Check if it looks like demo data is loaded
      if (saved.deals && saved.deals.length > 0 && saved.deals.some(d => d.propertyName === "Parkside Office Tower")) {
        setIsDemo(true);
      }
    }
    setThemeKey(loadTheme());
    setLoaded(true);
  }, []);

  // ── Save on change ──
  useEffect(() => { if (loaded) saveData(data); }, [data, loaded]);
  useEffect(() => { if (loaded) saveTheme(themeKey); }, [themeKey, loaded]);

  // ── Metrics ──
  const m = useMemo(() => {
    const monthDeals   = data.deals.filter(d => d.closeMonth === selectedMonth && d.stage === "Closed");
    const monthExps    = data.expenses.filter(e => e.month === selectedMonth);
    const allClosed    = data.deals.filter(d => d.stage === "Closed");

    const mGCI  = monthDeals.reduce((s, d) => s + (d.commission || 0), 0);
    const mExp  = monthExps.reduce((s, e) => s + (e.amount || 0), 0);
    const mNet  = mGCI - mExp;
    const mVol  = monthDeals.reduce((s, d) => s + (d.salePrice || 0), 0);

    const yGCI  = allClosed.reduce((s, d) => s + (d.commission || 0), 0);
    const yExp  = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const yNet  = yGCI - yExp;
    const yVol  = allClosed.reduce((s, d) => s + (d.salePrice || 0), 0);
    const yCnt  = allClosed.length;

    const chart = MONTHS.map((name, i) => {
      const md = data.deals.filter(d => d.closeMonth === i && d.stage === "Closed");
      const me = data.expenses.filter(e => e.month === i);
      const gci = md.reduce((s, d) => s + (d.commission || 0), 0);
      const exp = me.reduce((s, e) => s + (e.amount || 0), 0);
      return { name, GCI: gci, Expenses: exp, Net: gci - exp };
    });

    const expByCat = {};
    monthExps.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; });
    const expPie = Object.entries(expByCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const volByType = {};
    allClosed.forEach(d => { volByType[d.propertyType] = (volByType[d.propertyType] || 0) + (d.salePrice || 0); });
    const volPie = Object.entries(volByType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const pipeline = {};
    DEAL_STAGES.forEach(s => { pipeline[s] = data.deals.filter(d => d.stage === s); });

    const avgRate = yVol > 0 ? (yGCI / yVol) * 100 : 0;
    const avgDeal = yCnt > 0 ? yVol / yCnt : 0;

    const prev = selectedMonth > 0 ? selectedMonth - 1 : 11;
    const pGCI = data.deals.filter(d => d.closeMonth === prev && d.stage === "Closed").reduce((s, d) => s + (d.commission || 0), 0);
    const gciChg = pGCI > 0 ? ((mGCI - pGCI) / pGCI) * 100 : 0;

    return {
      mGCI, mExp, mNet, mVol, monthDeals, monthExps,
      yGCI, yExp, yNet, yVol, yCnt,
      chart, expPie, volPie, pipeline,
      avgRate, avgDeal, gciChg,
    };
  }, [data, selectedMonth]);

  // ── Deal form ──
  const emptyDeal = { id:"", propertyName:"", propertyType:"Office", address:"", salePrice:"", commission:"", commissionRate:"", stage:"Prospecting", closeMonth: selectedMonth, client:"", sqft:"", notes:"", dealType:"Sale" };
  const [dealForm, setDealForm] = useState(emptyDeal);

  function openDeal(deal) {
    if (deal) { setDealForm({ ...deal }); setEditingDeal(deal.id); }
    else { setDealForm({ ...emptyDeal, id: id(), closeMonth: selectedMonth }); setEditingDeal(null); }
    setShowDealModal(true);
  }
  function saveDeal() {
    const d = { ...dealForm, salePrice: Number(dealForm.salePrice)||0, commission: Number(dealForm.commission)||0, commissionRate: Number(dealForm.commissionRate)||0, sqft: Number(dealForm.sqft)||0 };
    setData(prev => editingDeal
      ? { ...prev, deals: prev.deals.map(x => x.id === editingDeal ? d : x) }
      : { ...prev, deals: [...prev.deals, d] }
    );
    setShowDealModal(false);
  }
  function deleteDeal(did) { setData(prev => ({ ...prev, deals: prev.deals.filter(d => d.id !== did) })); setShowDealModal(false); }
  function updateDealField(field, value) {
    setDealForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "commissionRate" && next.salePrice) next.commission = Math.round((Number(value)/100)*Number(next.salePrice));
      if (field === "salePrice" && next.commissionRate) next.commission = Math.round((Number(next.commissionRate)/100)*Number(value));
      return next;
    });
  }

  // ── Expense form ──
  const emptyExp = { id:"", category: EXPENSE_CATEGORIES[0], description:"", amount:"", month: selectedMonth, recurring: false };
  const [expForm, setExpForm] = useState(emptyExp);

  function openExp(exp) {
    if (exp) { setExpForm({ ...exp }); setEditingExpense(exp.id); }
    else { setExpForm({ ...emptyExp, id: id(), month: selectedMonth }); setEditingExpense(null); }
    setShowExpenseModal(true);
  }
  function saveExp() {
    const e = { ...expForm, amount: Number(expForm.amount)||0 };
    setData(prev => editingExpense
      ? { ...prev, expenses: prev.expenses.map(x => x.id === editingExpense ? e : x) }
      : { ...prev, expenses: [...prev.expenses, e] }
    );
    setShowExpenseModal(false);
  }
  function deleteExp(eid) { setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== eid) })); setShowExpenseModal(false); }

  // ── Goals ──
  function updateGoal(field, value) {
    setData(prev => ({ ...prev, goals: { ...prev.goals, [field]: value } }));
  }

  function resetAllData() {
    if (confirm("Are you sure? This deletes ALL deals, expenses, and goals permanently.")) {
      setData(getInitialData());
      setIsDemo(false);
    }
  }

  const stageColors = { Prospecting:"#FBBF24", Listed:"#4F7CFF", "Under Contract":"#A78BFA", "Due Diligence":"#22D3EE", Closed:"#34D399" };

  // ════════════ RENDER ════════════

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: t.bg, color: t.text, transition: "background 0.4s, color 0.4s" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", transition: "all 0.4s" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${t.glow1} 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${t.glow2} 0%, transparent 70%)` }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ═══ HEADER ═══ */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 28px", borderBottom: `1px solid ${t.border}`,
          backdropFilter: "blur(20px)", background: `${t.bg}dd`,
          position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🏢</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>
                Broker<span style={{ color: t.accent }}>Ledger</span>
              </div>
              <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Commercial Real Estate P&L</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Theme Picker */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowThemePicker(p => !p)} style={{
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: "8px 14px", color: t.text, cursor: "pointer", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
              }}>
                {t.emoji} Theme
              </button>
              {showThemePicker && (
                <div style={{
                  position: "absolute", top: "110%", right: 0, background: t.cardSolid,
                  border: `1px solid ${t.border}`, borderRadius: 12, padding: 8,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.4)", zIndex: 200, minWidth: 180,
                }}>
                  {Object.entries(THEMES).map(([key, theme]) => (
                    <button key={key} onClick={() => { setThemeKey(key); setShowThemePicker(false); }} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "10px 12px", border: "none", borderRadius: 8, cursor: "pointer",
                      background: themeKey === key ? `${theme.accent}22` : "transparent",
                      color: t.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (themeKey !== key) e.currentTarget.style.background = `${t.border}44`; }}
                    onMouseLeave={e => { if (themeKey !== key) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 18 }}>{theme.emoji}</span>
                      <span style={{ fontWeight: themeKey === key ? 600 : 400 }}>{theme.name}</span>
                      {themeKey === key && <span style={{ marginLeft: "auto", color: theme.accent }}>✓</span>}
                      <span style={{ marginLeft: themeKey === key ? 0 : "auto", width: 14, height: 14, borderRadius: "50%", background: theme.bg, border: `2px solid ${theme.accent}`, flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Month Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "6px 12px" }}>
              <button onClick={() => setSelectedMonth(p => p > 0 ? p-1 : 11)} style={{ background: "none", border: "none", color: t.textSecondary, fontSize: 16, cursor: "pointer", padding: "2px 6px" }}>◀</button>
              <span style={{ fontWeight: 600, fontSize: 14, minWidth: 80, textAlign: "center" }}>{MONTHS[selectedMonth]} {CURRENT_YEAR}</span>
              <button onClick={() => setSelectedMonth(p => p < 11 ? p+1 : 0)} style={{ background: "none", border: "none", color: t.textSecondary, fontSize: 16, cursor: "pointer", padding: "2px 6px" }}>▶</button>
            </div>

            <Tab tabs={[
              { key: "dashboard", label: "Dashboard" },
              { key: "deals", label: "Deals" },
              { key: "expenses", label: "Expenses" },
              { key: "pipeline", label: "Pipeline" },
              { key: "settings", label: "⚙️" },
            ]} active={view} onSelect={setView} t={t} />
          </div>
        </header>

        {/* ═══ DEMO BANNER ═══ */}
        {isDemo && (
          <div style={{
            background: `linear-gradient(90deg, ${t.accent}22, ${t.accent}08)`,
            borderBottom: `1px solid ${t.accent}33`,
            padding: "10px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🎭</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.accent }}>DEMO MODE</span>
              <span style={{ fontSize: 13, color: t.textSecondary }}>— Showing sample Birmingham CRE broker data. All data is fictional.</span>
            </div>
            <button onClick={clearDemo} style={{
              background: "rgba(248,113,113,0.15)", color: "#F87171",
              border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6,
              padding: "5px 14px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>Exit Demo</button>
          </div>
        )}

        <main style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

          {/* ═══ EMPTY STATE — Show when no data and not in demo ═══ */}
          {!isDemo && data.deals.length === 0 && data.expenses.length === 0 && view === "dashboard" && (
            <div style={{
              textAlign: "center", padding: "60px 20px", marginBottom: 24,
              background: `linear-gradient(135deg, ${t.card}, ${t.accent}08)`,
              border: `1px dashed ${t.accent}44`, borderRadius: 16,
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🏢</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
                Welcome to Broker<span style={{ color: t.accent }}>Ledger</span>
              </h2>
              <p style={{ color: t.textSecondary, fontSize: 15, maxWidth: 500, margin: "0 auto 24px", lineHeight: 1.6 }}>
                Track your commercial real estate deals, commissions, expenses, and pipeline — all in one place.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={loadDemo} style={{
                  background: t.accent, color: "#fff", border: "none",
                  borderRadius: 10, padding: "14px 28px", fontSize: 15,
                  fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  boxShadow: `0 4px 20px ${t.accent}44`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${t.accent}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 20px ${t.accent}44`; }}
                >
                  🎭 Load Demo Data
                </button>
                <button onClick={() => openDeal(null)} style={{
                  background: "transparent", color: t.text, border: `1px solid ${t.border}`,
                  borderRadius: 10, padding: "14px 28px", fontSize: 15,
                  fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
                >
                  + Add Your First Deal
                </button>
              </div>
              <p style={{ color: t.textMuted, fontSize: 12, marginTop: 16 }}>
                Demo loads 20 realistic deals, 6 months of expenses, and pre-set goals
              </p>
            </div>
          )}

          {/* ═══════════ DASHBOARD ═══════════ */}
          {view === "dashboard" && (
            <div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                <StatCard t={t} icon="💰" label="Monthly GCI" value={currency(m.mGCI)} sub={m.gciChg !== 0 ? `${pct(m.gciChg)} vs prev month` : "No prior data"} color={m.mGCI >= data.goals.monthlyGCI ? "green" : "blue"} />
                <StatCard t={t} icon="📉" label="Monthly Expenses" value={currency(m.mExp)} color="red" />
                <StatCard t={t} icon="📊" label="Net Income" value={currency(m.mNet)} color={m.mNet >= 0 ? "green" : "red"} sub={m.mGCI > 0 ? `${((m.mNet / m.mGCI)*100).toFixed(0)}% margin` : ""} />
                <StatCard t={t} icon="🏗️" label="Monthly Volume" value={currency(m.mVol)} color="purple" sub={`${m.monthDeals.length} closed`} />
                <StatCard t={t} icon="📈" label="YTD GCI" value={currency(m.yGCI)} color="cyan" sub={`${m.yCnt} deals closed`} />
              </div>

              {/* ── EDITABLE GOAL PROGRESS ── */}
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>🎯 Annual Goal Progress</h3>
                  <span style={{ fontSize: 11, color: t.textMuted, fontStyle: "italic" }}>Click goal values to edit</span>
                </div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {/* GCI Goal */}
                  <div style={{ flex: "1 1 220px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>
                      <span>GCI ({currency(m.yGCI)})</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Goal:
                        <EditableGoal
                          t={t}
                          value={data.goals.monthlyGCI * 12}
                          onChange={v => updateGoal("monthlyGCI", Math.round(v / 12))}
                          color="#4F7CFF"
                        />
                      </span>
                    </div>
                    <ProgressBar value={m.yGCI} max={data.goals.monthlyGCI * 12} color="#4F7CFF" />
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                      {((m.yGCI / (data.goals.monthlyGCI * 12)) * 100).toFixed(1)}% achieved
                    </div>
                  </div>
                  {/* Volume Goal */}
                  <div style={{ flex: "1 1 220px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>
                      <span>Volume ({currency(m.yVol)})</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Goal:
                        <EditableGoal
                          t={t}
                          value={data.goals.annualVolume}
                          onChange={v => updateGoal("annualVolume", v)}
                          color="#A78BFA"
                        />
                      </span>
                    </div>
                    <ProgressBar value={m.yVol} max={data.goals.annualVolume} color="#A78BFA" />
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                      {data.goals.annualVolume > 0 ? ((m.yVol / data.goals.annualVolume) * 100).toFixed(1) : 0}% achieved
                    </div>
                  </div>
                  {/* Deals Goal */}
                  <div style={{ flex: "1 1 220px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>
                      <span>Deals Closed ({m.yCnt})</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Goal:
                        <EditableGoal
                          t={t}
                          value={data.goals.closedDeals}
                          onChange={v => updateGoal("closedDeals", v)}
                          format="number"
                          color="#34D399"
                        />
                      </span>
                    </div>
                    <ProgressBar value={m.yCnt} max={data.goals.closedDeals} color="#34D399" />
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                      {data.goals.closedDeals > 0 ? ((m.yCnt / data.goals.closedDeals) * 100).toFixed(1) : 0}% achieved
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ flex: "2 1 400px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px 20px 10px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly GCI vs Expenses</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={m.chart} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${t.border}66`} />
                      <XAxis dataKey="name" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="GCI" fill="#4F7CFF" radius={[4,4,0,0]} />
                      <Bar dataKey="Expenses" fill="#F87171" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: "1 1 300px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px 20px 10px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Net Income Trend</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={m.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${t.border}66`} />
                      <XAxis dataKey="name" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="Net" stroke="#34D399" strokeWidth={2.5} dot={{ fill: "#34D399", r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Row */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {/* Expense Pie */}
                <div style={{ flex: "1 1 280px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Expense Breakdown — {MONTHS[selectedMonth]}</h3>
                  {m.expPie.length === 0
                    ? <div style={{ textAlign: "center", color: t.textMuted, padding: 40, fontSize: 13 }}>No expenses for {MONTHS[selectedMonth]}</div>
                    : <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={m.expPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2}>
                          {m.expPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie><Tooltip formatter={v => currency(v)} contentStyle={{ background: "#1A2035", border: "1px solid #2A3454", borderRadius: 8, fontSize: 12 }} /></PieChart>
                      </ResponsiveContainer>
                  }
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {m.expPie.slice(0,5).map((e, i) => (
                      <span key={e.name} style={{ fontSize: 11, color: t.textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], display: "inline-block" }} /> {e.name}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Volume Pie */}
                <div style={{ flex: "1 1 280px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Volume by Property Type</h3>
                  {m.volPie.length === 0
                    ? <div style={{ textAlign: "center", color: t.textMuted, padding: 40, fontSize: 13 }}>No closed deals yet</div>
                    : <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={m.volPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2}>
                          {m.volPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i+4) % PIE_COLORS.length]} />)}
                        </Pie><Tooltip formatter={v => currency(v)} contentStyle={{ background: "#1A2035", border: "1px solid #2A3454", borderRadius: 8, fontSize: 12 }} /></PieChart>
                      </ResponsiveContainer>
                  }
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {m.volPie.slice(0,5).map((e, i) => (
                      <span key={e.name} style={{ fontSize: 11, color: t.textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[(i+4) % PIE_COLORS.length], display: "inline-block" }} /> {e.name}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Key Metrics */}
                <div style={{ flex: "1 1 220px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Metrics</h3>
                  {[
                    { label: "Avg Commission Rate", value: `${m.avgRate.toFixed(2)}%`, icon: "📐" },
                    { label: "Avg Deal Size", value: currency(m.avgDeal), icon: "📏" },
                    { label: "Active Pipeline", value: `${data.deals.filter(d => d.stage !== "Closed").length} deals`, icon: "🔄" },
                    { label: "Pipeline Value", value: currency(data.deals.filter(d => d.stage !== "Closed").reduce((s, d) => s + (d.salePrice||0), 0)), icon: "💎" },
                    { label: "YTD Profit Margin", value: m.yGCI > 0 ? `${((m.yNet / m.yGCI)*100).toFixed(0)}%` : "—", icon: "🎯" },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${t.border}44` }}>
                      <span style={{ fontSize: 13, color: t.textSecondary }}>{item.icon} {item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
                <Btn t={t} onClick={() => openDeal(null)}>+ Add Deal</Btn>
                <Btn t={t} variant="secondary" onClick={() => openExp(null)}>+ Add Expense</Btn>
              </div>
            </div>
          )}

          {/* ═══════════ DEALS ═══════════ */}
          {view === "deals" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600 }}>Deals & Transactions</h2>
                <Btn t={t} onClick={() => openDeal(null)}>+ New Deal</Btn>
              </div>
              {data.deals.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: t.textMuted }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
                  <div style={{ fontSize: 16 }}>No deals yet. Add your first deal to start tracking.</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                    <thead>
                      <tr style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {["Property","Type","Deal","Sale Price","Commission","Stage","Month",""].map(h => (
                          <th key={h} style={{ textAlign: h === "Sale Price" || h === "Commission" ? "right" : "left", padding: "8px 12px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.deals.sort((a,b) => a.closeMonth - b.closeMonth).map(d => (
                        <tr key={d.id} style={{ background: t.card }}>
                          <td style={{ padding: 12, borderRadius: "8px 0 0 8px", fontWeight: 500 }}>{d.propertyName || "—"}</td>
                          <td style={{ padding: 12, fontSize: 13, color: t.textSecondary }}>{d.propertyType}</td>
                          <td style={{ padding: 12, fontSize: 13, color: t.textSecondary }}>{d.dealType || "Sale"}</td>
                          <td style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>{currency(d.salePrice)}</td>
                          <td style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#34D399" }}>{currency(d.commission)}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: `${stageColors[d.stage]}22`, color: stageColors[d.stage] }}>{d.stage}</span>
                          </td>
                          <td style={{ padding: 12, fontSize: 13, color: t.textSecondary }}>{MONTHS[d.closeMonth]}</td>
                          <td style={{ padding: 12, textAlign: "center", borderRadius: "0 8px 8px 0" }}>
                            <button onClick={() => openDeal(d)} style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ EXPENSES ═══════════ */}
          {view === "expenses" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600 }}>Expenses — {MONTHS[selectedMonth]} {CURRENT_YEAR}</h2>
                <Btn t={t} onClick={() => openExp(null)}>+ Add Expense</Btn>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
                <StatCard t={t} icon="💸" label="Total Expenses" value={currency(m.mExp)} color="red" />
                <StatCard t={t} icon="💰" label="GCI This Month" value={currency(m.mGCI)} color="green" />
                <StatCard t={t} icon="📊" label="Expense Ratio" value={m.mGCI > 0 ? `${((m.mExp / m.mGCI)*100).toFixed(0)}%` : "—"} color="amber" sub="of GCI" />
              </div>
              {m.monthExps.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: t.textMuted }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                  <div>No expenses for {MONTHS[selectedMonth]}.</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                    <thead>
                      <tr style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {["Category","Description","Amount","Recurring",""].map(h => (
                          <th key={h} style={{ textAlign: h === "Amount" ? "right" : h === "Recurring" || h === "" ? "center" : "left", padding: "8px 12px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.expenses.filter(e => e.month === selectedMonth).map(e => (
                        <tr key={e.id} style={{ background: t.card }}>
                          <td style={{ padding: 12, borderRadius: "8px 0 0 8px", fontWeight: 500, fontSize: 13 }}>{e.category}</td>
                          <td style={{ padding: 12, color: t.textSecondary, fontSize: 13 }}>{e.description || "—"}</td>
                          <td style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#F87171" }}>{currency(e.amount)}</td>
                          <td style={{ padding: 12, textAlign: "center", fontSize: 13, color: t.textSecondary }}>{e.recurring ? "✓" : "—"}</td>
                          <td style={{ padding: 12, textAlign: "center", borderRadius: "0 8px 8px 0" }}>
                            <button onClick={() => openExp(e)} style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ PIPELINE ═══════════ */}
          {view === "pipeline" && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Deal Pipeline</h2>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
                {DEAL_STAGES.map(stage => {
                  const deals = m.pipeline[stage] || [];
                  const c = stageColors[stage];
                  return (
                    <div key={stage} style={{ flex: "1 0 220px", minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                        <span style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage}</span>
                        <span style={{ fontSize: 11, color: t.textMuted, marginLeft: "auto" }}>{deals.length}</span>
                      </div>
                      <div style={{ background: `${t.card}`, borderRadius: 12, padding: 8, minHeight: 200, border: `1px solid ${c}22` }}>
                        {deals.length === 0
                          ? <div style={{ textAlign: "center", color: t.textMuted, fontSize: 12, padding: 20 }}>No deals</div>
                          : deals.map(d => (
                            <div key={d.id} onClick={() => openDeal(d)} style={{
                              background: t.cardSolid, border: `1px solid ${t.border}`, borderRadius: 10,
                              padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                              transition: "border-color 0.2s", borderLeft: `3px solid ${c}`,
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = c}
                            onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
                            >
                              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{d.propertyName || "Unnamed"}</div>
                              <div style={{ fontSize: 11, color: t.textSecondary }}>{d.propertyType} · {d.dealType || "Sale"}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: c, marginTop: 6 }}>{currency(d.salePrice)}</div>
                              {d.client && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>👤 {d.client}</div>}
                            </div>
                          ))
                        }
                      </div>
                      <div style={{ fontSize: 11, color: t.textMuted, textAlign: "center", marginTop: 8 }}>
                        {currency(deals.reduce((s, d) => s + (d.salePrice||0), 0))} total
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ SETTINGS ═══════════ */}
          {view === "settings" && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Settings & Goals</h2>

              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Annual Goals</h3>
                <Input t={t} label="Monthly GCI Target ($)" type="number" value={data.goals.monthlyGCI} onChange={e => updateGoal("monthlyGCI", Number(e.target.value)||0)} />
                <Input t={t} label="Annual Volume Target ($)" type="number" value={data.goals.annualVolume} onChange={e => updateGoal("annualVolume", Number(e.target.value)||0)} />
                <Input t={t} label="Deals Closed Target" type="number" value={data.goals.closedDeals} onChange={e => updateGoal("closedDeals", Number(e.target.value)||0)} />
              </div>

              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Theme</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                  {Object.entries(THEMES).map(([key, theme]) => (
                    <button key={key} onClick={() => setThemeKey(key)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
                      borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                      border: themeKey === key ? `2px solid ${theme.accent}` : `1px solid ${t.border}`,
                      background: themeKey === key ? `${theme.accent}15` : t.inputBg,
                      color: t.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    }}>
                      <span style={{ fontSize: 18 }}>{theme.emoji}</span>
                      <span style={{ fontWeight: themeKey === key ? 600 : 400 }}>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: `${t.accent}08`, border: `1px solid ${t.accent}22`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: t.accent, marginBottom: 8 }}>🎭 Demo Mode</h3>
                <p style={{ fontSize: 13, color: t.textSecondary, marginBottom: 16 }}>
                  {isDemo
                    ? "Demo data is currently loaded. Exit demo to start fresh with your own data."
                    : "Load sample data to explore the app with realistic Birmingham CRE broker data — 20 deals, 6 months of expenses, and pipeline activity."
                  }
                </p>
                {isDemo
                  ? <Btn t={t} variant="secondary" onClick={clearDemo}>Exit Demo Mode</Btn>
                  : <Btn t={t} onClick={loadDemo}>🎭 Load Demo Data</Btn>
                }
              </div>

              <div style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 14, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#F87171", marginBottom: 8 }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: t.textSecondary, marginBottom: 16 }}>Permanently delete all deals, expenses, and goals.</p>
                <Btn t={t} variant="danger" onClick={resetAllData}>Reset All Data</Btn>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═══════════ DEAL MODAL ═══════════ */}
      <Modal open={showDealModal} onClose={() => setShowDealModal(false)} title={editingDeal ? "Edit Deal" : "New Deal"} wide t={t}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input t={t} label="Property Name" value={dealForm.propertyName} onChange={e => setDealForm(p => ({ ...p, propertyName: e.target.value }))} placeholder="e.g. Parkside Office Tower" />
          <Input t={t} label="Client / Contact" value={dealForm.client} onChange={e => setDealForm(p => ({ ...p, client: e.target.value }))} placeholder="Company or person" />
          <div style={{ gridColumn: "1 / -1" }}>
            <Input t={t} label="Address" value={dealForm.address} onChange={e => setDealForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" />
          </div>
          <Select t={t} label="Property Type" options={PROPERTY_TYPES} value={dealForm.propertyType} onChange={e => setDealForm(p => ({ ...p, propertyType: e.target.value }))} />
          <Select t={t} label="Deal Type" options={["Sale","Lease","Sale-Leaseback","1031 Exchange","Buyer Rep","Seller Rep"]} value={dealForm.dealType||"Sale"} onChange={e => setDealForm(p => ({ ...p, dealType: e.target.value }))} />
          <Input t={t} label="Sale / Lease Price ($)" type="number" value={dealForm.salePrice} onChange={e => updateDealField("salePrice", e.target.value)} placeholder="0" />
          <Input t={t} label="Commission Rate (%)" type="number" step="0.1" value={dealForm.commissionRate} onChange={e => updateDealField("commissionRate", e.target.value)} placeholder="e.g. 3.0" />
          <Input t={t} label="Commission ($)" type="number" value={dealForm.commission} onChange={e => setDealForm(p => ({ ...p, commission: e.target.value }))} />
          <Input t={t} label="Square Footage" type="number" value={dealForm.sqft} onChange={e => setDealForm(p => ({ ...p, sqft: e.target.value }))} placeholder="0" />
          <Select t={t} label="Stage" options={DEAL_STAGES} value={dealForm.stage} onChange={e => setDealForm(p => ({ ...p, stage: e.target.value }))} />
          <Select t={t} label="Close / Target Month" options={MONTHS.map((mo, i) => ({ label: mo, value: i }))} value={dealForm.closeMonth} onChange={e => setDealForm(p => ({ ...p, closeMonth: Number(e.target.value) }))} />
        </div>
        <Input t={t} label="Notes" value={dealForm.notes||""} onChange={e => setDealForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional details..." />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <div>{editingDeal && <Btn t={t} variant="danger" onClick={() => deleteDeal(editingDeal)}>Delete</Btn>}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn t={t} variant="secondary" onClick={() => setShowDealModal(false)}>Cancel</Btn>
            <Btn t={t} onClick={saveDeal}>Save Deal</Btn>
          </div>
        </div>
      </Modal>

      {/* ═══════════ EXPENSE MODAL ═══════════ */}
      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title={editingExpense ? "Edit Expense" : "New Expense"} t={t}>
        <Select t={t} label="Category" options={EXPENSE_CATEGORIES} value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))} />
        <Input t={t} label="Description" value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. CoStar subscription" />
        <Input t={t} label="Amount ($)" type="number" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
        <Select t={t} label="Month" options={MONTHS.map((mo, i) => ({ label: mo, value: i }))} value={expForm.month} onChange={e => setExpForm(p => ({ ...p, month: Number(e.target.value) }))} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.textSecondary, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={expForm.recurring} onChange={e => setExpForm(p => ({ ...p, recurring: e.target.checked }))} />
          Recurring monthly expense
        </label>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <div>{editingExpense && <Btn t={t} variant="danger" onClick={() => deleteExp(editingExpense)}>Delete</Btn>}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn t={t} variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Btn>
            <Btn t={t} onClick={saveExp}>Save Expense</Btn>
          </div>
        </div>
      </Modal>

      {/* Global styles */}
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${t.bg}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
        select { cursor: pointer; }
        table td { font-size: 13px; }
      `}</style>
    </div>
  );
}
