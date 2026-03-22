import React, { useState, useEffect, useRef, createContext, useContext } from "react";

const API = "http://localhost:8000/api";
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Unknown error" })); throw new Error(err.detail || "Request failed"); }
  return res.status === 204 ? null : res.json();
}
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// ── Helpers ──────────────────────────────────────────────────────────────────
const sentimentColor = (s) => s === "Positive" ? "#059669" : s === "Negative" ? "#e11d48" : "#d97706";
const sentimentGlow  = (s) => s === "Positive" ? "rgba(5,150,105,0.3)" : s === "Negative" ? "rgba(225,29,72,0.3)" : "rgba(217,119,6,0.3)";
const sentimentBg    = (s) => s === "Positive" ? "rgba(5,150,105,0.12)" : s === "Negative" ? "rgba(225,29,72,0.12)" : "rgba(217,119,6,0.12)";
const statusColor    = { pending: "#d97706", processing: "#7c3aed", completed: "#059669", failed: "#e11d48" };
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const PC = ["#7c3aed","#0891b2","#d97706","#e11d48","#059669","#db2777","#ea580c","#0284c7","#65a30d","#9333ea"];

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const d = {
    home:      <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    upload:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    list:      <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    chart:     <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    check:     <><polyline points="20 6 9 17 4 12"/></>,
    alert:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    brain:     <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/></>,
    x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    refresh:   <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.21"/></>,
    file:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    zap:       <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    mic:       <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    micOff:    <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    stop:      <><rect x="3" y="3" width="18" height="18" rx="2"/></>,
    play:      <><polygon points="5 3 19 12 5 21 5 3"/></>,
    save:      <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    star:      <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    download:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    tag:       <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    filter:    <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    copy:      <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d[name]}
    </svg>
  );
};

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 22, color = "#7c3aed" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="40" strokeLinecap="round"/></svg>;
}

// ── Glass card ────────────────────────────────────────────────────────────────
function Glass({ children, style = {}, className = "" }) {
  return (
    <div className={`glass ${className}`} style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 8px 32px rgba(100,80,200,0.10), 0 1.5px 8px rgba(255,255,255,0.5) inset", ...style }}>
      {children}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, []);
  const col = type === "error" ? "#e11d48" : type === "success" ? "#059669" : "#7c3aed";
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: `1.5px solid ${col}40`, borderLeft: `4px solid ${col}`, color: "#1e1b4b", padding: "14px 18px", borderRadius: 16, boxShadow: `0 8px 40px ${col}25, 0 2px 8px rgba(0,0,0,0.08)`, display: "flex", gap: 12, alignItems: "center", maxWidth: 380, animation: "slideUp 0.35s cubic-bezier(.175,.885,.32,1.275)" }}>
      <Icon name={type === "error" ? "alert" : "check"} size={16} color={col}/>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", color: "#94a3b8" }}><Icon name="x" size={14}/></button>
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────
function DonutChart({ data, size = 130 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = -90;
  const cx = size / 2, cy = size / 2, r = size * 0.38, inn = size * 0.24;
  const toXY = (deg, rad) => ({ x: cx + rad * Math.cos(deg * Math.PI / 180), y: cy + rad * Math.sin(deg * Math.PI / 180) });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {data.map((d, i) => <radialGradient key={i} id={`dg${i}`} cx="50%" cy="50%"><stop offset="0%" stopColor={d.color} stopOpacity="1"/><stop offset="100%" stopColor={d.color} stopOpacity="0.7"/></radialGradient>)}
      </defs>
      {data.map((d, i) => {
        if (!d.value) return null;
        const pct = d.value / total, angle = pct * 360;
        const s1 = toXY(cum, r), e1 = toXY(cum + angle - 0.5, r);
        const s2 = toXY(cum, inn), e2 = toXY(cum + angle - 0.5, inn);
        const large = angle > 180 ? 1 : 0;
        cum += angle;
        return <path key={i} d={`M ${s1.x} ${s1.y} A ${r} ${r} 0 ${large} 1 ${e1.x} ${e1.y} L ${e2.x} ${e2.y} A ${inn} ${inn} 0 ${large} 0 ${s2.x} ${s2.y} Z`} fill={`url(#dg${i})`} style={{ filter: `drop-shadow(0 0 6px ${d.color}60)` }}/>;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 20, fontWeight: 800, fill: "#1e1b4b", fontFamily: "'Outfit', sans-serif" }}>{total}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontSize: 9, fill: "#94a3b8", fontFamily: "'Outfit', sans-serif", letterSpacing: 1 }}>TOTAL</text>
    </svg>
  );
}

function BarChart({ data, height = 110 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const colors = ["#7c3aed","#0891b2","#d97706","#e11d48","#059669","#db2777","#ea580c","#0284c7","#65a30d","#9333ea"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, paddingBottom: 22 }}>
      {data.slice(0, 10).map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", height: `${(d.count / max) * (height - 28)}px`, background: `linear-gradient(to top, ${colors[i % colors.length]}, ${colors[i % colors.length]}99)`, borderRadius: "6px 6px 0 0", minHeight: 4, boxShadow: `0 -2px 12px ${colors[i % colors.length]}50`, transition: "height 0.6s cubic-bezier(.175,.885,.32,1.275)" }} title={`${d.word}: ${d.count}`}/>
          <span style={{ fontSize: 9, color: "#94a3b8", transform: "rotate(-40deg)", whiteSpace: "nowrap", maxWidth: 28, overflow: "hidden", display: "block", fontFamily: "'Outfit', sans-serif" }}>{d.word}</span>
        </div>
      ))}
    </div>
  );
}

function SentimentBar({ breakdown }) {
  if (!breakdown) return null;
  const { positive = 0, neutral = 0, negative = 0 } = breakdown;
  return (
    <div style={{ width: "100%", height: 10, borderRadius: 5, overflow: "hidden", display: "flex", background: "rgba(0,0,0,0.06)" }}>
      <div style={{ width: `${positive}%`, background: "linear-gradient(90deg,#059669,#34d399)", transition: "width 0.7s ease", boxShadow: "2px 0 8px rgba(5,150,105,0.4)" }}/>
      <div style={{ width: `${neutral}%`, background: "linear-gradient(90deg,#d97706,#fbbf24)", transition: "width 0.7s ease" }}/>
      <div style={{ width: `${negative}%`, background: "linear-gradient(90deg,#e11d48,#fb7185)", transition: "width 0.7s ease" }}/>
    </div>
  );
}

