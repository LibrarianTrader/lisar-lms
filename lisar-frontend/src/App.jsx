import { useState, useRef, useEffect, useCallback } from "react";
import api, { setToken, getToken } from "./api";

const MOBILE_CSS = `
@media (max-width:768px){
  .sidebar-desktop{display:none!important;}
  .mobile-nav{display:flex!important;}
  .main-header{padding:0 12px!important;}
  .page-content{padding:16px 12px!important;}
  .stat-grid{grid-template-columns:1fr 1fr!important;}
  .table-wrap{overflow-x:auto;}
  .hide-mobile{display:none!important;}
  .modal-inner{width:95vw!important;max-height:90vh!important;}
  .form-grid-2{grid-template-columns:1fr!important;}
}
@media (min-width:769px){
  .mobile-nav{display:none!important;}
  .sidebar-desktop{display:flex!important;}
}
`;

const C = { primary: "#2563EB", bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0", text: "#1E293B", muted: "#64748B", success: "#16A34A", warning: "#D97706", danger: "#DC2626", info: "#0891B2", sidebar: "#0F172A" };

function Badge({ color = "blue", children }) {
  const map = { blue: { bg: "#DBEAFE", text: "#1E40AF" }, green: { bg: "#DCFCE7", text: "#15803D" }, red: { bg: "#FEE2E2", text: "#B91C1C" }, yellow: { bg: "#FEF9C3", text: "#A16207" }, purple: { bg: "#F3E8FF", text: "#7E22CE" }, gray: { bg: "#F3F4F6", text: "#374151" } };
  const s = map[color] || map.blue;
  return <span style={{ background: s.bg, color: s.text, fontSize: ".72em", fontWeight: 600, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>;
}

function Btn({ children, variant = "primary", size = "md", onClick, disabled, icon, full, color }) {
  const vs = { primary: { bg: C.primary, color: "#fff", border: "none" }, secondary: { bg: "#fff", color: C.text, border: `1px solid ${C.border}` }, danger: { bg: C.danger, color: "#fff", border: "none" }, ghost: { bg: "transparent", color: C.text, border: "none" } };
  const ss = { sm: { padding: "5px 12px", fontSize: ".78em" }, md: { padding: "8px 16px", fontSize: ".85em" }, lg: { padding: "11px 22px", fontSize: ".95em" } };
  const v = vs[variant] || vs.primary; const s = ss[size] || ss.md;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...v, ...s, borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .55 : 1, display: "inline-flex", alignItems: "center", gap: 6, width: full ? "100%" : "auto", justifyContent: "center", transition: "all .2s" }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.opacity = ".88"; }} onMouseOut={e => e.currentTarget.style.opacity = "1"}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
}

function StatCard({ label, value, icon, color = "#2563EB", sub }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: "20px", border: `1px solid ${C.border}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: "1.7em", fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: ".78em", color: C.muted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: ".7em", color: color, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Table({ cols, rows, onRowClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".84em" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.border}` }}>
            {cols.map((c, i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: ".78em", textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} onClick={() => onRowClick && onRowClick(r)} style={{ borderBottom: `1px solid ${C.border}`, cursor: onRowClick ? "pointer" : "default", transition: "background .12s" }}
              onMouseOver={e => { if (onRowClick) e.currentTarget.style.background = "#F8FAFC"; }} onMouseOut={e => e.currentTarget.style.background = ""}>
              {r.cells.map((c, j) => <td key={j} style={{ padding: "11px 14px", color: C.text, verticalAlign: "middle" }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: C.muted, fontSize: ".88em" }}>No records found</div>}
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.4em", fontWeight: 700, color: C.text, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: ".85em", color: C.muted }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", ...style }}>{children}</div>;
}

function Modal({ title, onClose, children, width = 500 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 14, width: `min(${width}px,95vw)`, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.card, zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1em", fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px" }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: ".78em", fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: ".9em", color: C.text, background: C.card, outline: "none", boxSizing: "border-box", fontFamily: "Inter,system-ui,sans-serif", transition: "border .2s" }}
        onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: ".78em", fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: ".9em", color: C.text, background: C.card, outline: "none", boxSizing: "border-box", fontFamily: "Inter,system-ui,sans-serif", transition: "border .2s" }}
        onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────

