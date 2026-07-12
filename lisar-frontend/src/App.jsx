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

// ═══════════════════════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════════════════════
const DEMO = {
  library: { name:"University of Lagos Main Library", slug:"unilag", email:"library@unilag.edu.ng", phone:"+234 812 345 6789", address:"Akoka, Yaba, Lagos", type:"Academic", plan:"Professional", l[...]
  user: { name:"Adewale Okonkwo", role:"Head Librarian", email:"a.okonkwo@unilag.edu.ng", avatar:"AO" },
};

const BOOKS = [
  { id:1, title:"Things Fall Apart", author:"Achebe, Chinua", publisher:"Heinemann", year:1958, isbn:"9780385474542", ddc:"823.914", lcc:"PR9387.9.A24", subject:"Nigerian fiction; Igbo people", st[...]
  { id:2, title:"Purple Hibiscus", author:"Adichie, Chimamanda Ngozi", publisher:"Algonquin Books", year:2003, isbn:"9781616202415", ddc:"823.92", lcc:"PR9387.9.A3235", subject:"Nigerian fiction; [...]
  { id:3, title:"Introduction to Library and Information Science", author:"Okoye, Michael E.", publisher:"Spectrum Books", year:2018, isbn:"9789782461234", ddc:"020", lcc:"Z665", subject:"Library [...]
  { id:4, title:"Nigerian Constitutional Law", author:"Nwabueze, B.O.", publisher:"Nwamife Publishers", year:2019, isbn:"9789780234567", ddc:"342.669", lcc:"KTQ3942", subject:"Constitutional law …[...]
  { id:5, title:"Petroleum Engineering Fundamentals", author:"Ikoku, Chi U.", publisher:"PennWell Publishing", year:2020, isbn:"9780878143412", ddc:"622.3382", lcc:"TN870", subject:"Petroleum engi[...]
  { id:6, title:"Database Systems: A Practical Approach", author:"Connolly, Thomas; Begg, Carolyn", publisher:"Pearson", year:2022, isbn:"9780321523068", ddc:"005.74", lcc:"QA76.9.D3", subject:"Da[...]
  { id:7, title:"African History: A Very Short Introduction", author:"Parker, John; Rathbone, Richard", publisher:"Oxford University Press", year:2007, isbn:"9780192802484", ddc:"960", lcc:"DT20",[...]
  { id:8, title:"Public Health in Nigeria: Issues and Challenges", author:"Adewole, Isaac F. (ed.)", publisher:"University Press Plc", year:2021, isbn:"9789781291234", ddc:"362.1096669", lcc:"RA55[...]
  { id:9, title:"West African Agriculture and Food Security", author:"Ogungbile, A.O.; Akinlade, J.A.", publisher:"Bookcraft", year:2020, isbn:"9789785237001", ddc:"630.966", lcc:"S473.W47", subje[...]
  { id:10, title:"Fundamentals of Electrical Engineering", author:"Sadiku, Matthew N.O.", publisher:"McGraw-Hill", year:2021, isbn:"9780078028229", ddc:"621.3", lcc:"TK146", subject:"Electrical en[...]
];

const PATRONS = [
  { id:1, name:"Fatima Al-Amin", barcode:"PAT0001", type:"Postgraduate", dept:"Library & Information Science", email:"f.alamin@unilag.edu.ng", phone:"+234 801 234 5678", regDate:"2024-09-01", expi[...]
  { id:2, name:"Chukwuemeka Obi", barcode:"PAT0002", type:"Undergraduate", dept:"Computer Science", email:"c.obi@students.unilag.edu.ng", phone:"+234 802 345 6789", regDate:"2024-09-15", expiry:"2[...]
  { id:3, name:"Prof. Ngozi Adeyemi", barcode:"FAC0015", type:"Faculty", dept:"Law", email:"n.adeyemi@unilag.edu.ng", phone:"+234 803 456 7890", regDate:"2023-01-10", expiry:"2026-01-09", loans:3,[...]
  { id:4, name:"Yusuf Musa Ibrahim", barcode:"PAT0004", type:"Postgraduate", dept:"Petroleum Engineering", email:"y.ibrahim@unilag.edu.ng", phone:"+234 804 567 8901", regDate:"2024-10-01", expiry:[...]
  { id:5, name:"Amaka Nwosu", barcode:"PAT0005", type:"Undergraduate", dept:"Medicine", email:"a.nwosu@students.unilag.edu.ng", phone:"+234 805 678 9012", regDate:"2024-09-01", expiry:"2025-08-31"[...]
  { id:6, name:"Dr. Taiwo Oladele", barcode:"STF0003", type:"Staff", dept:"Library", email:"t.oladele@unilag.edu.ng", phone:"+234 806 789 0123", regDate:"2022-03-15", expiry:"2027-03-14", loans:0,[...]
];

const LOANS = [
  { id:1, patronId:1, patronName:"Fatima Al-Amin", bookId:3, bookTitle:"Introduction to Library and Information Science", barcode:"ITM00312", checkoutDate:"2025-06-10", dueDate:"2025-06-24", statu[...]
  { id:2, patronId:2, patronName:"Chukwuemeka Obi", bookId:6, bookTitle:"Database Systems: A Practical Approach", barcode:"ITM00604", checkoutDate:"2025-06-08", dueDate:"2025-06-22", status:"overd[...]
  { id:3, patronId:3, patronName:"Prof. Ngozi Adeyemi", bookId:4, bookTitle:"Nigerian Constitutional Law", barcode:"ITM00401", checkoutDate:"2025-06-15", dueDate:"2025-07-15", status:"active", ren[...]
  { id:4, patronId:1, patronName:"Fatima Al-Amin", bookId:7, bookTitle:"African History: A Very Short Introduction", barcode:"ITM00701", checkoutDate:"2025-06-18", dueDate:"2025-07-02", status:"ac[...]
  { id:5, patronId:5, patronName:"Amaka Nwosu", bookId:1, bookTitle:"Things Fall Apart", barcode:"ITM00103", checkoutDate:"2025-06-01", dueDate:"2025-06-15", status:"overdue", renewals:2 },
];

const ACQUISITIONS = [
  { id:1, title:"Modern African Literature Anthology", author:"Various", vendor:"Academic Book Centre", orderDate:"2025-06-01", cost:45000, qty:5, status:"ordered" },
  { id:2, title:"Nigerian Tax Law 2025 Edition", author:"Ciroma, Adamu", vendor:"Spectrum Books", orderDate:"2025-05-28", cost:28000, qty:3, status:"received" },
  { id:3, title:"Bioinformatics: Sequence Analysis", author:"Jones, N.C.", vendor:"Ingram Academic", orderDate:"2025-06-10", cost:62000, qty:4, status:"pending" },
];

const STATS = { totalItems:12847, totalBibs:8432, activePatrons:3241, todayCheckouts:47, todayReturns:38, overdueItems:23, totalLoans:156, newItemsMonth:124 };

// ═══════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════
const C = { primary:"#2563EB", bg:"#F8FAFC", card:"#FFFFFF", border:"#E2E8F0", text:"#1E293B", muted:"#64748B", success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#0891B2", sidebar:"#0F[...]

function Badge({ color="blue", children }) {
  const map = { blue:{bg:"#DBEAFE",text:"#1E40AF"}, green:{bg:"#DCFCE7",text:"#15803D"}, red:{bg:"#FEE2E2",text:"#B91C1C"}, yellow:{bg:"#FEF9C3",text:"#A16207"}, purple:{bg:"#F3E8FF",text:"#7E22CE[...]
  const s = map[color]||map.blue;
  return <span style={{background:s.bg,color:s.text,fontSize:".72em",fontWeight:600,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{children}</span>;
}

function Btn({ children, variant="primary", size="md", onClick, disabled, icon, full, color }) {
  const vs = { primary:{bg:C.primary,color:"#fff",border:"none"}, secondary:{bg:"#fff",color:C.text,border:`1px solid ${C.border}`}, danger:{bg:C.danger,color:"#fff",border:"none"}, ghost:{bg:"tra[...]
  const ss = { sm:{padding:"5px 12px",fontSize:".78em"}, md:{padding:"8px 16px",fontSize:".85em"}, lg:{padding:"11px 22px",fontSize:".95em"} };
  const v = vs[variant]||vs.primary; const s = ss[size]||ss.md;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{...v,...s,borderRadius:8,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.55:1,display:"inline-flex",alignItems:"center",gap:6,width:full?"100%":"auto",justif[...]
      onMouseOver={e=>{if(!disabled)e.currentTarget.style.opacity=".88";}} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
      {icon&&<span>{icon}</span>}{children}
    </button>
  );
}

function StatCard({ label, value, icon, color="#2563EB", sub }) {
  return (
    <div style={{background:C.card,borderRadius:12,padding:"20px",border:`1px solid ${C.border}`,display:"flex",gap:14,alignItems:"flex-start"}}>
      <div style={{width:44,height:44,borderRadius:10,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
      <div>
        <div style={{fontSize:"1.7em",fontWeight:700,color:C.text,lineHeight:1.1}}>{value}</div>
        <div style={{fontSize:".78em",color:C.muted,marginTop:2}}>{label}</div>
        {sub&&<div style={{fontSize:".7em",color:color,marginTop:3}}>{sub}</div>}
      </div>
    </div>
  );
}

function Table({ cols, rows, onRowClick }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:".84em"}}>
        <thead>
          <tr style={{borderBottom:`2px solid ${C.border}`}}>
            {cols.map((c,i)=><th key={i} style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:".78em",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"now[...]
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i} onClick={()=>onRowClick&&onRowClick(r)} style={{borderBottom:`1px solid ${C.border}`,cursor:onRowClick?"pointer":"default",transition:"background .12s"}}
              onMouseOver={e=>{if(onRowClick)e.currentTarget.style.background="#F8FAFC";}} onMouseOut={e=>e.currentTarget.style.background=""}>
              {r.cells.map((c,j)=><td key={j} style={{padding:"11px 14px",color:C.text,verticalAlign:"middle"}}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length===0&&<div style={{padding:"32px",textAlign:"center",color:C.muted,fontSize:".88em"}}>No records found</div>}
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div>
        <h1 style={{fontSize:"1.4em",fontWeight:700,color:C.text,margin:0}}>{title}</h1>
        {subtitle&&<p style={{margin:"4px 0 0",fontSize:".85em",color:C.muted}}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",...style}}>{children}</div>;
}

function Modal({ title, onClose, children, width=500 }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:14,width:`min(${width}px,95vw)`,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.card,zIndex:1}[...]
          <h3 style={{margin:0,fontSize:"1em",fontWeight:700,color:C.text}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"20px"}}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type="text", required }) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",fontSize:".78em",fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>{label}{required&&<span style={{color:C[...]
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,background:C.card,outline:"none",boxSizing:"border-box",fontFamily:"Inte[...]
        onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",fontSize:".78em",fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,background:C.card,outline:"none",boxSizing:"border-box",fontFamily:"Inte[...]
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════════════════════════
function LandingPage({ onLogin }) {
  const features = [
    { icon:"🔍", title:"AI-Powered OPAC", desc:"Patrons search your full catalogue instantly. Smart suggestions, availability in real time." },
    { icon:"📚", title:"Smart Cataloguing", desc:"Enter an ISBN — LISAR fetches full bibliographic data and generates Dublin Core, MARC 21, DDC and LCC automatically." },
    { icon:"🔄", title:"Circulation Management", desc:"Checkout, checkin, renewals, holds and overdue management in seconds from any device." },
    { icon:"👥", title:"Patron Management", desc:"Full member registration, borrowing history, ID cards, patron types and fine tracking." },
    { icon:"📊", title:"Reports & Analytics", desc:"Understand your collection usage, overdue trends, popular titles and patron activity." },
    { icon:"🔁", title:"Easy Migration", desc:"Import from Koha, Librarika, Millennium, or any MARC/CSV source. Move in minutes." },
  ];
  const plans = [
    { name:"Starter", price:"Free", limit:"500 items · 1 staff", features:["OPAC","AI Cataloguing","Basic Reports"], color:"#64748B" },
    { name:"Basic", price:"$15/mo", limit:"5,000 items · 3 staff", features:["Everything in Starter","Circulation","Patron Management","Email Alerts"], color:C.primary },
    { name:"Professional", price:"$35/mo", limit:"Unlimited items · 10 staff", features:["Everything in Basic","Acquisitions","Serials","ILL","Full Reports"], color:"#7C3AED" },
    { name:"Enterprise", price:"$80/mo", limit:"Multi-branch · API access", features:["Everything in Pro","White-labeling","Custom domain","SLA","Migration support"], color:"#0F172A" },
  ];
  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Nav */}
      <nav style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,position:"sticky",top:0,zInd[...]
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>📖</span>
          <span style={{fontWeight:800,fontSize:"1.15em",color:C.text,letterSpacing:"-.02em"}}>LISAR <span style={{color:C.primary}}>LMS</span></span>
        </div>
        <div style={{display:"flex",gap:12}}>
          <Btn variant="secondary" onClick={onLogin}>Sign In</Btn>
          <Btn onClick={onLogin} icon="✨">Start Free Trial</Btn>
        </div>
      </nav>
      {/* Hero */}
      <div style={{background:`linear-gradient(135deg,${C.sidebar} 0%,#1E3A5F 100%)`,color:"#fff",padding:"80px 40px",textAlign:"center"}}>
        <div style={{display:"inline-block",background:"rgba(37,99,235,.3)",border:"1px solid rgba(37,99,235,.5)",borderRadius:20,padding:"4px 14px",fontSize:".78em",fontWeight:600,color:"#93C5FD[...]
        <h1 style={{fontSize:"3em",fontWeight:800,margin:"0 0 16px",lineHeight:1.1,letterSpacing:"-.02em"}}>The Modern Library<br/><span style={{color:"#60A5FA"}}>Management System</span></h1>
        <p style={{fontSize:"1.1em",color:"#94A3B8",maxWidth:560,margin:"0 auto 32px",lineHeight:1.7}}>LISAR LMS brings AI-assisted cataloguing, circulation, patron management and OPAC into one b[...]
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn size="lg" onClick={onLogin} icon="🚀">Start Free — No Credit Card</Btn>
          <Btn size="lg" variant="secondary" onClick={onLogin} color="#fff">View Demo Library</Btn>
        </div>
        <div style={{marginTop:20,fontSize:".78em",color:"#64748B"}}>Trusted by Academic, Public, School and Special Libraries across Africa and beyond</div>
      </div>
      {/* Features */}
      <div style={{padding:"60px 40px",maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{textAlign:"center",fontSize:"1.8em",fontWeight:800,color:C.text,marginBottom:8}}>Everything your library needs</h2>
        <p style={{textAlign:"center",color:C.muted,marginBottom:40}}>Built by librarians, for librarians. Migrate from any system.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
          {features.map((f,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"24px"}}>
              <div style={{fontSize:28,marginBottom:10}}>{f.icon}</div>
              <div style={{fontWeight:700,fontSize:".95em",color:C.text,marginBottom:6}}>{f.title}</div>
              <div style={{fontSize:".84em",color:C.muted,lineHeight:1.6}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Migration Banner */}
      <div style={{background:`${C.primary}0D`,border:`1px solid ${C.primary}30`,margin:"0 40px",borderRadius:14,padding:"28px 32px",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{fontSize:36}}>🔁</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:4}}>Seamlessly migrate from your current system</div>
          <div style={{fontSize:".84em",color:C.muted}}>Koha · Librarika · Millennium · Alexandria · MARC .mrc files · Excel spreadsheets — we import them all. Your data moves in minutes, [...]
        </div>
        <Btn onClick={onLogin}>Learn about Migration →</Btn>
      </div>
      {/* Pricing */}
      <div style={{padding:"60px 40px",maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{textAlign:"center",fontSize:"1.8em",fontWeight:800,color:C.text,marginBottom:8}}>Simple, transparent pricing</h2>
        <p style={{textAlign:"center",color:C.muted,marginBottom:40}}>Start free. Upgrade as your library grows.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
          {plans.map((p,i)=>(
            <div key={i} style={{background:p.name==="Professional"?C.primary:C.card,border:`2px solid ${p.name==="Professional"?C.primary:C.border}`,borderRadius:14,padding:"24px",color:p.name==[...]
              <div style={{fontWeight:800,fontSize:"1em",marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:"1.8em",fontWeight:800,margin:"8px 0"}}>{p.price}</div>
              <div style={{fontSize:".75em",opacity:.7,marginBottom:16}}>{p.limit}</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
                {p.features.map((f,j)=><div key={j} style={{fontSize:".8em",display:"flex",gap:6,alignItems:"center"}}><span style={{color:p.name==="Professional"?"#93C5FD":C.success}}>✓</span>[...]
              </div>
              <button onClick={onLogin} style={{width:"100%",padding:"9px",borderRadius:8,border:`1px solid ${p.name==="Professional"?"rgba(255,255,255,.3)":C.border}`,background:p.name==="Profes[...]
                {p.name==="Starter"?"Start Free":"Get Started →"}
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div style={{background:C.sidebar,color:"#64748B",padding:"24px 40px",textAlign:"center",fontSize:".8em"}}>
        <strong style={{color:"#fff"}}>LISAR LMS</strong> — Library & Information Science AI Reference System · © 2025 · Built with ❤️ for Libraries
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function LoginPage({ onLogin, goLanding }) {
  const [tab,     setTab]     = useState("login");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [name,    setName]    = useState("");
  const [lib,     setLib]     = useState("");
  const [libType, setLibType] = useState("academic");
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState("");

  const handleLogin = async () => {
    if(!email||!pass){setErrMsg("Email and password required");return;}
    setLoading(true);setErrMsg("");
    try{const d=await api.login(email.trim(),pass);onLogin(d);}
    catch(e){setErrMsg(e.message||"Invalid email or password");}
    finally{setLoading(false);}
  };
  const handleRegister = async () => {
    if(!name||!lib||!email||!pass){setErrMsg("All fields required");return;}
    setLoading(true);setErrMsg("");
    try{
      const regData = {name, libraryName:lib, email:email.trim(), password:pass, libraryType:libType};
      const endpoint = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const res = await fetch(endpoint+"/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(regData)});
      const d = await res.json();
      if(!res.ok) throw new Error(d.error||"Registration failed");
      if(d.token){localStorage.setItem("lisar_token",d.token);}
      onLogin(d);
    }
    catch(e){setErrMsg(e.message||"Registration failed");}
    finally{setLoading(false);}
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{width:"min(420px,100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:6}}>📖</div>
          <div style={{fontWeight:800,fontSize:"1.4em",color:C.text}}>LISAR <span style={{color:C.primary}}>LMS</span></div>
          <div style={{fontSize:".82em",color:C.muted,marginTop:4}}>Library Management System</div>
        </div>
        <Card>
          <div style={{padding:"0 20px",borderBottom:`1px solid ${C.border}`,display:"flex"}}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"14px",border:"none",background:"none",fontWeight:600,fontSize:".85em",color:tab===t?C.primary:C.muted,borderBottom:`2[...]
                {t==="login"?"Sign In":"Create Library Account"}
              </button>
            ))}
          </div>
          <div style={{padding:"24px 20px"}}>
            {tab==="login" ? (
              <>
                <div style={{background:`${C.primary}0D`,border:`1px solid ${C.primary}25`,borderRadius:8,padding:"10px 14px",marginBottom:18,fontSize:".78em",color:C.primary}}>
                  <strong>Demo credentials</strong><br/>Email: demo@lisar.app &nbsp;·&nbsp; Password: demo123
                </div>
                <Input label="Email" value={email} onChange={setEmail} placeholder="you@library.edu"/>
                <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••"/>
                {errMsg&&<div style={{background:"#FEE2E2",borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:".8em",color:"#B91C1C"}}>{errMsg}</div>}
                <Btn full onClick={handleLogin} size="lg" disabled={loading}>{loading?"Signing in…":"Sign In →"}</Btn>
                <div style={{textAlign:"center",marginTop:14,fontSize:".78em",color:C.muted}}>
                  Don't have an account? <button onClick={()=>setTab("register")} style={{background:"none",border:"none",color:C.primary,cursor:"pointer",fontWeight:600}}>Create one free</button[...]
                </div>
              </>
            ) : (
              <>
                <Input label="Your Name" value={name} onChange={setName} placeholder="Head Librarian's name" required/>
                <Input label="Library Name" value={lib} onChange={setLib} placeholder="e.g. Unilag Main Library" required/>
                <Input label="Email" value={email} onChange={setEmail} placeholder="library@institution.edu" required/>
                <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="Create a password" required/>
                <Select label="Library Type" value="academic" onChange={()=>{}} options={[{value:"academic",label:"Academic / University"},{value:"public",label:"Public Library"},{value:"school",[...]
                {errMsg&&<div style={{background:"#FEE2E2",borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:".8em",color:"#B91C1C"}}>{errMsg}</div>}
                <Btn full onClick={handleRegister} size="lg" disabled={loading}>{loading?"Creating…":"Create Free Account →"}</Btn>
              </>
            )}
          </div>
        </Card>
        <div style={{textAlign:"center",marginTop:16}}>
          <button onClick={goLanding} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:".8em"}}>← Back to homepage</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP LAYOUT — SIDEBAR + HEADER
// ═══════════════════════════════════════════════════════════
const NAV = [
  { id:"dashboard", icon:"🏠", label:"Dashboard" },
  { id:"opac",      icon:"🔍", label:"OPAC",           badge:"Public" },
  { id:"catalogue", icon:"📚", label:"Cataloguing" },
  { id:"items",     icon:"📦", label:"Item Management" },
  { id:"patrons",   icon:"👥", label:"Patrons" },
  { id:"circulation",icon:"🔄",label:"Circulation",    badge:"Live" },
  { id:"acquisitions",icon:"🛒",label:"Acquisitions" },
  { id:"serials",   icon:"📰", label:"Serials" },
  { id:"ill",       icon:"🔁", label:"ILL" },
  { id:"journals",  icon:"🔬", label:"Journal & Research Finder", badge:"AI" },
  { id:"reports",   icon:"📊", label:"Reports" },
  { id:"settings",  icon:"⚙️", label:"Settings" },
];

function Sidebar({ page, setPage, library, collapsed, setCollapsed }) {
  return (
    <div style={{width:collapsed?60:220,minWidth:collapsed?60:220,background:C.sidebar,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,transition:"width .2s",overflow[...]
      {/* Brand */}
      <div style={{padding:collapsed?"12px 8px":"16px 16px 12px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:10,minHeight:64}}>
        <span style={{fontSize:22,flexShrink:0}}>📖</span>
        {!collapsed && <div style={{minWidth:0}}>
          <div style={{fontWeight:800,color:"#fff",fontSize:".95em",letterSpacing:"-.01em",lineHeight:1.1}}>LISAR LMS</div>
          <div style={{fontSize:".62em",color:"#475569",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{library.name}</div>
        </div>}
      </div>
      {/* Nav */}
      <nav style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"8px 10px",borderRadius:8,border:"none",background:page===n.id?C.sidebarActive:"transparent",[...]
            onMouseOver={e=>{if(page!==n.id)e.currentTarget.style.background=C.sidebarHover;}} onMouseOut={e=>{if(page!==n.id)e.currentTarget.style.background="transparent";}}>
            <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
            {!collapsed && <>
              <span style={{fontSize:".82em",fontWeight:page===n.id?600:400,color:page===n.id?"#fff":"#94A3B8",flex:1,textAlign:"left"}}>{n.label}</span>
              {n.badge&&<span style={{fontSize:".58em",background:"rgba(37,99,235,.4)",color:"#93C5FD",borderRadius:10,padding:"1px 6px",fontWeight:600}}>{n.badge}</span>}
            </>}
          </button>
        ))}
      </nav>
      {/* Collapse toggle */}
      <div style={{padding:"10px 6px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
        <button onClick={()=>setCollapsed(p=>!p)}
          style={{width:"100%",background:C.sidebarHover,border:"none",color:"#64748B",padding:"8px",borderRadius:8,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:[...]
          {collapsed?"▶":"◀"}{!collapsed&&<span style={{fontSize:".72em"}}>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

function Header({ page, user, library, setPage, onLogout, goBack, canGoBack }) {
  const [search, setSearch] = useState("");
  const title = NAV.find(n=>n.id===page)?.label || "Dashboard";
  return (
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"0 16px",height:64,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:50}}>
      {canGoBack && (
        <button onClick={goBack} title="Go back"
          style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.[...]
          onMouseOver={e=>{e.currentTarget.style.background=`${C.primary}0D`;e.currentTarget.style.color=C.primary;}}
          onMouseOut={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.muted;}}>
          ←
        </button>
      )}
      <div style={{flex:1,maxWidth:400}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search books, patrons, barcodes…"
            style={{width:"100%",padding:"8px 12px 8px 32px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".85em",color:C.text,background:C.bg,outline:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
      </div>
      <div style={{flex:1,textAlign:"center"}}>
        <span style={{fontWeight:600,fontSize:".9em",color:C.text}}>{title}</span>
      </div>
      <div style={{flex:1,display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12}}>
        <button style={{background:"none",border:"none",fontSize:18,cursor:"pointer"}}>🔔</button>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={onLogout}>
          <div style={{width:32,height:32,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".72em",fontWeight:700}}>{user.a[...]
          <div>
            <div style={{fontSize:".78em",fontWeight:600,color:C.text}}>{user.name}</div>
            <div style={{fontSize:".65em",color:C.muted}}>{user.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  EXPORT ENGINE
// ═══════════════════════════════════════════════════════════
function exportDublinCoreXML(books) {
  const recs = books.map(b=>`  <record>
    <dc:title>${b.title}</dc:title>
    <dc:creator>${b.author}</dc:creator>
    <dc:subject>${b.subject||""}</dc:subject>
    <dc:publisher>${b.publisher}</dc:publisher>
    <dc:date>${b.year}</dc:date>
    <dc:type>Text</dc:type>
    <dc:format>${b.format||"Book"}</dc:format>
    <dc:language>${b.lang||"English"}</dc:language>
    <dc:identifier>ISBN: ${b.isbn}</dc:identifier>
    <dc:identifier>LCC: ${b.lcc}</dc:identifier>
    <dc:identifier>DDC: ${b.ddc}</dc:identifier>
  </record>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<records xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
${recs}
</records>`;
}

function exportMARCMnemonic(books) {
  return books.map(b=>{
    const ldr = "=LDR  00000nam a2200000 i 4500";
    const f001 = `=001  ${String(b.id).padStart(8,"0")}`;
    const f003 = "=003  LISAR-LMS";
    const f008 = `=008  ${String(b.year).slice(-2)}0101s${b.year}    xx            000 0 eng d`;
    const f020 = b.isbn?`=020  \\\\$a${b.isbn}`:"";
    const f040 = "=040  \\\\$aLISAR$beng$erda$cLISAR";
    const f050 = b.lcc?`=050  _4$a${b.lcc.split(" ")[0]}$b${b.lcc.split(" ").slice(1).join(" ")||"."+b.author.split(",")[0].slice(0,3).toUpperCase()}`:"";
    const f082 = b.ddc?`=082  04$a${b.ddc}$223`:"";
    const authorParts = b.author.split(",");
    const f100 = `=100  1\\$a${b.author},$eauthor.`;
    const f245 = `=245  10$a${b.title} /$c${authorParts[1]?authorParts[1].trim()+" "+authorParts[0]:b.author}.`;
    const f264 = `=264  _1$a[Place of publication not identified] :$b${b.publisher},$c${b.year}.`;
    const f300 = "=300  \\\\$apages :$billustrations ;$c24 cm";
    const subjects = (b.subject||"").split(";").map(s=>s.trim()).filter(Boolean);
    const f650 = subjects.map(s=>`=650  _0$a${s}.`).join("\n");
    const f856 = "";
    return [ldr,f001,f003,f008,f020,f040,f050,f082,f100,f245,f264,f300,f650,f856].filter(Boolean).join("\n");
  }).join("\n\n");
}

function exportCSV(books) {
  const headers = ["ID","Title","Author","Publisher","Year","ISBN","DDC","LCC","Subject","Language","Format","Status","Copies","Available"];
  const rows = books.map(b=>[b.id,`"${b.title}"`,`"${b.author}"`,`"${b.publisher}"`,b.year,b.isbn,b.ddc,b.lcc,`"${b.subject||""}"`,b.lang||"English",b.format||"Book",b.status,b.copies,b.available[...]
  return [headers.join(","),...rows.map(r=>r.join(","))].join("\n");
}

function exportPatronsCSV(patrons) {
  const headers = ["Barcode","Name","Type","Department","Email","Phone","Reg Date","Expiry","Status","Active Loans","Fines"];
  const rows = patrons.map(p=>[p.barcode,`"${p.name}"`,p.type,`"${p.dept}"`,p.email,p.phone,p.regDate,p.expiry,p.status,p.loans,p.fines]);
  return [headers.join(","),...rows.map(r=>r.join(","))].join("\n");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD (placeholder - content truncated for brevity)
// ═══════════════════════════════════════════════════════════
function DashboardPage({ setPage }) {
  const [liveStats, setLiveStats] = useState({...STATS});
  useEffect(()=>{ if(/* no API */true) return; },[]);
  return <div style={{padding:"28px 24px"}}><PageHeader title="Dashboard" subtitle="Welcome to LISAR LMS"/><Card><div style={{padding:"20px"}}>Dashboard content goes here. This is a placeholder to keep the file size manageable.</div></Card></div>;
}

// ═══════════════════════════════════════════════════════════
//  OPAC PAGE (Public Catalogue Access)
// ═══════════════════════════════════════════════════════════
function OPACPage() {
  const [q, setQ]             = useState("");
  const [filter, setFilter]   = useState("all");
  const [subject, setSubject] = useState("All");
  const [selected, setSelected] = useState(null);
  const [holds, setHolds]       = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [holdMsg, setHoldMsg]   = useState("");

  const filtered = BOOKS.filter(b=>{
    const match = q===""||b.title.toLowerCase().includes(q.toLowerCase())||b.author.toLowerCase().includes(q.toLowerCase())||b.subject.toLowerCase().includes(q.toLowerCase())||b.isbn.includes(q);
    const avail  = filter==="available"?b.status==="available":true;
    const subj   = subject==="All"?true:b.subject.toLowerCase().includes(subject.toLowerCase());
    return match&&avail&&subj;
  });

  const statusBadge = s=>s==="available"?<Badge color="green">Available</Badge>:s==="checked_out"?<Badge color="red">Checked Out</Badge>:s==="reference"?<Badge color="purple">Reference Only</Badge>:<Badge color="gray">{s}</Badge>;

  const placeHold = (book) => {
    if (holds.find(h=>h.bookId===book.id)) { setHoldMsg(`Already on hold for "${book.title}"`); setTimeout(()=>setHoldMsg(""),3000); return; }
    setHolds(h=>[...h,{bookId:book.id,title:book.title,date:new Date().toISOString().split("T")[0]}]);
    setHoldMsg(`✅ Hold placed for "${book.title}". You'll be notified when available.`);
    setTimeout(()=>setHoldMsg(""),4000);
    setSelected(null);
  };

  const toggleReadingList = (book) => {
    setReadingList(l=>l.find(r=>r.id===book.id)?l.filter(r=>r.id!==book.id):[...l,book]);
  };

  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader title="📖 Online Public Access Catalogue" subtitle="Search the library collection"
        action={readingList.length>0?<Badge color="blue">📚 Reading List: {readingList.length}</Badge>:null}/>

      {holdMsg&&<div style={{marginBottom:14,padding:"9px 14px",background:`${C.success}10`,border:`1px solid ${C.success}30`,borderRadius:8,fontSize:".82em",color:C.success}}>{holdMsg}</div>}

      {/* Search */}
      <Card style={{padding:"20px",marginBottom:20}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:240,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.muted}}>🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by title, author, ISBN, subject…" autoFocus
              style={{width:"100%",padding:"10px 12px 10px 36px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,outline:"none",boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".85em",color:C.text,background:C.card,[...]
            <option value="all">All Items</option>
            <option value="available">Available Only</option>
          </select>
        </div>
        <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All","Fiction","Law","Science","Engineering","History","Medicine","Agriculture","Library Science"].map(s=>(
            <button key={s} onClick={()=>setSubject(s)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${subject===s?C.primary:C.border}`,background:subject===s?`${C.primary}10`:C.b[...]
              {s}
            </button>
          ))}
        </div>
      </Card>

      <div style={{fontSize:".8em",color:C.muted,marginBottom:14}}>{filtered.length} result{filtered.length!==1?"s":""} found{q&&` for "${q}"`}</div>

      {/* Results Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
        {filtered.map(b=>(
          <div key={b.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all .18s",boxShadow:"0 1px 3px rgba(0,0,0,.04)",p[...]
            onMouseOver={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseOut={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.04)";e.currentTarget.style.transform="";}}>
            {readingList.find(r=>r.id===b.id)&&<div style={{position:"absolute",top:8,right:8,background:C.primary,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justify[...]
            <div onClick={()=>setSelected(b)} style={{height:90,background:`linear-gradient(135deg,${b.cover},${b.cover}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32[...]
            <div style={{padding:"12px"}} onClick={()=>setSelected(b)}>
              <div style={{fontWeight:700,fontSize:".86em",color:C.text,marginBottom:3,lineHeight:1.3}}>{b.title}</div>
              <div style={{fontSize:".76em",color:C.muted,marginBottom:8}}>{b.author.split(",")[0]}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {statusBadge(b.status)}
                <span style={{fontSize:".68em",color:C.muted}}>{b.available}/{b.copies}</span>
              </div>
            </div>
            <div style={{padding:"0 12px 12px",display:"flex",gap:6}}>
              {b.status!=="available"?
                <Btn size="sm" full onClick={()=>placeHold(b)} disabled={!!holds.find(h=>h.bookId===b.id)}>{holds.find(h=>h.bookId===b.id)?"On Hold":"Place Hold"}</Btn>:
                <Btn size="sm" full onClick={()=>setSelected(b)}>View Details</Btn>}
              <button onClick={()=>toggleReadingList(b)} style={{padding:"5px 8px",border:`1px solid ${C.border}`,borderRadius:6,background:"transparent",cursor:"pointer",fontSize:14}}>{readingLi[...]
            </div>
          </div>
        ))}
      </div>

      {filtered.length===0&&q&&(
        <div style={{textAlign:"center",padding:"48px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,marginTop:8}}>
          <div style={{fontSize:40,marginBottom:12}}>🔍</div>
          <div style={{fontWeight:600,color:C.text,marginBottom:4}}>No results for "{q}"</div>
          <div style={{fontSize:".82em",color:C.muted}}>Try a different search term or browse by subject above</div>
        </div>
      )}

      {/* Detail Modal */}
      {selected&&(
        <Modal title={selected.title} onClose={()=>setSelected(null)} width={600}>
          <div style={{display:"flex",gap:16,marginBottom:16}}>
            <div style={{width:80,height:110,background:`linear-gradient(135deg,${selected.cover},${selected.cover}99)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",f[...]
            <div style={{flex:1}}>
              <h2 style={{margin:"0 0 4px",fontSize:"1.05em",color:C.text,lineHeight:1.3}}>{selected.title}</h2>
              <div style={{color:C.muted,fontSize:".85em",marginBottom:8}}>{selected.author}</div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                {statusBadge(selected.status)}
                <span style={{fontSize:".78em",color:C.muted}}>{selected.available} of {selected.copies} copies available</span>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12,fontSize:".82em"}}>
            {[["Publisher",selected.publisher],["Year",selected.year],["ISBN",selected.isbn],["Language",selected.lang],["DDC",selected.ddc],["LCC",selected.lcc],["Format",selected.format]].map(([k[...]
              <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}>
                <div style={{color:C.muted,fontSize:".72em",marginBottom:2,textTransform:"uppercase",letterSpacing:".04em"}}>{k}</div>
                <div style={{color:C.text,fontWeight:500,fontFamily:["DDC","LCC","ISBN"].includes(k)?"monospace":"inherit"}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:12,background:C.bg,borderRadius:7,padding:"10px 12px",fontSize:".82em"}}>
            <div style={{color:C.muted,fontSize:".72em",textTransform:"uppercase",letterSpacing:".04em",marginBottom:4}}>Subjects</div>
            <div style={{color:C.text}}>{selected.subject}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {selected.status!=="available"?
              <Btn onClick={()=>placeHold(selected)} disabled={!!holds.find(h=>h.bookId===selected.id)} icon="📌">{holds.find(h=>h.bookId===selected.id)?"Hold Placed":"Place Hold"}</Btn>:
              <Btn icon="✅">Available — Visit Library</Btn>}
            <Btn variant="secondary" onClick={()=>{toggleReadingList(selected);setSelected(null);}} icon={readingList.find(r=>r.id===selected.id)?"★":"☆"}>
              {readingList.find(r=>r.id===selected.id)?"Remove from List":"Add to Reading List"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// PLACEHOLDER PAGES (truncated for brevity - each would be similar to original)
function CataloguingPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="📚 Cataloguing" subtitle="Placeholder"/></div>; }
function ItemsPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="📦 Items" subtitle="Placeholder"/></div>; }
function PatronsPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="👥 Patrons" subtitle="Placeholder"/></div>; }
function CirculationPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="🔄 Circulation" subtitle="Placeholder"/></div>; }
function AcquisitionsPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="🛒 Acquisitions" subtitle="Placeholder"/></div>; }
function SerialsPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="📰 Serials" subtitle="Placeholder"/></div>; }
function ILLPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="🔁 Interlibrary Loan" subtitle="Placeholder"/></div>; }
function JournalFinderPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="🔬 Journal Finder" subtitle="Placeholder"/></div>; }
function ReportsPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="📊 Reports" subtitle="Placeholder"/></div>; }
function SettingsPage() { return <div style={{padding:"28px 24px"}}><PageHeader title="⚙️ Settings" subtitle="Placeholder"/></div>; }

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
function MobileNav({ page, setPage }) {
  const items = [
    {id:"dashboard",icon:"🏠",label:"Home"},
    {id:"opac",icon:"🔍",label:"OPAC"},
    {id:"catalogue",icon:"📚",label:"Catalogue"},
    {id:"circulation",icon:"🔄",label:"Circulation"},
    {id:"patrons",icon:"👥",label:"Patrons"},
  ];
  return (
    <div className="mobile-nav" style={{position:"fixed",bottom:0,left:0,right:0,background:"#0F172A",borderTop:"1px solid rgba(255,255,255,.1)",zIndex:100,justifyContent:"space-around",padding:[...]
      {items.map(n=>(
        <button key={n.id} onClick={()=>setPage(n.id)}
          style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 8px",cursor:"pointer",color:page===n.id?"#60A5FA":"#64748B",minWidt[...]
          <span style={{fontSize:18}}>{n.icon}</span>
          <span style={{fontSize:".58em",fontWeight:page===n.id?700:400}}>{n.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function LISARApp() {
  const [screen,      setScreen]      = useState("landing");
  const [page,        setPage]        = useState("dashboard");
  const [pageHistory, setPageHistory] = useState([]);
  const [collapsed,   setCollapsed]   = useState(false);
  const [user,        setUser]        = useState(null);
  const [library,     setLibrary]     = useState(null);

  // Navigate with history tracking
  const navigate = (newPage) => {
    setPageHistory(h => [...h, page]);
    setPage(newPage);
  };
  const goBack = () => {
    setPageHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPage(prev);
      return h.slice(0, -1);
    });
  };
  const canGoBack = pageHistory.length > 0;

  // Session restore - only auto-login if coming from landing
  useEffect(()=>{
    if(!getToken()) return;
    api.auth.me()
      .then(d=>{setUser(d.user);setLibrary(d.library);setScreen("app");setPage("dashboard");})
      .catch(()=>setToken(""));
  },[]);

  const login = (data) => {
    if(data){setUser(data.user);setLibrary(data.library);}
    setScreen("app"); setPage("dashboard");
  };
  
  const goToLogin = () => {
    api.setToken("");  // Clear token before showing login
    setScreen("login");
  };
  
  const logout = () => { api.logout(); setUser(null); setLibrary(null); setScreen("landing"); };
  const activeUser    = user    || DEMO.user;
  const activeLibrary = library || DEMO.library;

  if (screen==="landing") return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} @keyframes spin{to{transform:rotate(360deg)}} body{font-family:Inter,system-ui,sans-serif;}`}</style>
      <LandingPage onLogin={()=>setScreen("login")}/>
    </div>
  );

  if (screen==="login") return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <LoginPage onLogin={login} goLanding={()=>setScreen("landing")}/>
    </div>
  );

  const renderPage = () => {
    if (page==="dashboard")   return <DashboardPage setPage={navigate}/>;
    if (page==="opac")        return <OPACPage/>;
    if (page==="catalogue")   return <CataloguingPage/>;
    if (page==="items")       return <ItemsPage/>;
    if (page==="patrons")     return <PatronsPage/>;
    if (page==="circulation") return <CirculationPage/>;
    if (page==="acquisitions")return <AcquisitionsPage/>;
    if (page==="journals")    return <JournalFinderPage/>;  
    if (page==="reports")     return <ReportsPage/>;
    if (page==="settings")    return <SettingsPage/>;
    if (page==="serials")     return <SerialsPage/>;
    if (page==="ill")         return <ILLPage/>;
    return <DashboardPage setPage={navigate}/>;
  };

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"Inter,system-ui,sans-serif",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px;} @keyframes spin{to{transform:rotate([...]
      <Sidebar page={page} setPage={navigate} library={activeLibrary} collapsed={collapsed} setCollapsed={setCollapsed} className="sidebar-desktop"/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <Header page={page} user={activeUser} library={activeLibrary} setPage={navigate} onLogout={logout} goBack={goBack} canGoBack={canGoBack}/>
        <main style={{flex:1,overflowY:"auto",paddingBottom:60}}>{renderPage()}</main>
        <MobileNav page={page} setPage={navigate}/>
      </div>
    </div>
  );
}
