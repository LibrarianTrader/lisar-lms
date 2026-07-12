import { useState, useRef, useEffect, useCallback } from "react";
import api, { setToken, getToken } from "./api";

// ═══════════════════════════════════════════════════════════
//  DEMO DATA
// ═══════════════════════════════════════════════════════════
const DEMO = {
  library: { name: "University of Lagos Main Library", slug: "unilag" },
  user: { name: "Adewale Okonkwo", role: "Head Librarian", avatar: "AO" },
};

const BOOKS = [
  { id: 1, title: "Things Fall Apart", author: "Achebe, Chinua", status: "available", copies: 3, available: 2, cover: "#8B5CF6" },
  { id: 2, title: "Purple Hibiscus", author: "Adichie, Chimamanda", status: "checked_out", copies: 2, available: 0, cover: "#EC4899" },
  { id: 3, title: "Introduction to Library Science", author: "Okoye, Michael", status: "available", copies: 5, available: 3, cover: "#3B82F6" },
  { id: 4, title: "Nigerian Constitutional Law", author: "Nwabueze, B.O.", status: "available", copies: 4, available: 2, cover: "#F59E0B" },
  { id: 5, title: "Petroleum Engineering", author: "Ikoku, Chi", status: "checked_out", copies: 2, available: 0, cover: "#10B981" },
];