function TrendLine({ data }) {
  if (!data?.length) return null;
  const w = 320, h = 72, p = 12;
  const scores = data.map(d => d.score);
  const min = Math.min(...scores, -1), max = Math.max(...scores, 1), range = max - min || 1;
  const pts = data.map((d, i) => [p + (i / (data.length - 1 || 1)) * (w - p * 2), h - p - ((d.score - min) / range) * (h - p * 2)]);
  const pathD = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt[0]} ${pt[1]}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1][0]} ${h} L ${pts[0][0]} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient>
        <linearGradient id="tl" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#0891b2"/><stop offset="50%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#db2777"/></linearGradient>
      </defs>
      <line x1={p} y1={h/2} x2={w-p} y2={h/2} stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4"/>
      <path d={areaD} fill="url(#tg)"/>
      <path d={pathD} fill="none" stroke="url(#tl)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={sentimentColor(data[i].sentiment)} stroke="white" strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 4px ${sentimentGlow(data[i].sentiment)})` }}/>)}
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="card-hover" style={{ background: gradient, borderRadius: 20, padding: "22px 24px", boxShadow: "0 4px 24px rgba(100,80,200,0.12)", border: "1px solid rgba(255,255,255,0.6)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "rgba(255,255,255,0.2)", borderRadius: "50%" }}/>
      <div style={{ position: "absolute", top: 10, right: 10, width: 42, height: 42, background: "rgba(255,255,255,0.35)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color="white"/>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 6, fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Card Title ────────────────────────────────────────────────────────────────
function CardTitle({ children, color = "#7c3aed" }) {
  return <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 18, fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>{children}</h3>;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ children, color }) {
  return <span style={{ background: `${color}18`, color, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1.5px solid ${color}35`, fontFamily: "'Outfit', sans-serif", boxShadow: `0 2px 8px ${color}20` }}>{children}</span>;
}

// ── Shared Styles ─────────────────────────────────────────────────────────────
const inputS = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.2)", fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.7)", fontFamily: "'Outfit', sans-serif", backdropFilter: "blur(8px)", transition: "all 0.2s" };
const labelS = { display: "block", fontSize: 12, fontWeight: 700, color: "#6d28d9", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Outfit', sans-serif" };
const ghostBtn = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4c1d95", fontWeight: 600, fontFamily: "'Outfit', sans-serif", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(124,58,237,0.08)" };
const primaryBtn = { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", transition: "all 0.2s" };

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════
function DashboardPage() {
  const { setPage, setSelectedMeeting } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiFetch("/dashboard/stats").then(setStats).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}><Spinner size={44}/></div>;
  if (!stats) return <div style={{ textAlign: "center", padding: 80, color: "#6d28d9", fontFamily: "'Outfit',sans-serif" }}>Could not load dashboard.</div>;

  const donutData = [
    { label: "Positive", value: stats.sentiment_distribution.positive, color: "#059669" },
    { label: "Neutral",  value: stats.sentiment_distribution.neutral,  color: "#d97706" },
    { label: "Negative", value: stats.sentiment_distribution.negative, color: "#e11d48" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "floatIn 0.5s cubic-bezier(.175,.885,.32,1.275)" }}>

      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 40%,#db2777 100%)", borderRadius: 24, padding: "32px 36px", position: "relative", overflow: "hidden", boxShadow: "0 12px 48px rgba(124,58,237,0.35)" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }}/>
        <div style={{ position: "absolute", bottom: -40, left: 200, width: 160, height: 160, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }}/>
        <div style={{ position: "absolute", top: 20, right: 100, width: 80, height: 80, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }}/>
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 14px", marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, background: "#86efac", borderRadius: "50%", animation: "pulse 2s infinite" }}/>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif" }}>AI SYSTEM ACTIVE</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.5px", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>Meeting Intelligence Hub</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 8, fontFamily: "'Outfit',sans-serif" }}>Transform conversations into actionable insights with AI</p>
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            <button onClick={() => setPage("upload")} style={{ background: "rgba(255,255,255,0.95)", color: "#7c3aed", border: "none", borderRadius: 12, padding: "11px 22px", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s" }}>
              ✦ Upload Transcript
            </button>
            <button onClick={() => setPage("live")} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 12, padding: "11px 22px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", backdropFilter: "blur(8px)" }}>
              🔴 Live Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
        <StatCard label="Total Meetings" value={stats.total_meetings} icon="list" gradient="linear-gradient(135deg,#4f46e5,#7c3aed)"/>
        <StatCard label="Completed" value={stats.completed_meetings} icon="check" gradient="linear-gradient(135deg,#0891b2,#06b6d4)"/>
        <StatCard label="Action Items" value={stats.total_action_items} icon="zap" gradient="linear-gradient(135deg,#d97706,#f59e0b)"/>
        <StatCard label="Avg Words" value={stats.avg_words?.toLocaleString()} icon="file" gradient="linear-gradient(135deg,#db2777,#f472b6)"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Donut */}
        <Glass style={{ padding: 24 }}>
          <CardTitle>📊 Sentiment Distribution</CardTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DonutChart data={donutData} size={130}/>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {donutData.map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, boxShadow: `0 0 8px ${d.color}80` }}/>
                  <span style={{ fontSize: 13, color: "#4c1d95", fontFamily: "'Outfit',sans-serif", flex: 1, fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: d.color, fontFamily: "'Outfit',sans-serif" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Glass>

        {/* Keywords */}
        <Glass style={{ padding: 24 }}>
          <CardTitle>🔑 Top Keywords</CardTitle>
          {stats.top_keywords?.length ? <BarChart data={stats.top_keywords} height={110}/> : <div style={{ color: "#a78bfa", fontSize: 13, textAlign: "center", paddingTop: 30, fontFamily: "'Outfit',sans-serif" }}>No data yet</div>}
        </Glass>
      </div>

      {/* Trend */}
      {stats.sentiment_trend?.length > 1 && (
        <Glass style={{ padding: 24 }}>
          <CardTitle>📈 Sentiment Trend</CardTitle>
          <TrendLine data={stats.sentiment_trend}/>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {stats.sentiment_trend.map((d, i) => <span key={i} style={{ fontSize: 10, color: "#a78bfa", fontFamily: "'Outfit',sans-serif" }}>{d.date}</span>)}
          </div>
        </Glass>
      )}

      {/* Recent meetings */}
      <Glass style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <CardTitle>🕐 Recent Meetings</CardTitle>
          <button onClick={() => setPage("meetings")} style={{ fontSize: 13, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>View all →</button>
        </div>
        {stats.recent_meetings?.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Title","Sentiment","Words","Actions","Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#a78bfa", fontWeight: 700, paddingBottom: 12, borderBottom: "1.5px solid rgba(124,58,237,0.1)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {stats.recent_meetings.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: "1px solid rgba(124,58,237,0.06)" }}>
                  <td style={{ padding: "13px 0" }}>
                    <button onClick={() => { setSelectedMeeting(m.id); setPage("detail"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#1e1b4b", fontWeight: 700, fontSize: 14, padding: 0, fontFamily: "'Outfit',sans-serif" }}>{m.title}</button>
                  </td>
                  <td><Badge color={sentimentColor(m.sentiment)}>{m.sentiment || "—"}</Badge></td>
                  <td style={{ fontSize: 13, color: "#6d28d9", fontFamily: "'Outfit',sans-serif" }}>{m.word_count?.toLocaleString() || "—"}</td>
                  <td style={{ fontSize: 13, color: "#6d28d9", fontFamily: "'Outfit',sans-serif" }}>{m.action_items_count}</td>
                  <td style={{ fontSize: 12, color: "#a78bfa", fontFamily: "'Outfit',sans-serif" }}>{fmtDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div style={{ fontSize: 44 }}>🧠</div>
            <p style={{ color: "#6d28d9", marginTop: 12, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>No meetings yet. Upload your first transcript!</p>
            <button onClick={() => setPage("upload")} style={{ ...primaryBtn, margin: "16px auto 0" }}>Upload Transcript</button>
          </div>
        )}
      </Glass>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD PAGE
// ═══════════════════════════════════════════════════════════════════════════
function UploadPage() {
  const { addToast, setPage, setSelectedMeeting } = useApp();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [pasteText, setPasteText] = useState("");
  const [mode, setMode] = useState("file");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { addToast("Please enter a meeting title.", "error"); return; }
    if (mode === "file" && !file) { addToast("Please select a file.", "error"); return; }
    if (mode === "paste" && pasteText.trim().length < 50) { addToast("Transcript too short (min 50 chars).", "error"); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("title", title);
      if (mode === "file") fd.append("file", file); else fd.append("text_content", pasteText);
      const res = await apiFetch("/transcripts/upload", { method: "POST", body: fd });
      addToast("Transcript uploaded! AI is analyzing...", "success");
      setSelectedMeeting(res.id); setPage("detail");
    } catch (e) { addToast(e.message, "error"); } finally { setUploading(false); }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, animation: "floatIn 0.5s cubic-bezier(.175,.885,.32,1.275)" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.1)", borderRadius: 20, padding: "5px 14px", marginBottom: 12, border: "1px solid rgba(124,58,237,0.2)" }}>
          <Icon name="brain" size={13} color="#7c3aed"/>
          <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif" }}>AI ANALYSIS</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1e1b4b", fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.5px" }}>Upload Transcript</h2>
        <p style={{ color: "#6d28d9", fontSize: 14, marginTop: 4, fontFamily: "'Outfit',sans-serif" }}>AI extracts summary, action items, sentiment & keywords automatically</p>
      </div>

      <Glass style={{ padding: 24 }}>
        <label style={labelS}>Meeting Title *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q3 Planning Session" style={inputS}/>
      </Glass>

      <Glass style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", background: "rgba(124,58,237,0.06)", borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          {["file","paste"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "14px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif", transition: "all 0.2s", background: mode === m ? "rgba(255,255,255,0.8)" : "transparent", color: mode === m ? "#7c3aed" : "#a78bfa", borderBottom: mode === m ? "3px solid #7c3aed" : "3px solid transparent" }}>
              {m === "file" ? "📄 Upload File" : "📝 Paste Text"}
            </button>
          ))}
        </div>
        <div style={{ padding: 24 }}>
          {mode === "file" ? (
            <div onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); } }} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onClick={() => document.getElementById("fi2").click()}
              style={{ border: `2px dashed ${dragOver ? "#7c3aed" : "rgba(124,58,237,0.25)"}`, borderRadius: 16, padding: 48, textAlign: "center", background: dragOver ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.25s", backdropFilter: "blur(8px)" }}>
              <input id="fi2" type="file" accept=".txt,.pdf,.docx" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])}/>
              <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
                <Icon name="upload" size={26} color="white"/>
              </div>
              {file ? (
                <div>
                  <p style={{ color: "#1e1b4b", fontWeight: 700, fontFamily: "'Outfit',sans-serif", fontSize: 15 }}>{file.name}</p>
                  <p style={{ color: "#a78bfa", fontSize: 12, marginTop: 4, fontFamily: "'Outfit',sans-serif" }}>{(file.size/1024).toFixed(1)} KB · Ready to analyze</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#4c1d95", fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>Drop file here or click to browse</p>
                  <p style={{ color: "#a78bfa", fontSize: 12, marginTop: 6, fontFamily: "'Outfit',sans-serif" }}>Supports TXT, PDF, DOCX</p>
                </div>
              )}
            </div>
          ) : (
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your meeting transcript here…&#10;&#10;Format: Name: What they said&#10;Example:&#10;Sarah: Let's review the Q3 results.&#10;John: We exceeded our targets this quarter." style={{ ...inputS, height: 220, resize: "vertical" }}/>
          )}
        </div>
      </Glass>

      <button onClick={handleSubmit} disabled={uploading} style={{ background: uploading ? "#c4b5fd" : "linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 800, cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Outfit',sans-serif", boxShadow: "0 6px 28px rgba(124,58,237,0.4)", transition: "all 0.2s" }}>
        {uploading ? <><Spinner size={20} color="white"/> Analyzing with AI…</> : <><Icon name="star" size={18} color="white"/> Analyze with AI</>}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MEETINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function MeetingsPage() {
  const { setPage, setSelectedMeeting, addToast } = useApp();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); apiFetch("/transcripts/").then(setMeetings).catch(e => addToast(e.message,"error")).finally(() => setLoading(false)); };
  useEffect(load, []);

  const del = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await apiFetch(`/transcripts/${id}`,{method:"DELETE"}); addToast("Deleted.","success"); load(); }
    catch(e) { addToast(e.message,"error"); }
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20,animation:"floatIn 0.5s cubic-bezier(.175,.885,.32,1.275)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <h2 style={{ fontSize:28,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.5px" }}>All Meetings</h2>
          <p style={{ color:"#6d28d9",fontSize:13,fontFamily:"'Outfit',sans-serif",marginTop:3 }}>{meetings.length} transcript{meetings.length!==1?"s":""} analyzed</p>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={load} style={ghostBtn}><Icon name="refresh" size={15}/> Refresh</button>
          <button onClick={() => setPage("upload")} style={primaryBtn}><Icon name="plus" size={15} color="#fff"/> New Upload</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex",justifyContent:"center",padding:70 }}><Spinner size={40}/></div>
      ) : meetings.length === 0 ? (
        <Glass style={{ textAlign:"center",padding:"80px 0" }}>
          <div style={{ fontSize:48 }}>✨</div>
          <p style={{ color:"#6d28d9",marginTop:14,fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:15 }}>No meetings yet. Upload your first transcript!</p>
          <button onClick={() => setPage("upload")} style={{ ...primaryBtn,margin:"16px auto 0" }}>Upload Transcript</button>
        </Glass>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {meetings.map(m => (
            <Glass key={m.id} className="card-hover" style={{ padding:"18px 22px",display:"flex",alignItems:"center",gap:16 }}>
              <div style={{ width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#7c3aed20,#a855f720)",border:"1.5px solid rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <Icon name="file" size={18} color="#7c3aed"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,color:"#1e1b4b",fontSize:15,fontFamily:"'Outfit',sans-serif" }}>{m.title}</span>
                  <span style={{ fontSize:10,padding:"2px 9px",borderRadius:20,background:`${statusColor[m.status]}18`,color:statusColor[m.status],fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Outfit',sans-serif" }}>{m.status}</span>
                  {m.sentiment && <Badge color={sentimentColor(m.sentiment)}>{m.sentiment}</Badge>}
                </div>
                <div style={{ display:"flex",gap:16,marginTop:5 }}>
                  <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{fmtDate(m.created_at)}</span>
                  {m.original_filename && <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>📄 {m.original_filename}</span>}
                  {m.word_count && <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{m.word_count.toLocaleString()} words</span>}
                </div>
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={() => { setSelectedMeeting(m.id); setPage("detail"); }} style={ghostBtn} title="View"><Icon name="eye" size={15}/></button>
                <button onClick={() => del(m.id,m.title)} style={{ ...ghostBtn,color:"#e11d48",borderColor:"rgba(225,29,72,0.25)" }} title="Delete"><Icon name="trash" size={15}/></button>
              </div>
            </Glass>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MEETING DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════════
function MeetingDetailPage() {
  const { selectedMeeting, setPage, addToast } = useApp();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("summary");
  const [polling, setPolling] = useState(false);

  const load = () => apiFetch(`/transcripts/${selectedMeeting}`).then(m => { setMeeting(m); setPolling(m.status==="processing"||m.status==="pending"); }).catch(e => addToast(e.message,"error")).finally(() => setLoading(false));
  useEffect(() => { load(); },[selectedMeeting]);
  useEffect(() => { if(!polling) return; const t=setInterval(load,3000); return () => clearInterval(t); },[polling]);

  if (loading) return <div style={{ display:"flex",justifyContent:"center",padding:80 }}><Spinner size={44}/></div>;
  if (!meeting) return null;
  const isProc = meeting.status==="pending"||meeting.status==="processing";

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:22,animation:"floatIn 0.5s cubic-bezier(.175,.885,.32,1.275)" }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:14 }}>
        <button onClick={() => setPage("meetings")} style={ghostBtn}><Icon name="arrowLeft" size={15}/></button>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:24,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.3px" }}>{meeting.title}</h2>
          <div style={{ display:"flex",gap:12,marginTop:6,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{fmtDate(meeting.created_at)}</span>
            {meeting.word_count && <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{meeting.word_count.toLocaleString()} words</span>}
            {meeting.sentiment && <Badge color={sentimentColor(meeting.sentiment)}>{meeting.sentiment}</Badge>}
          </div>
        </div>
        {meeting.status==="completed" && (
          <button onClick={() => exportMeetingPDF(meeting)} style={{ ...ghostBtn, background:"linear-gradient(135deg,#4f46e520,#7c3aed15)", borderColor:"rgba(124,58,237,0.3)", color:"#7c3aed", flexShrink:0 }}>
            <Icon name="download" size={15} color="#7c3aed"/> Export PDF
          </button>
        )}
      </div>

      {isProc && (
        <Glass style={{ padding:"16px 20px",border:"1.5px solid rgba(124,58,237,0.3)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <Spinner size={20}/>
            <span style={{ color:"#7c3aed",fontSize:14,fontFamily:"'Outfit',sans-serif",fontWeight:600 }}>AI is analyzing your transcript… Auto-refreshing every 3 seconds.</span>
          </div>
        </Glass>
      )}

      {meeting.status==="completed" && (
        <>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14 }}>
            {[{label:"Sentiment",value:meeting.sentiment,grad:`linear-gradient(135deg,${sentimentColor(meeting.sentiment)},${sentimentColor(meeting.sentiment)}99)`},{label:"Action Items",value:meeting.action_items?.length||0,grad:"linear-gradient(135deg,#d97706,#f59e0b)"},{label:"Keywords",value:meeting.keywords?.length||0,grad:"linear-gradient(135deg,#0891b2,#06b6d4)"},{label:"Sent. Score",value:meeting.sentiment_score?.toFixed(2),grad:`linear-gradient(135deg,${sentimentColor(meeting.sentiment)},${sentimentColor(meeting.sentiment)}99)`}].map((s,i) => (
              <div key={i} style={{ background:s.grad,borderRadius:16,padding:"18px 20px",boxShadow:`0 4px 20px ${sentimentGlow(meeting.sentiment)}` }}>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"'Outfit',sans-serif",fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:26,fontWeight:800,color:"#fff",marginTop:6,fontFamily:"'Outfit',sans-serif",textShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Glass style={{ padding:5,display:"flex",width:"fit-content",gap:4 }}>
            {[["summary","📋 Summary"],["actions","⚡ Actions"],["sentiment","😊 Sentiment"],["keywords","🔑 Keywords"],["transcript","📄 Transcript"]].map(([k,label]) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding:"9px 16px",borderRadius:14,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"'Outfit',sans-serif",transition:"all 0.2s",background:tab===k?"linear-gradient(135deg,#7c3aed,#a855f7)":"transparent",color:tab===k?"#fff":"#6d28d9",boxShadow:tab===k?"0 4px 16px rgba(124,58,237,0.3)":"none" }}>
                {label}
              </button>
            ))}
          </Glass>

          <Glass style={{ padding:28 }}>
            {tab==="summary" && <div><CardTitle>Meeting Summary</CardTitle><p style={{ fontSize:15,lineHeight:1.9,color:"#3730a3",fontFamily:"'Outfit',sans-serif",fontWeight:400 }}>{meeting.summary||"No summary generated."}</p></div>}

            {tab==="actions" && <ActionTracker items={meeting.action_items} meetingId={meeting.id}/>}

            {tab==="sentiment" && <div>
              <CardTitle>Sentiment Analysis</CardTitle>
              <div style={{ display:"flex",gap:32,alignItems:"center",marginTop:8 }}>
                <div style={{ background:`linear-gradient(135deg,${sentimentColor(meeting.sentiment)},${sentimentColor(meeting.sentiment)}aa)`,borderRadius:20,padding:"20px 32px",textAlign:"center",boxShadow:`0 8px 32px ${sentimentGlow(meeting.sentiment)}` }}>
                  <div style={{ fontSize:44,fontWeight:900,color:"#fff",fontFamily:"'Outfit',sans-serif",textShadow:"0 2px 12px rgba(0,0,0,0.2)" }}>{meeting.sentiment}</div>
                  <div style={{ fontSize:13,color:"rgba(255,255,255,0.8)",marginTop:4,fontFamily:"'Outfit',sans-serif" }}>score: {meeting.sentiment_score?.toFixed(3)}</div>
                </div>
                {meeting.sentiment_breakdown && (
                  <div style={{ flex:1 }}>
                    <SentimentBar breakdown={meeting.sentiment_breakdown}/>
                    <div style={{ display:"flex",justifyContent:"space-between",marginTop:14 }}>
                      {[["Positive","#059669"],["Neutral","#d97706"],["Negative","#e11d48"]].map(([k,c]) => (
                        <div key={k} style={{ display:"flex",alignItems:"center",gap:7 }}>
                          <div style={{ width:10,height:10,borderRadius:"50%",background:c,boxShadow:`0 0 8px ${c}80` }}/>
                          <span style={{ fontSize:13,color:"#3730a3",fontFamily:"'Outfit',sans-serif" }}>{k}: <strong>{meeting.sentiment_breakdown[k.toLowerCase()]}%</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>}

            {tab==="keywords" && <div>
              <CardTitle>Top Keywords</CardTitle>
              <div style={{ display:"flex",flexWrap:"wrap",gap:10,marginTop:8 }}>
                {meeting.keywords?.map((kw,i) => (
                  <span key={i} style={{ background:`linear-gradient(135deg,${PC[i%PC.length]}18,${PC[i%PC.length]}10)`,color:PC[i%PC.length],padding:"7px 18px",borderRadius:24,fontSize:13,fontWeight:700,border:`1.5px solid ${PC[i%PC.length]}30`,fontFamily:"'Outfit',sans-serif",boxShadow:`0 2px 10px ${PC[i%PC.length]}20` }}>
                    {kw.word} <span style={{ opacity:0.5 }}>×{kw.count}</span>
                  </span>
                ))}
              </div>
              {meeting.keywords?.length>0 && <div style={{ marginTop:24 }}><BarChart data={meeting.keywords} height={120}/></div>}
            </div>}

            {tab==="transcript" && <div>
              <CardTitle>Original Transcript</CardTitle>
              <pre style={{ fontSize:13,lineHeight:1.9,color:"#3730a3",whiteSpace:"pre-wrap",fontFamily:"'DM Mono','Courier New',monospace",background:"rgba(124,58,237,0.04)",borderRadius:14,padding:20,maxHeight:480,overflowY:"auto",border:"1.5px solid rgba(124,58,237,0.1)" }}>
                {meeting.transcript_text}
              </pre>
            </div>}
          </Glass>
        </>
      )}
      {meeting.status==="failed" && (
        <Glass style={{ padding:"20px 24px",border:"1.5px solid rgba(225,29,72,0.3)",background:"rgba(225,29,72,0.05)" }}>
          <p style={{ color:"#e11d48",fontWeight:600,fontFamily:"'Outfit',sans-serif" }}>Processing failed. Please try re-uploading.</p>
        </Glass>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE MEETING PAGE
// ═══════════════════════════════════════════════════════════════════════════
function LiveMeetingPage() {
  const { addToast, setPage, setSelectedMeeting } = useApp();
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState([{id:1,name:"Person 1",color:PC[0]},{id:2,name:"Person 2",color:PC[1]}]);
  const [newName, setNewName] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [currentText, setCurrentText] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [duration, setDuration] = useState(0);
  const [insights, setInsights] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const analyzeRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  useEffect(() => { if(isLive){timerRef.current=setInterval(()=>setDuration(d=>d+1),1000);}else{clearInterval(timerRef.current);} return()=>clearInterval(timerRef.current); },[isLive]);
  useEffect(() => { if(isLive){analyzeRef.current=setInterval(()=>{setMessages(msgs=>{if(msgs.length>2)analyzeT(msgs);return msgs;});},20000);}else{clearInterval(analyzeRef.current);} return()=>clearInterval(analyzeRef.current); },[isLive]);

  const fmtDur=(s)=>`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const buildT=(msgs)=>msgs.map(m=>`${m.name}: ${m.text}`).join("\n");

  const analyzeT=(msgs)=>{
    const text=buildT(msgs); if(!text.trim()||text.length<30)return; setAnalyzing(true);
    setTimeout(()=>{
      const pos=["great","excellent","good","positive","agree","success","wonderful","fantastic","amazing","perfect","happy","pleased","effective","productive","resolved","achieved","approved","glad","appreciate","improve","better","outstanding","support","helpful","excited","confident","strong","best","completed","done"];
      const neg=["bad","issue","problem","concern","fail","failed","poor","delay","delayed","disappointed","unfortunately","difficult","challenge","obstacle","risk","missing","missed","wrong","error","mistake","disagree","negative","reject","incomplete","stuck","blocker","blocked","worse","worst","never","cannot","impossible","frustrated","behind","critical","serious"];
      const tokens=text.toLowerCase().match(/\b[a-zA-Z]+\b/g)||[];
      const posC=tokens.filter(t=>pos.includes(t)).length,negC=tokens.filter(t=>neg.includes(t)).length;
      const score=(posC-negC)/Math.max(posC+negC,1);
      const sentiment=score>0.1?"Positive":score<-0.1?"Negative":"Neutral";
      const posP=Math.min(100,Math.round(posC/Math.max(tokens.length,1)*100)),negP=Math.min(100,Math.round(negC/Math.max(tokens.length,1)*100));
      const ap=/\b(will|shall|should|must|need to|please|follow.?up|next step|assigned to|deadline|complete|finish|deliver|send|review|update|prepare|schedule|ensure|make sure)\b/i;
      const actions=msgs.filter(m=>ap.test(m.text)).map(m=>`${m.name}: ${m.text}`).slice(0,8);
      const sw=new Set(["i","me","my","we","our","you","your","he","she","it","they","the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","are","were","be","been","have","has","had","do","does","did","will","this","that","so","if","then","as","up","about","not","just","also","very","too","can","all","both","ok","yes","yeah","um","uh","s","t","re","ll","ve"]);
      const freq={}; tokens.filter(t=>!sw.has(t)&&t.length>3).forEach(t=>{freq[t]=(freq[t]||0)+1;});
      const keywords=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([word,count])=>({word,count}));
      const perP={}; msgs.forEach(m=>{if(!perP[m.name])perP[m.name]={pos:0,neg:0,color:m.color};const w=m.text.toLowerCase().match(/\b[a-zA-Z]+\b/g)||[];perP[m.name].pos+=w.filter(t=>pos.includes(t)).length;perP[m.name].neg+=w.filter(t=>neg.includes(t)).length;});
      const personSentiments=Object.entries(perP).map(([name,d])=>{const sc=(d.pos-d.neg)/Math.max(d.pos+d.neg,1);return{name,sentiment:sc>0.1?"Positive":sc<-0.1?"Negative":"Neutral",color:d.color};});
      const spStats={}; msgs.forEach(m=>{if(!spStats[m.name])spStats[m.name]={count:0,words:0,color:m.color};spStats[m.name].count++;spStats[m.name].words+=m.text.split(/\s+/).length;});
      setInsights({sentiment,score:score.toFixed(2),posP,negP,neuP:Math.max(0,100-posP-negP),actions,keywords,personSentiments,speakerStats:spStats});
      setAnalyzing(false);
    },600);
  };

  const addP=()=>{if(!newName.trim()){addToast("Enter a name!","error");return;}if(participants.length>=10){addToast("Max 10!","error");return;}const id=Date.now();setParticipants(p=>[...p,{id,name:newName.trim(),color:PC[p.length%PC.length]}]);setNewName("");};
  const removeP=(id)=>{if(participants.length<=2){addToast("Need at least 2!","error");return;}setParticipants(p=>p.filter(x=>x.id!==id));};
  const updateP=(id,name)=>setParticipants(p=>p.map(x=>x.id===id?{...x,name}:x));

  const startMeeting=()=>{if(!title.trim()){addToast("Enter a title!","error");return;}if(participants.some(p=>!p.name.trim())){addToast("All need names!","error");return;}setSetupDone(true);setIsLive(true);setActiveParticipant(participants[0].id);setDuration(0);addToast(`Meeting started with ${participants.length} participants!`,"success");};
  const sendMessage=()=>{if(!currentText.trim()||!activeParticipant)return;const p=participants.find(x=>x.id===activeParticipant);const msg={id:Date.now(),participantId:activeParticipant,name:p.name,color:p.color,text:currentText.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};const updated=[...messages,msg];setMessages(updated);setCurrentText("");if(updated.length%3===0)analyzeT(updated);inputRef.current?.focus();};

  const startMic=async()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){addToast("Use Google Chrome for mic support!","error");return;}
    try{await navigator.mediaDevices.getUserMedia({audio:true});}catch(e){
      if(e.name==="NotAllowedError")addToast("Mic blocked! Click 🔒 in address bar → Microphone → Allow → reload.","error");
      else if(e.name==="NotFoundError")addToast("No microphone found!","error");
      else addToast(`Mic error: ${e.message}`,"error"); return;
    }
    const r=new SR();r.continuous=false;r.interimResults=false;r.lang="en-US";
    r.onresult=(e)=>{const text=e.results[0][0].transcript;if(!text.trim())return;const p=participants.find(x=>x.id===activeParticipant);const msg={id:Date.now(),participantId:activeParticipant,name:p.name,color:p.color,text:text.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};const updated=[...messages,msg];setMessages(updated);if(updated.length%3===0)analyzeT(updated);setIsListening(false);addToast(`Added: "${text.trim().substring(0,40)}"`,"success");};
    r.onerror=(ev)=>{setIsListening(false);const m={"not-allowed":"Mic blocked! Allow in browser settings.","no-speech":"No speech detected. Speak clearly!","audio-capture":"No microphone found!"};addToast(m[ev.error]||`Mic error: ${ev.error}`,"error");};
    r.onend=()=>setIsListening(false);
    recognitionRef.current=r;
    try{r.start();setIsListening(true);}catch{addToast("Could not start mic.","error");}
  };

  const stopMic=()=>{recognitionRef.current?.stop();setIsListening(false);};
  const endMeeting=()=>{setIsLive(false);stopMic();if(messages.length>0)analyzeT(messages);addToast("Meeting ended! Save to dashboard.","info");};
  const saveToDashboard=async()=>{if(!messages.length){addToast("No messages!","error");return;}setSaving(true);try{const fd=new FormData();fd.append("title",title);fd.append("text_content",buildT(messages));const res=await apiFetch("/transcripts/upload",{method:"POST",body:fd});addToast("Saved!","success");setSelectedMeeting(res.id);setPage("detail");}catch(e){addToast(e.message,"error");}finally{setSaving(false);}};

  const activeP=participants.find(p=>p.id===activeParticipant);

  // SETUP SCREEN
  if(!setupDone) return (
    <div style={{ maxWidth:580,margin:"0 auto",display:"flex",flexDirection:"column",gap:20,animation:"floatIn 0.5s cubic-bezier(.175,.885,.32,1.275)" }}>
      <div>
        <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(225,29,72,0.1)",borderRadius:20,padding:"5px 14px",marginBottom:12,border:"1px solid rgba(225,29,72,0.2)" }}>
          <div style={{ width:7,height:7,background:"#e11d48",borderRadius:"50%",animation:"pulse 1s infinite" }}/>
          <span style={{ fontSize:11,color:"#e11d48",fontWeight:700,letterSpacing:"0.08em",fontFamily:"'Outfit',sans-serif" }}>LIVE MODE</span>
        </div>
        <h2 style={{ fontSize:28,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.5px" }}>Setup Live Meeting</h2>
        <p style={{ color:"#6d28d9",fontSize:14,marginTop:4,fontFamily:"'Outfit',sans-serif" }}>Add all participants before starting</p>
      </div>
      <Glass style={{ padding:24 }}>
        <label style={labelS}>Meeting Title *</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Daily Standup — March 21" style={inputS}/>
      </Glass>
      <Glass style={{ padding:24 }}>
        <label style={labelS}>👥 Participants ({participants.length} / 10)</label>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:16 }}>
          {participants.map((p,i)=>(
            <div key={p.id} style={{ display:"flex",gap:10,alignItems:"center" }}>
              <div style={{ width:36,height:36,borderRadius:12,background:`linear-gradient(135deg,${p.color}30,${p.color}15)`,border:`2px solid ${p.color}50`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${p.color}25` }}>
                <span style={{ color:p.color,fontWeight:800,fontSize:14,fontFamily:"'Outfit',sans-serif" }}>{p.name.charAt(0).toUpperCase()}</span>
              </div>
              <input value={p.name} onChange={e=>updateP(p.id,e.target.value)} placeholder={`Participant ${i+1}`} style={{ ...inputS,flex:1 }}/>
              <button onClick={()=>removeP(p.id)} style={{ ...ghostBtn,color:"#e11d48",borderColor:"rgba(225,29,72,0.25)",padding:"9px 10px" }}><Icon name="x" size={14}/></button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addP()} placeholder="Add participant name..." style={{ ...inputS,flex:1 }}/>
          <button onClick={addP} style={primaryBtn}><Icon name="plus" size={15} color="#fff"/> Add</button>
        </div>
      </Glass>
      {participants.filter(p=>p.name.trim()).length>0 && (
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {participants.filter(p=>p.name.trim()).map(p=>(
            <span key={p.id} style={{ background:`linear-gradient(135deg,${p.color}20,${p.color}10)`,color:p.color,padding:"7px 16px",borderRadius:24,fontSize:13,fontWeight:700,border:`1.5px solid ${p.color}35`,fontFamily:"'Outfit',sans-serif",boxShadow:`0 2px 10px ${p.color}20` }}>{p.name}</span>
          ))}
        </div>
      )}
      <button onClick={startMeeting} style={{ background:"linear-gradient(135deg,#e11d48,#f43f5e,#fb7185)",color:"#fff",border:"none",borderRadius:16,padding:"16px",fontSize:15,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"'Outfit',sans-serif",boxShadow:"0 6px 28px rgba(225,29,72,0.4)",transition:"all 0.2s" }}>
        <Icon name="play" size={18} color="#fff"/> Start Live Meeting
      </button>
    </div>
  );

  // LIVE SCREEN
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16,height:"calc(100vh - 100px)",animation:"floatIn 0.5s ease" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
        <div>
          <h2 style={{ fontSize:20,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif" }}>{title}</h2>
          <p style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{participants.length} participants · {messages.length} messages</p>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {isLive && (
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(225,29,72,0.1)",borderRadius:12,padding:"8px 16px",border:"1.5px solid rgba(225,29,72,0.25)" }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:"#e11d48",animation:"pulse 1s infinite",boxShadow:"0 0 10px rgba(225,29,72,0.6)" }}/>
              <span style={{ color:"#e11d48",fontWeight:800,fontSize:14,fontFamily:"'Outfit',sans-serif" }}>LIVE {fmtDur(duration)}</span>
            </div>
          )}
          {isLive
            ? <button onClick={endMeeting} style={ghostBtn}><Icon name="stop" size={15}/> End Meeting</button>
            : <button onClick={saveToDashboard} disabled={saving} style={primaryBtn}>{saving?<><Spinner size={14} color="#fff"/> Saving…</>:<><Icon name="save" size={14} color="#fff"/> Save to Dashboard</>}</button>
          }
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 340px",gap:16,flex:1,minHeight:0 }}>
        {/* Chat */}
        <Glass style={{ display:"flex",flexDirection:"column",overflow:"hidden",border:isLive?"2px solid rgba(225,29,72,0.3)":"1.5px solid rgba(255,255,255,0.7)",boxShadow:isLive?"0 0 40px rgba(225,29,72,0.12)":"0 8px 32px rgba(100,80,200,0.1)",transition:"all 0.3s" }}>
          {/* Speaker selector */}
          <div style={{ padding:"14px 16px",borderBottom:"1px solid rgba(124,58,237,0.1)",background:"rgba(255,255,255,0.4)" }}>
            <p style={{ fontSize:10,color:"#a78bfa",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontFamily:"'Outfit',sans-serif" }}>WHO IS SPEAKING?</p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
              {participants.map(p=>(
                <button key={p.id} onClick={()=>{setActiveParticipant(p.id);inputRef.current?.focus();}} style={{ padding:"7px 16px",borderRadius:24,border:`2px solid ${activeParticipant===p.id?p.color:"rgba(124,58,237,0.15)"}`,background:activeParticipant===p.id?`linear-gradient(135deg,${p.color}20,${p.color}10)`:"rgba(255,255,255,0.5)",color:activeParticipant===p.id?p.color:"#6d28d9",fontWeight:activeParticipant===p.id?800:500,fontSize:13,cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:6,fontFamily:"'Outfit',sans-serif",boxShadow:activeParticipant===p.id?`0 4px 16px ${p.color}35`:"none" }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:p.color,boxShadow:`0 0 6px ${p.color}` }}/>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:14 }}>
            {messages.length===0 ? (
              <div style={{ textAlign:"center",padding:"50px 0",color:"#a78bfa" }}>
                <div style={{ fontSize:44 }}>💬</div>
                <p style={{ marginTop:12,fontSize:14,fontFamily:"'Outfit',sans-serif",fontWeight:500,color:"#6d28d9" }}>Select who is speaking and start typing!</p>
              </div>
            ) : messages.map(msg=>(
              <div key={msg.id} style={{ display:"flex",gap:10,alignItems:"flex-start",animation:"floatIn 0.25s ease" }}>
                <div style={{ width:34,height:34,borderRadius:12,background:`linear-gradient(135deg,${msg.color}30,${msg.color}15)`,border:`2px solid ${msg.color}50`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,boxShadow:`0 4px 12px ${msg.color}25` }}>
                  <span style={{ color:msg.color,fontWeight:800,fontSize:13,fontFamily:"'Outfit',sans-serif" }}>{msg.name.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"baseline",gap:8,marginBottom:4 }}>
                    <span style={{ fontWeight:800,fontSize:13,color:msg.color,fontFamily:"'Outfit',sans-serif",textShadow:`0 0 8px ${msg.color}40` }}>{msg.name}</span>
                    <span style={{ fontSize:10,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{msg.time}</span>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.65)",backdropFilter:"blur(8px)",borderRadius:"4px 14px 14px 14px",padding:"10px 14px",fontSize:14,color:"#1e1b4b",lineHeight:1.65,borderLeft:`3px solid ${msg.color}`,boxShadow:"0 2px 12px rgba(124,58,237,0.08)",fontFamily:"'Outfit',sans-serif" }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>

          {/* Input area */}
          <div style={{ padding:14,borderTop:"1px solid rgba(124,58,237,0.1)",background:"rgba(255,255,255,0.4)" }}>
            {activeP && (
              <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
                <div style={{ width:7,height:7,borderRadius:"50%",background:activeP.color,boxShadow:`0 0 8px ${activeP.color}` }}/>
                <span style={{ fontSize:11,color:activeP.color,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"'Outfit',sans-serif" }}>Speaking as: {activeP.name}</span>
              </div>
            )}
            <div style={{ display:"flex",gap:8 }}>
              <textarea ref={inputRef} value={currentText} onChange={e=>setCurrentText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={isLive?`What did ${activeP?.name||"they"} say? (Enter to send)`:"Meeting ended"} disabled={!isLive} rows={2} style={{ ...inputS,flex:1,resize:"none",fontSize:13,padding:"10px 12px",background:isLive?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.3)" }}/>
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                <button onClick={sendMessage} disabled={!isLive||!currentText.trim()} style={{ background:activeP?`linear-gradient(135deg,${activeP.color},${activeP.color}cc)`:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:10,padding:"10px 13px",cursor:"pointer",opacity:(!isLive||!currentText.trim())?0.4:1,boxShadow:activeP&&isLive?`0 4px 16px ${activeP.color}40`:"none" }}>
                  <Icon name="zap" size={16} color="#fff"/>
                </button>
                <button onClick={isListening?stopMic:startMic} disabled={!isLive} style={{ background:isListening?"rgba(225,29,72,0.15)":"rgba(5,150,105,0.15)",border:`1.5px solid ${isListening?"rgba(225,29,72,0.4)":"rgba(5,150,105,0.4)"}`,borderRadius:10,padding:"10px 13px",cursor:"pointer",display:"flex",justifyContent:"center" }}>
                  <Icon name={isListening?"micOff":"mic"} size={16} color={isListening?"#e11d48":"#059669"}/>
                </button>
              </div>
            </div>
            {isListening && (
              <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:8,background:"rgba(225,29,72,0.08)",borderRadius:10,padding:"8px 12px",border:"1px solid rgba(225,29,72,0.2)" }}>
                <div style={{ display:"flex",gap:2 }}>{[1,2,3,4].map(i=><div key={i} style={{ width:3,borderRadius:3,background:"#e11d48",animation:`soundBar${i} 0.8s ease infinite`,animationDelay:`${i*0.1}s`,height:14 }}/>)}</div>
                <span style={{ fontSize:12,color:"#e11d48",fontWeight:700,fontFamily:"'Outfit',sans-serif" }}>Listening for {activeP?.name}... speak now!</span>
              </div>
            )}
            {isLive&&!isListening&&(
              <div style={{ marginTop:8,background:"rgba(5,150,105,0.08)",borderRadius:10,padding:"7px 12px",border:"1px solid rgba(5,150,105,0.2)" }}>
                <p style={{ fontSize:11,color:"#059669",margin:0,fontFamily:"'Outfit',sans-serif",fontWeight:500 }}>🎤 Mic not working? Click 🔒 in Chrome address bar → Microphone → Allow → Ctrl+R</p>
              </div>
            )}
          </div>
        </Glass>

        {/* Insights Panel */}
        <div style={{ display:"flex",flexDirection:"column",gap:12,overflowY:"auto" }}>
          <Glass style={{ padding:18 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <CardTitle>👥 Per-Person</CardTitle>
              {analyzing&&<Spinner size={14}/>}
            </div>
            {insights?.personSentiments?.length ? (
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {insights.personSentiments.map((ps,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:30,height:30,borderRadius:10,background:`linear-gradient(135deg,${ps.color}30,${ps.color}15)`,border:`2px solid ${ps.color}40`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <span style={{ color:ps.color,fontWeight:800,fontSize:12,fontFamily:"'Outfit',sans-serif" }}>{ps.name.charAt(0)}</span>
                    </div>
                    <span style={{ fontSize:13,color:"#3730a3",flex:1,fontFamily:"'Outfit',sans-serif",fontWeight:600 }}>{ps.name}</span>
                    <Badge color={sentimentColor(ps.sentiment)}>{ps.sentiment}</Badge>
                  </div>
                ))}
              </div>
            ):<p style={{ fontSize:12,color:"#a78bfa",textAlign:"center",padding:"10px 0",fontFamily:"'Outfit',sans-serif" }}>Appears after a few messages</p>}
          </Glass>

          <Glass style={{ padding:18 }}>
            <CardTitle>😊 Overall Sentiment</CardTitle>
            {insights?(
              <div>
                <span style={{ fontSize:24,fontWeight:900,color:sentimentColor(insights.sentiment),fontFamily:"'Outfit',sans-serif",textShadow:`0 2px 12px ${sentimentGlow(insights.sentiment)}` }}>{insights.sentiment}</span>
                <div style={{ marginTop:12 }}><SentimentBar breakdown={{positive:insights.posP,neutral:insights.neuP,negative:insights.negP}}/></div>
              </div>
            ):<p style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>Analyzing…</p>}
          </Glass>

          {insights?.speakerStats&&(
            <Glass style={{ padding:18 }}>
              <CardTitle>🗣️ Speaking Time</CardTitle>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {Object.entries(insights.speakerStats).sort((a,b)=>b[1].words-a[1].words).map(([name,s],i)=>{
                  const max=Math.max(...Object.values(insights.speakerStats).map(x=>x.words));
                  return(
                    <div key={i}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                        <span style={{ fontSize:12,fontWeight:700,color:s.color,fontFamily:"'Outfit',sans-serif" }}>{name}</span>
                        <span style={{ fontSize:11,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{s.words} words</span>
                      </div>
                      <div style={{ height:7,background:"rgba(124,58,237,0.1)",borderRadius:4 }}>
                        <div style={{ height:"100%",width:`${Math.round(s.words/max*100)}%`,background:`linear-gradient(90deg,${s.color},${s.color}80)`,borderRadius:4,transition:"width 0.6s ease",boxShadow:`0 0 8px ${s.color}50` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Glass>
          )}

          <Glass style={{ padding:18 }}>
            <CardTitle>⚡ Action Items</CardTitle>
            {insights?.actions?.length?(
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {insights.actions.map((a,i)=>(
                  <div key={i} style={{ fontSize:12,color:"#3730a3",background:"rgba(124,58,237,0.06)",borderRadius:10,padding:"8px 12px",borderLeft:"3px solid #7c3aed",lineHeight:1.6,fontFamily:"'Outfit',sans-serif" }}>{a}</div>
                ))}
              </div>
            ):<p style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>Detected automatically…</p>}
          </Glass>

          {insights?.keywords?.length>0&&(
            <Glass style={{ padding:18 }}>
              <CardTitle>🔑 Keywords</CardTitle>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {insights.keywords.map((kw,i)=>(
                  <span key={i} style={{ background:`linear-gradient(135deg,${PC[i%PC.length]}18,${PC[i%PC.length]}10)`,color:PC[i%PC.length],padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1.5px solid ${PC[i%PC.length]}30`,fontFamily:"'Outfit',sans-serif" }}>
                    {kw.word} <span style={{ opacity:0.5 }}>×{kw.count}</span>
                  </span>
                ))}
              </div>
            </Glass>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}
        @keyframes soundBar1{0%,100%{height:4px}50%{height:16px}}
        @keyframes soundBar2{0%,100%{height:8px}50%{height:20px}}
        @keyframes soundBar3{0%,100%{height:12px}50%{height:6px}}
        @keyframes soundBar4{0%,100%{height:6px}50%{height:18px}}
      `}</style>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// PDF EXPORT UTILITY
// ═══════════════════════════════════════════════════════════════════════════
function exportMeetingPDF(meeting) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>${meeting.title} — Meeting Report</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e1b4b; padding: 40px; }
        .header { background: linear-gradient(135deg,#4f46e5,#7c3aed); color: white; padding: 32px; border-radius: 16px; margin-bottom: 28px; }
        .header h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .header p { opacity: 0.85; font-size: 13px; }
        .meta { display: flex; gap: 20px; margin-top: 14px; flex-wrap: wrap; }
        .meta span { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .section { background: #f8f7ff; border-radius: 14px; padding: 24px; margin-bottom: 20px; border-left: 4px solid #7c3aed; }
        .section h2 { font-size: 16px; font-weight: 700; color: #4f46e5; margin-bottom: 14px; }
        .section p { font-size: 14px; line-height: 1.8; color: #374151; }
        .action-item { background: white; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; border-left: 3px solid #7c3aed; font-size: 13px; line-height: 1.6; color: #374151; }
        .sentiment-box { display: inline-block; padding: 10px 24px; border-radius: 12px; font-size: 22px; font-weight: 900; margin-bottom: 16px; }
        .keyword { display: inline-block; background: rgba(124,58,237,0.1); color: #7c3aed; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin: 3px; border: 1.5px solid rgba(124,58,237,0.2); }
        .footer { text-align: center; margin-top: 32px; color: #a78bfa; font-size: 12px; border-top: 1px solid #e9d5ff; padding-top: 16px; }
        .sentiment-bar { height: 12px; border-radius: 6px; overflow: hidden; display: flex; background: #e5e7eb; margin: 12px 0; }
        .bar-pos { height: 100%; background: linear-gradient(90deg,#059669,#34d399); }
        .bar-neu { height: 100%; background: linear-gradient(90deg,#d97706,#fbbf24); }
        .bar-neg { height: 100%; background: linear-gradient(90deg,#e11d48,#fb7185); }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${meeting.title}</h1>
        <p>AI-Generated Meeting Insights Report</p>
        <div class="meta">
          <span>📅 ${new Date(meeting.created_at).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
          <span>📝 ${meeting.word_count?.toLocaleString() || 0} words</span>
          <span>⚡ ${meeting.action_items?.length || 0} action items</span>
          ${meeting.sentiment ? `<span>😊 ${meeting.sentiment}</span>` : ''}
        </div>
      </div>

      <div class="section">
        <h2>📋 Meeting Summary</h2>
        <p>${meeting.summary || 'No summary available.'}</p>
      </div>

      <div class="section">
        <h2>⚡ Action Items (${meeting.action_items?.length || 0})</h2>
        ${meeting.action_items?.length ? meeting.action_items.map((a,i) => `<div class="action-item"><strong>#${i+1}</strong> ${a}</div>`).join('') : '<p>No action items detected.</p>'}
      </div>

      <div class="section">
        <h2>😊 Sentiment Analysis</h2>
        <div class="sentiment-box" style="background:${meeting.sentiment==='Positive'?'rgba(5,150,105,0.12)':meeting.sentiment==='Negative'?'rgba(225,29,72,0.12)':'rgba(217,119,6,0.12)'};color:${meeting.sentiment==='Positive'?'#059669':meeting.sentiment==='Negative'?'#e11d48':'#d97706'}">
          ${meeting.sentiment || 'N/A'}
        </div>
        ${meeting.sentiment_breakdown ? `
        <div class="sentiment-bar">
          <div class="bar-pos" style="width:${meeting.sentiment_breakdown.positive||0}%"></div>
          <div class="bar-neu" style="width:${meeting.sentiment_breakdown.neutral||0}%"></div>
          <div class="bar-neg" style="width:${meeting.sentiment_breakdown.negative||0}%"></div>
        </div>
        <p style="font-size:13px;color:#6b7280">
          Positive: ${meeting.sentiment_breakdown.positive||0}% &nbsp;|&nbsp;
          Neutral: ${meeting.sentiment_breakdown.neutral||0}% &nbsp;|&nbsp;
          Negative: ${meeting.sentiment_breakdown.negative||0}%
        </p>` : ''}
      </div>

      <div class="section">
        <h2>🔑 Top Keywords</h2>
        <div>${meeting.keywords?.map(k => `<span class="keyword">${k.word} ×${k.count}</span>`).join('') || 'No keywords.'}</div>
      </div>

      <div class="footer">
        Generated by Smart Meeting Insights Platform • ${new Date().toLocaleDateString()} • Powered by AI
      </div>
    </body>
    </html>
  `;
  const win = window.open('','_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH PAGE
// ═══════════════════════════════════════════════════════════════════════════
const TAGS = ["All","Sprint Planning","Client Call","HR","Product","Finance","Engineering","Marketing","Strategy","Daily Standup"];

function SearchPage() {
  const { setPage, setSelectedMeeting, addToast } = useApp();
  const [meetings, setMeetings] = useState([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [sentiment, setSentiment] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiFetch("/transcripts/").then(setMeetings).catch(e => addToast(e.message,"error")).finally(() => setLoading(false)); }, []);

  const filtered = meetings.filter(m => {
    const matchQ = !query.trim() || m.title.toLowerCase().includes(query.toLowerCase());
    const matchS = sentiment === "All" || m.sentiment === sentiment;
    const matchT = tag === "All" || (m.title + " ").toLowerCase().includes(tag.toLowerCase());
    return matchQ && matchS && matchT;
  });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20,animation:"floatIn 0.5s cubic-bezier(.175,.885,.32,1.275)" }}>
      <div>
        <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(124,58,237,0.1)",borderRadius:20,padding:"5px 14px",marginBottom:12,border:"1px solid rgba(124,58,237,0.2)" }}>
          <Icon name="search" size={12} color="#7c3aed"/>
          <span style={{ fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:"0.08em",fontFamily:"'Outfit',sans-serif" }}>SMART SEARCH</span>
        </div>
        <h2 style={{ fontSize:28,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.5px" }}>Search Meetings</h2>
        <p style={{ color:"#6d28d9",fontSize:14,marginTop:4,fontFamily:"'Outfit',sans-serif" }}>Find any meeting instantly by title, sentiment or category</p>
      </div>

      {/* Search bar */}
      <Glass style={{ padding:20 }}>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }}>
            <Icon name="search" size={18} color="#a78bfa"/>
          </div>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search meeting titles..."
            style={{ ...inputS, paddingLeft:44, fontSize:15 }}
            autoFocus
          />
        </div>
      </Glass>

      {/* Filters */}
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <Icon name="filter" size={14} color="#a78bfa"/>
          <span style={{ fontSize:12,color:"#6d28d9",fontWeight:700,fontFamily:"'Outfit',sans-serif" }}>SENTIMENT:</span>
          {["All","Positive","Neutral","Negative"].map(s => (
            <button key={s} onClick={() => setSentiment(s)} style={{ padding:"6px 14px",borderRadius:20,border:`1.5px solid ${sentiment===s?sentimentColor(s==="All"?"N":s):"rgba(124,58,237,0.2)"}`,background:sentiment===s?`${sentimentColor(s==="All"?"N":s)}18`:"rgba(255,255,255,0.6)",color:sentiment===s?sentimentColor(s==="All"?"N":s):"#6d28d9",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",backdropFilter:"blur(8px)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Category tags */}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        {TAGS.map(t => (
          <button key={t} onClick={() => setTag(t)} style={{ padding:"6px 16px",borderRadius:20,border:`1.5px solid ${tag===t?"#7c3aed":"rgba(124,58,237,0.15)"}`,background:tag===t?"linear-gradient(135deg,#7c3aed20,#a855f710)":"rgba(255,255,255,0.5)",color:tag===t?"#7c3aed":"#94a3b8",fontWeight:tag===t?700:500,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",backdropFilter:"blur(8px)",transition:"all 0.15s" }}>
            {t===tag&&"✓ "}{t}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:13,color:"#6d28d9",fontFamily:"'Outfit',sans-serif",fontWeight:600 }}>
          {loading ? "Loading..." : `${filtered.length} meeting${filtered.length!==1?"s":""} found`}
        </span>
        {query && <button onClick={() => setQuery("")} style={{ fontSize:12,color:"#e11d48",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600 }}>✕ Clear search</button>}
      </div>

      {/* Results */}
      {loading ? <div style={{ display:"flex",justifyContent:"center",padding:60 }}><Spinner size={40}/></div> : (
        filtered.length === 0 ? (
          <Glass style={{ textAlign:"center",padding:"60px 0" }}>
            <div style={{ fontSize:44 }}>🔍</div>
            <p style={{ color:"#6d28d9",marginTop:14,fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:15 }}>No meetings found for "{query}"</p>
            <p style={{ color:"#a78bfa",marginTop:6,fontFamily:"'Outfit',sans-serif",fontSize:13 }}>Try a different search term or filter</p>
          </Glass>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {filtered.map(m => {
              const titleLower = m.title.toLowerCase();
              const qLower = query.toLowerCase();
              const idx = titleLower.indexOf(qLower);
              const highlightedTitle = query && idx >= 0
                ? <>{m.title.slice(0,idx)}<mark style={{ background:"rgba(124,58,237,0.2)",color:"#4f46e5",borderRadius:4,padding:"0 2px" }}>{m.title.slice(idx,idx+query.length)}</mark>{m.title.slice(idx+query.length)}</>
                : m.title;
              return (
                <Glass key={m.id} className="card-hover" style={{ padding:"18px 22px",display:"flex",alignItems:"center",gap:16 }}>
                  <div style={{ width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#7c3aed20,#a855f720)",border:"1.5px solid rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <Icon name="file" size={18} color="#7c3aed"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700,color:"#1e1b4b",fontSize:15,fontFamily:"'Outfit',sans-serif" }}>{highlightedTitle}</span>
                      {m.sentiment && <Badge color={sentimentColor(m.sentiment)}>{m.sentiment}</Badge>}
                    </div>
                    <div style={{ display:"flex",gap:14,marginTop:5 }}>
                      <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{fmtDate(m.created_at)}</span>
                      {m.word_count && <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{m.word_count.toLocaleString()} words</span>}
                      <span style={{ fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>{m.action_items_count || 0} actions</span>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedMeeting(m.id); setPage("detail"); }} style={ghostBtn}>
                    <Icon name="eye" size={15}/> View
                  </button>
                </Glass>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ─── Action Item Tracker Component ───────────────────────────────────────────
function ActionTracker({ items, meetingId }) {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`actions_${meetingId}`) || "{}"); }
    catch { return {}; }
  });

  const toggle = (i) => {
    const updated = { ...checked, [i]: !checked[i] };
    setChecked(updated);
    try { localStorage.setItem(`actions_${meetingId}`, JSON.stringify(updated)); } catch {}
  };

  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = items?.length || 0;
  const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <CardTitle>⚡ Action Items ({total})</CardTitle>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ fontSize:13,color:"#6d28d9",fontFamily:"'Outfit',sans-serif",fontWeight:700 }}>
            {doneCount}/{total} done
          </div>
          {doneCount > 0 && (
            <button onClick={() => { setChecked({}); try { localStorage.removeItem(`actions_${meetingId}`); } catch {} }} style={{ fontSize:11,color:"#e11d48",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600 }}>Reset</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
            <span style={{ fontSize:12,color:"#6d28d9",fontFamily:"'Outfit',sans-serif" }}>Progress</span>
            <span style={{ fontSize:12,fontWeight:700,color:pct===100?"#059669":"#7c3aed",fontFamily:"'Outfit',sans-serif" }}>{pct}%</span>
          </div>
          <div style={{ height:8,background:"rgba(124,58,237,0.1)",borderRadius:4,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${pct}%`,background:pct===100?"linear-gradient(90deg,#059669,#34d399)":"linear-gradient(90deg,#7c3aed,#a855f7)",borderRadius:4,transition:"width 0.5s ease",boxShadow:pct===100?"0 0 10px rgba(5,150,105,0.4)":"0 0 10px rgba(124,58,237,0.4)" }}/>
          </div>
          {pct===100 && <p style={{ fontSize:12,color:"#059669",fontWeight:700,marginTop:6,fontFamily:"'Outfit',sans-serif",textAlign:"center" }}>🎉 All action items completed!</p>}
        </div>
      )}

      {items?.length ? (
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {items.map((item,i) => (
            <div key={i} onClick={() => toggle(i)} style={{ display:"flex",gap:14,background:checked[i]?"linear-gradient(135deg,rgba(5,150,105,0.08),rgba(52,211,153,0.04))":"linear-gradient(135deg,rgba(124,58,237,0.06),rgba(168,85,247,0.04))",borderRadius:14,padding:"14px 16px",borderLeft:`4px solid ${checked[i]?"#059669":"#7c3aed"}`,border:`1px solid ${checked[i]?"rgba(5,150,105,0.2)":"rgba(124,58,237,0.12)"}`,borderLeftWidth:4,cursor:"pointer",transition:"all 0.2s",opacity:checked[i]?0.75:1 }}>
              <div style={{ width:26,height:26,background:checked[i]?"linear-gradient(135deg,#059669,#34d399)":"linear-gradient(135deg,#7c3aed,#a855f7)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${checked[i]?"rgba(5,150,105,0.35)":"rgba(124,58,237,0.35)"}`,transition:"all 0.2s" }}>
                {checked[i]
                  ? <Icon name="check" size={13} color="#fff"/>
                  : <span style={{ color:"#fff",fontSize:11,fontWeight:800,fontFamily:"'Outfit',sans-serif" }}>{i+1}</span>
                }
              </div>
              <p style={{ fontSize:14,color:checked[i]?"#6b7280":"#3730a3",lineHeight:1.7,margin:0,fontFamily:"'Outfit',sans-serif",textDecoration:checked[i]?"line-through":"none",transition:"all 0.2s" }}>{item}</p>
            </div>
          ))}
        </div>
      ) : <p style={{ color:"#a78bfa",fontFamily:"'Outfit',sans-serif" }}>No action items detected.</p>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// ROOM MEETING PAGE — Real-time multi-user WebSocket meeting
// ═══════════════════════════════════════════════════════════════════════════
const ROOM_COLORS = ["#7c3aed","#0891b2","#d97706","#e11d48","#059669","#db2777","#ea580c","#0284c7","#65a30d","#9333ea"];

function RoomPage() {
  const { addToast, setPage, setSelectedMeeting } = useApp();

  // ── Setup state ──
  const [screen, setScreen] = useState("lobby"); // lobby | create | join | room
  const [myName, setMyName] = useState("");
  const [myColor, setMyColor] = useState(ROOM_COLORS[Math.floor(Math.random()*ROOM_COLORS.length)]);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Room state ──
  const [roomCode, setRoomCode] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [duration, setDuration] = useState(0);
  const [insights, setInsights] = useState(null);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // connecting|connected|disconnected

  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const analyzeTimerRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  useEffect(() => {
    if (screen === "room") {
      timerRef.current = setInterval(() => setDuration(d => d+1), 1000);
      analyzeTimerRef.current = setInterval(() => {
        setMessages(msgs => { if(msgs.length > 2) analyzeRoomTranscript(msgs); return msgs; });
      }, 15000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(analyzeTimerRef.current);
      setDuration(0);
    }
    return () => { clearInterval(timerRef.current); clearInterval(analyzeTimerRef.current); };
  }, [screen]);

  // Cleanup WS on unmount
  useEffect(() => () => { wsRef.current?.close(); }, []);

  const fmtDur = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // ── Analyze transcript ──
  const analyzeRoomTranscript = (msgs) => {
    const text = msgs.map(m => `${m.name}: ${m.text}`).join("\n");
    if (!text.trim() || text.length < 30) return;
    const pos = ["great","excellent","good","positive","agree","success","wonderful","amazing","perfect","happy","pleased","effective","productive","resolved","achieved","glad","appreciate","improve","better","outstanding","helpful","excited","confident","strong","best","completed","done"];
    const neg = ["bad","issue","problem","concern","fail","failed","poor","delay","delayed","disappointed","difficult","challenge","obstacle","risk","missing","missed","wrong","error","mistake","disagree","negative","reject","incomplete","stuck","blocker","blocked","worse","worst","cannot","impossible","frustrated","critical","serious"];
    const tokens = text.toLowerCase().match(/\b[a-zA-Z]+\b/g)||[];
    const posC = tokens.filter(t=>pos.includes(t)).length, negC = tokens.filter(t=>neg.includes(t)).length;
    const score = (posC-negC)/Math.max(posC+negC,1);
    const sentiment = score>0.1?"Positive":score<-0.1?"Negative":"Neutral";
    const posP = Math.min(100,Math.round(posC/Math.max(tokens.length,1)*100));
    const negP = Math.min(100,Math.round(negC/Math.max(tokens.length,1)*100));
    const ap = /\b(will|shall|should|must|need to|please|follow.?up|next step|deadline|complete|finish|deliver|send|review|update|prepare|schedule|ensure|make sure)\b/i;
    const actions = msgs.filter(m=>ap.test(m.text)).map(m=>`${m.name}: ${m.text}`).slice(0,6);
    const sw = new Set(["i","me","my","we","our","you","your","he","she","it","they","the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","are","were","be","been","have","has","had","do","does","did","will","this","that","so","if","then","as","up","about","not","just","also","very","too","can","all","both","ok","yes","yeah","um","uh","s","t","re","ll","ve"]);
    const freq={};tokens.filter(t=>!sw.has(t)&&t.length>3).forEach(t=>{freq[t]=(freq[t]||0)+1;});
    const keywords=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([word,count])=>({word,count}));
    const perP={};msgs.forEach(m=>{if(!perP[m.name])perP[m.name]={pos:0,neg:0,color:m.color,count:0,words:0};const w=m.text.toLowerCase().match(/\b[a-zA-Z]+\b/g)||[];perP[m.name].pos+=w.filter(t=>pos.includes(t)).length;perP[m.name].neg+=w.filter(t=>neg.includes(t)).length;perP[m.name].count++;perP[m.name].words+=m.text.split(/\s+/).length;});
    const personSentiments=Object.entries(perP).map(([name,d])=>{const sc=(d.pos-d.neg)/Math.max(d.pos+d.neg,1);return{name,sentiment:sc>0.1?"Positive":sc<-0.1?"Negative":"Neutral",color:d.color,words:d.words};});
    setInsights({sentiment,score:score.toFixed(2),posP,negP,neuP:Math.max(0,100-posP-negP),actions,keywords,personSentiments});
  };

  // ── Create room ──
  const createRoom = async () => {
    if (!myName.trim()) { addToast("Enter your name first!","error"); return; }
    if (!meetingTitle.trim()) { addToast("Enter a meeting title!","error"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/rooms/create", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({title: meetingTitle.trim()}) });
      setRoomCode(res.room_code);
      setRoomTitle(meetingTitle.trim());
      connectWebSocket(res.room_code);
    } catch(e) { addToast(e.message,"error"); setLoading(false); }
  };

  // ── Join room ──
  const joinRoom = async () => {
    if (!myName.trim()) { addToast("Enter your name first!","error"); return; }
    if (!joinCode.trim()) { addToast("Enter a room code!","error"); return; }
    const code = joinCode.trim().toUpperCase();
    setLoading(true);
    try {
      const info = await apiFetch(`/rooms/check/${code}`);
      setRoomCode(code);
      setRoomTitle(info.title);
      connectWebSocket(code);
    } catch(e) { addToast(`Room not found: ${joinCode.toUpperCase()}. Check the code!`,"error"); setLoading(false); }
  };

  // ── Connect WebSocket ──
  const connectWebSocket = (code) => {
    const wsUrl = `ws://localhost:8000/api/rooms/ws/${code}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setConnectionStatus("connecting");

    ws.onopen = () => {
      setConnectionStatus("connected");
      ws.send(JSON.stringify({ type:"join", name: myName.trim(), color: myColor }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "room_joined") {
        setMessages(data.messages || []);
        setParticipants(data.participant_count || 1);
        setScreen("room");
        setLoading(false);
        addToast(`Joined room ${code} successfully! 🎉`,"success");
      } else if (data.type === "message") {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      } else if (data.type === "user_joined") {
        setParticipants(data.participant_count);
        addToast(`${data.name} joined the meeting!`,"info");
      } else if (data.type === "user_left") {
        setParticipants(data.participant_count);
        addToast(`${data.name} left the meeting`,"info");
      } else if (data.type === "error") {
        addToast(data.message,"error");
        setLoading(false);
        setScreen("lobby");
      }
    };

    ws.onerror = () => {
      setConnectionStatus("disconnected");
      addToast("Connection error. Make sure backend is running!","error");
      setLoading(false);
      setScreen("lobby");
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };
  };

  // ── Send message ──
  const sendMessage = () => {
    if (!currentText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type:"message", text: currentText.trim() }));
    setCurrentText("");
    inputRef.current?.focus();
  };

  // ── Mic ──
  const startMic = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addToast("Use Google Chrome for mic!","error"); return; }
    try { await navigator.mediaDevices.getUserMedia({audio:true}); } catch(e) {
      addToast("Mic blocked! Click 🔒 in address bar → Microphone → Allow.","error"); return;
    }
    const r = new SR(); r.continuous=false; r.interimResults=false; r.lang="en-US";
    r.onresult=(e)=>{
      const text=e.results[0][0].transcript;
      if (!text.trim()) return;
      if (wsRef.current && wsRef.current.readyState===WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({type:"message",text:text.trim()}));
      }
      setIsListening(false);
      addToast(`Sent: "${text.substring(0,40)}"`, "success");
    };
    r.onerror=(ev)=>{ setIsListening(false); const m={"not-allowed":"Mic blocked!","no-speech":"No speech detected. Try again!"}; addToast(m[ev.error]||`Mic error: ${ev.error}`,"error"); };
    r.onend=()=>setIsListening(false);
    recognitionRef.current=r;
    try { r.start(); setIsListening(true); } catch { addToast("Could not start mic.","error"); }
  };

  const stopMic = () => { recognitionRef.current?.stop(); setIsListening(false); };

  // ── Leave room ──
  const leaveRoom = () => {
    wsRef.current?.close();
    setScreen("lobby");
    setMessages([]);
    setInsights(null);
    setRoomCode("");
    setParticipants(0);
  };

  // ── Save to dashboard ──
  const saveToDashboard = async () => {
    if (!messages.length) { addToast("No messages to save!","error"); return; }
    setSaving(true);
    try {
      const transcript = messages.map(m=>`${m.name}: ${m.text}`).join("\n");
      const fd = new FormData(); fd.append("title", roomTitle); fd.append("text_content", transcript);
      const res = await apiFetch("/transcripts/upload",{method:"POST",body:fd});
      addToast("Meeting saved to dashboard!","success");
      setSelectedMeeting(res.id); setPage("detail");
    } catch(e) { addToast(e.message,"error"); } finally { setSaving(false); }
  };

  // ════════════════════════════════
  // LOBBY SCREEN
  // ════════════════════════════════
  if (screen === "lobby") return (
    <div style={{maxWidth:600,margin:"0 auto",display:"flex",flexDirection:"column",gap:20,animation:"floatIn 0.5s cubic-bezier(.175,.885,.32,1.275)"}}>
      <div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(8,145,178,0.1)",borderRadius:20,padding:"5px 14px",marginBottom:12,border:"1px solid rgba(8,145,178,0.25)"}}>
          <div style={{width:7,height:7,background:"#0891b2",borderRadius:"50%",animation:"pulse 1.5s infinite"}}/>
          <span style={{fontSize:11,color:"#0891b2",fontWeight:700,letterSpacing:"0.08em",fontFamily:"'Outfit',sans-serif"}}>MULTI-USER ROOMS</span>
        </div>
        <h2 style={{fontSize:28,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.5px"}}>Team Meeting Room</h2>
        <p style={{color:"#6d28d9",fontSize:14,marginTop:4,fontFamily:"'Outfit',sans-serif"}}>Create a room or join your team's meeting with a code</p>
      </div>

      {/* Name + Color */}
      <Glass style={{padding:24}}>
        <label style={labelS}>Your Name *</label>
        <input value={myName} onChange={e=>setMyName(e.target.value)} placeholder="Enter your name..." style={inputS}/>
        <div style={{marginTop:16}}>
          <label style={labelS}>Your Color</label>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
            {ROOM_COLORS.map(c=>(
              <button key={c} onClick={()=>setMyColor(c)} style={{width:34,height:34,borderRadius:"50%",background:c,border:myColor===c?"3px solid #1e1b4b":"3px solid transparent",cursor:"pointer",boxShadow:myColor===c?`0 0 12px ${c}80`:"none",transition:"all 0.15s"}}/>
            ))}
          </div>
        </div>
      </Glass>

      {/* Action cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Create Room */}
        <Glass style={{padding:24,cursor:"pointer",border:"1.5px solid rgba(124,58,237,0.25)"}} className="card-hover" onClick={()=>setScreen("create")}>
          <div style={{width:48,height:48,background:"linear-gradient(135deg,#7c3aed,#a855f7)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:"0 8px 24px rgba(124,58,237,0.3)"}}>
            <Icon name="plus" size={24} color="white"/>
          </div>
          <h3 style={{fontSize:16,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",marginBottom:6}}>Create Room</h3>
          <p style={{fontSize:12,color:"#6d28d9",fontFamily:"'Outfit',sans-serif",lineHeight:1.6}}>Start a new meeting and invite your team with a code</p>
        </Glass>

        {/* Join Room */}
        <Glass style={{padding:24,cursor:"pointer",border:"1.5px solid rgba(8,145,178,0.25)"}} className="card-hover" onClick={()=>setScreen("join")}>
          <div style={{width:48,height:48,background:"linear-gradient(135deg,#0891b2,#06b6d4)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:"0 8px 24px rgba(8,145,178,0.3)"}}>
            <Icon name="arrowLeft" size={24} color="white"/>
          </div>
          <h3 style={{fontSize:16,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",marginBottom:6}}>Join Room</h3>
          <p style={{fontSize:12,color:"#0891b2",fontFamily:"'Outfit',sans-serif",lineHeight:1.6}}>Enter a room code shared by your host to join the meeting</p>
        </Glass>
      </div>

      {/* How it works */}
      <Glass style={{padding:20}}>
        <h3 style={{fontSize:13,fontWeight:700,color:"#4f46e5",fontFamily:"'Outfit',sans-serif",marginBottom:12}}>💡 How It Works</h3>
        {[
          ["1","Host creates a room and gets a code like MEET-A7X2","#7c3aed"],
          ["2","Share the code with your team via WhatsApp, email, etc.","#0891b2"],
          ["3","Everyone joins from their own computer or phone","#059669"],
          ["4","Type or speak — everyone sees it in real time","#d97706"],
          ["5","AI analyzes insights live for the whole team","#e11d48"],
        ].map(([n,text,color])=>(
          <div key={n} style={{display:"flex",gap:12,marginBottom:10,alignItems:"flex-start"}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:`${color}20`,border:`1.5px solid ${color}50`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:11,fontWeight:800,color,fontFamily:"'Outfit',sans-serif"}}>{n}</span>
            </div>
            <p style={{fontSize:13,color:"#374151",fontFamily:"'Outfit',sans-serif",lineHeight:1.6,margin:0}}>{text}</p>
          </div>
        ))}
      </Glass>
    </div>
  );

  // ════════════════════════════════
  // CREATE SCREEN
  // ════════════════════════════════
  if (screen === "create") return (
    <div style={{maxWidth:500,margin:"0 auto",display:"flex",flexDirection:"column",gap:20,animation:"floatIn 0.5s ease"}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <button onClick={()=>setScreen("lobby")} style={ghostBtn}><Icon name="arrowLeft" size={15}/></button>
        <h2 style={{fontSize:22,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif"}}>Create Meeting Room</h2>
      </div>
      <Glass style={{padding:24}}>
        <label style={labelS}>Meeting Title *</label>
        <input value={meetingTitle} onChange={e=>setMeetingTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createRoom()} placeholder="e.g. Q3 Sprint Review" style={inputS}/>
        <div style={{marginTop:16,background:"rgba(124,58,237,0.06)",borderRadius:12,padding:14,border:"1px solid rgba(124,58,237,0.15)"}}>
          <p style={{fontSize:12,color:"#6d28d9",fontFamily:"'Outfit',sans-serif",lineHeight:1.6}}>
            You are joining as <strong style={{color:"#7c3aed"}}>{myName||"(no name)"}</strong>
            <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:myColor,marginLeft:8,boxShadow:`0 0 6px ${myColor}`,verticalAlign:"middle"}}/>
          </p>
        </div>
      </Glass>
      <button onClick={createRoom} disabled={loading} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"'Outfit',sans-serif",boxShadow:"0 6px 28px rgba(124,58,237,0.4)"}}>
        {loading?<><Spinner size={20} color="white"/> Creating Room…</>:<><Icon name="play" size={18} color="white"/> Create & Enter Room</>}
      </button>
    </div>
  );

  // ════════════════════════════════
  // JOIN SCREEN
  // ════════════════════════════════
  if (screen === "join") return (
    <div style={{maxWidth:500,margin:"0 auto",display:"flex",flexDirection:"column",gap:20,animation:"floatIn 0.5s ease"}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <button onClick={()=>setScreen("lobby")} style={ghostBtn}><Icon name="arrowLeft" size={15}/></button>
        <h2 style={{fontSize:22,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif"}}>Join Meeting Room</h2>
      </div>
      <Glass style={{padding:24}}>
        <label style={labelS}>Room Code *</label>
        <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&joinRoom()} placeholder="e.g. MEET-A7X2" style={{...inputS,textTransform:"uppercase",fontSize:18,fontWeight:700,letterSpacing:"0.1em",textAlign:"center"}}/>
        <div style={{marginTop:16,background:"rgba(8,145,178,0.06)",borderRadius:12,padding:14,border:"1px solid rgba(8,145,178,0.15)"}}>
          <p style={{fontSize:12,color:"#0891b2",fontFamily:"'Outfit',sans-serif",lineHeight:1.6}}>
            Joining as <strong style={{color:"#0891b2"}}>{myName||"(no name)"}</strong>
            <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:myColor,marginLeft:8,boxShadow:`0 0 6px ${myColor}`,verticalAlign:"middle"}}/>
          </p>
        </div>
      </Glass>
      <button onClick={joinRoom} disabled={loading} style={{background:"linear-gradient(135deg,#0891b2,#06b6d4)",color:"#fff",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"'Outfit',sans-serif",boxShadow:"0 6px 28px rgba(8,145,178,0.4)"}}>
        {loading?<><Spinner size={20} color="white"/> Joining…</>:<><Icon name="arrowLeft" size={18} color="white"/> Join Room</>}
      </button>
    </div>
  );

  // ════════════════════════════════
  // ACTIVE ROOM SCREEN
  // ════════════════════════════════
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,height:"calc(100vh - 100px)",animation:"floatIn 0.4s ease"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <h2 style={{fontSize:20,fontWeight:800,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif"}}>{roomTitle}</h2>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(8,145,178,0.12)",borderRadius:10,padding:"5px 12px",border:"1px solid rgba(8,145,178,0.25)"}}>
              <div style={{width:7,height:7,background:"#0891b2",borderRadius:"50%",animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:12,fontWeight:700,color:"#0891b2",fontFamily:"'Outfit',sans-serif"}}>LIVE {fmtDur(duration)}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:12,marginTop:4}}>
            <span style={{fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>👥 {participants} participant{participants!==1?"s":""}</span>
            <span style={{fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>💬 {messages.length} messages</span>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {/* Room code badge */}
          <div style={{background:"rgba(124,58,237,0.1)",borderRadius:10,padding:"8px 14px",border:"1.5px solid rgba(124,58,237,0.25)",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:"#6d28d9",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>CODE:</span>
            <span style={{fontSize:15,fontWeight:900,color:"#7c3aed",fontFamily:"'Outfit',sans-serif",letterSpacing:"0.08em"}}>{roomCode}</span>
            <button onClick={()=>{navigator.clipboard.writeText(roomCode);addToast("Room code copied!","success");}} style={{background:"none",border:"none",cursor:"pointer",color:"#a78bfa"}}>
              <Icon name="copy" size={13}/>
            </button>
          </div>
          <button onClick={leaveRoom} style={{...ghostBtn,color:"#e11d48",borderColor:"rgba(225,29,72,0.3)"}}>
            Leave Room
          </button>
          <button onClick={saveToDashboard} disabled={saving||!messages.length} style={{...primaryBtn,opacity:!messages.length?0.5:1}}>
            {saving?<><Spinner size={14} color="#fff"/> Saving…</>:<><Icon name="save" size={14} color="#fff"/> Save to Dashboard</>}
          </button>
        </div>
      </div>

      {/* Share tip */}
      <div style={{background:"linear-gradient(135deg,rgba(8,145,178,0.08),rgba(6,182,212,0.05))",borderRadius:12,padding:"12px 18px",border:"1px solid rgba(8,145,178,0.2)",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:18}}>📤</span>
        <p style={{fontSize:13,color:"#0891b2",fontFamily:"'Outfit',sans-serif",fontWeight:500,margin:0}}>
          Share code <strong style={{letterSpacing:"0.05em"}}>{roomCode}</strong> with your team. They go to <strong>Room Meeting</strong> page → click <strong>Join Room</strong> → enter this code!
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16,flex:1,minHeight:0}}>
        {/* Chat */}
        <Glass style={{display:"flex",flexDirection:"column",overflow:"hidden",border:"2px solid rgba(8,145,178,0.3)",boxShadow:"0 0 40px rgba(8,145,178,0.08)"}}>
          <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:14}}>
            {messages.length===0?(
              <div style={{textAlign:"center",padding:"50px 0"}}>
                <div style={{fontSize:44}}>👋</div>
                <p style={{marginTop:12,fontSize:14,fontFamily:"'Outfit',sans-serif",fontWeight:600,color:"#6d28d9"}}>You're in the room! Start speaking or typing.</p>
                <p style={{fontSize:12,color:"#a78bfa",marginTop:6,fontFamily:"'Outfit',sans-serif"}}>Waiting for others to join...</p>
              </div>
            ):messages.map((msg,i)=>{
              const isMe = msg.name === myName;
              return (
                <div key={`${msg.id}-${i}`} style={{display:"flex",gap:10,alignItems:"flex-start",flexDirection:isMe?"row-reverse":"row",animation:"floatIn 0.2s ease"}}>
                  <div style={{width:34,height:34,borderRadius:12,background:`linear-gradient(135deg,${msg.color}30,${msg.color}15)`,border:`2px solid ${msg.color}50`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,boxShadow:`0 4px 12px ${msg.color}25`}}>
                    <span style={{color:msg.color,fontWeight:800,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>{msg.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{flex:1,maxWidth:"75%"}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4,justifyContent:isMe?"flex-end":"flex-start"}}>
                      <span style={{fontWeight:800,fontSize:13,color:msg.color,fontFamily:"'Outfit',sans-serif"}}>{isMe?"You":msg.name}</span>
                      <span style={{fontSize:10,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>{msg.time}</span>
                    </div>
                    <div style={{background:isMe?`linear-gradient(135deg,${msg.color}20,${msg.color}10)`:"rgba(255,255,255,0.65)",backdropFilter:"blur(8px)",borderRadius:isMe?"14px 4px 14px 14px":"4px 14px 14px 14px",padding:"10px 14px",fontSize:14,color:"#1e1b4b",lineHeight:1.65,borderLeft:isMe?"none":`3px solid ${msg.color}`,borderRight:isMe?`3px solid ${msg.color}`:"none",boxShadow:"0 2px 12px rgba(124,58,237,0.08)",fontFamily:"'Outfit',sans-serif",fontWeight:500}}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef}/>
          </div>

          {/* Input */}
          <div style={{padding:14,borderTop:"1px solid rgba(124,58,237,0.1)",background:"rgba(255,255,255,0.4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:myColor,boxShadow:`0 0 8px ${myColor}`}}/>
              <span style={{fontSize:11,color:myColor,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"'Outfit',sans-serif"}}>You ({myName})</span>
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:connectionStatus==="connected"?"#059669":"#e11d48"}}/>
                <span style={{fontSize:10,color:connectionStatus==="connected"?"#059669":"#e11d48",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>{connectionStatus}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <textarea value={currentText} onChange={e=>setCurrentText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Type your message... (Enter to send)" rows={2} style={{...inputS,flex:1,resize:"none",fontSize:13,padding:"10px 12px"}}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button onClick={sendMessage} disabled={!currentText.trim()||connectionStatus!=="connected"} style={{background:`linear-gradient(135deg,${myColor},${myColor}cc)`,border:"none",borderRadius:10,padding:"10px 13px",cursor:"pointer",opacity:(!currentText.trim()||connectionStatus!=="connected")?0.4:1,boxShadow:`0 4px 16px ${myColor}40`}}>
                  <Icon name="zap" size={16} color="#fff"/>
                </button>
                <button onClick={isListening?stopMic:startMic} style={{background:isListening?"rgba(225,29,72,0.15)":"rgba(5,150,105,0.15)",border:`1.5px solid ${isListening?"rgba(225,29,72,0.4)":"rgba(5,150,105,0.4)"}`,borderRadius:10,padding:"10px 13px",cursor:"pointer",display:"flex",justifyContent:"center"}}>
                  <Icon name={isListening?"micOff":"mic"} size={16} color={isListening?"#e11d48":"#059669"}/>
                </button>
              </div>
            </div>
            {isListening&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,background:"rgba(225,29,72,0.08)",borderRadius:10,padding:"8px 12px"}}>
                <div style={{display:"flex",gap:2}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,borderRadius:3,background:"#e11d48",animation:`soundBar${i} 0.8s ease infinite`,animationDelay:`${i*0.1}s`,height:14}}/>)}</div>
                <span style={{fontSize:12,color:"#e11d48",fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>Listening... speak now!</span>
              </div>
            )}
          </div>
        </Glass>

        {/* Insights */}
        <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
          <Glass style={{padding:18}}>
            <CardTitle>😊 Overall Sentiment</CardTitle>
            {insights?(
              <div>
                <span style={{fontSize:24,fontWeight:900,color:sentimentColor(insights.sentiment),fontFamily:"'Outfit',sans-serif",textShadow:`0 2px 12px ${sentimentGlow(insights.sentiment)}`}}>{insights.sentiment}</span>
                <div style={{marginTop:12,height:8,borderRadius:4,overflow:"hidden",display:"flex",background:"rgba(0,0,0,0.06)"}}>
                  <div style={{width:`${insights.posP}%`,background:"linear-gradient(90deg,#059669,#34d399)",transition:"width 0.6s"}}/>
                  <div style={{width:`${insights.neuP}%`,background:"linear-gradient(90deg,#d97706,#fbbf24)",transition:"width 0.6s"}}/>
                  <div style={{width:`${insights.negP}%`,background:"linear-gradient(90deg,#e11d48,#fb7185)",transition:"width 0.6s"}}/>
                </div>
              </div>
            ):<p style={{fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>Analyzing after a few messages…</p>}
          </Glass>

          {insights?.personSentiments?.length>0&&(
            <Glass style={{padding:18}}>
              <CardTitle>👥 Per-Person</CardTitle>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {insights.personSentiments.map((ps,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:9,background:`${ps.color}20`,border:`2px solid ${ps.color}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{color:ps.color,fontWeight:800,fontSize:11,fontFamily:"'Outfit',sans-serif"}}>{ps.name.charAt(0)}</span>
                    </div>
                    <div style={{flex:1}}>
                      <span style={{fontSize:13,color:"#1e1b4b",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>{ps.name}</span>
                      <div style={{fontSize:10,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>{ps.words} words</div>
                    </div>
                    <Badge color={sentimentColor(ps.sentiment)}>{ps.sentiment}</Badge>
                  </div>
                ))}
              </div>
            </Glass>
          )}

          <Glass style={{padding:18}}>
            <CardTitle>⚡ Action Items</CardTitle>
            {insights?.actions?.length?(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {insights.actions.map((a,i)=>(
                  <div key={i} style={{fontSize:12,color:"#3730a3",background:"rgba(124,58,237,0.06)",borderRadius:10,padding:"8px 12px",borderLeft:"3px solid #7c3aed",lineHeight:1.6,fontFamily:"'Outfit',sans-serif"}}>{a}</div>
                ))}
              </div>
            ):<p style={{fontSize:12,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>Detected after a few messages…</p>}
          </Glass>

          {insights?.keywords?.length>0&&(
            <Glass style={{padding:18}}>
              <CardTitle>🔑 Keywords</CardTitle>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {insights.keywords.map((kw,i)=>(
                  <span key={i} style={{background:`${PC[i%PC.length]}18`,color:PC[i%PC.length],padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1.5px solid ${PC[i%PC.length]}30`,fontFamily:"'Outfit',sans-serif"}}>
                    {kw.word} <span style={{opacity:0.5}}>×{kw.count}</span>
                  </span>
                ))}
              </div>
            </Glass>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes soundBar1{0%,100%{height:4px}50%{height:16px}}
        @keyframes soundBar2{0%,100%{height:8px}50%{height:20px}}
        @keyframes soundBar3{0%,100%{height:12px}50%{height:6px}}
        @keyframes soundBar4{0%,100%{height:6px}50%{height:18px}}
      `}</style>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const navItems = [
    { id:"dashboard", label:"Dashboard",    icon:"home"   },
    { id:"live",      label:"Live Meeting", icon:"mic"    },
    { id:"upload",    label:"Upload",       icon:"upload" },
    { id:"meetings",  label:"Meetings",     icon:"list"   },
    { id:"search",    label:"Search",       icon:"search" },
    { id:"room",      label:"Room Meeting",  icon:"chart"  },
  ];
  const isActive = (id) => page===id||(page==="detail"&&id==="meetings");

  return (
    <nav style={{ width:230,background:"rgba(255,255,255,0.45)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRight:"1px solid rgba(255,255,255,0.6)",display:"flex",flexDirection:"column",padding:"24px 14px",gap:4,flexShrink:0 }}>
      {/* Logo */}
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"0 8px",marginBottom:32 }}>
        <div style={{ width:42,height:42,background:"linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 24px rgba(124,58,237,0.4)" }}>
          <Icon name="brain" size={22} color="#fff"/>
        </div>
        <div>
          <div style={{ fontSize:15,fontWeight:800,color:"#1e1b4b",lineHeight:1.2,fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.3px" }}>MeetingAI</div>
          <div style={{ fontSize:10,color:"#a78bfa",fontFamily:"'Outfit',sans-serif",fontWeight:600,letterSpacing:"0.06em" }}>INSIGHTS PLATFORM</div>
        </div>
      </div>

      <div style={{ fontSize:10,color:"#a78bfa",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",padding:"0 10px",marginBottom:8,fontFamily:"'Outfit',sans-serif" }}>Menu</div>

      {navItems.map(item=>(
        <button key={item.id} onClick={()=>setPage(item.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:14,border:"none",cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:isActive(item.id)?700:500,transition:"all 0.2s",fontFamily:"'Outfit',sans-serif",background:isActive(item.id)?"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))":`transparent`,color:isActive(item.id)?"#6d28d9":"#64748b",boxShadow:isActive(item.id)?"0 2px 12px rgba(124,58,237,0.12)":"none",position:"relative" }}>
          {isActive(item.id)&&<div style={{ position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:4,height:22,background:"linear-gradient(to bottom,#7c3aed,#a855f7)",borderRadius:"0 4px 4px 0",boxShadow:"0 0 10px rgba(124,58,237,0.5)" }}/>}
          <Icon name={item.icon} size={17} color={isActive(item.id)?"#7c3aed":"#94a3b8"}/>
          {item.label}
          {item.id==="live"&&<div style={{ marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:"#e11d48",boxShadow:"0 0 8px rgba(225,29,72,0.7)",animation:"pulse 2s infinite" }}/>}
        </button>
      ))}

      {/* Bottom tip */}
      <div style={{ marginTop:"auto",padding:"16px",borderRadius:16,background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.08))",border:"1.5px solid rgba(124,58,237,0.2)",boxShadow:"0 4px 16px rgba(124,58,237,0.08)" }}>
        <div style={{ fontSize:12,fontWeight:800,color:"#7c3aed",marginBottom:6,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:6 }}>
          ✨ AI POWERED
        </div>
        <div style={{ fontSize:11,color:"#6d28d9",lineHeight:1.7,fontFamily:"'Outfit',sans-serif" }}>Upload transcripts or join a live meeting for instant AI-powered insights.</div>
      </div>
    </nav>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type="info") => setToasts(t=>[...t,{id:Date.now(),msg,type}]);
  const removeToast = (id) => setToasts(t=>t.filter(x=>x.id!==id));
  const pageMap = { dashboard:DashboardPage, upload:UploadPage, meetings:MeetingsPage, detail:MeetingDetailPage, live:LiveMeetingPage, search:SearchPage, room:RoomPage };
  const PageComponent = pageMap[page] || DashboardPage;

  return (
    <AppCtx.Provider value={{ page, setPage, selectedMeeting, setSelectedMeeting, addToast }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body {
          font-family:'Outfit',sans-serif;
          min-height:100vh;
          background:
            radial-gradient(ellipse at 0% 0%, rgba(139,92,246,0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 0%, rgba(6,182,212,0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, rgba(236,72,153,0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 0% 100%, rgba(99,102,241,0.2) 0%, transparent 50%),
            linear-gradient(135deg, #f0f4ff 0%, #faf5ff 30%, #f0fffe 60%, #fff0f8 100%);
          background-attachment: fixed;
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes floatIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .glass:hover { box-shadow: 0 12px 48px rgba(124,58,237,0.15), 0 1.5px 8px rgba(255,255,255,0.6) inset !important; }
        .card-hover { transition: all 0.2s ease !important; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.15) !important; }
        button:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
        input:focus, textarea:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: rgba(124,58,237,0.04); }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(124,58,237,0.4); }
      `}</style>

      <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
        <Sidebar page={page} setPage={setPage}/>
        <main style={{ flex:1, overflowY:"auto", padding:"32px 36px" }}>
          <PageComponent/>
        </main>
      </div>

      {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onClose={()=>removeToast(t.id)}/>)}
    </AppCtx.Provider>
  );
}