const DEMO = {
  library: { name: "University of Lagos Main Library", slug: "unilag", email: "library@unilag.edu.ng", phone: "+234 812 345 6789", address: "Akoka, Yaba, Lagos", type: "Academic", plan: "Professional", logo: "📚" },
  user: { name: "Adewale Okonkwo", role: "Head Librarian", email: "a.okonkwo@unilag.edu.ng", avatar: "AO" },
};

const BOOKS = [
  { id: 1, title: "Things Fall Apart", author: "Achebe, Chinua", publisher: "Heinemann", year: 1958, isbn: "9780385474542", ddc: "823.914", lcc: "PR9387.9.A24", subject: "Nigerian fiction; Igbo people", status: "available", copies: 3, available: 2 },
  { id: 2, title: "Purple Hibiscus", author: "Adichie, Chimamanda Ngozi", publisher: "Algonquin Books", year: 2003, isbn: "9781616202415", ddc: "823.92", lcc: "PR9387.9.A3235", subject: "Nigerian fiction", status: "checked_out", copies: 2, available: 0 },
  { id: 3, title: "Introduction to Library and Information Science", author: "Okoye, Michael E.", publisher: "Spectrum Books", year: 2018, isbn: "9789788246123", ddc: "020", lcc: "Z665", subject: "Library science", status: "available", copies: 5, available: 3 },
];

const PATRONS = [
  { id: 1, name: "Fatima Al-Amin", barcode: "PAT0001", type: "Postgraduate", dept: "Library Science", email: "f.alamin@unilag.edu.ng", fines: 0 },
  { id: 2, name: "Chukwuemeka Obi", barcode: "PAT0002", type: "Undergraduate", dept: "CS", email: "c.obi@unilag.edu.ng", fines: 500 },
];

const LOANS = [
  { id: 1, patronId: 1, bookId: 3, dueDate: "2025-06-20", status: "active" },
  { id: 2, patronId: 2, bookId: 1, dueDate: "2025-06-10", status: "overdue" },
];

// ─────────────────────────────────────────────────────────────
//  LANDING PAGE
// ─────────────────────────────────────────────────────────────
function LandingPage({ onLogin }) {
  const features = [
    { icon: "🤖", title: "AI-Powered OPAC", desc: "Patrons search your full catalogue" },
    { icon: "📚", title: "Smart Cataloguing", desc: "MARC support, bulk uploads, metadata enrichment" },
    { icon: "🔄", title: "Full Circulation", desc: "Checkout, returns, renewals, holds, fines" },
    { icon: "👥", title: "Patron Management", desc: "Registration, profiles, reading lists" },
    { icon: "📊", title: "Reports & Analytics", desc: "Circulation trends, collection insights" },
    { icon: "⚡", title: "Fast & Reliable", desc: "Built for African libraries" },
  ];

  return (
    <div style={{ fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{MOBILE_CSS}</style>
      <nav style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28 }}>📖</span>
          <span style={{ fontWeight: 800, fontSize: "1.15em" }}>LISAR <span style={{ color: C.primary }}>LMS</span></span>
        </div>
        <Btn onClick={onLogin}>Sign In</Btn>
      </nav>

      <div style={{ background: `linear-gradient(135deg,${C.sidebar} 0%,#1E3A5F 100%)`, color: "#fff", padding: "80px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5em", fontWeight: 800, margin: "0 0 16px" }}>Library Management System</h1>
        <p style={{ fontSize: "1.1em", color: "#94A3B8", maxWidth: 560, margin: "0 auto 32px" }}>LISAR brings AI-assisted cataloguing, circulation, and patron management into one beautiful system.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn onClick={onLogin}>Get Started</Btn>
          <Btn variant="secondary" onClick={() => { }}>Learn More</Btn>
        </div>
      </div>

      <div style={{ padding: "80px 40px" }}>
        <h2 style={{ textAlign: "center", fontSize: "2em", fontWeight: 700, color: C.text, marginBottom: 40 }}>Everything You Need</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, maxWidth: 1200, margin: "0 auto" }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: "1em", fontWeight: 700, color: C.text, margin: "0 0 8px" }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: ".85em", color: C.muted }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  LOGIN PAGE
// ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin, goLanding }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setErrMsg("Email and password required"); return; }
    setLoading(true); setErrMsg("");
    try { const d = await api.login(email.trim(), password); onLogin(d); }
    catch (e) { setErrMsg(e.message || "Invalid email or password"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ width: "min(420px,100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>📖</div>
          <div style={{ fontWeight: 800, fontSize: "1.4em" }}>LISAR <span style={{ color: C.primary }}>LMS</span></div>
          <p style={{ margin: "4px 0 0", fontSize: ".85em", color: C.muted }}>Sign in to your library</p>
        </div>
        <Card style={{ padding: "24px 20px" }}>
          <Input label="Email" value={email} onChange={setEmail} placeholder="name@library.edu" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          {errMsg && <div style={{ background: "#FEE2E2", borderRadius: 7, padding: "8px 12px", marginBottom: 12, fontSize: ".8em", color: "#B91C1C" }}>{errMsg}</div>}
          <Btn full onClick={handleLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</Btn>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: ".78em", color: C.muted }}>
            <button onClick={goLanding} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer" }}>← Back to home</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────
function DashboardPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="Dashboard" /><Card style={{ padding: "20px" }}>Welcome to LISAR LMS</Card></div>; }

// ─────────────────────────────────────────────────────────────
//  OPAC PAGE (Public Catalogue)
// ─────────────────────────────────────────────────────────────
function OPACPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [holds, setHolds] = useState([]);
  const [holdMsg, setHoldMsg] = useState("");

  const filtered = BOOKS.filter(b => q === "" || b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()));

  const statusBadge = s => s === "available" ? <Badge color="green">Available</Badge> : <Badge color="red">Checked Out</Badge>;

  const placeHold = (book) => {
    if (holds.find(h => h.bookId === book.id)) { setHoldMsg(`Already on hold for "${book.title}"`); setTimeout(() => setHoldMsg(""), 3000); return; }
    setHolds(h => [...h, { bookId: book.id, title: book.title }]);
    setHoldMsg(`✅ Hold placed for "${book.title}"`);
    setTimeout(() => setHoldMsg(""), 3000);
    setSelected(null);
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200 }}>
      <PageHeader title="📖 Online Public Access Catalogue" subtitle="Search the library collection" />

      {holdMsg && <div style={{ marginBottom: 14, padding: "9px 14px", background: `${C.success}10`, border: `1px solid ${C.success}30`, borderRadius: 8, fontSize: ".82em", color: C.success }}>{holdMsg}</div>}

      {/* Search */}
      <Card style={{ padding: "20px", marginBottom: 20 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title, author, or ISBN..." autoFocus
          style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: ".9em", color: C.text, outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
      </Card>

      {/* Results grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
        {filtered.map(b => (
          <Card key={b.id} style={{ cursor: "pointer", overflow: "hidden", transition: "transform .2s" }} onClick={() => setSelected(b)}>
            <div style={{ height: 100, background: `hsl(${b.id * 45},70%,60%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#fff" }}>📚</div>
            <div style={{ padding: "12px" }}>
              <div style={{ fontWeight: 700, fontSize: ".8em", color: C.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
              <div style={{ fontSize: ".7em", color: C.muted, marginBottom: 6 }}>{b.author}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".75em" }}>
                {statusBadge(b.status)}
                <span>{b.available}/{b.copies}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} width={600}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: ".7em", fontWeight: 600, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Author</div>
              <div style={{ fontSize: ".95em", color: C.text }}>{selected.author}</div>
              <div style={{ fontSize: ".7em", fontWeight: 600, color: C.muted, textTransform: "uppercase", marginBottom: 4, marginTop: 12 }}>Publisher</div>
              <div>{selected.publisher} ({selected.year})</div>
            </div>
            <div>
              <div style={{ fontSize: ".7em", fontWeight: 600, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Status</div>
              <div style={{ marginBottom: 12 }}>{statusBadge(selected.status)}</div>
              <div style={{ fontSize: ".7em", fontWeight: 600, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Availability</div>
              <div>{selected.available} of {selected.copies} available</div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", gap: 8 }}>
            {selected.status === "available" && <Btn full onClick={() => placeHold(selected)}>Place Hold</Btn>}
            <Btn full variant="secondary" onClick={() => setSelected(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  STUB PAGES
// ─────────────────────────────────────────────────────────────
function CataloguingPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="📚 Cataloguing" /></div>; }
function CirculationPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="🔄 Circulation" /></div>; }
function PatronsPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="👥 Patrons" /></div>; }
function SettingsPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="⚙️ Settings" /></div>; }

// ─────────────────────────────────────────────────────────────
//  SIDEBAR & HEADER
// ─────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, collapsed }) {
  const nav = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "opac", icon: "🔍", label: "OPAC" },
    { id: "catalogue", icon: "📚", label: "Cataloguing" },
    { id: "circulation", icon: "🔄", label: "Circulation" },
    { id: "patrons", icon: "👥", label: "Patrons" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="sidebar-desktop" style={{ width: 220, minWidth: 220, background: C.sidebar, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflow: "hidden", zIndex: 100, transition: "width .3s" }}>
      <div style={{ padding: "14px", color: "#fff", fontSize: "1.1em", fontWeight: 800, borderBottom: `1px solid rgba(255,255,255,.1)`, overflow: "hidden" }}>📖 <span>{!collapsed ? "LISAR" : ""}</span></div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: "none", background: page === n.id ? "rgba(37,99,235,.2)" : "transparent", color: page === n.id ? "#fff" : "#94A3B8", fontWeight: page === n.id ? 600 : 400, cursor: "pointer", fontSize: ".85em", transition: "all .2s", justifyContent: collapsed ? "center" : "flex-start" }}
            onMouseOver={e => { if (page !== n.id) e.currentTarget.style.background = "rgba(255,255,255,.05)"; }} onMouseOut={e => { if (page !== n.id) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            {!collapsed && <span>{n.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Header({ page, user, collapsed, onCollapse, onLogout }) {
  const title = { dashboard: "Dashboard", opac: "OPAC", catalogue: "Cataloguing", circulation: "Circulation", patrons: "Patrons", settings: "Settings" }[page] || "Dashboard";

  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onCollapse} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.text }}>☰</button>
        <div style={{ fontWeight: 600, fontSize: ".9em", color: C.text }}>{title}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "6px 12px", borderRadius: 8, transition: "background .2s" }} onClick={onLogout} onMouseOver={e => e.currentTarget.style.background = C.bg} onMouseOut={e => e.currentTarget.style.background = ""}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: ".72em", fontWeight: 700 }}>{user.avatar}</div>
        <div>
          <div style={{ fontSize: ".78em", fontWeight: 600, color: C.text }}>{user.name}</div>
          <div style={{ fontSize: ".65em", color: C.muted }}>{user.role}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
export default function LISARApp() {
  const [screen, setScreen] = useState("landing");
  const [page, setPage] = useState("dashboard");
  const [pageHistory, setPageHistory] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState(null);

  // Navigate with history tracking
  const navigate = (newPage) => {
    setPageHistory(h => [...h, page]);
    setPage(newPage);
  };

  // Session restore - only auto-login if token exists
  useEffect(() => {
    if (!getToken()) return;
    api.auth.me()
      .then(d => { setUser(d.user); setLibrary(d.library); setScreen("app"); setPage("dashboard"); })
      .catch(() => setToken(""));
  }, []);

  const login = (data) => {
    if (data) { setUser(data.user); setLibrary(data.library); }
    setScreen("app"); setPage("dashboard");
  };

  const logout = () => { api.logout(); setUser(null); setLibrary(null); setScreen("landing"); };
  const activeUser = user || DEMO.user;
  const activeLibrary = library || DEMO.library;

  if (screen === "landing") return (
    <div style={{ fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} @keyframes spin{to{transform:rotate(360deg)}} body{font-family:Inter,system-ui,sans-serif;}`}</style>
      <LandingPage onLogin={() => setScreen("login")} />
    </div>
  );

  if (screen === "login") return (
    <div style={{ fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <LoginPage onLogin={login} goLanding={() => setScreen("landing")} />
    </div>
  );

  const renderPage = () => {
    if (page === "dashboard") return <DashboardPage />;
    if (page === "opac") return <OPACPage />;
    if (page === "catalogue") return <CataloguingPage />;
    if (page === "circulation") return <CirculationPage />;
    if (page === "patrons") return <PatronsPage />;
    if (page === "settings") return <SettingsPage />;
    return <DashboardPage />;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "Inter,system-ui,sans-serif", overflow: "hidden" }}>
      <Sidebar page={page} setPage={navigate} collapsed={collapsed} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header page={page} user={activeUser} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} onLogout={logout} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