const C = { primary: "#2563EB", bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0", text: "#1E293B", muted: "#64748B", success: "#16A34A", danger: "#DC2626", sidebar: "#0F172A" };

function Badge({ color = "blue", children }) {
  const colors = { blue: { bg: "#DBEAFE", text: "#1E40AF" }, green: { bg: "#DCFCE7", text: "#15803D" }, red: { bg: "#FEE2E2", text: "#B91C1C" } };
  const s = colors[color] || colors.blue;
  return <span style={{ background: s.bg, color: s.text, fontSize: ".72em", fontWeight: 600, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>;
}

function Btn({ children, onClick, disabled, full, size = "md", variant = "primary" }) {
  const styles = { primary: { bg: C.primary, color: "#fff" }, secondary: { bg: "#fff", color: C.text, border: `1px solid ${C.border}` } };
  const style = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...style, padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", border: style.border || "none", fontSize: ".85em", opacity: disabled ? 0.55 : 1, transition: "all .2s" }} onMouseOver={e => !disabled && (e.currentTarget.style.opacity = ".88")} onMouseOut={e => !disabled && (e.currentTarget.style.opacity = "1")}>
      {children}
    </button>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, ...style }}>{children}</div>;
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: "1.4em", fontWeight: 700, color: C.text, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: ".85em", color: C.muted }}>{subtitle}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════════════════════════
function LandingPage({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter,system-ui,sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>📖</span>
          <span style={{ fontWeight: 800, fontSize: "1.15em", color: C.text }}>LISAR <span style={{ color: C.primary }}>LMS</span></span>
        </div>
        <Btn onClick={onLogin}>Sign In</Btn>
      </nav>
      <div style={{ background: `linear-gradient(135deg,${C.sidebar} 0%,#1E3A5F 100%)`, color: "#fff", padding: "80px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5em", fontWeight: 800, margin: "0 0 16px" }}>Library Management System</h1>
        <p style={{ fontSize: "1.1em", color: "#94A3B8", maxWidth: 560, margin: "0 auto 32px" }}>LISAR brings AI-assisted cataloguing, circulation, and patron management into one beautiful system.</p>
        <Btn onClick={onLogin}>Get Started</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function LoginPage({ onLogin, goLanding }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleLogin = async () => {
    if (!email || !pass) { setErrMsg("Email and password required"); return; }
    setLoading(true); setErrMsg("");
    try { const d = await api.login(email.trim(), pass); onLogin(d); }
    catch (e) { setErrMsg(e.message || "Invalid email or password"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ width: "min(420px,100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>📖</div>
          <div style={{ fontWeight: 800, fontSize: "1.4em", color: C.text }}>LISAR <span style={{ color: C.primary }}>LMS</span></div>
        </div>
        <Card style={{ padding: "24px 20px" }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: "10px", marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: ".9em" }} />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" style={{ width: "100%", padding: "10px", marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: ".9em" }} />
          {errMsg && <div style={{ background: "#FEE2E2", borderRadius: 7, padding: "8px 12px", marginBottom: 12, fontSize: ".8em", color: "#B91C1C" }}>{errMsg}</div>}
          <Btn full onClick={handleLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</Btn>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: ".78em", color: C.muted }}>
            <button onClick={goLanding} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer" }}>← Back</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  OPAC PAGE (Public Catalogue Access) ✅ WORKING
// ═══════════════════════════════════════════════════════════
function OPACPage() {
  const [q, setQ] = useState("");
  const [holds, setHolds] = useState([]);

  const filtered = BOOKS.filter(b => q === "" || b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()));

  const statusBadge = s => s === "available" ? <Badge color="green">Available</Badge> : <Badge color="red">Checked Out</Badge>;

  const placeHold = (book) => {
    if (holds.find(h => h.id === book.id)) return;
    setHolds(h => [...h, book]);
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200 }}>
      <PageHeader title="📖 Online Public Access Catalogue" subtitle="Search the library collection" />

      <Card style={{ padding: "20px", marginBottom: 20 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title, author…" autoFocus style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: ".9em", color: C.text, outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
      </Card>

      <div style={{ fontSize: ".8em", color: C.muted, marginBottom: 14 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} found</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
        {filtered.map(b => (
          <Card key={b.id} style={{ overflow: "hidden", cursor: "pointer" }}>
            <div style={{ height: 90, background: b.cover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#fff" }}>📚</div>
            <div style={{ padding: "12px" }}>
              <div style={{ fontWeight: 700, fontSize: ".86em", color: C.text, marginBottom: 3, lineHeight: 1.3 }}>{b.title}</div>
              <div style={{ fontSize: ".76em", color: C.muted, marginBottom: 8 }}>{b.author}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                {statusBadge(b.status)}
                <span style={{ fontSize: ".68em", color: C.muted }}>{b.available}/{b.copies}</span>
              </div>
              {b.status === "available" ? (
                <Btn full size="sm" onClick={() => placeHold(b)} disabled={!!holds.find(h => h.id === b.id)}>
                  {holds.find(h => h.id === b.id) ? "On Hold" : "Place Hold"}
                </Btn>
              ) : (
                <Btn full size="sm" variant="secondary">View Details</Btn>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && q && (
        <div style={{ textAlign: "center", padding: "48px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginTop: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>No results for "{q}"</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PLACEHOLDER PAGES
// ═══════════════════════════════════════════════════════════
function DashboardPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="Dashboard" /><Card style={{ padding: "20px" }}>Welcome to LISAR LMS</Card></div>; }
function CataloguingPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="📚 Cataloguing" /></div>; }
function CirculationPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="🔄 Circulation" /></div>; }
function PatronsPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="👥 Patrons" /></div>; }
function SettingsPage() { return <div style={{ padding: "28px 24px" }}><PageHeader title="⚙️ Settings" /></div>; }

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "opac", icon: "🔍", label: "OPAC" },
  { id: "catalogue", icon: "📚", label: "Cataloguing" },
  { id: "circulation", icon: "🔄", label: "Circulation" },
  { id: "patrons", icon: "👥", label: "Patrons" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

function Sidebar({ page, setPage }) {
  return (
    <div style={{ width: 220, minWidth: 220, background: C.sidebar, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px", color: "#fff", fontSize: "1.2em", fontWeight: 800 }}>📖 LISAR</div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: "none", background: page === n.id ? "rgba(37,99,235,.2)" : "transparent", color: page === n.id ? "#fff" : "#94A3B8", fontWeight: page === n.id ? 600 : 400, cursor: "pointer", fontSize: ".85em", transition: "all .2s" }} onMouseOver={e => page !== n.id && (e.currentTarget.style.background = "rgba(255,255,255,.05)")} onMouseOut={e => page !== n.id && (e.currentTarget.style.background = "transparent")}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Header({ page, user, onLogout }) {
  const title = NAV.find(n => n.id === page)?.label || "Dashboard";
  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ fontWeight: 600, fontSize: ".9em", color: C.text }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={onLogout}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: ".72em", fontWeight: 700 }}>{user.avatar}</div>
        <div>
          <div style={{ fontSize: ".78em", fontWeight: 600, color: C.text }}>{user.name}</div>
          <div style={{ fontSize: ".65em", color: C.muted }}>{user.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function LISARApp() {
  const [screen, setScreen] = useState("landing");
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState(null);

  useEffect(() => {
    if (!getToken()) return;
    api.auth.me()
      .then(d => { setUser(d.user); setLibrary(d.library); setScreen("app"); })
      .catch(() => setToken(""));
  }, []);

  const login = (data) => {
    if (data) { setUser(data.user); setLibrary(data.library); }
    setScreen("app"); setPage("dashboard");
  };

  const logout = () => { api.logout(); setUser(null); setLibrary(null); setScreen("landing"); };
  const activeUser = user || DEMO.user;

  if (screen === "landing") return <LandingPage onLogin={() => setScreen("login")} />;
  if (screen === "login") return <LoginPage onLogin={login} goLanding={() => setScreen("landing")} />;

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
      <Sidebar page={page} setPage={setPage} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header page={page} user={activeUser} onLogout={logout} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
