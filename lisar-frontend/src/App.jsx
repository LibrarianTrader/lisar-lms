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
  library: { name:"University of Lagos Main Library", slug:"unilag", email:"library@unilag.edu.ng", phone:"+234 812 345 6789", address:"Akoka, Yaba, Lagos", type:"Academic", plan:"Professional", logo:"📖" },
  user: { name:"Adewale Okonkwo", role:"Head Librarian", email:"a.okonkwo@unilag.edu.ng", avatar:"AO" },
};

const BOOKS = [
  { id:1, title:"Things Fall Apart", author:"Achebe, Chinua", publisher:"Heinemann", year:1958, isbn:"9780385474542", ddc:"823.914", lcc:"PR9387.9.A24", subject:"Nigerian fiction; Igbo people", status:"available", copies:5, available:4, cover:"#C8A84B", lang:"English", format:"Book" },
  { id:2, title:"Purple Hibiscus", author:"Adichie, Chimamanda Ngozi", publisher:"Algonquin Books", year:2003, isbn:"9781616202415", ddc:"823.92", lcc:"PR9387.9.A3235", subject:"Nigerian fiction; Family life", status:"available", copies:3, available:2, cover:"#A855F7", lang:"English", format:"Book" },
  { id:3, title:"Introduction to Library and Information Science", author:"Okoye, Michael E.", publisher:"Spectrum Books", year:2018, isbn:"9789782461234", ddc:"020", lcc:"Z665", subject:"Library science; Information science", status:"available", copies:8, available:6, cover:"#2563EB", lang:"English", format:"Book" },
  { id:4, title:"Nigerian Constitutional Law", author:"Nwabueze, B.O.", publisher:"Nwamife Publishers", year:2019, isbn:"9789780234567", ddc:"342.669", lcc:"KTQ3942", subject:"Constitutional law — Nigeria", status:"checked_out", copies:4, available:0, cover:"#EF4444", lang:"English", format:"Book" },
  { id:5, title:"Petroleum Engineering Fundamentals", author:"Ikoku, Chi U.", publisher:"PennWell Publishing", year:2020, isbn:"9780878143412", ddc:"622.3382", lcc:"TN870", subject:"Petroleum engineering; Niger Delta", status:"available", copies:6, available:5, cover:"#D97706", lang:"English", format:"Book" },
  { id:6, title:"Database Systems: A Practical Approach", author:"Connolly, Thomas; Begg, Carolyn", publisher:"Pearson", year:2022, isbn:"9780321523068", ddc:"005.74", lcc:"QA76.9.D3", subject:"Database management; SQL", status:"available", copies:10, available:7, cover:"#0891B2", lang:"English", format:"Book" },
  { id:7, title:"African History: A Very Short Introduction", author:"Parker, John; Rathbone, Richard", publisher:"Oxford University Press", year:2007, isbn:"9780192802484", ddc:"960", lcc:"DT20", subject:"Africa — History; African civilisation", status:"available", copies:3, available:3, cover:"#16A34A", lang:"English", format:"Book" },
  { id:8, title:"Public Health in Nigeria: Issues and Challenges", author:"Adewole, Isaac F. (ed.)", publisher:"University Press Plc", year:2021, isbn:"9789781291234", ddc:"362.1096669", lcc:"RA552.N5", subject:"Public health — Nigeria; Epidemiology", status:"reference", copies:2, available:0, cover:"#DC2626", lang:"English", format:"Book" },
  { id:9, title:"West African Agriculture and Food Security", author:"Ogungbile, A.O.; Akinlade, J.A.", publisher:"Bookcraft", year:2020, isbn:"9789785237001", ddc:"630.966", lcc:"S473.W47", subject:"Agriculture — West Africa; Food security", status:"available", copies:4, available:4, cover:"#65A30D", lang:"English", format:"Book" },
  { id:10, title:"Fundamentals of Electrical Engineering", author:"Sadiku, Matthew N.O.", publisher:"McGraw-Hill", year:2021, isbn:"9780078028229", ddc:"621.3", lcc:"TK146", subject:"Electrical engineering; Circuit theory", status:"available", copies:7, available:5, cover:"#7C3AED", lang:"English", format:"Book" },
];

const PATRONS = [
  { id:1, name:"Fatima Al-Amin", barcode:"PAT0001", type:"Postgraduate", dept:"Library & Information Science", email:"f.alamin@unilag.edu.ng", phone:"+234 801 234 5678", regDate:"2024-09-01", expiry:"2025-08-31", loans:2, fines:0, status:"active" },
  { id:2, name:"Chukwuemeka Obi", barcode:"PAT0002", type:"Undergraduate", dept:"Computer Science", email:"c.obi@students.unilag.edu.ng", phone:"+234 802 345 6789", regDate:"2024-09-15", expiry:"2025-08-31", loans:1, fines:200, status:"active" },
  { id:3, name:"Prof. Ngozi Adeyemi", barcode:"FAC0015", type:"Faculty", dept:"Law", email:"n.adeyemi@unilag.edu.ng", phone:"+234 803 456 7890", regDate:"2023-01-10", expiry:"2026-01-09", loans:3, fines:0, status:"active" },
  { id:4, name:"Yusuf Musa Ibrahim", barcode:"PAT0004", type:"Postgraduate", dept:"Petroleum Engineering", email:"y.ibrahim@unilag.edu.ng", phone:"+234 804 567 8901", regDate:"2024-10-01", expiry:"2025-09-30", loans:0, fines:0, status:"active" },
  { id:5, name:"Amaka Nwosu", barcode:"PAT0005", type:"Undergraduate", dept:"Medicine", email:"a.nwosu@students.unilag.edu.ng", phone:"+234 805 678 9012", regDate:"2024-09-01", expiry:"2025-08-31", loans:1, fines:500, status:"suspended" },
  { id:6, name:"Dr. Taiwo Oladele", barcode:"STF0003", type:"Staff", dept:"Library", email:"t.oladele@unilag.edu.ng", phone:"+234 806 789 0123", regDate:"2022-03-15", expiry:"2027-03-14", loans:0, fines:0, status:"active" },
];

const LOANS = [
  { id:1, patronId:1, patronName:"Fatima Al-Amin", bookId:3, bookTitle:"Introduction to Library and Information Science", barcode:"ITM00312", checkoutDate:"2025-06-10", dueDate:"2025-06-24", status:"active", renewals:0 },
  { id:2, patronId:2, patronName:"Chukwuemeka Obi", bookId:6, bookTitle:"Database Systems: A Practical Approach", barcode:"ITM00604", checkoutDate:"2025-06-08", dueDate:"2025-06-22", status:"overdue", renewals:1 },
  { id:3, patronId:3, patronName:"Prof. Ngozi Adeyemi", bookId:4, bookTitle:"Nigerian Constitutional Law", barcode:"ITM00401", checkoutDate:"2025-06-15", dueDate:"2025-07-15", status:"active", renewals:0 },
  { id:4, patronId:1, patronName:"Fatima Al-Amin", bookId:7, bookTitle:"African History: A Very Short Introduction", barcode:"ITM00701", checkoutDate:"2025-06-18", dueDate:"2025-07-02", status:"active", renewals:0 },
  { id:5, patronId:5, patronName:"Amaka Nwosu", bookId:1, bookTitle:"Things Fall Apart", barcode:"ITM00103", checkoutDate:"2025-06-01", dueDate:"2025-06-15", status:"overdue", renewals:2 },
];

const ACQUISITIONS = [
  { id:1, title:"Modern African Literature Anthology", author:"Various", vendor:"Academic Book Centre", orderDate:"2025-06-01", cost:45000, qty:5, status:"ordered" },
  { id:2, title:"Nigerian Tax Law 2025 Edition", author:"Ciroma, Adamu", vendor:"Spectrum Books", orderDate:"2025-05-28", cost:28000, qty:3, status:"received" },
  { id:3, title:"Bioinformatics: Sequence Analysis", author:"Jones, N.C.", vendor:"Ingram Academic", orderDate:"2025-06-10", cost:62000, qty:4, status:"pending" },
];

const STATS = { totalItems:12847, totalBibs:8432, activePatrons:3241, todayCheckouts:47, todayReturns:38, overdueItems:23, totalLoans:156, newItemsMonth:124 };

// ═══════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS (Updated for Theming)
// ═══════════════════════════════════════════════════════════
const C = { 
  primary: "var(--primary)", 
  bg: "var(--bg)", 
  card: "var(--card)", 
  border: "var(--border)", 
  text: "var(--text)", 
  muted: "var(--muted)", 
  success: "var(--success)", 
  warning: "var(--warning)", 
  danger: "var(--danger)", 
  info: "var(--info)", 
  sidebar: "var(--sidebar)", 
  sidebarHover: "var(--sidebarHover)", 
  sidebarActive: "var(--sidebarActive)" 
};

function Badge({ color="blue", children }) {
  const map = { blue:{bg:"#DBEAFE",text:"#1E40AF"}, green:{bg:"#DCFCE7",text:"#15803D"}, red:{bg:"#FEE2E2",text:"#B91C1C"}, yellow:{bg:"#FEF9C3",text:"#A16207"}, purple:{bg:"#F3E8FF",text:"#7E22CE"}, gray:{bg:"#F1F5F9",text:"#475569"} };
  const s = map[color]||map.blue;
  return <span style={{background:s.bg,color:s.text,fontSize:".72em",fontWeight:600,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{children}</span>;
}

function Btn({ children, variant="primary", size="md", onClick, disabled, icon, full, color }) {
  const vs = { primary:{bg:C.primary,color:"#fff",border:"none"}, secondary:{bg:"#fff",color:C.text,border:`1px solid ${C.border}`}, danger:{bg:C.danger,color:"#fff",border:"none"}, ghost:{bg:"transparent",color:C.muted,border:"none"} };
  const ss = { sm:{padding:"5px 12px",fontSize:".78em"}, md:{padding:"8px 16px",fontSize:".85em"}, lg:{padding:"11px 22px",fontSize:".95em"} };
  const v = vs[variant]||vs.primary; const s = ss[size]||ss.md;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{...v,...s,borderRadius:8,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.55:1,display:"inline-flex",alignItems:"center",gap:6,width:full?"100%":"auto",justifyContent:"center",transition:"all .15s",fontFamily:"Inter,system-ui,sans-serif",...(color?{color}:{})}}
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
            {cols.map((c,i)=><th key={i} style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:".78em",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{c}</th>)}
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
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.card,zIndex:1}}>
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
      {label&&<label style={{display:"block",fontSize:".78em",fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>{label}{required&&<span style={{color:C.danger}}> *</span>}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,background:C.card,outline:"none",boxSizing:"border-box",fontFamily:"Inter,system-ui,sans-serif"}}
        onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",fontSize:".78em",fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,background:C.card,outline:"none",boxSizing:"border-box",fontFamily:"Inter,system-ui,sans-serif"}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  PATRON PORTAL (signup + login + OPAC-only view)
// ═══════════════════════════════════════════════════════════

function PatronAuthPage({ onPatronLogin, goLanding }) {
  const [tab,     setTab]     = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [libSlug, setLibSlug] = useState("");
  const [pass,    setPass]    = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState("");

  const handleLogin = async () => {
    if(!email||!pass){setErrMsg("Email and password required");return;}
    setLoading(true);setErrMsg("");
    try {
      const endpoint = (import.meta.env.VITE_API_URL||"http://localhost:4000/api");
      const res = await fetch(endpoint+"/patrons/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password:pass})});
      const d = await res.json();
      if(!res.ok) throw new Error(d.error||"Invalid credentials");
      localStorage.setItem("lisar_patron_token", d.token);
      onPatronLogin(d.patron, d.library);
    } catch(e) { setErrMsg(e.message||"Login failed"); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if(!name||!email||!pass||!libSlug){setErrMsg("All fields required");return;}
    setLoading(true);setErrMsg("");
    try {
      const endpoint = (import.meta.env.VITE_API_URL||"http://localhost:4000/api");
      const res = await fetch(endpoint+"/patrons/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email:email.trim(),phone,password:pass,librarySlug:libSlug.trim().toLowerCase()})});
      const d = await res.json();
      if(!res.ok) throw new Error(d.error||"Signup failed");
      localStorage.setItem("lisar_patron_token", d.token);
      onPatronLogin(d.patron, d.library);
    } catch(e) { setErrMsg(e.message||"Signup failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{width:"min(420px,100%)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:36,marginBottom:6}}>📚</div>
          <div style={{fontWeight:800,fontSize:"1.4em",color:C.text}}>Library <span style={{color:C.primary}}>Patron Portal</span></div>
          <div style={{fontSize:".82em",color:C.muted,marginTop:4}}>Search the catalogue · Place holds · View your loans</div>
        </div>
        <Card>
          <div style={{padding:"0 20px",borderBottom:`1px solid ${C.border}`,display:"flex"}}>
            {[{id:"login",label:"Sign In"},{id:"signup",label:"Register"}].map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setErrMsg("");}}
                style={{flex:1,padding:"14px",border:"none",background:"none",fontWeight:600,fontSize:".85em",color:tab===t.id?C.primary:C.muted,borderBottom:`2px solid ${tab===t.id?C.primary:"transparent"}`,cursor:"pointer"}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{padding:"24px 20px"}}>
            {errMsg&&<div style={{background:"#FEE2E2",borderRadius:7,padding:"8px 12px",marginBottom:14,fontSize:".8em",color:"#B91C1C"}}>{errMsg}</div>}
            {tab==="login" ? (
              <>
                <Input label="Email" value={email} onChange={setEmail} placeholder="your@email.com"/>
                <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••"/>
                <Btn full onClick={handleLogin} size="lg" disabled={loading}>{loading?"Signing in…":"Sign In →"}</Btn>
              </>
            ) : (
              <>
                <Input label="Full Name" value={name} onChange={setName} placeholder="Your full name" required/>
                <Input label="Email" value={email} onChange={setEmail} placeholder="your@email.com" required/>
                <Input label="Phone" value={phone} onChange={setPhone} placeholder="+234 8XX XXX XXXX"/>
                <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="Create a password" required/>
                <Input label="Library Code" value={libSlug} onChange={setLibSlug} placeholder="e.g. unilag (ask your librarian)" required/>
                <div style={{fontSize:".72em",color:C.muted,marginBottom:12,marginTop:-8}}>Ask your librarian for the Library Code to register</div>
                <Btn full onClick={handleSignup} size="lg" disabled={loading}>{loading?"Registering…":"Create Patron Account →"}</Btn>
              </>
            )}
          </div>
        </Card>
        <div style={{textAlign:"center",marginTop:16,display:"flex",gap:12,justifyContent:"center"}}>
          <button onClick={goLanding} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:".8em"}}>← Back to homepage</button>
          <span style={{color:C.border}}>|</span>
          <span style={{fontSize:".8em",color:C.muted}}>Librarian? <a href="#" onClick={e=>{e.preventDefault();goLanding();}} style={{color:C.primary,fontWeight:600}}>Staff Login →</a></span>
        </div>
      </div>
    </div>
  );
}

function PatronDashboardPage({ patron, library, onLogout }) {
  const [q,        setQ]        = useState("");
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [tab,      setTab]      = useState("search");
  const [books,    setBooks]    = useState(BOOKS);
  const [loans,    setLoans]    = useState([]);
  const [holds,    setHolds]    = useState([]);
  const [holdMsg,  setHoldMsg]  = useState("");

  useEffect(()=>{
    api.catalogue.list().then(d=>{if(d?.bibs?.length)setBooks(d.bibs);}).catch(()=>{});
  },[]);

  const filtered = books.filter(b=>{
    const qs = q.toLowerCase();
    const match = q===""||((b.title||"").toLowerCase().includes(qs))||(b.author||"").toLowerCase().includes(qs)||(b.subject||"").toLowerCase().includes(qs)||(b.isbn||"").includes(q);
    const avail = filter==="available"?(b.status==="available"||(b.available>0)):true;
    return match&&avail;
  });

  const statusBadge = s=>s==="available"?<Badge color="green">Available</Badge>:s==="checked_out"?<Badge color="red">Checked Out</Badge>:s==="reference"?<Badge color="purple">Reference Only</Badge>:<Badge color="gray">{s}</Badge>;

  const placeHold = (book) => {
    if(holds.find(h=>h.id===book.id)){setHoldMsg("Already on hold");setTimeout(()=>setHoldMsg(""),2000);return;}
    setHolds(h=>[...h,book]);
    setHoldMsg(`✅ Hold placed for "${book.title}"`);
    setTimeout(()=>setHoldMsg(""),3000);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"#0F172A",padding:"0 20px",height:56,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:50}}>
        <span style={{fontSize:20}}>📖</span>
        <span style={{fontWeight:700,color:"#fff",fontSize:".9em",flex:1}}>{library?.name||"Library"} <span style={{color:"#60A5FA",fontSize:".8em"}}>· Patron Portal</span></span>
        <span style={{fontSize:".78em",color:"#94A3B8"}}>{patron?.name}</span>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:".75em",padding:"5px 10px",borderRadius:6}}>Sign Out</button>
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",gap:0}}>
        {[{id:"search",label:"🔍 Search Catalogue"},{id:"holds",label:`📋 My Holds (${holds.length})`},{id:"account",label:"👤 My Account"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"12px 16px",border:"none",borderBottom:`2px solid ${tab===t.id?C.primary:"transparent"}`,background:"none",color:tab===t.id?C.primary:C.muted,fontWeight:tab===t.id?700:400,fontSize:".83em",cursor:"pointer",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"20px",maxWidth:1100,margin:"0 auto"}}>
        {/* Search Tab */}
        {tab==="search"&&(
          <>
            {holdMsg&&<div style={{padding:"10px 14px",background:`${C.success}10`,border:`1px solid ${C.success}30`,borderRadius:8,marginBottom:14,fontSize:".84em",color:C.success}}>{holdMsg}</div>}
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200,position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.muted}}>🔍</span>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by title, author, subject, ISBN…"
                  style={{width:"100%",padding:"10px 12px 10px 36px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".85em",outline:"none"}}>
                <option value="all">All Items</option>
                <option value="available">Available Only</option>
              </select>
            </div>
            <div style={{fontSize:".78em",color:C.muted,marginBottom:12}}>{filtered.length} result{filtered.length!==1?"s":""}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {filtered.map((b,i)=>(
                <div key={i} onClick={()=>setSelected(b)} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all .18s"}}
                  onMouseOver={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseOut={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.transform="";}}>
                  <div style={{height:80,background:`linear-gradient(135deg,${b.cover||"#2563EB"},${b.cover||"#2563EB"}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>📖</div>
                  <div style={{padding:"12px"}}>
                    <div style={{fontWeight:700,fontSize:".85em",color:C.text,marginBottom:2,lineHeight:1.3}}>{b.title}</div>
                    <div style={{fontSize:".75em",color:C.muted,marginBottom:8}}>{b.author}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      {statusBadge(b.status||"available")}
                      <span style={{fontSize:".68em",color:C.muted}}>{b.ddc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Holds Tab */}
        {tab==="holds"&&(
          <div>
            {holds.length===0?(
              <div style={{textAlign:"center",padding:"52px",background:"#fff",borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:44,marginBottom:12}}>📋</div>
                <div style={{fontWeight:700,color:C.text,marginBottom:6}}>No holds yet</div>
                <div style={{fontSize:".84em",color:C.muted}}>Search the catalogue and place holds on items you need</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {holds.map((h,i)=>(
                  <div key={i} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",display:"flex",gap:12,alignItems:"center"}}>
                    <span style={{fontSize:24}}>📖</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:".88em",color:C.text}}>{h.title}</div>
                      <div style={{fontSize:".75em",color:C.muted}}>{h.author} · Hold placed today</div>
                    </div>
                    <Badge color="yellow">Pending</Badge>
                    <button onClick={()=>setHolds(hs=>hs.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Account Tab */}
        {tab==="account"&&(
          <div style={{maxWidth:500}}>
            <Card style={{padding:"24px"}}>
              <div style={{display:"flex",gap:14,marginBottom:20,alignItems:"center"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"1.2em",fontWeight:700}}>
                  {(patron?.name||"P").split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:"1.05em",color:C.text}}>{patron?.name||"Patron"}</div>
                  <div style={{fontSize:".8em",color:C.muted}}>{patron?.email}</div>
                  <div style={{fontSize:".75em",color:C.primary,marginTop:2}}>{patron?.patron_type||"Member"} · {library?.name}</div>
                </div>
              </div>
              {[["Patron ID",patron?.barcode||"—"],["Phone",patron?.phone||"—"],["Member Since",patron?.reg_date||"—"],["Account Status",patron?.status||"active"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`,fontSize:".84em"}}>
                  <span style={{color:C.muted}}>{k}</span>
                  <span style={{fontWeight:600,color:C.text,textTransform:"capitalize"}}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      {/* Book Detail Modal */}
      {selected&&(
        <Modal title={selected.title} onClose={()=>setSelected(null)} width={560}>
          <div style={{display:"flex",gap:14,marginBottom:14}}>
            <div style={{width:72,height:96,background:`linear-gradient(135deg,${selected.cover||"#2563EB"},${selected.cover||"#2563EB"}88)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>📖</div>
            <div>
              <h2 style={{margin:"0 0 4px",fontSize:"1.05em",color:C.text}}>{selected.title}</h2>
              <div style={{color:C.muted,fontSize:".85em",marginBottom:6}}>{selected.author}</div>
              {statusBadge(selected.status||"available")}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:".82em",marginBottom:12}}>
            {[["Publisher",selected.publisher],["Year",selected.year],["ISBN",selected.isbn],["Language",selected.language||selected.lang||"English"],["DDC",selected.ddc],["LCC",selected.lcc]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}>
                <div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:2}}>{k}</div>
                <div style={{color:C.text,fontWeight:500}}>{v||"—"}</div>
              </div>
            ))}
          </div>
          {selected.subject&&<div style={{background:C.bg,borderRadius:7,padding:"10px 12px",marginBottom:14,fontSize:".82em"}}><div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:4}}>Subjects</div><div>{selected.subject}</div></div>}
          <div style={{display:"flex",gap:8}}>
            <Btn full onClick={()=>{placeHold(selected);setSelected(null);}}>📋 Place Hold</Btn>
            <Btn full variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

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
      <nav style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>📖</span>
          <span style={{fontWeight:800,fontSize:"1.15em",color:C.text,letterSpacing:"-.02em"}}>LISAR <span style={{color:C.primary}}>LMS</span></span>
        </div>
        <div style={{display:"flex",gap:12}}>
          <Btn variant="secondary" onClick={()=>onLogin("patron")} color="#0F172A">📚 Patron Portal</Btn>
          <Btn variant="secondary" onClick={onLogin} color="#0F172A">Staff Sign In</Btn>
          <Btn variant={onLogin} icon="✨" color="#0F172A">Start Free</Btn>
        </div>
      </nav>
      {/* Hero */}
      <div style={{background:`linear-gradient(rgba(15,23,42,.88),rgba(15,23,42,.88)),url('https://i.postimg.cc/bJRQmXhL/Gemini-Generated-Image-xevrk2xevrk2xevr.png') center/cover no-repeat`,color:"#fff",padding:"80px 40px",textAlign:"center"}}>
        <div style={{display:"inline-block",background:"rgba(37,99,235,.3)",border:"1px solid rgba(37,99,235,.5)",borderRadius:20,padding:"4px 14px",fontSize:".78em",fontWeight:600,color:"#93C5FD",marginBottom:18}}>✨ AI-Powered Library Management</div>
        <h1 style={{fontSize:"3em",fontWeight:800,margin:"0 0 16px",lineHeight:1.1,letterSpacing:"-.02em"}}>The Modern Library<br/><span style={{color:"#60A5FA"}}>Management System</span></h1>
        <p style={{fontSize:"1.1em",color:"#94A3B8",maxWidth:560,margin:"0 auto 32px",lineHeight:1.7}}>LISAR LMS brings AI-assisted cataloguing, circulation, patron management and OPAC into one beautiful platform any library can adopt in minutes.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn size="lg" onClick={onLogin} icon="🚀" color="#0F172A">Start Free — No Credit Card</Btn>
          <Btn size="lg" variant="secondary" onClick={onLogin} color="#0F172A">View Demo Library</Btn>
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
          <div style={{fontSize:".84em",color:C.muted}}>Koha · Librarika · Millennium · Alexandria · MARC .mrc files · Excel spreadsheets — we import them all. Your data moves in minutes, not months.</div>
        </div>
        <Btn onClick={onLogin} color="#0F172A">Learn about Migration →</Btn>
      </div>
      {/* Pricing */}
      <div style={{padding:"60px 40px",maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{textAlign:"center",fontSize:"1.8em",fontWeight:800,color:C.text,marginBottom:8}}>Simple, transparent pricing</h2>
        <p style={{textAlign:"center",color:C.muted,marginBottom:40}}>Start free. Upgrade as your library grows.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
          {plans.map((p,i)=>(
            <div key={i} style={{background:p.name==="Professional"?C.primary:C.card,border:`2px solid ${p.name==="Professional"?C.primary:C.border}`,borderRadius:14,padding:"24px",color:p.name==="Professional"?"#fff":C.text}}>
              <div style={{fontWeight:800,fontSize:"1em",marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:"1.8em",fontWeight:800,margin:"8px 0"}}>{p.price}</div>
              <div style={{fontSize:".75em",opacity:.7,marginBottom:16}}>{p.limit}</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
                {p.features.map((f,j)=><div key={j} style={{fontSize:".8em",display:"flex",gap:6,alignItems:"center"}}><span style={{color:p.name==="Professional"?"#93C5FD":C.success}}>✓</span>{f}</div>)}
              </div>
              <button onClick={onLogin} style={{width:"100%",padding:"9px",borderRadius:8,border:`1px solid ${p.name==="Professional"?"rgba(255,255,255,.3)":C.border}`,background:p.name==="Professional"?"rgba(255,255,255,.15)":"#F1F5F9",color:p.name==="Professional"?"#fff":C.text,fontWeight:600,fontSize:".85em",cursor:"pointer"}}>
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
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"14px",border:"none",background:"none",fontWeight:600,fontSize:".85em",color:tab===t?C.primary:C.muted,borderBottom:`2px solid ${tab===t?C.primary:"transparent"}`,cursor:"pointer",textTransform:"capitalize"}}>
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
                  Don't have an account? <button onClick={()=>setTab("register")} style={{background:"none",border:"none",color:C.primary,cursor:"pointer",fontWeight:600}}>Create one free</button>
                </div>
              </>
            ) : (
              <>
                <Input label="Your Name" value={name} onChange={setName} placeholder="Head Librarian's name" required/>
                <Input label="Library Name" value={lib} onChange={setLib} placeholder="e.g. Unilag Main Library" required/>
                <Input label="Email" value={email} onChange={setEmail} placeholder="library@institution.edu" required/>
                <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="Create a password" required/>
                <Select label="Library Type" value="academic" onChange={()=>{}} options={[{value:"academic",label:"Academic / University"},{value:"public",label:"Public Library"},{value:"school",label:"School Library"},{value:"special",label:"Special / Corporate"}]}/>
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
  { id:"chat", icon:"💬", label:"Chat & Support" },
];

function Sidebar({ page, setPage, library, collapsed, setCollapsed }) {
  return (
    <div style={{width:collapsed?60:220,minWidth:collapsed?60:220,background:C.sidebar,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,transition:"width .2s",overflow:"hidden"}}>
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
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"8px 10px",borderRadius:8,border:"none",background:page===n.id?C.sidebarActive:"transparent",marginBottom:2,cursor:"pointer",transition:"all .15s",justifyContent:collapsed?"center":"flex-start"}}
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
          style={{width:"100%",background:C.sidebarHover,border:"none",color:"#64748B",padding:"8px",borderRadius:8,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {collapsed?"▶":"◀"}{!collapsed&&<span style={{fontSize:".72em"}}>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

function Header({ page, user, library, setPage, onLogout, goBack, canGoBack, theme, setTheme }) {
  const [search, setSearch] = useState("");
  const title = NAV.find(n=>n.id===page)?.label || "Dashboard";
  
  return (
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"0 16px",height:64,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:50}}>
      {canGoBack && (
        <button onClick={goBack} title="Go back"
          style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.muted,flexShrink:0,transition:"all .15s"}}
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
        {/* NEW THEME TOGGLE BUTTON */}
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} title="Toggle Theme" style={{background:"none",border:"none",fontSize:18,cursor:"pointer"}}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button style={{background:"none",border:"none",fontSize:18,cursor:"pointer"}}>🔔</button>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={onLogout}>
          <div style={{width:32,height:32,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".72em",fontWeight:700}}>{user.avatar}</div>
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
  const rows = books.map(b=>[b.id,`"${b.title}"`,`"${b.author}"`,`"${b.publisher}"`,b.year,b.isbn,b.ddc,b.lcc,`"${b.subject||""}"`,b.lang||"English",b.format||"Book",b.status,b.copies,b.available]);
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
//  DASHBOARD
// ═══════════════════════════════════════════════════════════
function DashboardPage({ setPage }) {
  const [liveStats, setLiveStats] = useState({...STATS});
  useEffect(()=>{
    api.reports.dashboard().then(d=>{if(!d)return;setLiveStats(s=>({...s,totalItems:d.total_items??s.totalItems,totalBibs:d.total_bibs??s.totalBibs,activePatrons:d.active_patrons??s.activePatrons,todayCheckouts:d.today_checkouts??s.todayCheckouts,todayReturns:d.today_returns??s.todayReturns,overdueItems:d.overdue_count??s.overdueItems,totalLoans:d.active_loans??s.totalLoans,newItemsMonth:d.new_items_month??s.newItemsMonth}));}).catch(()=>{});
  },[]);
  const [exportMsg, setExportMsg] = useState("");

  // Simulate live ticking for today's activity
  useEffect(()=>{
    const t = setInterval(()=>{
      setLiveStats(s=>({...s,todayCheckouts:s.todayCheckouts+(Math.random()>.92?1:0),todayReturns:s.todayReturns+(Math.random()>.95?1:0)}));
    },8000);
    return ()=>clearInterval(t);
  },[]);

  const doExport = (type) => {
    if(type==="dc") { downloadFile(exportDublinCoreXML(BOOKS),"lisar-catalogue-dc.xml","application/xml"); setExportMsg("✅ Dublin Core XML exported"); }
    else if(type==="marc") { downloadFile(exportMARCMnemonic(BOOKS),"lisar-catalogue.mrk","text/plain"); setExportMsg("✅ MARC 21 (.mrk) exported"); }
    else if(type==="csv") { downloadFile(exportCSV(BOOKS),"lisar-catalogue.csv","text/csv"); setExportMsg("✅ Catalogue CSV exported"); }
    else if(type==="patrons") { downloadFile(exportPatronsCSV(PATRONS),"lisar-patrons.csv","text/csv"); setExportMsg("✅ Patron list CSV exported"); }
    setTimeout(()=>setExportMsg(""),3500);
  };

  const activity = [
    { icon:"🔄", text:"Chukwuemeka Obi checked out Database Systems", time:"2 mins ago", color:C.primary },
    { icon:"✅", text:"Prof. Adeyemi returned Nigerian Tax Law", time:"15 mins ago", color:C.success },
    { icon:"📚", text:"5 new items added to Petroleum Engineering", time:"1 hour ago", color:"#7C3AED" },
    { icon:"⚠️", text:"2 overdue notices sent to patrons", time:"2 hours ago", color:C.warning },
    { icon:"👤", text:"New patron registered: Yusuf Musa Ibrahim", time:"3 hours ago", color:C.info },
  ];

  const weekBars = [{d:"Mon",v:42},{d:"Tue",v:58},{d:"Wed",v:71},{d:"Thu",v:49},{d:"Fri",v:63},{d:"Sat",v:28},{d:"Sun",v:11}];
  const maxBar = 71;

  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader
        title={`Welcome back, ${DEMO.user.name.split(" ")[0]} 👋`}
        subtitle={`${DEMO.library.name} · ${new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}`}
        action={<div style={{display:"flex",gap:8}}><Btn onClick={()=>setPage("circulation")} icon="🔄">Circulation Desk</Btn><Btn variant="secondary" onClick={()=>setPage("catalogue")} icon="📚">Add Item</Btn></div>}/>

      {/* Live Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:24}}>
        <StatCard label="Total Items" value={liveStats.totalItems.toLocaleString()} icon="📦" color={C.primary} sub={`${liveStats.newItemsMonth} added this month`}/>
        <StatCard label="Active Patrons" value={liveStats.activePatrons.toLocaleString()} icon="👥" color="#7C3AED" sub="348 new this term"/>
        <StatCard label="Today's Checkouts" value={liveStats.todayCheckouts} icon="🔄" color={C.success} sub={`${liveStats.todayReturns} returns today`}/>
        <StatCard label="Overdue Items" value={liveStats.overdueItems} icon="⚠️" color={C.warning} sub="3 need escalation"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:20,marginBottom:20}}>
        {/* Checkout chart + activity */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Weekly bar chart */}
          <Card style={{padding:"18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>📈 Checkouts This Week</div>
              <Badge color="blue">{weekBars.reduce((a,b)=>a+b.v,0)} total</Badge>
            </div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>
              {weekBars.map((b,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:".65em",color:C.text,fontWeight:600}}>{b.v}</div>
                  <div style={{width:"100%",height:`${(b.v/maxBar)*86}px`,background:i===2?C.primary:`${C.primary}55`,borderRadius:"4px 4px 0 0",transition:"height .3s",minHeight:4}}/>
                  <div style={{fontSize:".65em",color:C.muted}}>{b.d}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:".88em",color:C.text}}>📋 Recent Activity</div>
            <div style={{padding:"4px 0"}}>
              {activity.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"9px 18px",borderBottom:i<activity.length-1?`1px solid ${C.border}`:""}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:`${a.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{a.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".82em",color:C.text}}>{a.text}</div>
                    <div style={{fontSize:".7em",color:C.muted,marginTop:1}}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Quick Actions */}
          <Card style={{padding:"18px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>⚡ Quick Actions</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{icon:"📚",label:"Add Item",page:"catalogue"},{icon:"👤",label:"New Patron",page:"patrons"},{icon:"🔄",label:"Checkout",page:"circulation"},{icon:"↩️",label:"Check In",page:"circulation"},{icon:"🔍",label:"OPAC",page:"opac"},{icon:"📊",label:"Reports",page:"reports"},{icon:"📰",label:"Serials",page:"serials"},{icon:"🔁",label:"ILL",page:"ill"}].map((a,i)=>(
                <button key={i} onClick={()=>setPage(a.page)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,background:C.bg,cursor:"pointer",fontSize:".8em",fontWeight:500,color:C.text}}
                  onMouseOver={e=>{e.currentTarget.style.background=`${C.primary}0D`;e.currentTarget.style.borderColor=C.primary;}} onMouseOut={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.borderColor=C.border;}}>
                  <span>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Collection Overview */}
          <Card style={{padding:"18px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>📦 Collection Overview</div>
            {[{label:"Books",val:8432,pct:66,color:C.primary},{label:"E-Resources",val:2847,pct:22,color:"#7C3AED"},{label:"Serials",val:1247,pct:10,color:C.info},{label:"AV Materials",val:321,pct:2,color:C.success}].map((r,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:".78em",marginBottom:4}}>
                  <span style={{color:C.text,fontWeight:500}}>{r.label}</span>
                  <span style={{color:C.muted}}>{r.val.toLocaleString()}</span>
                </div>
                <div style={{height:6,background:C.border,borderRadius:10,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${r.pct}%`,background:r.color,borderRadius:10,transition:"width .4s"}}/>
                </div>
              </div>
            ))}
          </Card>

          {/* Export Engine */}
          <Card style={{padding:"18px",border:`1px solid ${C.primary}20`}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:4}}>📤 Export Engine</div>
            <div style={{fontSize:".72em",color:C.muted,marginBottom:12}}>Download catalogue data in standard library formats</div>
            {exportMsg&&<div style={{marginBottom:10,padding:"7px 10px",background:`${C.success}12`,border:`1px solid ${C.success}30`,borderRadius:7,fontSize:".75em",color:C.success,fontWeight:600}}>{exportMsg}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[
                {type:"dc",icon:"📄",label:"Dublin Core XML",desc:"DC metadata for all items"},
                {type:"marc",icon:"📋",label:"MARC 21 (.mrk)",desc:"Standard library interchange format"},
                {type:"csv",icon:"📊",label:"Catalogue CSV",desc:"Spreadsheet of all bibliographic records"},
                {type:"patrons",icon:"👥",label:"Patron List CSV",desc:"All registered patron records"},
              ].map(e=>(
                <div key={e.type} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:16}}>{e.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".78em",fontWeight:600,color:C.text}}>{e.label}</div>
                    <div style={{fontSize:".68em",color:C.muted}}>{e.desc}</div>
                  </div>
                  <Btn size="sm" variant="secondary" onClick={()=>doExport(e.type)}>Download</Btn>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Overdue */}
      <Card>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>⚠️ Overdue Items</div>
          <Btn variant="ghost" size="sm" onClick={()=>setPage("circulation")}>View all →</Btn>
        </div>
        <Table cols={["Patron","Item","Due Date","Days Overdue","Fine (₦)","Action"]}
          rows={LOANS.filter(l=>l.status==="overdue").map(l=>{
            const days = Math.max(0,Math.floor((new Date()-new Date(l.dueDate))/(1000*60*60*24)));
            return {cells:[
              l.patronName, l.bookTitle, l.dueDate,
              <Badge color="red">{days} days</Badge>,
              <span style={{fontWeight:700,color:C.danger}}>₦{(days*50).toLocaleString()}</span>,
              <Btn size="sm" variant="secondary">Send Notice</Btn>
            ]};
          })}/>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  OPAC
// ═══════════════════════════════════════════════════════════
function OPACPage() {
  const [q, setQ]             = useState("");
  const [filter, setFilter]   = useState("all");
  const [subject, setSubject] = useState("All");
  const [selected, setSelected] = useState(null);
  const [holds, setHolds]       = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [holdMsg, setHoldMsg]   = useState("");
  const [showLabel, setShowLabel] = useState(null);

  const [opacBooks, setOpacBooks] = useState(BOOKS);
  useEffect(()=>{ api.catalogue.list().then(d=>{if(d?.bibs?.length)setOpacBooks(d.bibs);}).catch(()=>{}); },[]);
  const filtered = opacBooks.filter(b=>{
    const title   = (b.title||"").toLowerCase();
    const author  = (b.author||"").toLowerCase();
    const subj    = (b.subject||"").toLowerCase();
    const isbn    = (b.isbn||"");
    const qs      = q.toLowerCase();
    const match   = q===""||title.includes(qs)||author.includes(qs)||subj.includes(qs)||isbn.includes(q);
    const avail   = filter==="available"?(b.status||b.available)>0||b.status==="available":true;
    const subjF   = subject==="All"?true:subj.includes(subject.toLowerCase());
    return match&&avail&&subjF;
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
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".85em",color:C.text,background:C.card,outline:"none"}}>
            <option value="all">All Items</option>
            <option value="available">Available Only</option>
          </select>
        </div>
        <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All","Fiction","Law","Science","Engineering","History","Medicine","Agriculture","Library Science"].map(s=>(
            <button key={s} onClick={()=>setSubject(s)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${subject===s?C.primary:C.border}`,background:subject===s?`${C.primary}10`:C.bg,fontSize:".75em",cursor:"pointer",color:subject===s?C.primary:C.muted,fontWeight:subject===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      <div style={{fontSize:".8em",color:C.muted,marginBottom:14}}>{filtered.length} result{filtered.length!==1?"s":""} found{q&&` for "${q}"`}</div>

      {/* Results Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
        {filtered.map(b=>(
          <div key={b.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all .18s",boxShadow:"0 1px 3px rgba(0,0,0,.04)",position:"relative"}}
            onMouseOver={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseOut={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.04)";e.currentTarget.style.transform="";}}>
            {readingList.find(r=>r.id===b.id)&&<div style={{position:"absolute",top:8,right:8,background:C.primary,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>✓</div>}
            <div onClick={()=>setSelected(b)} style={{height:90,background:`linear-gradient(135deg,${b.cover},${b.cover}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>📖</div>
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
              <button onClick={()=>toggleReadingList(b)} style={{padding:"5px 8px",border:`1px solid ${C.border}`,borderRadius:6,background:"transparent",cursor:"pointer",fontSize:14}}>{readingList.find(r=>r.id===b.id)?"★":"☆"}</button>
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
      
      {selected&&(
        <Modal title={selected.title} onClose={()=>setSelected(null)} width={600}>
          <div style={{display:"flex",gap:16,marginBottom:16}}>
            <div style={{width:80,height:110,background:`linear-gradient(135deg,${selected.cover},${selected.cover}99)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,flexShrink:0}}>📖</div>
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
            {[["Publisher",selected.publisher],["Year",selected.year],["ISBN",selected.isbn],["Language",selected.lang],["DDC",selected.ddc],["LCC",selected.lcc],["Format",selected.format]].map(([k,v])=>(
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
            <Btn variant="secondary" icon="🏷️" onClick={()=>{setShowLabel(selected);setSelected(null);}}>Print Label</Btn>
          </div>
        </Modal>
      )}

      {/* Label Print Modal */}
      {showLabel&&(
        <Modal title="🏷️ Spine Label & Barcode" onClose={()=>setShowLabel(null)} width={480}>
          <div style={{marginBottom:12,padding:"9px 14px",background:`${C.primary}08`,borderRadius:7,fontSize:".78em",color:C.primary}}>
            🖨️ Use Ctrl+P / Cmd+P to print. Set margins to None and enable Background graphics.
          </div>
          <div style={{display:"flex",gap:16,justifyContent:"center",padding:"16px 0",flexWrap:"wrap"}}>
            {/* Spine label */}
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".7em",color:C.muted,marginBottom:6,fontWeight:600,textTransform:"uppercase"}}>Spine Label</div>
              <div style={{width:55,padding:"8px 4px",background:"#fff",border:"2px solid #000",borderRadius:3,textAlign:"center",fontFamily:"monospace",display:"inline-block"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#000",lineHeight:1.3}}>{showLabel.ddc}</div>
                <div style={{fontSize:8,color:"#000",lineHeight:1.2,marginTop:2}}>{showLabel.author.split(",")[0].slice(0,3).toUpperCase()}</div>
                <div style={{fontSize:7,color:"#000",lineHeight:1.2}}>{showLabel.year}</div>
              </div>
            </div>
            {/* Barcode label */}
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".7em",color:C.muted,marginBottom:6,fontWeight:600,textTransform:"uppercase"}}>Barcode Label</div>
              <div style={{padding:"8px 12px",background:"#fff",border:"2px solid #000",borderRadius:3,display:"inline-block",minWidth:120}}>
                <div style={{fontSize:8,color:"#000",textAlign:"center",marginBottom:3,fontWeight:600}}>{DEMO.library.name.slice(0,20)}</div>
                <div style={{display:"flex",gap:1,justifyContent:"center",height:30,alignItems:"flex-end",marginBottom:3}}>
                  {Array.from({length:40}).map((_,i)=>(
                    <div key={i} style={{width:i%3===0?2:1,height:i%5===0?30:i%3===0?24:20,background:"#000"}}/>
                  ))}
                </div>
                <div style={{fontFamily:"monospace",fontSize:8,textAlign:"center",color:"#000"}}>ITM{String(showLabel.id).padStart(3,"0")}01</div>
                <div style={{fontSize:7,color:"#555",textAlign:"center",marginTop:2}}>{showLabel.title.slice(0,22)}</div>
              </div>
            </div>
            {/* Book card */}
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".7em",color:C.muted,marginBottom:6,fontWeight:600,textTransform:"uppercase"}}>Book Card</div>
              <div style={{padding:"6px 10px",background:"#fff",border:"2px solid #000",borderRadius:3,display:"inline-block",width:120,textAlign:"left"}}>
                <div style={{fontSize:8,fontWeight:700,color:"#000",marginBottom:2}}>{showLabel.title.slice(0,24)}</div>
                <div style={{fontSize:7,color:"#000",marginBottom:4}}>{showLabel.author.split(",")[0]}</div>
                <div style={{fontSize:7,color:"#000",fontFamily:"monospace",marginBottom:6}}>{showLabel.ddc} / {showLabel.lcc}</div>
                {["Date Out","Date Due","Borrower"].map((h,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #000",marginBottom:2,paddingBottom:1}}>
                    <div style={{fontSize:6,color:"#000"}}>{h}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12}}>
            <Btn icon="🖨️" onClick={()=>window.print()}>Print All Labels</Btn>
            <Btn variant="secondary" onClick={()=>setShowLabel(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CATALOGUING
// ═══════════════════════════════════════════════════════════

// ── MARC 21 field tag definitions for display ──
const MARC_TAGS = {
  "001":"Control Number","003":"Control Number Identifier","005":"Date/Time of Latest Transaction","008":"Fixed-Length Data Elements",
  "010":"Library of Congress Control Number","015":"National Bibliography Number","016":"National Bibliographic Agency Control Number",
  "019":"OCLC Control Number Cross-Reference","020":"ISBN","022":"ISSN","035":"System Control Number","040":"Cataloging Source",
  "041":"Language Code","043":"Geographic Area Code","050":"Library of Congress Call Number","082":"Dewey Decimal Number",
  "090":"Locally Assigned LC-Type Call Number","092":"Locally Assigned DDC",
  "100":"Main Entry — Personal Name","110":"Main Entry — Corporate Name","111":"Main Entry — Meeting Name",
  "130":"Main Entry — Uniform Title",
  "240":"Uniform Title","245":"Title Statement","246":"Varying Form of Title","247":"Former Title",
  "250":"Edition Statement","255":"Cartographic Mathematical Data","260":"Publication, Distribution, Manufacture",
  "263":"Projected Publication Date","264":"Production, Publication, Distribution, Manufacture",
  "300":"Physical Description","336":"Content Type","337":"Media Type","338":"Carrier Type",
  "340":"Physical Medium","362":"Dates of Publication and/or Sequential Designation",
  "400":"Series Statement/Personal Name","440":"Series Statement/Title","490":"Series Statement",
  "500":"General Note","501":"With Note","502":"Dissertation Note","504":"Bibliography Note",
  "505":"Formatted Contents Note","506":"Restrictions on Access Note","508":"Creation/Production Credits",
  "510":"Citation/References Note","511":"Participant or Performer Note","515":"Numbering Peculiarities Note",
  "520":"Summary","521":"Audience","522":"Geographic Coverage Note","525":"Supplement Note",
  "530":"Additional Physical Form Available Note","533":"Reproduction Note","538":"System Details Note",
  "540":"Terms Governing Use and Reproduction","541":"Immediate Source of Acquisition","545":"Biographical or Historical Data",
  "546":"Language Note","550":"Issuing Body Note","555":"Cumulative Index/Finding Aids Note",
  "563":"Binding Information","580":"Linking Entry Complexity Note","586":"Awards Note","588":"Source of Description Note",
  "600":"Subject Added Entry — Personal Name","610":"Subject Added Entry — Corporate Name",
  "611":"Subject Added Entry — Meeting Name","630":"Subject Added Entry — Uniform Title",
  "648":"Subject Added Entry — Chronological Term","650":"Subject Added Entry — Topical Term",
  "651":"Subject Added Entry — Geographic Name","653":"Index Term — Uncontrolled",
  "655":"Index Term — Genre/Form","656":"Index Term — Occupation","657":"Index Term — Function",
  "700":"Added Entry — Personal Name","710":"Added Entry — Corporate Name","711":"Added Entry — Meeting Name",
  "720":"Added Entry — Uncontrolled Name","730":"Added Entry — Uniform Title","740":"Added Entry — Uncontrolled Related/Analytical Title",
  "760":"Main Series Entry","762":"Subseries Entry","765":"Original Language Entry","767":"Translation Entry",
  "770":"Supplement/Special Issue Entry","772":"Supplement Parent Entry","773":"Host Item Entry",
  "776":"Additional Physical Form Entry","780":"Preceding Entry","785":"Succeeding Entry",
  "787":"Other Relationship Entry","800":"Series Added Entry — Personal Name","810":"Series Added Entry — Corporate Name",
  "811":"Series Added Entry — Meeting Name","830":"Series Added Entry — Uniform Title",
  "856":"Electronic Location and Access","880":"Alternate Graphic Representation","887":"Non-MARC Information Field"
};

// ── Parse MARC 21 text (mnemonic/readable format) into structured fields ──
function parseMARCText(raw) {
  const lines = raw.split("\n").map(l=>l.trim()).filter(Boolean);
  const fields = [];
  for (const line of lines) {
    // Match: TAG IND1 IND2 $a ... OR TAG $a ... OR =TAG ...
    const m1 = line.match(/^=?(\d{3})\s+([\s\S]*)$/);
    if (!m1) continue;
    const tag = m1[1];
    const rest = m1[2];
    // Control fields (00x) — no indicators/subfields
    if (tag < "010") {
      fields.push({ tag, ind1:"", ind2:"", subfields:[{code:"",data:rest.replace(/^\\\\?\s*/,"")}] });
      continue;
    }
    // Extract indicators (first two chars if they are digits/# / or backslash)
    const indMatch = rest.match(/^([#\s\d\\])([#\s\d\\])\s*([\s\S]*)$/);
    let ind1="", ind2="", subRest=rest;
    if (indMatch) { ind1=indMatch[1].trim(); ind2=indMatch[2].trim(); subRest=indMatch[3]; }
    // Parse subfields: $a text $b text ...
    const subfields = [];
    const parts = subRest.split(/\$(?=[a-z0-9])/i);
    for (const part of parts) {
      if (!part.trim()) continue;
      const code = part[0]; const data = part.slice(1).trim();
      if (data) subfields.push({ code, data });
    }
    if (subfields.length === 0 && subRest.trim()) subfields.push({ code:"a", data:subRest.trim() });
    fields.push({ tag, ind1, ind2, subfields });
  }
  return fields;
}

// ── Extract key bibliographic data from parsed MARC fields ──
function extractBibFromMARC(fields) {
  const get = (tag, sub="a") => {
    const f = fields.find(f=>f.tag===tag);
    if (!f) return "";
    const s = f.subfields.find(s=>s.code===sub||s.code==="");
    return s ? s.data : (f.subfields[0]?.data||"");
  };
  const getAll = (tag) => fields.filter(f=>f.tag===tag);
  const title245 = fields.find(f=>f.tag==="245");
  const title = title245 ? (title245.subfields.find(s=>s.code==="a")?.data||"") + (title245.subfields.find(s=>s.code==="b") ? " " + title245.subfields.find(s=>s.code==="b").data : "") : "";
  const author100 = fields.find(f=>f.tag==="100");
  const author = author100 ? (author100.subfields.find(s=>s.code==="a")?.data||"") : get("110","a") || get("111","a");
  const pub264 = fields.find(f=>f.tag==="264")||fields.find(f=>f.tag==="260");
  const publisher = pub264 ? (pub264.subfields.find(s=>s.code==="b")?.data||"") : "";
  const pubYear = pub264 ? (pub264.subfields.find(s=>s.code==="c")?.data||"").replace(/[^0-9]/g,"").slice(0,4) : "";
  const pubPlace = pub264 ? (pub264.subfields.find(s=>s.code==="a")?.data||"") : "";
  const edition = get("250","a");
  const pages300 = fields.find(f=>f.tag==="300");
  const pages = pages300 ? pages300.subfields.map(s=>s.data).join(" ") : "";
  const isbn = getAll("020").map(f=>f.subfields.find(s=>s.code==="a")?.data||f.subfields[0]?.data||"").filter(Boolean).join("; ");
  const issn = getAll("022").map(f=>f.subfields.find(s=>s.code==="a")?.data||f.subfields[0]?.data||"").filter(Boolean).join("; ");
  const lccn = get("010","a").replace(/\s/g,"");
  const lcc = get("050","a") + (get("050","b") ? " "+get("050","b") : "");
  const ddc = get("082","a");
  const lang041 = get("041","a") || "eng";
  const summary = get("520","a");
  const subjects = getAll("650").map(f=>{
    const parts = f.subfields.filter(s=>["a","b","x","y","z","v"].includes(s.code)).map(s=>s.data.replace(/[.,]+$/,""));
    return parts.join(" -- ");
  }).concat(getAll("651").map(f=>f.subfields.filter(s=>["a","x","y","z","v"].includes(s.code)).map(s=>s.data.replace(/[.,]+$/,"")).join(" -- ")));
  const series = get("490","a") || get("440","a") || get("830","a");
  const notes = getAll("500").concat(getAll("504")).concat(getAll("505")).map(f=>f.subfields.map(s=>s.data).join(" ")).filter(Boolean);
  const genre = getAll("655").map(f=>f.subfields.find(s=>s.code==="a")?.data||"").filter(Boolean);
  const addedAuthors = getAll("700").map(f=>f.subfields.find(s=>s.code==="a")?.data||"").filter(Boolean);
  const contentType = get("336","a");
  const mediaType = get("337","a");
  const carrierType = get("338","a");
  const url = fields.find(f=>f.tag==="856")?.subfields.find(s=>s.code==="u")?.data||"";
  return { title:title.replace(/\s*\/\s*$|[\s:/]+$/,"").trim(), author:author.replace(/,?\s*$/,"").trim(), publisher:publisher.replace(/[,;]+$/,"").trim(), pubYear, pubPlace:pubPlace.replace(/[,:]+$/,"").trim(), edition, pages, isbn, issn, lccn, lcc:lcc.trim(), ddc, lang:lang041, summary, subjects:subjects.filter(Boolean), series, notes, genre, addedAuthors, contentType, mediaType, carrierType, url };
}

const LOC_CATALOGUE_PROMPT = `You are LISAR, an expert AI cataloguing librarian with complete mastery of DDC, LCC, MARC 21, LCSH, and Dublin Core.

ALWAYS generate a complete catalogue record with ALL of the following sections:

## Dublin Core Record
All 15 DC elements (dc:title, dc:creator, dc:subject, dc:description, dc:publisher, dc:contributor, dc:date, dc:type, dc:format, dc:identifier, dc:source, dc:language, dc:relation, dc:coverage, dc:rights)

## Classification
DDC (Dewey Decimal Classification 23rd Ed.): Full class number with table extensions, step-by-step notation reasoning, cutter number, complete shelf label.
LCC (Library of Congress Classification): Subclass letters, integer range, geographic cutter, author cutter, date, complete call number with construction steps.
For Nigerian/African materials: Nigeria geographic .N6 (H schedules), DT515.5 (history), KTQ (Nigerian law), PL8671 (Yoruba), PR9387.9 (Nigerian literature in English).

## LCSH Subject Headings (MARC 21 Tagged)
Generate 4-6 authorised LCSH headings formatted as:
650 _0 $a [Main heading] $x [Topical subdivision] $z [Geographic] $y [Chronological] $v [Form].
651 _0 $a [Geographic heading] $x [Subdivision].
655 _7 $a [Genre/form term]. $2 lcgft

## MARC 21 Record (Key Fields)
LDR, 008, 020/022, 040, 050, 082, 1XX, 245, 250, 264, 300, 336/337/338, 520, 650, 651, 655

## RDA Description
Title proper, Statement of responsibility, Edition, Publication, Extent, Identifier

## Cataloguer Notes
Classification decisions, alternative numbers, notes on Nigerian/African context if applicable.`;

function CataloguingPage() {
  const [view,        setView]        = useState("list");
  const [apiBooks,    setApiBooks]    = useState(BOOKS);
  const [editingBib,  setEditingBib]  = useState(null);
  const [editSaving,  setEditSaving]  = useState(false);
  const [editMsg,     setEditMsg]     = useState("");

  useEffect(()=>{ if(view!=="list")return; api.catalogue.list().then(d=>{if(d?.bibs?.length)setApiBooks(d.bibs);}).catch(()=>{}); },[view]);

  const saveEdit = async () => {
    if(!editingBib)return;
    setEditSaving(true);setEditMsg("");
    try{
      await api.catalogue.update(editingBib.id, editingBib);
      setEditMsg("✅ Record saved!");
      api.catalogue.list().then(d=>{if(d?.bibs?.length)setApiBooks(d.bibs);}).catch(()=>{});
      setTimeout(()=>{setEditingBib(null);setEditMsg("");},1200);
    }catch(e){setEditMsg("❌ "+(e.message||"Save failed"));}
    finally{setEditSaving(false);}
  };
  const [inputMode, setInputMode] = useState("loc"); // loc | isbn | marc | manual
  const [q, setQ]               = useState("");
  const [selected, setSelected] = useState(null);
  // LOC mode
  const [locQuery, setLocQuery] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locResults, setLocResults] = useState([]);
  const [locPicked, setLocPicked] = useState(null);
  const [locError, setLocError] = useState("");
  // ISBN/Open Library mode
  const [isbn, setIsbn]         = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched]   = useState(null);
  // MARC import mode
  const [marcRaw, setMarcRaw]   = useState("");
  const [marcFields, setMarcFields] = useState(null);
  const [marcBib, setMarcBib]   = useState(null);
  const [marcError, setMarcError] = useState("");
  const [marcView, setMarcView] = useState("parsed"); // parsed | fields | save
  const [marcSaved, setMarcSaved] = useState(false);
  // Common
  const [scheme, setScheme]     = useState("full");
  const [generating, setGenerating] = useState(false);
  const [record, setRecord]     = useState(null);
  const [saved, setSaved]       = useState(false);
  const resultRef = useRef(null);
  const marcFileRef = useRef(null);

  const filtered = BOOKS.filter(b=>q===""||b.title.toLowerCase().includes(q.toLowerCase())||b.author.toLowerCase().includes(q.toLowerCase()));

  // ── Parse pasted/uploaded MARC ──
  const parseMARCInput = (text) => {
    setMarcError(""); setMarcFields(null); setMarcBib(null); setMarcSaved(false); setRecord(null);
    if (!text.trim()) return;
    try {
      const fields = parseMARCText(text);
      if (fields.length === 0) { setMarcError("No MARC fields detected. Paste a MARC 21 record in mnemonic/readable format (e.g. =245 10 $a Title $b Subtitle)."); return; }
      const bib = extractBibFromMARC(fields);
      if (!bib.title && !bib.author && !bib.isbn) { setMarcError("Could not extract bibliographic data. Ensure your MARC record includes fields 100/245/264/020."); return; }
      setMarcFields(fields);
      setMarcBib(bib);
    } catch(e) { setMarcError("Parse error: " + e.message); }
  };

  const handleMARCFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const txt = ev.target.result; setMarcRaw(txt); parseMARCInput(txt); };
    reader.readAsText(file);
  };

  const generateFromMARC = async () => {
    if (!marcBib) return;
    setGenerating(true); setRecord(null);
    const systemPrompt = `You are LISAR, an expert library cataloguer. A MARC 21 record has been imported. Generate a clean, professional full catalogue record. Use the provided data exactly — do not invent or alter titles, authors, ISBNs, call numbers, or LCSH subjects that are already present.

Format with ## section headers:
## Dublin Core Record
All 15 DCMES elements with dc: prefix.

## Classification
LCC call number (use provided if available), DDC number with explanation.

## LCSH Subject Headings (MARC 650/651 formatted)
Use the subjects from the MARC record exactly. Format each as:
6XX _X $a Topic $x Subdivision $y Period $z Place $v Form.

## RDA Core Elements
Title proper, statement of responsibility, edition, publication info, physical description, content/media/carrier types.

## MARC 21 Summary
Key fields verified and sourced from the imported record.

## Cataloguer's Note
Short note confirming this record was imported from MARC 21 data.`;
    const userMsg = `Generate full catalogue record from this imported MARC 21 data:

TITLE: ${marcBib.title}
AUTHOR/CREATOR: ${marcBib.author}
ADDED AUTHORS: ${marcBib.addedAuthors.join("; ")||"—"}
PUBLISHER: ${marcBib.publisher}
PLACE: ${marcBib.pubPlace}
YEAR: ${marcBib.pubYear}
EDITION: ${marcBib.edition||"—"}
PAGES/EXTENT: ${marcBib.pages}
ISBN: ${marcBib.isbn||"—"}
ISSN: ${marcBib.issn||"—"}
LCCN: ${marcBib.lccn||"—"}
LCC CALL NUMBER: ${marcBib.lcc||"—"}
DDC: ${marcBib.ddc||"—"}
LANGUAGE: ${marcBib.lang}
SERIES: ${marcBib.series||"—"}
CONTENT TYPE: ${marcBib.contentType||"—"}
MEDIA TYPE: ${marcBib.mediaType||"—"}
CARRIER TYPE: ${marcBib.carrierType||"—"}
SUMMARY: ${marcBib.summary||"—"}
SUBJECTS (LCSH from MARC): ${marcBib.subjects.join(" | ")||"—"}
GENRE/FORM: ${marcBib.genre.join("; ")||"—"}
NOTES: ${marcBib.notes.join(" | ")||"—"}

Use the LCC, DDC, and LCSH subjects EXACTLY as provided — these are from the MARC record. Only generate missing elements.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:systemPrompt,messages:[{role:"user",content:userMsg}]})
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"Could not generate record.";
      setRecord(text);
      setMarcView("save");
      setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    } catch { setRecord("⚠️ Connection error. Please check your internet connection."); }
    setGenerating(false);
  };

  // ── Search LOC Catalog ──
  const searchLOC = async () => {
    if (!locQuery.trim()) return;
    setLocLoading(true); setLocError(""); setLocResults([]); setLocPicked(null); setRecord(null);
    try {
      // Try LOC catalog JSON API
      const res = await fetch(`https://www.loc.gov/books/?q=${encodeURIComponent(locQuery)}&fo=json&c=8`);
      if (!res.ok) throw new Error("LOC API unavailable");
      const data = await res.json();
      const items = (data.results||[]).map(item => ({
        title:      item.title||"",
        creator:    item.creator||"",
        date:       item.date||"",
        subjects:   Array.isArray(item.subject)?item.subject:(item.subject?[item.subject]:[]),
        callNumber: item.shelf_id||item.call_number?.[0]||"",
        description:(Array.isArray(item.description)?item.description.join(" "):item.description)||"",
        url:        item.url||"",
        publisher:  item.publisher||"",
        language:   Array.isArray(item.language)?item.language[0]:item.language||"eng",
        locId:      item.id||"",
        isbn:       item.number?.find(n=>n.length===13||n.length===10)||""
      })).filter(i=>i.title);
      if (items.length===0) setLocError("No results found in LOC Catalog. Try a different query or switch to ISBN/Open Library.");
      setLocResults(items);
    } catch(e) {
      // LOC API might have CORS issues — fallback via Open Library + LCSH API
      setLocError("LOC Catalog API unreachable from browser. Using Open Library + id.loc.gov as fallback.");
      // Attempt Open Library search as fallback
      try {
        const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(locQuery)}&limit=6&fields=title,author_name,first_publish_year,publisher,isbn,subject,lcc,ddc`);
        const olD = await olRes.json();
        const items = (olD.docs||[]).map(item=>({
          title:      item.title||"",
          creator:    (item.author_name||[]).join("; "),
          date:       String(item.first_publish_year||""),
          subjects:   (item.subject||[]).slice(0,8),
          callNumber: (item.lcc||[])[0]||"",
          description:"",
          url:        "",
          publisher:  (item.publisher||[]).join("; "),
          language:   "eng",
          locId:      "",
          isbn:       (item.isbn||[])[0]||""
        })).filter(i=>i.title);
        if (items.length>0) { setLocResults(items); setLocError("⚠️ Showing Open Library results (LOC API unreachable). LCSH subjects may be less authoritative."); }
      } catch(e2) { setLocError("Both LOC Catalog and Open Library are unreachable. Check your connection."); }
    }
    setLocLoading(false);
  };

  // ── Pick a LOC result ──
  const pickLocResult = async (item) => {
    setLocPicked(item);
    setRecord(null);
    // If subjects are short strings, enrich with live LCSH verification
    // (id.loc.gov suggest API — we know this works)
  };

  // ── ISBN / Open Library lookup ──
  const fetchISBN = () => {
    setFetching(true); setRecord(null);
    setTimeout(()=>{
      setFetched({title:"Half of a Yellow Sun",authors:"Adichie, Chimamanda Ngozi",publisher:"Knopf",date:"2006",pages:"x, 433 pages",isbn:isbn||"9781400044160",subjects:"Nigeria--History--Civil War, 1967-1970--Fiction; Biafra (Nigeria)--Fiction",language:"eng",cover:"#A855F7"});
      setFetching(false);
    },1000);
  };

  // ── Generate DC from LOC data ──
  const generateFromLOC = async () => {
    if (!locPicked) return;
    setGenerating(true); setRecord(null);
    const systemPrompt = LOC_CATALOGUE_PROMPT;

    const userMsg = `Generate catalogue record from this LOC Catalog data:

TITLE: ${locPicked.title}
CREATOR: ${locPicked.creator}
DATE: ${locPicked.date}
PUBLISHER: ${locPicked.publisher}
CALL NUMBER (LCC from LOC): ${locPicked.callNumber}
LCSH SUBJECTS (from LOC authority): ${locPicked.subjects.join(" | ")}
LANGUAGE: ${locPicked.language}
DESCRIPTION: ${locPicked.description}
ISBN: ${locPicked.isbn}
LOC URL: ${locPicked.url}

Use the LCC call number and LCSH subjects EXACTLY as provided above — these come directly from the Library of Congress catalog.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:systemPrompt,messages:[{role:"user",content:userMsg}]})
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"Could not generate record.";
      setRecord(text);
      setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    } catch { setRecord("⚠️ Connection error. Please check your internet connection."); }
    setGenerating(false);
  };

  // ── Generate from Open Library/ISBN data ──
  const generateFromISBN = async () => {
    if (!fetched) return;
    setGenerating(true); setRecord(null);
    setTimeout(()=>{
      setRecord(`## Dublin Core Record

**dc:title** — ${fetched.title}
**dc:creator** — ${fetched.authors}
**dc:subject** — ${fetched.subjects}
**dc:description** — A sweeping novel set during the Nigerian Civil War of 1967–1970, following three characters across different social classes through love, upheaval, and the brutal realities of conflict.
**dc:publisher** — ${fetched.publisher}
**dc:contributor** — Not applicable
**dc:date** — ${fetched.date}
**dc:type** — Text
**dc:format** — ${fetched.pages} ; 24 cm
**dc:identifier** — ISBN: ${fetched.isbn}
**dc:source** — Open Library
**dc:language** — ${fetched.language}
**dc:relation** — Related to Adichie's Purple Hibiscus (2003) and Americanah (2013)
**dc:coverage** — Nigeria; Biafra; 1967–1970
**dc:rights** — © ${fetched.date} ${fetched.authors}. All rights reserved.

## Classification
**DDC:** 823.92 — English fiction, 21st century; Call number: 823.92 ADI
**LCC:** PR9387.9.A3235 H35 ${fetched.date}

## LCSH Subject Headings
650 _0 $a Nigeria $x History $y Civil War, 1967-1970 $v Fiction.
651 _0 $a Biafra (Nigeria) $v Fiction.
655 _7 $a Historical fiction. $2 lcgft
655 _7 $a War fiction. $2 lcgft

## Cataloguer's Note
Record generated via Open Library ISBN lookup. Verify LCSH headings against id.loc.gov authority file.`);
      setGenerating(false);
      setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    },1800);
  };

  const statusBadge = s=>s==="available"?<Badge color="green">Available</Badge>:s==="checked_out"?<Badge color="red">Checked Out</Badge>:s==="reference"?<Badge color="purple">Reference</Badge>:<Badge color="gray">{s}</Badge>;

  // ── WORKSTATION VIEW ──
  if (view==="workstation") return (
    <div style={{padding:"28px 24px",maxWidth:940}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={()=>{setView("list");setLocResults([]);setLocPicked(null);setFetched(null);setRecord(null);setSaved(false);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:".82em",color:C.muted}}>← Back</button>
        <h1 style={{margin:0,fontSize:"1.3em",fontWeight:800,color:C.text}}>📚 Smart Cataloguing Workstation</h1>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:".68em",color:C.muted}}>Powered by</span>
          <span style={{fontSize:".65em",background:"#EFF6FF",color:C.primary,border:`1px solid ${C.primary}30`,borderRadius:10,padding:"2px 8px",fontWeight:600}}>LOC Catalog</span>
          <span style={{fontSize:".65em",background:"#F0FDF4",color:C.success,border:`1px solid rgba(22,163,74,.25)`,borderRadius:10,padding:"2px 8px",fontWeight:600}}>id.loc.gov</span>
          <span style={{fontSize:".65em",background:"#FAF5FF",color:"#7C3AED",border:"1px solid rgba(124,58,237,.25)",borderRadius:10,padding:"2px 8px",fontWeight:600}}>Claude AI</span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:20,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        {[{id:"loc",icon:"🏛️",label:"LOC Catalog Search",desc:"Authoritative LCSH & LCC"},{id:"isbn",icon:"📖",label:"ISBN / Open Library",desc:"Quick ISBN/title lookup"},{id:"marc",icon:"📋",label:"Import MARC 21",desc:"Paste or upload MARC record"},{id:"manual",icon:"✍️",label:"Manual Entry",desc:"Enter details yourself"}].map(m=>(
          <button key={m.id} onClick={()=>{setInputMode(m.id);setRecord(null);setSaved(false);setMarcFields(null);setMarcBib(null);setMarcError("");}}
            style={{flex:1,padding:"13px 10px",border:"none",borderBottom:`3px solid ${inputMode===m.id?C.primary:"transparent"}`,background:inputMode===m.id?`${C.primary}09`:"transparent",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:3}}>{m.icon}</div>
            <div style={{fontSize:".8em",fontWeight:700,color:inputMode===m.id?C.primary:C.text}}>{m.label}</div>
            <div style={{fontSize:".65em",color:C.muted,marginTop:1}}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* ── LOC Catalog Mode (Primary) ── */}
      {inputMode==="loc" && (
        <>
          <Card style={{padding:"20px",marginBottom:14}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:20}}>🏛️</span>
              <div><div style={{fontWeight:700,color:C.text,fontSize:".9em"}}>Library of Congress Catalog Search</div>
              <div style={{fontSize:".72em",color:C.muted}}>Enter ISBN, ISSN, or any title/keyword — retrieves authoritative LCSH subjects and LCC call numbers directly from LOC</div></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <input value={locQuery} onChange={e=>setLocQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchLOC()}
                placeholder="ISBN, ISSN, title, author or keyword…"
                style={{flex:1,padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
              <Btn onClick={searchLOC} disabled={locLoading||!locQuery.trim()} icon={locLoading?"":"🔍"}>
                {locLoading?<><div style={{width:13,height:13,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .8s linear infinite"}}/>Searching LOC…</>:"Search LOC →"}
              </Btn>
            </div>
            {locError&&<div style={{marginTop:10,padding:"8px 12px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:7,fontSize:".78em",color:"#92400E"}}>{locError}</div>}
          </Card>

          {/* LOC Results */}
          {locResults.length>0&&!locPicked&&(
            <Card style={{marginBottom:14}}>
              <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:".82em",color:C.text}}>
                {locResults.length} result{locResults.length!==1?"s":""} from {locError?"Open Library":"LOC Catalog"} — select to catalogue
              </div>
              {locResults.map((item,i)=>(
                <div key={i} onClick={()=>pickLocResult(item)}
                  style={{display:"flex",gap:14,padding:"14px 18px",borderBottom:i<locResults.length-1?`1px solid ${C.border}`:"",cursor:"pointer",transition:"background .15s"}}
                  onMouseOver={e=>e.currentTarget.style.background="#F0F7FF"} onMouseOut={e=>e.currentTarget.style.background=""}>
                  <div style={{width:36,height:36,borderRadius:8,background:`${C.primary}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📖</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:C.text,fontSize:".88em",marginBottom:2}}>{item.title}</div>
                    <div style={{fontSize:".77em",color:C.muted,marginBottom:4}}>{item.creator}{item.date?` · ${item.date}`:""}{item.publisher?` · ${item.publisher}`:""}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {item.callNumber&&<span style={{fontSize:".68em",background:"#EFF6FF",color:C.primary,border:`1px solid ${C.primary}25`,borderRadius:5,padding:"1px 7px",fontFamily:"monospace"}}>{item.callNumber}</span>}
                      {item.subjects.slice(0,2).map((s,j)=><span key={j} style={{fontSize:".67em",background:"#F0FDF4",color:C.success,border:"1px solid rgba(22,163,74,.2)",borderRadius:5,padding:"1px 7px"}}>{s.split("--")[0]}</span>)}
                    </div>
                  </div>
                  <div style={{fontSize:".78em",color:C.primary,fontWeight:600,flexShrink:0,alignSelf:"center"}}>Select →</div>
                </div>
              ))}
            </Card>
          )}

          {/* Selected LOC item preview */}
          {locPicked&&(
            <Card style={{marginBottom:14,border:`2px solid ${C.primary}35`}}>
              <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:16}}>✅</span>
                  <div style={{fontWeight:700,color:C.success,fontSize:".85em"}}>LOC Record Retrieved — Ready to Catalogue</div>
                </div>
                <button onClick={()=>{setLocPicked(null);setRecord(null);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:".78em"}}>Change selection</button>
              </div>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14,fontSize:".82em"}}>
                  {[["Title",locPicked.title],["Creator",locPicked.creator],["Date",locPicked.date],["Publisher",locPicked.publisher],["Language",locPicked.language],["ISBN",locPicked.isbn||"—"]].map(([k,v])=>(
                    <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}>
                      <div style={{color:C.muted,fontSize:".72em",textTransform:"uppercase",letterSpacing:".04em",marginBottom:2}}>{k}</div>
                      <div style={{color:C.text,fontWeight:500}}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
                {locPicked.callNumber&&(
                  <div style={{background:"#EFF6FF",border:`1px solid ${C.primary}30`,borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:16}}>🏛️</span>
                    <div><div style={{fontSize:".68em",color:C.primary,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>LCC Call Number (from LOC)</div>
                    <div style={{fontFamily:"monospace",fontSize:".95em",color:C.primary,fontWeight:700,marginTop:2}}>{locPicked.callNumber}</div></div>
                  </div>
                )}
                {locPicked.subjects.length>0&&(
                  <div style={{background:"#F0FDF4",border:"1px solid rgba(22,163,74,.2)",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
                    <div style={{fontSize:".68em",color:C.success,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>LCSH Subject Headings (from LOC Authority)</div>
                    {locPicked.subjects.map((s,i)=>(
                      <div key={i} style={{fontSize:".8em",color:C.text,padding:"3px 0",borderBottom:i<locPicked.subjects.length-1?`1px solid rgba(22,163,74,.1)`:"",display:"flex",gap:6}}>
                        <span style={{color:C.success,flexShrink:0}}>•</span>{s}
                      </div>
                    ))}
                  </div>
                )}
                <Btn full size="lg" onClick={generateFromLOC} disabled={generating} icon={generating?"":"📖"}>
                  {generating?<><div style={{width:15,height:15,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .8s linear infinite"}}/>Generating Full Catalogue Record…</>:"Generate Full Catalogue Record from LOC Data"}
                </Btn>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── ISBN / Open Library Mode ── */}
      {inputMode==="isbn" && (
        <Card style={{padding:"20px",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>📖 ISBN / ISSN / Title Lookup via Open Library</div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input value={isbn} onChange={e=>setIsbn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchISBN()}
              placeholder="Enter ISBN-13, ISBN-10, ISSN or book title…"
              style={{flex:1,padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",outline:"none"}}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
            <Btn onClick={fetchISBN} disabled={fetching||!isbn.trim()} icon={fetching?"":"🔍"}>
              {fetching?<><div style={{width:13,height:13,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .8s linear infinite"}}/>Looking up…</>:"Look Up"}
            </Btn>
          </div>
          <div style={{fontSize:".73em",color:C.muted}}>💡 Tip: For more authoritative results (with LCSH + LCC), use the LOC Catalog tab above</div>
          {fetched&&(
            <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12,fontSize:".82em"}}>
                {[["Title",fetched.title],["Author",fetched.authors],["Publisher",fetched.publisher],["Year",fetched.date],["Pages",fetched.pages],["ISBN",fetched.isbn]].map(([k,v])=>(
                  <div key={k}><label style={{fontSize:".7em",color:C.muted,display:"block",marginBottom:3,textTransform:"uppercase"}}>{k}</label>
                  <input defaultValue={v} style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".86em",outline:"none",boxSizing:"border-box"}}/></div>
                ))}
              </div>
              <Btn full onClick={generateFromISBN} disabled={generating} icon="📖">
                {generating?<><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .8s linear infinite"}}/>Generating…</>:"Generate Catalogue Record"}
              </Btn>
            </div>
          )}
        </Card>
      )}

      {/* ── MARC 21 Import Mode ── */}
      {inputMode==="marc" && (
        <div style={{marginBottom:14}}>
          <Card style={{padding:"20px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>📋 Import MARC 21 Record</div>
              <div style={{display:"flex",gap:8}}>
                <input ref={marcFileRef} type="file" accept=".mrc,.marc,.txt,.mrk" style={{display:"none"}} onChange={handleMARCFile}/>
                <Btn size="sm" variant="secondary" icon="📁" onClick={()=>marcFileRef.current?.click()}>Upload .mrc / .mrk file</Btn>
              </div>
            </div>
            <div style={{fontSize:".75em",color:C.muted,marginBottom:10,padding:"8px 12px",background:`${C.primary}08`,borderRadius:7,border:`1px solid ${C.primary}20`}}>
              💡 Paste a MARC 21 record in mnemonic/readable format below, or upload a .mrc/.mrk file. The system will automatically parse every field and pre-fill all bibliographic data — title, author, publisher, LCC, DDC, LCSH subjects, edition, language, and more.
            </div>
            <textarea
              value={marcRaw}
              onChange={e=>{setMarcRaw(e.target.value);if(!e.target.value.trim()){setMarcFields(null);setMarcBib(null);setMarcError("");}}}
              placeholder={`Paste your MARC 21 record here, e.g.:\n\n=001  123456789\n=003  OCoLC\n=040  \\\\$aDLC$beng$cDLC\n=020  \\\\$a9780385474542\n=050 00$aPR9387.9.A24$bT5 1958\n=082 04$a823.914$222\n=100 1\\$aAchebe, Chinua,$eauthor.\n=245 10$aThings fall apart /$cChinua Achebe.\n=264 \\1$aLondon :$bHeinemann,$c1958.\n=300  \\\\$a215 pages ;$c21 cm\n=336  \\\\$atext$btxt$2rdacontent\n=650  \\0$aNigerian fiction (English)\n=650  \\0$aIgbo (African people)$xSocial life and customs$vFiction.`}
              rows={12}
              style={{width:"100%",padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".8em",fontFamily:"monospace",color:C.text,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor=C.border}
            />
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <Btn icon="🔍" onClick={()=>parseMARCInput(marcRaw)} disabled={!marcRaw.trim()}>Parse MARC Record</Btn>
              {marcRaw&&<Btn variant="secondary" size="sm" onClick={()=>{setMarcRaw("");setMarcFields(null);setMarcBib(null);setMarcError("");setRecord(null);}}>Clear</Btn>}
            </div>
            {marcError&&<div style={{marginTop:10,padding:"9px 12px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:7,fontSize:".78em",color:"#92400E"}}>⚠️ {marcError}</div>}
          </Card>

          {/* Parsed MARC preview */}
          {marcBib&&(
            <Card style={{marginBottom:12,border:`2px solid ${C.success}35`}}>
              <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span>✅</span>
                  <div style={{fontWeight:700,color:C.success,fontSize:".85em"}}>MARC Record Parsed — {marcFields?.length} fields extracted</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setMarcView("parsed")} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${marcView==="parsed"?C.primary:C.border}`,background:marcView==="parsed"?`${C.primary}10`:"transparent",fontSize:".72em",fontWeight:600,color:marcView==="parsed"?C.primary:C.muted,cursor:"pointer"}}>Bibliographic Summary</button>
                  <button onClick={()=>setMarcView("fields")} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${marcView==="fields"?C.primary:C.border}`,background:marcView==="fields"?`${C.primary}10`:"transparent",fontSize:".72em",fontWeight:600,color:marcView==="fields"?C.primary:C.muted,cursor:"pointer"}}>All MARC Fields ({marcFields?.length})</button>
                </div>
              </div>
              <div style={{padding:"16px 18px"}}>
                {marcView==="parsed" && (
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12,fontSize:".82em"}}>
                      {[["Title",marcBib.title],["Author/Creator",marcBib.author],["Publisher",marcBib.publisher],["Place of Publication",marcBib.pubPlace],["Year",marcBib.pubYear],["Edition",marcBib.edition||"—"],["Extent/Pages",marcBib.pages||"—"],["ISBN",marcBib.isbn||"—"],["ISSN",marcBib.issn||"—"],["LCCN",marcBib.lccn||"—"],["Language",marcBib.lang],["Series",marcBib.series||"—"]].map(([k,v])=>(
                        <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}>
                          <div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",letterSpacing:".04em",marginBottom:2}}>{k}</div>
                          <div style={{color:v&&v!=="—"?C.text:C.muted,fontWeight:v&&v!=="—"?500:400,fontStyle:v&&v!=="—"?"normal":"italic"}}>{v||"—"}</div>
                        </div>
                      ))}
                    </div>
                    {(marcBib.lcc||marcBib.ddc)&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                        {marcBib.lcc&&<div style={{background:"#EFF6FF",border:`1px solid ${C.primary}30`,borderRadius:8,padding:"10px 14px"}}>
                          <div style={{fontSize:".65em",color:C.primary,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>LCC Call Number (from MARC 050)</div>
                          <div style={{fontFamily:"monospace",fontSize:".95em",color:C.primary,fontWeight:700}}>{marcBib.lcc}</div>
                        </div>}
                        {marcBib.ddc&&<div style={{background:"#F0FDF4",border:"1px solid rgba(22,163,74,.2)",borderRadius:8,padding:"10px 14px"}}>
                          <div style={{fontSize:".65em",color:C.success,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>DDC Number (from MARC 082)</div>
                          <div style={{fontFamily:"monospace",fontSize:".95em",color:C.success,fontWeight:700}}>{marcBib.ddc}</div>
                        </div>}
                      </div>
                    )}
                    {marcBib.subjects.length>0&&(
                      <div style={{background:"#F0FDF4",border:"1px solid rgba(22,163,74,.2)",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                        <div style={{fontSize:".65em",color:C.success,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>LCSH Subject Headings (MARC 650/651)</div>
                        {marcBib.subjects.map((s,i)=>(
                          <div key={i} style={{fontSize:".8em",color:C.text,padding:"3px 0",borderBottom:i<marcBib.subjects.length-1?`1px solid rgba(22,163,74,.1)`:"",display:"flex",gap:6}}>
                            <span style={{color:C.success,flexShrink:0}}>•</span>{s}
                          </div>
                        ))}
                      </div>
                    )}
                    {marcBib.addedAuthors.length>0&&(
                      <div style={{background:C.bg,borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:".82em"}}>
                        <div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:4}}>Added Entries (MARC 700)</div>
                        {marcBib.addedAuthors.map((a,i)=><div key={i} style={{color:C.text}}>• {a}</div>)}
                      </div>
                    )}
                    {marcBib.summary&&(
                      <div style={{background:C.bg,borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:".82em"}}>
                        <div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:4}}>Summary (MARC 520)</div>
                        <div style={{color:C.text,lineHeight:1.5}}>{marcBib.summary}</div>
                      </div>
                    )}
                  </>
                )}
                {marcView==="fields" && (
                  <div style={{maxHeight:320,overflowY:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:".78em"}}>
                      <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                        <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,width:50}}>Tag</th>
                        <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,width:60}}>Ind</th>
                        <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,width:180}}>Field Name</th>
                        <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600}}>Content</th>
                      </tr></thead>
                      <tbody>
                        {marcFields?.map((f,i)=>(
                          <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                            <td style={{padding:"6px 10px",fontFamily:"monospace",fontWeight:700,color:C.primary}}>{f.tag}</td>
                            <td style={{padding:"6px 10px",fontFamily:"monospace",color:C.muted,fontSize:".85em"}}>{f.ind1}{f.ind2}</td>
                            <td style={{padding:"6px 10px",color:C.muted,fontSize:".78em"}}>{MARC_TAGS[f.tag]||"—"}</td>
                            <td style={{padding:"6px 10px",color:C.text}}>
                              {f.subfields.map((s,j)=>(
                                <span key={j}>
                                  {s.code&&<span style={{color:"#7C3AED",fontFamily:"monospace",fontSize:".85em",marginRight:1}}>${s.code}</span>}
                                  <span>{s.data} </span>
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{marginTop:14}}>
                  <Btn full size="lg" onClick={generateFromMARC} disabled={generating} icon={generating?"":"📄"}>
                    {generating?<><div style={{width:15,height:15,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .8s linear infinite"}}/>Generating Catalogue Record from MARC Data…</>:"Generate Full Catalogue Record from MARC Data"}
                  </Btn>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Manual Entry Mode ── */}
      {inputMode==="manual" && (
        <Card style={{padding:"20px",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>✍️ Manual Entry</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            <div style={{gridColumn:"1/-1"}}><Input label="Title" value="" onChange={()=>{}} placeholder="Full title of the material" required/></div>
            <div style={{paddingRight:8}}><Input label="Author / Creator" value="" onChange={()=>{}} placeholder="Surname, Firstname"/></div>
            <div style={{paddingLeft:8}}><Input label="Year" value="" onChange={()=>{}} placeholder="2024"/></div>
            <div style={{paddingRight:8}}><Input label="Publisher" value="" onChange={()=>{}} placeholder="Publisher name"/></div>
            <div style={{paddingLeft:8}}><Input label="ISBN / ISSN" value="" onChange={()=>{}} placeholder="978-..."/></div>
            <div style={{gridColumn:"1/-1"}}><Input label="Subject / Description" value="" onChange={()=>{}} placeholder="Brief description of contents"/></div>
          </div>
          <Btn full>Generate Catalogue Record</Btn>
        </Card>
      )}

      {/* ── Scheme selector (shown when something is ready to generate) ── */}
      {(locPicked||fetched||marcBib)&&!record&&(
        <Card style={{padding:"16px",marginBottom:14}}>
          <div style={{fontSize:".75em",color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Output Depth</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{id:"dc",label:"Dublin Core",desc:"15 DCMES elements",c:C.info},{id:"dc_lcc",label:"DC + LCC/DDC",desc:"Add classification",c:"#7C3AED"},{id:"full",label:"Full Record",desc:"DC + MARC + RDA + LCSH",c:C.primary}].map(s=>(
              <button key={s.id} onClick={()=>setScheme(s.id)} style={{padding:"10px",borderRadius:9,border:`2px solid ${scheme===s.id?s.c:C.border}`,background:scheme===s.id?`${s.c}0D`:C.bg,cursor:"pointer",textAlign:"center"}}>
                <div style={{fontWeight:700,fontSize:".78em",color:scheme===s.id?s.c:C.muted}}>{s.label}</div>
                <div style={{fontSize:".65em",color:C.muted,marginTop:2}}>{s.desc}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ── Generated Record ── */}
      {record&&(
        <div ref={resultRef}>
          <Card style={{padding:"20px",border:`1px solid ${C.primary}30`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:18}}>📄</span>
                <div style={{fontWeight:700,color:C.text,fontSize:".9em"}}>Generated Catalogue Record</div>
                {(locPicked?.callNumber||locPicked?.subjects?.length>0||marcBib)&&<span style={{fontSize:".65em",background:"#DCFCE7",color:C.success,border:"1px solid rgba(22,163,74,.25)",borderRadius:10,padding:"2px 9px",fontWeight:700}}>{marcBib?"✓ MARC 21 Import":"✓ LOC Authoritative Data"}</span>}
              </div>
              <div style={{display:"flex",gap:7}}>
                <Btn size="sm" variant="secondary" icon="📋" onClick={()=>navigator.clipboard?.writeText(record).catch(()=>{})}>Copy</Btn>
                <Btn size="sm" icon="💾" onClick={()=>setSaved(true)}>{saved?"✓ Saved":"Save to Catalogue"}</Btn>
              </div>
            </div>
            <div style={{background:C.bg,borderRadius:9,padding:"16px",fontSize:".83em",lineHeight:1.85,color:C.text}}>
              {record.split("\n").map((line,i)=>{
                if(line.startsWith("## ")) return <div key={i} style={{fontWeight:800,color:C.primary,fontSize:"1em",marginTop:14,marginBottom:6,paddingBottom:4,borderBottom:`1px solid ${C.border}`}}>{line.replace("## ","")}</div>;
                if(line.match(/^\*\*dc:/)) return <div key={i} style={{display:"flex",gap:8,marginBottom:3,padding:"3px 0"}}><strong style={{color:"#7C3AED",minWidth:150,flexShrink:0}}>{line.match(/\*\*(.*?)\*\*/)?.[1]||""}</strong><span style={{color:C.text}}>{line.replace(/\*\*.*?\*\* — /,"")}</span></div>;
                if(line.match(/^6[0-9]{2} /)) return <div key={i} style={{fontFamily:"monospace",fontSize:".88em",color:"#7C3AED",marginBottom:3,background:"rgba(124,58,237,.05)",padding:"2px 6px",borderRadius:4}}>{line}</div>;
                if(line.startsWith("**LCC:**")||line.startsWith("**DDC:**")) return <div key={i} style={{marginBottom:4,fontWeight:500}}><strong style={{color:C.primary}}>{line.match(/\*\*(.*?)\*\*/)?.[1]||""}:</strong> {line.replace(/\*\*.*?\*\*:/,"")}</div>;
                if(line.trim()==="") return <div key={i} style={{height:6}}/>;
                return <div key={i} style={{color:line.startsWith("Reasoning")||line.startsWith("Construction")?C.muted:C.text}}>{line}</div>;
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  // ── LIST VIEW ──
  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader title="📚 Cataloguing & Metadata" subtitle="AI-powered smart cataloguing via LOC Catalog · MARC 21 Import · LCSH · LCC · Dublin Core"
        action={<div style={{display:"flex",gap:8}}><Btn variant="secondary" icon="📋" onClick={()=>{setView("workstation");setInputMode("marc");}}>Import MARC</Btn><Btn onClick={()=>setView("workstation")} icon="✨">Smart Catalogue (AI)</Btn></div>}/>
      <Card>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search catalogue…" style={{flex:1,minWidth:180,padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}/>
          <select style={{padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}><option>All Formats</option><option>Books</option><option>Serials</option><option>E-Resources</option></select>
          <Btn variant="secondary" size="sm" icon="📤">Export DC</Btn>
          <Btn variant="secondary" size="sm" icon="📤">Export MARC</Btn>
        </div>
        <Table cols={["Title","Author","DDC","LCC","ISBN","Copies","Status","Actions"]}
          rows={filtered.map(b=>({cells:[
            <div><div style={{fontWeight:600,fontSize:".88em",color:C.text}}>{b.title}</div><div style={{fontSize:".72em",color:C.muted}}>{b.year} · {b.publisher}</div></div>,
            b.author.split(",")[0], b.ddc,
            <span style={{fontFamily:"monospace",fontSize:".8em"}}>{b.lcc}</span>,
            <span style={{fontFamily:"monospace",fontSize:".72em",color:C.muted}}>{b.isbn}</span>,
            `${b.available}/${b.copies}`, statusBadge(b.status),
            <div style={{display:"flex",gap:4}}><Btn size="sm" variant="secondary" onClick={()=>setSelected(b)}>View</Btn><Btn size="sm" variant="ghost" onClick={()=>setEditingBib({...b})}>Edit</Btn></div>
          ]}))}/>
      </Card>
      {selected&&(
        <Modal title={selected.title} onClose={()=>setSelected(null)} width={600}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,fontSize:".82em"}}>
            {[["Author",selected.author],["Publisher",selected.publisher],["Year",selected.year],["ISBN",selected.isbn],["DDC",selected.ddc],["LCC",selected.lcc],["Language",selected.lang],["Format",selected.format]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}><div style={{color:C.muted,fontSize:".72em",textTransform:"uppercase",marginBottom:2}}>{k}</div><div style={{color:C.text,fontWeight:500}}>{v}</div></div>
            ))}
          </div>
          <div style={{background:C.bg,borderRadius:7,padding:"10px 12px",marginBottom:14,fontSize:".82em"}}><div style={{color:C.muted,fontSize:".72em",textTransform:"uppercase",marginBottom:4}}>Subjects</div><div>{selected.subject}</div></div>
          <div style={{display:"flex",gap:8}}><Btn>Edit Record</Btn><Btn variant="secondary">View Items</Btn><Btn variant="secondary">Export DC</Btn></div>
        </Modal>
      )}
    </div>
  );
}


function ItemsPage() {
  const items = BOOKS.flatMap(b=>Array.from({length:b.copies},(_, i)=>({id:`ITM${String(b.id).padStart(3,"0")}${i+1}`,barcode:`ITM${String(b.id).padStart(3,"0")}${String(i+1).padStart(2,"0")}`,title:b.title,author:b.author,callNo:`${b.ddc} ${b.author.split(",")[0].slice(0,3).toUpperCase()}`,location:["General Stacks","Reserve","Reference","Periodicals"][i%4],status:i===0&&b.status==="checked_out"?"checked_out":b.status==="reference"?"reference":"available"})));
  const [q,           setQ]           = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [itemSaving,  setItemSaving]  = useState(false);
  const [itemMsg,     setItemMsg]     = useState("");
  const filtered = items.filter(it=>q===""||it.title.toLowerCase().includes(q.toLowerCase())||it.barcode.includes(q));
  const statusBadge = s=>s==="available"?<Badge color="green">Available</Badge>:s==="checked_out"?<Badge color="red">Checked Out</Badge>:s==="reference"?<Badge color="purple">Reference</Badge>:<Badge color="gray">{s}</Badge>;
  
  const saveItem = async () => {
    if(!editingItem)return;
    setItemSaving(true);setItemMsg("");
    try{
      await api.catalogue.update(editingItem.bib_id||editingItem.id, {location:editingItem.location, status:editingItem.status, call_number:editingItem.callNo});
      setItemMsg("✅ Item updated!");
      setTimeout(()=>{setEditingItem(null);setItemMsg("");},1200);
    }catch(e){setItemMsg("❌ "+(e.message||"Update failed"));}
    finally{setItemSaving(false);}
  };
  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      {editingItem&&(
        <Modal title="Edit Item" onClose={()=>setEditingItem(null)} width={480}>
          <Input label="Barcode" value={editingItem.barcode||""} onChange={v=>setEditingItem(p=>({...p,barcode:v}))}/>
          <Input label="Call Number" value={editingItem.callNo||""} onChange={v=>setEditingItem(p=>({...p,callNo:v}))}/>
          <Select label="Location" value={editingItem.location||"General Stacks"} onChange={v=>setEditingItem(p=>({...p,location:v}))} options={["General Stacks","Reserve","Reference","Periodicals","Special Collections"].map(v=>({value:v,label:v}))}/>
          <Select label="Status" value={editingItem.status||"available"} onChange={v=>setEditingItem(p=>({...p,status:v}))} options={[{value:"available",label:"Available"},{value:"checked_out",label:"Checked Out"},{value:"reference",label:"Reference Only"},{value:"lost",label:"Lost"},{value:"withdrawn",label:"Withdrawn"}]}/>
          {itemMsg&&<div style={{padding:"8px 12px",borderRadius:7,background:itemMsg.startsWith("✅")?"#DCFCE7":"#FEE2E2",color:itemMsg.startsWith("✅")?"#15803D":"#B91C1C",fontSize:".82em",marginBottom:10}}>{itemMsg}</div>}
          <div style={{display:"flex",gap:8,marginTop:8}}><Btn onClick={saveItem} disabled={itemSaving}>{itemSaving?"Saving…":"Save Changes"}</Btn><Btn variant="secondary" onClick={()=>setEditingItem(null)}>Cancel</Btn></div>
        </Modal>
      )}
      <PageHeader title="📦 Item Management" subtitle="Manage physical copies, barcodes and shelf locations"
        action={<div style={{display:"flex",gap:8}}><Btn variant="secondary" icon="🏷️">Print Labels</Btn><Btn icon="➕" onClick={()=>setEditingItem({barcode:"",callNo:"",location:"General Stacks",status:"available",title:"New Item"})}>Add Copy</Btn></div>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{label:"Total Copies",val:items.length,color:C.primary},{label:"Available",val:items.filter(i=>i.status==="available").length,color:C.success},{label:"Checked Out",val:items.filter(i=>i.status==="checked_out").length,color:C.warning},{label:"Reference Only",val:items.filter(i=>i.status==="reference").length,color:"#7C3AED"}].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:"1.5em",fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:".75em",color:C.muted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      <Card>
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by title or barcode…" style={{flex:1,padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}/>
          <select style={{padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}>
            <option>All Locations</option><option>General Stacks</option><option>Reserve</option><option>Reference</option>
          </select>
        </div>
        <Table cols={["Barcode","Title","Call Number","Location","Status","Action"]}
          rows={filtered.slice(0,20).map(it=>({cells:[
            <span style={{fontFamily:"monospace",fontSize:".85em",color:C.primary}}>{it.barcode}</span>,
            <div style={{fontWeight:500,fontSize:".85em"}}>{it.title}</div>,
            <span style={{fontFamily:"monospace",fontSize:".8em"}}>{it.callNo}</span>,
            <Badge color="gray">{it.location}</Badge>,
            statusBadge(it.status),
            <div style={{display:"flex",gap:4}}><Btn size="sm" variant="secondary" onClick={()=>setEditingItem({...it})}>Edit</Btn><Btn size="sm" variant="ghost">History</Btn></div>
          ]}))}/>
      </Card>
    </div>
  );
}

// ── Patron ID Card component (printable) ──
function PatronIDCard({ patron, library }) {
  const typeColor = t=>t==="Faculty"?"#7C3AED":t==="Postgraduate"?C.primary:t==="Undergraduate"?C.success:t==="Staff"?C.info:"#475569";
  const col = typeColor(patron.type);
  // Simple barcode-like visual using div stripes
  const barcodeStripes = () => {
    const seed = patron.barcode.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
    return Array.from({length:32},(_,i)=>{
      const w = ((seed*(i+1)*7)%3)+1;
      const gap = ((seed*(i+2)*3)%2)+1;
      return <div key={i} style={{width:w,background:"#000",height:36,marginRight:gap}}/>;
    });
  };
  return (
    <div style={{width:320,background:"#fff",borderRadius:12,overflow:"hidden",border:"1.5px solid #E2E8F0",boxShadow:"0 4px 16px rgba(0,0,0,.10)",fontFamily:"Inter,system-ui,sans-serif",flexShrink:0}}>
      {/* Header strip */}
      <div style={{background:col,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:18}}>📖</span>
          <div style={{color:"#fff",fontWeight:800,fontSize:".78em",letterSpacing:".02em",lineHeight:1.2}}>{library?.name||"University Library"}</div>
        </div>
        <div style={{background:"rgba(255,255,255,.2)",borderRadius:5,padding:"2px 8px",color:"#fff",fontSize:".62em",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>{patron.type}</div>
      </div>
      {/* Body */}
      <div style={{padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{width:52,height:52,borderRadius:10,background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:"1.2em",flexShrink:0,border:"2px solid #fff",boxShadow:`0 2px 8px ${col}55`}}>
          {patron.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:".9em",color:"#0F172A",lineHeight:1.2,marginBottom:2}}>{patron.name}</div>
          <div style={{fontSize:".7em",color:"#64748B",marginBottom:1}}>{patron.dept}</div>
          <div style={{fontSize:".68em",color:"#94A3B8"}}>{patron.email}</div>
        </div>
      </div>
      {/* Barcode area */}
      <div style={{padding:"4px 14px 10px",borderTop:"1px solid #F1F5F9"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:0,marginBottom:2,overflow:"hidden",height:38}}>
          {barcodeStripes()}
        </div>
        <div style={{fontFamily:"monospace",fontSize:".72em",color:"#475569",textAlign:"center",letterSpacing:".18em"}}>{patron.barcode}</div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:".62em",color:"#94A3B8"}}>
          <span>Issued: {patron.regDate}</span>
          <span>Expires: {patron.expiry}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PATRONS
// ═══════════════════════════════════════════════════════════
function PatronEditForm({ patron, onSave, onClose }) {
  const [form,    setForm]    = useState({...patron});
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      const updated = await api.patrons.update(patron.id, form);
      setMsg("✅ Saved successfully!");
      setTimeout(()=>onSave(updated.patron||form),1000);
    } catch(e) { setMsg("❌ "+(e.message||"Save failed")); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}} className="form-grid-2">
        <div style={{gridColumn:"1/-1"}}><Input label="Full Name" value={form.name||""} onChange={v=>set("name",v)}/></div>
        <div style={{paddingRight:8}}><Input label="Email" value={form.email||""} onChange={v=>set("email",v)}/></div>
        <div style={{paddingLeft:8}}><Input label="Phone" value={form.phone||""} onChange={v=>set("phone",v)}/></div>
        <div style={{paddingRight:8}}><Input label="Barcode / Member ID" value={form.barcode||""} onChange={v=>set("barcode",v)}/></div>
        <div style={{paddingLeft:8}}><Select label="Patron Type" value={form.patron_type||form.type||"undergraduate"} onChange={v=>set("patron_type",v)} options={["faculty","postgraduate","undergraduate","staff","public"].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/></div>
        <div style={{gridColumn:"1/-1"}}><Input label="Department / Faculty" value={form.department||form.dept||""} onChange={v=>set("department",v)}/></div>
        <div style={{paddingRight:8}}><Input label="Expiry Date" type="date" value={form.expiry_date||form.expiry||""} onChange={v=>set("expiry_date",v)}/></div>
        <div style={{paddingLeft:8}}><Select label="Status" value={form.status||"active"} onChange={v=>set("status",v)} options={[{value:"active",label:"Active"},{value:"suspended",label:"Suspended"},{value:"expired",label:"Expired"}]}/></div>
      </div>
      {msg&&<div style={{padding:"8px 12px",borderRadius:7,background:msg.startsWith("✅")?"#DCFCE7":"#FEE2E2",color:msg.startsWith("✅")?"#15803D":"#B91C1C",fontSize:".82em",marginBottom:10}}>{msg}</div>}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Changes"}</Btn>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

function PatronsPage() {
  const [patrons, setPatrons]   = useState(PATRONS);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cardModal, setCardModal] = useState(null);
  const [bulkCardMode, setBulkCardMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [q, setQ] = useState("");
  const [newP, setNewP] = useState({name:"",email:"",phone:"",type:"Undergraduate",dept:"",regDate:new Date().toISOString().split("T")[0],expiry:""});

  const filtered = patrons.filter(p=>q===""||p.name.toLowerCase().includes(q.toLowerCase())||p.barcode.includes(q)||p.email.toLowerCase().includes(q.toLowerCase()));
  const typeBadge = t=>t==="Faculty"?<Badge color="purple">Faculty</Badge>:t==="Postgraduate"?<Badge color="blue">Postgrad</Badge>:t==="Undergraduate"?<Badge color="green">Undergrad</Badge>:t==="Staff"?<Badge color="gray">Staff</Badge>:<Badge color="gray">{t}</Badge>;
  const statusBadge = s=>s==="active"?<Badge color="green">Active</Badge>:s==="suspended"?<Badge color="red">Suspended</Badge>:<Badge color="gray">{s}</Badge>;

  const registerPatron = () => {
    if(!newP.name||!newP.email) return;
    const id = patrons.length+1;
    const barcode = `PAT${String(id).padStart(4,"0")}`;
    setPatrons(pp=>[...pp,{id,name:newP.name,barcode,type:newP.type,dept:newP.dept,email:newP.email,phone:newP.phone,regDate:newP.regDate,expiry:newP.expiry||"2026-08-31",loans:0,fines:0,status:"active"}]);
    setShowModal(false);
    setNewP({name:"",email:"",phone:"",type:"Undergraduate",dept:"",regDate:new Date().toISOString().split("T")[0],expiry:""});
  };

  const toggleBulk = (id) => setBulkSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader title="👥 Patron Management" subtitle="Register and manage library members"
        action={<div style={{display:"flex",gap:8}}>
          <Btn variant="secondary" icon="🪪" onClick={()=>setBulkCardMode(b=>!b)}>{bulkCardMode?"Cancel Bulk":"Print ID Cards"}</Btn>
          {bulkCardMode&&bulkSelected.length>0&&<Btn icon="🖨️" onClick={()=>setCardModal(patrons.filter(p=>bulkSelected.includes(p.id)))}>Print {bulkSelected.length} Card{bulkSelected.length>1?"s":""}</Btn>}
          <Btn variant="secondary" icon="📥">Import CSV</Btn>
          <Btn onClick={()=>setShowModal(true)} icon="➕">New Patron</Btn>
        </div>}/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{label:"Total Patrons",val:patrons.length.toLocaleString(),color:C.primary},{label:"Active",val:patrons.filter(p=>p.status==="active").length,color:C.success},{label:"Suspended",val:patrons.filter(p=>p.status==="suspended").length,color:C.danger},{label:"Expiring Soon",val:"47",color:C.warning}].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:"1.4em",fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:".75em",color:C.muted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patrons…" style={{flex:1,minWidth:180,padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}/>
          <select style={{padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}><option>All Types</option><option>Faculty</option><option>Postgraduate</option><option>Undergraduate</option><option>Staff</option></select>
          <select style={{padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}><option>All Status</option><option>Active</option><option>Suspended</option></select>
        </div>
        {bulkCardMode&&<div style={{padding:"8px 18px",background:`${C.primary}08`,borderBottom:`1px solid ${C.border}`,fontSize:".78em",color:C.primary,fontWeight:600}}>🪪 Card print mode — tick the checkboxes to select patrons, then click "Print Cards"</div>}
        <Table cols={bulkCardMode?["☐","Patron ID","Name","Type","Department","Loans","Fines (₦)","Status","Action"]:["Patron ID","Name","Type","Department","Loans","Fines (₦)","Status","Action"]}
          rows={filtered.map(p=>({cells:[
            ...(bulkCardMode?[<input type="checkbox" checked={bulkSelected.includes(p.id)} onChange={()=>toggleBulk(p.id)} style={{width:15,height:15,cursor:"pointer"}}/>]:[]),
            <span style={{fontFamily:"monospace",fontSize:".82em",color:C.primary}}>{p.barcode}</span>,
            <div><div style={{fontWeight:600,fontSize:".88em"}}>{p.name}</div><div style={{fontSize:".72em",color:C.muted}}>{p.email}</div></div>,
            typeBadge(p.type), p.dept, p.loans,
            <span style={{color:p.fines>0?C.danger:C.text,fontWeight:p.fines>0?700:400}}>₦{p.fines.toLocaleString()}</span>,
            statusBadge(p.status),
            <div style={{display:"flex",gap:4}}>
              <Btn size="sm" variant="secondary" onClick={()=>setSelected(p)}>View</Btn>
              <Btn size="sm" variant="ghost" icon="🪪" onClick={()=>setCardModal([p])}>ID Card</Btn>
            </div>
          ]}))}/>
      </Card>

      {/* Register Modal */}
      {showModal&&(
        <Modal title="Register New Patron" onClose={()=>setShowModal(false)} width={520}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            <div style={{gridColumn:"1/-1"}}><Input label="Full Name" value={newP.name} onChange={v=>setNewP(p=>({...p,name:v}))} placeholder="Surname, Firstname" required/></div>
            <div style={{paddingRight:8}}><Input label="Email" value={newP.email} onChange={v=>setNewP(p=>({...p,email:v}))} placeholder="email@institution.edu" required/></div>
            <div style={{paddingLeft:8}}><Input label="Phone" value={newP.phone} onChange={v=>setNewP(p=>({...p,phone:v}))} placeholder="+234 8XX XXX XXXX"/></div>
            <div style={{paddingRight:8}}><Select label="Patron Type" value={newP.type} onChange={v=>setNewP(p=>({...p,type:v}))} options={["Faculty","Postgraduate","Undergraduate","Staff","Public"].map(v=>({value:v,label:v}))}/></div>
            <div style={{paddingLeft:8}}><Input label="Department / Faculty" value={newP.dept} onChange={v=>setNewP(p=>({...p,dept:v}))} placeholder="e.g. Computer Science"/></div>
            <div style={{paddingRight:8}}><Input label="Registration Date" type="date" value={newP.regDate} onChange={v=>setNewP(p=>({...p,regDate:v}))}/></div>
            <div style={{paddingLeft:8}}><Input label="Expiry Date" type="date" value={newP.expiry} onChange={v=>setNewP(p=>({...p,expiry:v}))}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <Btn full onClick={registerPatron} disabled={!newP.name||!newP.email}>Register Patron</Btn>
            <Btn full variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* View Patron Modal */}
      {selected&&(
        <Modal title={selected.name} onClose={()=>setSelected(null)} width={580}>
          <div style={{display:"flex",gap:16,marginBottom:16,alignItems:"center"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"1.3em",fontWeight:700,flexShrink:0}}>{selected.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div>{typeBadge(selected.type)}<div style={{fontWeight:700,fontSize:"1.1em",color:C.text,marginTop:4}}>{selected.name}</div><div style={{fontSize:".8em",color:C.muted}}>{selected.dept}</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,fontSize:".82em"}}>
            {[["Patron ID",selected.barcode],["Email",selected.email],["Phone",selected.phone],["Reg. Date",selected.regDate],["Expiry",selected.expiry],["Active Loans",selected.loans],["Outstanding Fines",`₦${selected.fines.toLocaleString()}`],["Status",selected.status.toUpperCase()]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}><div style={{color:C.muted,fontSize:".72em",textTransform:"uppercase",marginBottom:2}}>{k}</div><div style={{color:k==="Outstanding Fines"&&selected.fines>0?C.danger:C.text,fontWeight:500}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn>Edit Profile</Btn>
            <Btn variant="secondary" onClick={()=>{setSelected(null);setCardModal([selected]);}}>🪪 Print ID Card</Btn>
            <Btn variant="secondary">View Loan History</Btn>
            {selected.fines>0&&<Btn variant="danger">Collect Fine</Btn>}
          </div>
        </Modal>
      )}

      {/* ID Card Print Modal */}
      {cardModal&&(
        <Modal title={`🪪 Library ID Card${cardModal.length>1?"s":""} — ${cardModal.length} patron${cardModal.length>1?"s":""}`} onClose={()=>{setCardModal(null);setBulkSelected([]);setBulkCardMode(false);}} width={740}>
          <div style={{marginBottom:14,padding:"10px 14px",background:`${C.primary}08`,borderRadius:8,fontSize:".8em",color:C.primary,display:"flex",gap:8,alignItems:"center"}}>
            <span>🖨️</span> Use your browser's Print function (Ctrl+P / Cmd+P) to print these cards. Set margins to "None" and enable "Background graphics" for best results.
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:16,justifyContent:"center",padding:"8px 0"}} id="id-card-print-area">
            {cardModal.map(p=><PatronIDCard key={p.id} patron={p} library={DEMO.library}/>)}
          </div>
          <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"center"}}>
            <Btn icon="🖨️" onClick={()=>window.print()}>Print Now</Btn>
            <Btn variant="secondary" onClick={()=>{setCardModal(null);setBulkSelected([]);setBulkCardMode(false);}}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CIRCULATION  (fully live state)
// ═══════════════════════════════════════════════════════════
function CirculationPage() {
  const today = new Date().toISOString().split("T")[0];
  const dueDate = (patronType) => {
    const d = new Date(); d.setDate(d.getDate() + (patronType==="Faculty"?30:patronType==="Postgraduate"?21:14));
    return d.toISOString().split("T")[0];
  };

  const [loans, setLoans]           = useState(LOANS.map(l=>({...l})));
  const [holds, setHolds]           = useState([
    {id:1,patron:"Yusuf Musa Ibrahim",patronId:4,title:"Petroleum Engineering Fundamentals",bookId:5,date:"2025-06-20",pos:1,notified:false},
    {id:2,patron:"Amaka Nwosu",patronId:5,title:"Things Fall Apart",bookId:1,date:"2025-06-22",pos:1,notified:false},
  ]);
  const [tab, setTab]               = useState("checkout");
  const [itemBarcode, setItemBarcode] = useState("");
  const [patronBarcode, setPatronBarcode] = useState("");
  const [scanning, setScanning]     = useState(null); // "item"|"patron"|null
  const [resolvedItem, setResolvedItem] = useState(null);
  const [resolvedPatron, setResolvedPatron] = useState(null);
  const [msg, setMsg]               = useState(null);
  const [todayStats, setTodayStats] = useState({checkouts:47, returns:38, renewals:12, holds:5});
  const [fineModal, setFineModal]   = useState(null);
  const [loanDetailModal, setLoanDetailModal] = useState(null);
  const itemRef   = useRef(null);
  const patronRef = useRef(null);

  const flash = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };

  // Resolve item barcode
  const resolveItem = (code) => {
    const book = BOOKS.find(b=>b.isbn===code||`ITM00${b.id}01`===code||code.startsWith(`ITM${String(b.id).padStart(3,"0")}`));
    if (book) setResolvedItem(book); else setResolvedItem(null);
  };
  // Resolve patron barcode
  const resolvePatron = (code) => {
    const p = PATRONS.find(p=>p.barcode===code||p.email===code||p.id===parseInt(code));
    if (p) setResolvedPatron(p); else setResolvedPatron(null);
  };

  // CHECKOUT
  const processCheckout = () => {
    if (!itemBarcode.trim()) { flash("error","Please enter an item barcode."); return; }
    if (!patronBarcode.trim()) { flash("error","Please enter a patron ID."); return; }
    const patron = resolvedPatron || PATRONS[0];
    const book   = resolvedItem   || BOOKS[0];
    if (patron.status==="suspended") { flash("error",`❌ ${patron.name}'s account is suspended. Clear fines before checkout.`); return; }
    if (book.available===0) { flash("error",`❌ No copies of "${book.title}" are currently available.`); return; }
    const newLoan = { id:loans.length+1, patronId:patron.id, patronName:patron.name, bookId:book.id, bookTitle:book.title, barcode:itemBarcode, checkoutDate:today, dueDate:dueDate(patron.type), status:"active", renewals:0 };
    setLoans(l=>[newLoan,...l]);
    setTodayStats(s=>({...s,checkouts:s.checkouts+1}));
    flash("success",`✅ Checked out "${book.title}" to ${patron.name}. Due: ${newLoan.dueDate}`);
    setItemBarcode(""); setPatronBarcode(""); setResolvedItem(null); setResolvedPatron(null);
    itemRef.current?.focus();
  };

  // CHECKIN
  const processCheckin = () => {
    if (!itemBarcode.trim()) { flash("error","Please enter an item barcode."); return; }
    const loan = loans.find(l=>l.barcode===itemBarcode&&(l.status==="active"||l.status==="overdue"));
    if (!loan) { flash("error",`❌ No active loan found for barcode "${itemBarcode}".`); return; }
    const overdueDays = loan.status==="overdue" ? Math.max(0,Math.floor((new Date()-new Date(loan.dueDate))/(1000*60*60*24))) : 0;
    const fine = overdueDays * 50;
    setLoans(l=>l.map(x=>x.id===loan.id?{...x,status:"returned",returnDate:today}:x));
    setTodayStats(s=>({...s,returns:s.returns+1}));
    if (fine>0) flash("warning",`✅ "${loan.bookTitle}" returned. ⚠️ Overdue fine: ₦${fine.toLocaleString()} (${overdueDays} days).`);
    else flash("success",`✅ "${loan.bookTitle}" returned by ${loan.patronName}.`);
    setItemBarcode(""); setResolvedItem(null);
    itemRef.current?.focus();
  };

  // RENEW
  const processRenew = () => {
    if (!itemBarcode.trim()) { flash("error","Please enter an item barcode."); return; }
    const loan = loans.find(l=>l.barcode===itemBarcode&&l.status==="active");
    if (!loan) { flash("error",`❌ No active loan found for barcode "${itemBarcode}".`); return; }
    if (loan.renewals>=2) { flash("error",`❌ Max renewals (2) reached for "${loan.bookTitle}".`); return; }
    const patron = PATRONS.find(p=>p.id===loan.patronId);
    const newDue = dueDate(patron?.type||"Undergraduate");
    setLoans(l=>l.map(x=>x.id===loan.id?{...x,dueDate:newDue,renewals:x.renewals+1,status:"active"}:x));
    setTodayStats(s=>({...s,renewals:s.renewals+1}));
    flash("success",`✅ Renewed "${loan.bookTitle}". New due date: ${newDue} (renewal ${loan.renewals+1}/2)`);
    setItemBarcode(""); setResolvedItem(null);
    itemRef.current?.focus();
  };

  const process = () => { if(tab==="checkout")processCheckout(); else if(tab==="checkin")processCheckin(); else processRenew(); };

  const handleKey = (e) => { if(e.key==="Enter") process(); };

  const statusBadge = s=>s==="active"?<Badge color="green">Active</Badge>:s==="overdue"?<Badge color="red">Overdue</Badge>:s==="returned"?<Badge color="gray">Returned</Badge>:<Badge color="gray">{s}</Badge>;
  const activeLoans = loans.filter(l=>l.status==="active"||l.status==="overdue");
  const overdueLoans = loans.filter(l=>l.status==="overdue");

  return (
    <div style={{padding:"28px 24px",maxWidth:1300}}>
      <PageHeader title="🔄 Circulation Desk" subtitle={`Live circulation management · ${new Date().toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long"})}`}/>
      <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:20}}>

        {/* ── Left Panel ── */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
              {[{id:"checkout",icon:"🔄",label:"Check Out"},{id:"checkin",icon:"✅",label:"Check In"},{id:"renew",icon:"🔁",label:"Renew"}].map(t=>(
                <button key={t.id} onClick={()=>{setTab(t.id);setItemBarcode("");setPatronBarcode("");setResolvedItem(null);setResolvedPatron(null);setMsg(null);}} style={{flex:1,padding:"12px 6px",border:"none",background:tab===t.id?`${C.primary}08`:"none",fontWeight:600,fontSize:".78em",color:tab===t.id?C.primary:C.muted,borderBottom:`2px solid ${tab===t.id?C.primary:"transparent"}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <span style={{fontSize:16}}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <div style={{padding:"16px"}}>
              {/* Item barcode */}
              <div style={{marginBottom:12}}>
                <label style={{display:"block",fontSize:".72em",fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>Item Barcode / ISBN <span style={{color:C.danger}}>*</span></label>
                <div style={{display:"flex",gap:6}}>
                  <input ref={itemRef} value={itemBarcode} onChange={e=>{setItemBarcode(e.target.value);resolveItem(e.target.value);}} onKeyDown={e=>e.key==="Enter"&&(tab!=="checkin"?patronRef.current?.focus():process())}
                    placeholder="Scan or type item barcode…" autoFocus
                    style={{flex:1,padding:"9px 12px",border:`1px solid ${resolvedItem?C.success:C.border}`,borderRadius:8,fontSize:".88em",color:C.text,outline:"none"}}
                    onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=resolvedItem?C.success:C.border}/>
                  <button onClick={()=>setScanning(scanning==="item"?null:"item")} style={{padding:"9px 10px",border:`1px solid ${scanning==="item"?C.primary:C.border}`,borderRadius:8,background:scanning==="item"?`${C.primary}12`:"#fff",cursor:"pointer",fontSize:14}}>📷</button>
                </div>
                {resolvedItem&&<div style={{marginTop:4,fontSize:".72em",color:C.success,fontWeight:600}}>✓ {resolvedItem.title} · {resolvedItem.available}/{resolvedItem.copies} available</div>}
              </div>
              {/* Patron barcode (checkout/renew) */}
              {tab!=="checkin"&&(
                <div style={{marginBottom:12}}>
                  <label style={{display:"block",fontSize:".72em",fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>Patron ID / Barcode <span style={{color:C.danger}}>*</span></label>
                  <div style={{display:"flex",gap:6}}>
                    <input ref={patronRef} value={patronBarcode} onChange={e=>{setPatronBarcode(e.target.value);resolvePatron(e.target.value);}} onKeyDown={handleKey}
                      placeholder="Scan or type patron barcode…"
                      style={{flex:1,padding:"9px 12px",border:`1px solid ${resolvedPatron?C.success:C.border}`,borderRadius:8,fontSize:".88em",color:C.text,outline:"none"}}
                      onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=resolvedPatron?C.success:C.border}/>
                    <button onClick={()=>setScanning(scanning==="patron"?null:"patron")} style={{padding:"9px 10px",border:`1px solid ${scanning==="patron"?C.primary:C.border}`,borderRadius:8,background:scanning==="patron"?`${C.primary}12`:"#fff",cursor:"pointer",fontSize:14}}>📷</button>
                  </div>
                  {resolvedPatron&&(
                    <div style={{marginTop:4,fontSize:".72em",fontWeight:600,color:resolvedPatron.status==="suspended"?C.danger:C.success}}>
                      {resolvedPatron.status==="suspended"?"❌":"✓"} {resolvedPatron.name} · {resolvedPatron.type} · {resolvedPatron.loans} loans active
                      {resolvedPatron.fines>0&&<span style={{color:C.danger}}> · ₦{resolvedPatron.fines.toLocaleString()} fines</span>}
                    </div>
                  )}
                </div>
              )}
              {/* Scanner hint */}
              {scanning&&(
                <div style={{marginBottom:12,padding:"10px 12px",background:`${C.primary}08`,border:`1px solid ${C.primary}25`,borderRadius:8,fontSize:".75em",color:C.primary,textAlign:"center"}}>
                  📷 Camera barcode scanning — connect a USB barcode scanner and it will auto-fill this field. Or use a mobile barcode scanner app that outputs as keyboard input.
                </div>
              )}
              {/* Message */}
              {msg&&<div style={{marginBottom:12,padding:"10px 13px",borderRadius:8,background:msg.type==="success"?`${C.success}12`:msg.type==="warning"?`${C.warning}12`:`${C.danger}12`,border:`1px solid ${msg.type==="success"?C.success:msg.type==="warning"?C.warning:C.danger}35`,fontSize:".82em",color:msg.type==="success"?C.success:msg.type==="warning"?C.warning:C.danger,lineHeight:1.5}}>{msg.text}</div>}
              <Btn full size="lg" onClick={process} icon={tab==="checkout"?"🔄":tab==="checkin"?"✅":"🔁"}>
                {tab==="checkout"?"Process Checkout":tab==="checkin"?"Process Return":"Renew Item"}
              </Btn>
              <div style={{marginTop:10,display:"flex",gap:16,justifyContent:"center",fontSize:".7em",color:C.muted}}>
                <span>Undergrad: 14 days</span><span>Postgrad: 21 days</span><span>Faculty: 30 days</span>
              </div>
              <div style={{marginTop:4,textAlign:"center",fontSize:".7em",color:C.muted}}>Fine: ₦50/day overdue</div>
            </div>
          </Card>

          {/* Today's Stats */}
          <Card style={{padding:"16px"}}>
            <div style={{fontWeight:700,fontSize:".82em",color:C.text,marginBottom:10}}>⚡ Today's Activity</div>
            {[{label:"Checkouts",val:todayStats.checkouts,color:C.primary},{label:"Returns",val:todayStats.returns,color:C.success},{label:"Renewals",val:todayStats.renewals,color:C.info},{label:"Holds",val:todayStats.holds,color:"#7C3AED"}].map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<3?`1px solid ${C.border}`:""}}>
                <span style={{fontSize:".82em",color:C.muted}}>{s.label}</span>
                <span style={{fontWeight:700,color:s.color,fontSize:".95em"}}>{s.val}</span>
              </div>
            ))}
          </Card>

          {/* Overdue quick list */}
          {overdueLoans.length>0&&(
            <Card style={{padding:"16px",border:`1px solid ${C.danger}25`}}>
              <div style={{fontWeight:700,fontSize:".82em",color:C.danger,marginBottom:10}}>⚠️ Overdue ({overdueLoans.length})</div>
              {overdueLoans.map((l,i)=>{
                const days = Math.max(0,Math.floor((new Date()-new Date(l.dueDate))/(1000*60*60*24)));
                return (
                  <div key={i} style={{padding:"8px 0",borderBottom:i<overdueLoans.length-1?`1px solid ${C.border}`:"",fontSize:".78em"}}>
                    <div style={{fontWeight:600,color:C.text}}>{l.patronName}</div>
                    <div style={{color:C.muted,marginTop:2}}>{l.bookTitle}</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                      <span style={{color:C.danger,fontWeight:600}}>{days} days overdue · ₦{(days*50).toLocaleString()}</span>
                      <button onClick={()=>setFineModal(l)} style={{background:"none",border:`1px solid ${C.danger}`,borderRadius:5,padding:"2px 8px",color:C.danger,fontSize:".82em",cursor:"pointer",fontWeight:600}}>Collect Fine</button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>📋 Active Loans</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <Badge color="blue">{activeLoans.length} items out</Badge>
                {overdueLoans.length>0&&<Badge color="red">{overdueLoans.length} overdue</Badge>}
              </div>
            </div>
            <Table cols={["Patron","Item","Barcode","Checkout","Due Date","Renewals","Status","Action"]}
              rows={activeLoans.map(l=>{
                const days = l.status==="overdue"?Math.max(0,Math.floor((new Date()-new Date(l.dueDate))/(1000*60*60*24))):0;
                return {cells:[
                  <div style={{fontWeight:600,fontSize:".85em"}}>{l.patronName}</div>,
                  <div style={{fontWeight:500,fontSize:".82em",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.bookTitle}</div>,
                  <span style={{fontFamily:"monospace",fontSize:".78em",color:C.primary}}>{l.barcode}</span>,
                  <span style={{fontSize:".78em"}}>{l.checkoutDate}</span>,
                  <span style={{fontSize:".78em",fontWeight:l.status==="overdue"?700:400,color:l.status==="overdue"?C.danger:C.text}}>{l.dueDate}</span>,
                  <span style={{fontSize:".8em"}}>{l.renewals}/2</span>,
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    {statusBadge(l.status)}
                    {days>0&&<span style={{fontSize:".65em",color:C.danger,fontWeight:600}}>₦{(days*50).toLocaleString()}</span>}
                  </div>,
                  <div style={{display:"flex",gap:4}}>
                    <Btn size="sm" variant="secondary" onClick={()=>{setTab("renew");setItemBarcode(l.barcode);resolveItem(l.barcode);}}>Renew</Btn>
                    <Btn size="sm" variant="secondary" onClick={()=>{setTab("checkin");setItemBarcode(l.barcode);resolveItem(l.barcode);}}>Return</Btn>
                    {l.status==="overdue"&&<Btn size="sm" variant="danger" onClick={()=>setFineModal(l)}>Fine</Btn>}
                  </div>
                ]};
              })}/>
            {activeLoans.length===0&&<div style={{padding:"32px",textAlign:"center",color:C.muted,fontSize:".88em"}}>No active loans</div>}
          </Card>

          {/* Holds Queue */}
          <Card>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>📌 Holds Queue</div>
              <Badge color="purple">{holds.length} holds</Badge>
            </div>
            <div style={{padding:"12px 18px",display:"flex",flexDirection:"column",gap:8}}>
              {holds.map((h,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"12px",background:C.bg,borderRadius:9,alignItems:"center",border:`1px solid ${C.border}`}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:`${C.primary}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".82em",fontWeight:800,color:C.primary,flexShrink:0}}>#{h.pos}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".85em",fontWeight:600,color:C.text}}>{h.patron}</div>
                    <div style={{fontSize:".75em",color:C.muted,marginTop:1}}>{h.title} · Requested {h.date}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {h.notified&&<Badge color="green">Notified</Badge>}
                    <Btn size="sm" variant="secondary" onClick={()=>setHolds(hs=>hs.map(x=>x.id===h.id?{...x,notified:true}:x))}>{h.notified?"Resend":"Notify"}</Btn>
                    <Btn size="sm" variant="ghost" onClick={()=>setHolds(hs=>hs.filter(x=>x.id!==h.id))}>✕</Btn>
                  </div>
                </div>
              ))}
              {holds.length===0&&<div style={{padding:"16px",textAlign:"center",color:C.muted,fontSize:".85em"}}>No holds in queue</div>}
            </div>
          </Card>
        </div>
      </div>

      {/* Fine collection modal */}
      {fineModal&&(
        <Modal title="Collect Overdue Fine" onClose={()=>setFineModal(null)} width={420}>
          {()=>{
            const days = Math.max(0,Math.floor((new Date()-new Date(fineModal.dueDate))/(1000*60*60*24)));
            const fine = days * 50;
            return (<>
              <div style={{background:`${C.danger}08`,border:`1px solid ${C.danger}25`,borderRadius:9,padding:"14px",marginBottom:16}}>
                <div style={{fontWeight:700,color:C.text,marginBottom:4}}>{fineModal.bookTitle}</div>
                <div style={{fontSize:".82em",color:C.muted,marginBottom:8}}>Patron: {fineModal.patronName} · Due: {fineModal.dueDate}</div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:".85em",color:C.muted}}>Days overdue</span><span style={{fontWeight:700,color:C.danger}}>{days} days</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontSize:".85em",color:C.muted}}>Fine (₦50/day)</span><span style={{fontWeight:800,color:C.danger,fontSize:"1.1em"}}>₦{fine.toLocaleString()}</span>
                </div>
              </div>
              <Select label="Payment Method" value="cash" onChange={()=>{}} options={[{value:"cash",label:"Cash"},{value:"transfer",label:"Bank Transfer"},{value:"pos",label:"POS / Card"}]}/>
              <div style={{display:"flex",gap:8}}>
                <Btn full onClick={()=>{setLoans(l=>l.map(x=>x.id===fineModal.id?{...x,status:"active",dueDate:new Date().toISOString().split("T")[0]}:x));flash("success",`₦${fine.toLocaleString()} fine collected from ${fineModal.patronName}`);setFineModal(null);}}>Collect ₦{fine.toLocaleString()}</Btn>
                <Btn full variant="secondary" onClick={()=>setFineModal(null)}>Cancel</Btn>
              </div>
            </>);
          }}
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ACQUISITIONS
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  ACQUISITIONS  (fully live)
// ═══════════════════════════════════════════════════════════
const VENDORS_DATA = [
  {id:1,name:"Academic Book Centre",contact:"info@abcbooks.com.ng",phone:"+234 1 234 5678",type:"Local",discount:10,active:true},
  {id:2,name:"Spectrum Books",contact:"orders@spectrumbooks.ng",phone:"+234 1 345 6789",type:"Local",discount:5,active:true},
  {id:3,name:"Ingram Academic",contact:"academic@ingramcontent.com",phone:"+1 615 793 5000",type:"International",discount:15,active:true},
  {id:4,name:"University Press Plc",contact:"sales@universitypressplc.com",phone:"+234 2 241 0088",type:"Local",discount:8,active:true},
];

function AcquisitionsPage() {
  const [orders, setOrders]   = useState([
    {id:1,title:"Modern African Literature Anthology",author:"Various",vendor:"Academic Book Centre",vendorId:1,orderDate:"2025-06-01",expectedDate:"2025-06-30",cost:45000,qty:5,received:0,status:"ordered",fund:"General",notes:"For Literature dept."},
    {id:2,title:"Nigerian Tax Law 2025 Edition",author:"Ciroma, Adamu",vendor:"Spectrum Books",vendorId:2,orderDate:"2025-05-28",expectedDate:"2025-06-20",cost:28000,qty:3,received:3,status:"received",fund:"Law",notes:""},
    {id:3,title:"Bioinformatics: Sequence Analysis",author:"Jones, N.C.",vendor:"Ingram Academic",vendorId:3,orderDate:"2025-06-10",expectedDate:"2025-07-15",cost:62000,qty:4,received:0,status:"pending",fund:"Science",notes:"Awaiting budget approval"},
    {id:4,title:"Advanced Petroleum Reservoir Engineering",author:"Craft, B.C.; Hawkins, M.",vendor:"Academic Book Centre",vendorId:1,orderDate:"2025-06-18",expectedDate:"2025-07-10",cost:89000,qty:6,received:0,status:"ordered",fund:"Engineering",notes:"Priority order"},
  ]);
  const [vendors]             = useState(VENDORS_DATA);
  const [tab, setTab]         = useState("orders");
  const [showModal, setShowModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(null);
  const [receiveQty, setReceiveQty]     = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [msg, setMsg]         = useState(null);
  const [newOrder, setNewOrder] = useState({title:"",author:"",vendor:"",vendorId:"",orderDate:new Date().toISOString().split("T")[0],expectedDate:"",cost:"",qty:"1",fund:"General",notes:"",status:"pending"});
  const flash = (type,text)=>{ setMsg({type,text}); setTimeout(()=>setMsg(null),3500); };

  const BUDGET = {total:4800000, funds:{General:1200000,Law:800000,Science:1000000,Engineering:1200000,Medicine:600000}};
  const spent  = orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+o.cost,0);
  const budgetPct = Math.round((spent/BUDGET.total)*100);

  const submitOrder = () => {
    if (!newOrder.title||!newOrder.vendor||!newOrder.cost) return;
    const o = {...newOrder,id:orders.length+1,cost:parseInt(newOrder.cost),qty:parseInt(newOrder.qty)||1,received:0};
    setOrders(prev=>[o,...prev]);
    setShowModal(false);
    setNewOrder({title:"",author:"",vendor:"",vendorId:"",orderDate:new Date().toISOString().split("T")[0],expectedDate:"",cost:"",qty:"1",fund:"General",notes:"",status:"pending"});
    flash("success",`✅ Order placed for "${o.title}"`);
  };

  const receiveOrder = (order, qty) => {
    setOrders(prev=>prev.map(o=>o.id===order.id?{...o,received:Math.min(o.qty,o.received+qty),status:o.received+qty>=o.qty?"received":"partial"}:o));
    flash("success",`✅ ${qty} cop${qty>1?"ies":"y"} of "${order.title}" received and added to catalogue.`);
    setReceiveModal(null);
  };

  const statusBadge = s=>({ordered:<Badge color="blue">Ordered</Badge>,received:<Badge color="green">Received</Badge>,pending:<Badge color="yellow">Pending Approval</Badge>,partial:<Badge color="blue">Partially Received</Badge>,cancelled:<Badge color="red">Cancelled</Badge>})[s]||<Badge color="gray">{s}</Badge>;

  const fundColors = {General:C.primary,Law:"#7C3AED",Science:C.success,Engineering:C.warning,Medicine:C.danger};

  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader title="🛒 Acquisitions" subtitle="Manage orders, vendors, budgets and receiving"
        action={<div style={{display:"flex",gap:8}}><Btn variant="secondary" icon="📤">Export Orders</Btn><Btn onClick={()=>setShowModal(true)} icon="➕">New Order</Btn></div>}/>

      {msg&&<div style={{marginBottom:16,padding:"10px 16px",borderRadius:9,background:msg.type==="success"?`${C.success}12`:`${C.danger}12`,border:`1px solid ${msg.type==="success"?C.success:C.danger}30`,fontSize:".85em",color:msg.type==="success"?C.success:C.danger}}>{msg.text}</div>}

      {/* Budget overview */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <Card style={{padding:"20px"}}>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>💰 Annual Budget</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:"1.8em",fontWeight:800,color:C.text}}>₦{spent.toLocaleString()}</span>
            <span style={{fontSize:".82em",color:C.muted,alignSelf:"flex-end",marginBottom:4}}>of ₦{BUDGET.total.toLocaleString()}</span>
          </div>
          <div style={{height:10,background:C.border,borderRadius:10,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",width:`${budgetPct}%`,background:budgetPct>85?C.danger:budgetPct>65?C.warning:C.success,borderRadius:10,transition:"width .4s"}}/>
          </div>
          <div style={{fontSize:".75em",color:budgetPct>85?C.danger:C.muted}}>{budgetPct}% used · ₦{(BUDGET.total-spent).toLocaleString()} remaining</div>
          <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:6}}>
            {Object.entries(BUDGET.funds).map(([fund,budget])=>{
              const fundSpent = orders.filter(o=>o.fund===fund&&o.status!=="cancelled").reduce((s,o)=>s+o.cost,0);
              const pct = Math.min(100,Math.round((fundSpent/budget)*100));
              return (
                <div key={fund}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".72em",marginBottom:2}}>
                    <span style={{color:C.text,fontWeight:500}}>{fund}</span>
                    <span style={{color:C.muted}}>₦{fundSpent.toLocaleString()} / ₦{budget.toLocaleString()}</span>
                  </div>
                  <div style={{height:5,background:C.border,borderRadius:6,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:fundColors[fund]||C.primary,borderRadius:6}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignContent:"start"}}>
          {[{label:"Total Orders",val:orders.length,color:C.primary},{label:"Pending Approval",val:orders.filter(o=>o.status==="pending").length,color:C.warning},{label:"Active Orders",val:orders.filter(o=>o.status==="ordered").length,color:C.info},{label:"Items Received YTD",val:orders.reduce((s,o)=>s+o.received,0),color:C.success}].map((s,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
              <div style={{fontSize:"1.5em",fontWeight:800,color:s.color}}>{s.val}</div>
              <div style={{fontSize:".75em",color:C.muted,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"fit-content"}}>
        {[{id:"orders",label:"📋 Purchase Orders"},{id:"vendors",label:"🏪 Vendors"},{id:"receiving",label:"📥 Receiving"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 20px",border:"none",borderBottom:`2px solid ${tab===t.id?C.primary:"transparent"}`,background:tab===t.id?`${C.primary}08`:"transparent",color:tab===t.id?C.primary:C.muted,fontWeight:tab===t.id?700:400,fontSize:".82em",cursor:"pointer",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab==="orders"&&(
        <Card>
          <Table cols={["Title","Author","Vendor","Fund","Order Date","Cost (₦)","Qty","Received","Status","Action"]}
            rows={orders.map(o=>({cells:[
              <div style={{fontWeight:600,fontSize:".85em",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.title}</div>,
              <span style={{fontSize:".78em"}}>{o.author}</span>,
              <span style={{fontSize:".78em"}}>{o.vendor}</span>,
              <span style={{fontSize:".72em",color:fundColors[o.fund]||C.muted,fontWeight:600}}>{o.fund}</span>,
              <span style={{fontSize:".78em"}}>{o.orderDate}</span>,
              <span style={{fontWeight:600}}>₦{o.cost.toLocaleString()}</span>,
              o.qty,
              <span style={{fontWeight:o.received>0?700:400,color:o.received>=o.qty?C.success:o.received>0?C.warning:C.muted}}>{o.received}/{o.qty}</span>,
              statusBadge(o.status),
              <div style={{display:"flex",gap:4}}>
                {o.status==="pending"&&<Btn size="sm" onClick={()=>setOrders(prev=>prev.map(x=>x.id===o.id?{...x,status:"ordered"}:x))}>Approve</Btn>}
                {(o.status==="ordered"||o.status==="partial")&&<Btn size="sm" onClick={()=>{setReceiveModal(o);setReceiveQty(o.qty-o.received);}}>Receive</Btn>}
                <Btn size="sm" variant="ghost" onClick={()=>setOrders(prev=>prev.map(x=>x.id===o.id?{...x,status:"cancelled"}:x))}>✕</Btn>
              </div>
            ]}))}/>
        </Card>
      )}

      {/* Vendors tab */}
      {tab==="vendors"&&(
        <Card>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>Vendor Directory</div>
            <Btn size="sm" icon="➕">Add Vendor</Btn>
          </div>
          <Table cols={["Vendor Name","Contact Email","Phone","Type","Discount","Status","Action"]}
            rows={vendors.map(v=>({cells:[
              <div style={{fontWeight:600,fontSize:".88em"}}>{v.name}</div>,
              <span style={{fontSize:".8em"}}>{v.contact}</span>,
              <span style={{fontSize:".8em"}}>{v.phone}</span>,
              <Badge color={v.type==="International"?"purple":"blue"}>{v.type}</Badge>,
              <span style={{fontWeight:700,color:C.success}}>{v.discount}%</span>,
              v.active?<Badge color="green">Active</Badge>:<Badge color="gray">Inactive</Badge>,
              <div style={{display:"flex",gap:4}}><Btn size="sm" variant="secondary">Edit</Btn><Btn size="sm" variant="ghost">Orders</Btn></div>
            ]}))}/>
        </Card>
      )}

      {/* Receiving tab */}
      {tab==="receiving"&&(
        <Card>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:".88em",color:C.text}}>Items Awaiting Receipt</div>
          <Table cols={["Title","Vendor","Ordered","Expected","Ordered Qty","Received","Action"]}
            rows={orders.filter(o=>o.status==="ordered"||o.status==="partial").map(o=>({cells:[
              <div style={{fontWeight:600,fontSize:".85em"}}>{o.title}</div>,
              o.vendor, o.orderDate,
              <span style={{color:o.expectedDate&&new Date(o.expectedDate)<new Date()?C.danger:C.text,fontSize:".8em"}}>{o.expectedDate||"—"}</span>,
              o.qty,
              <span style={{fontWeight:700,color:o.received>0?C.warning:C.muted}}>{o.received}/{o.qty}</span>,
              <Btn size="sm" onClick={()=>{setReceiveModal(o);setReceiveQty(o.qty-o.received);}}>Receive Items</Btn>
            ]}))}/>
          {orders.filter(o=>o.status==="ordered"||o.status==="partial").length===0&&<div style={{padding:"32px",textAlign:"center",color:C.muted,fontSize:".88em"}}>No items awaiting receipt</div>}
        </Card>
      )}

      {/* New Order Modal */}
      {showModal&&(
        <Modal title="New Purchase Order" onClose={()=>setShowModal(false)} width={560}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            <div style={{gridColumn:"1/-1"}}><Input label="Title" value={newOrder.title} onChange={v=>setNewOrder(o=>({...o,title:v}))} placeholder="Full title of material" required/></div>
            <div style={{paddingRight:8}}><Input label="Author" value={newOrder.author} onChange={v=>setNewOrder(o=>({...o,author:v}))} placeholder="Author name"/></div>
            <div style={{paddingLeft:8}}><Input label="Quantity" type="number" value={newOrder.qty} onChange={v=>setNewOrder(o=>({...o,qty:v}))}/></div>
            <div style={{paddingRight:8}}><Select label="Vendor" value={newOrder.vendor} onChange={v=>setNewOrder(o=>({...o,vendor:v}))} options={[{value:"",label:"Select vendor…"},...vendors.map(v=>({value:v.name,label:v.name}))]}/></div>
            <div style={{paddingLeft:8}}><Select label="Fund" value={newOrder.fund} onChange={v=>setNewOrder(o=>({...o,fund:v}))} options={Object.keys(BUDGET.funds).map(f=>({value:f,label:f}))}/></div>
            <div style={{paddingRight:8}}><Input label="Unit Cost (₦)" type="number" value={newOrder.cost} onChange={v=>setNewOrder(o=>({...o,cost:v}))} placeholder="e.g. 25000" required/></div>
            <div style={{paddingLeft:8}}><Input label="Expected Date" type="date" value={newOrder.expectedDate} onChange={v=>setNewOrder(o=>({...o,expectedDate:v}))}/></div>
            <div style={{gridColumn:"1/-1"}}><Input label="Notes" value={newOrder.notes} onChange={v=>setNewOrder(o=>({...o,notes:v}))} placeholder="Any special instructions…"/></div>
          </div>
          {newOrder.cost&&newOrder.qty&&<div style={{padding:"10px 12px",background:`${C.primary}08`,borderRadius:8,marginBottom:12,fontSize:".82em",color:C.primary,fontWeight:600}}>Total Cost: ₦{(parseInt(newOrder.cost||0)*parseInt(newOrder.qty||1)).toLocaleString()}</div>}
          <div style={{display:"flex",gap:8}}>
            <Btn full onClick={submitOrder} disabled={!newOrder.title||!newOrder.vendor||!newOrder.cost}>Place Order</Btn>
            <Btn full variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Receive Modal */}
      {receiveModal&&(
        <Modal title={`Receive: ${receiveModal.title}`} onClose={()=>setReceiveModal(null)} width={420}>
          <div style={{background:C.bg,borderRadius:8,padding:"12px",marginBottom:14,fontSize:".82em"}}>
            <div style={{fontWeight:600,color:C.text,marginBottom:6}}>{receiveModal.title}</div>
            <div style={{color:C.muted}}>Vendor: {receiveModal.vendor}</div>
            <div style={{color:C.muted,marginTop:2}}>Ordered: {receiveModal.qty} · Previously received: {receiveModal.received}</div>
          </div>
          <Input label="Copies Received Now" type="number" value={String(receiveQty)} onChange={v=>setReceiveQty(Math.max(1,Math.min(receiveModal.qty-receiveModal.received,parseInt(v)||1)))}/>
          <Input label="Date Received" type="date" value={new Date().toISOString().split("T")[0]} onChange={()=>{}}/>
          <Select label="Condition" value="good" onChange={()=>{}} options={[{value:"good",label:"Good"},{value:"damaged",label:"Damaged"},{value:"incomplete",label:"Incomplete set"}]}/>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <Btn full onClick={()=>receiveOrder(receiveModal,receiveQty)}>Confirm Receipt of {receiveQty} cop{receiveQty>1?"ies":"y"}</Btn>
            <Btn full variant="secondary" onClick={()=>setReceiveModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SERIALS MANAGEMENT
// ═══════════════════════════════════════════════════════════
const SERIALS_DATA = [
  {id:1,title:"Journal of Nigerian Law",issn:"0189-4315",publisher:"Nigerian Bar Association",frequency:"Quarterly",format:"Print",status:"active",currentVol:"Vol. 34",nextExpected:"2025-07-01",cost:48000,paid:true,issues:[{vol:"34",no:"1",date:"2025-01-15",received:true},{vol:"33",no:"4",date:"2024-10-10",received:true},{vol:"33",no:"3",date:"2024-07-12",received:true}]},
  {id:2,title:"African Journal of Library & Information Science",issn:"0795-4778",publisher:"Archibus Africa",frequency:"Biannual",format:"Print + Online",status:"active",currentVol:"Vol. 22",nextExpected:"2025-08-15",cost:32000,paid:true,issues:[{vol:"22",no:"1",date:"2025-02-20",received:true},{vol:"21",no:"2",date:"2024-08-18",received:true}]},
  {id:3,title:"Petroleum Science and Technology",issn:"1091-6466",publisher:"Taylor & Francis",frequency:"Monthly",format:"Online",status:"active",currentVol:"Vol. 43",nextExpected:"2025-07-05",cost:145000,paid:false,issues:[{vol:"43",no:"5",date:"2025-05-30",received:true},{vol:"43",no:"4",date:"2025-04-28",received:true},{vol:"43",no:"3",date:"2025-03-30",received:false}]},
  {id:4,title:"West African Journal of Medicine",issn:"0189-160X",publisher:"West African College of Physicians",frequency:"Quarterly",format:"Print",status:"renewal_pending",currentVol:"Vol. 41",nextExpected:"2025-07-20",cost:24000,paid:false,issues:[{vol:"41",no:"1",date:"2025-01-20",received:true},{vol:"40",no:"4",date:"2024-10-15",received:true}]},
  {id:5,title:"Bulletin of the American Mathematical Society",issn:"0273-0979",publisher:"AMS",frequency:"Quarterly",format:"Online",status:"active",currentVol:"Vol. 62",nextExpected:"2025-07-01",cost:62000,paid:true,issues:[{vol:"62",no:"2",date:"2025-04-01",received:true}]},
];

function SerialsPage() {
  const [serials, setSerials] = useState(SERIALS_DATA);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("subscriptions"); // subscriptions | checkin | kardex
  const [q, setQ] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [checkInBarcode, setCheckInBarcode] = useState("");
  const [checkInMsg, setCheckInMsg] = useState(null);

  const filtered = serials.filter(s=>q===""||s.title.toLowerCase().includes(q.toLowerCase())||s.issn.includes(q));
  const statusBadge = s=>s==="active"?<Badge color="green">Active</Badge>:s==="renewal_pending"?<Badge color="yellow">Renewal Pending</Badge>:s==="cancelled"?<Badge color="red">Cancelled</Badge>:<Badge color="gray">{s}</Badge>;
  const freqColor = f=>f==="Monthly"?C.primary:f==="Quarterly"?"#7C3AED":f==="Biannual"?C.info:C.muted;

  const receiveIssue = (serialId) => {
    const today = new Date().toISOString().split("T")[0];
    setSerials(ss=>ss.map(s=>{
      if(s.id!==serialId) return s;
      const latestNo = s.issues[0]?.no ? parseInt(s.issues[0].no)+1 : 1;
      const newIssue = {vol:s.currentVol.replace("Vol. ",""),no:String(latestNo).padStart(2,"0"),date:today,received:true};
      return {...s,issues:[newIssue,...s.issues]};
    }));
    setCheckInMsg({type:"success",text:`✅ Issue received and recorded.`});
    setTimeout(()=>setCheckInMsg(null),3000);
    setCheckInBarcode("");
  };

  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader title="📰 Serials Management" subtitle="Manage journal subscriptions, receive issues and track binding"
        action={<div style={{display:"flex",gap:8}}><Btn variant="secondary" icon="📤">Export Kardex</Btn><Btn onClick={()=>setShowAddModal(true)} icon="➕">Add Subscription</Btn></div>}/>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{label:"Active Subscriptions",val:serials.filter(s=>s.status==="active").length,color:C.primary},{label:"Renewal Pending",val:serials.filter(s=>s.status==="renewal_pending").length,color:C.warning},{label:"Annual Budget (₦)",val:"311,000",color:"#7C3AED"},{label:"Issues This Month",val:serials.flatMap(s=>s.issues).filter(i=>i.date?.startsWith("2025-06")).length,color:C.success}].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:"1.4em",fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:".75em",color:C.muted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"fit-content"}}>
        {[{id:"subscriptions",label:"📋 Subscriptions"},{id:"checkin",label:"📥 Issue Check-in"},{id:"kardex",label:"🗂️ Kardex"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 20px",border:"none",borderBottom:`2px solid ${tab===t.id?C.primary:"transparent"}`,background:tab===t.id?`${C.primary}08`:"transparent",color:tab===t.id?C.primary:C.muted,fontWeight:tab===t.id?700:400,fontSize:".82em",cursor:"pointer",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Subscriptions Tab */}
      {tab==="subscriptions"&&(
        <Card>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search serials…" style={{flex:1,padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}/>
            <select style={{padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".85em",outline:"none"}}><option>All Status</option><option>Active</option><option>Renewal Pending</option></select>
          </div>
          <Table cols={["Title","ISSN","Publisher","Frequency","Format","Next Issue","Cost (₦/yr)","Status","Action"]}
            rows={filtered.map(s=>({cells:[
              <div><div style={{fontWeight:600,fontSize:".88em",color:C.text}}>{s.title}</div><div style={{fontSize:".72em",color:C.muted}}>{s.currentVol}</div></div>,
              <span style={{fontFamily:"monospace",fontSize:".8em"}}>{s.issn}</span>,
              <span style={{fontSize:".78em"}}>{s.publisher}</span>,
              <span style={{fontSize:".78em",color:freqColor(s.frequency),fontWeight:600}}>{s.frequency}</span>,
              <Badge color="gray">{s.format}</Badge>,
              <span style={{fontSize:".78em",color:new Date(s.nextExpected)<new Date()?C.danger:C.text}}>{s.nextExpected}</span>,
              <span style={{fontWeight:600}}>{s.cost.toLocaleString()}</span>,
              statusBadge(s.status),
              <div style={{display:"flex",gap:4}}>
                <Btn size="sm" variant="secondary" onClick={()=>setSelected(s)}>Issues</Btn>
                <Btn size="sm" onClick={()=>receiveIssue(s.id)}>Receive</Btn>
              </div>
            ]}))}/>
        </Card>
      )}

      {/* Check-in Tab */}
      {tab==="checkin"&&(
        <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:16}}>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>📥 Receive New Issue</div>
            <Input label="ISSN or Serial Barcode" value={checkInBarcode} onChange={setCheckInBarcode} placeholder="Enter ISSN or scan barcode…"/>
            <Select label="Volume" value="" onChange={()=>{}} options={serials.map(s=>({value:String(s.id),label:s.title}))}/>
            <Input label="Issue Number" value="" onChange={()=>{}} placeholder="e.g. Vol. 34, No. 2"/>
            <Input label="Date Received" type="date" value={new Date().toISOString().split("T")[0]} onChange={()=>{}}/>
            {checkInMsg&&<div style={{marginBottom:12,padding:"9px 12px",borderRadius:8,background:`${C.success}12`,border:`1px solid ${C.success}30`,fontSize:".82em",color:C.success}}>{checkInMsg.text}</div>}
            <Btn full icon="📥" onClick={()=>{const s=serials.find(x=>x.issn===checkInBarcode||checkInBarcode!=="");if(s)receiveIssue(s.id);}}>Record Receipt</Btn>
          </Card>
          <Card>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:".88em",color:C.text}}>Recent Receipts</div>
            <Table cols={["Serial Title","Volume/Issue","Date Received","Status"]}
              rows={serials.flatMap(s=>s.issues.slice(0,2).map(i=>({cells:[
                <span style={{fontSize:".85em",fontWeight:600}}>{s.title}</span>,
                <span style={{fontFamily:"monospace",fontSize:".8em"}}>Vol.{i.vol} No.{i.no}</span>,
                i.date,
                i.received?<Badge color="green">Received</Badge>:<Badge color="red">Missing</Badge>
              ]}))).slice(0,10)}/>
          </Card>
        </div>
      )}

      {/* Kardex Tab */}
      {tab==="kardex"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {serials.map(s=>(
            <Card key={s.id} style={{padding:"0",overflow:"hidden"}}>
              <div style={{padding:"12px 18px",background:`${C.primary}06`,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:700,color:C.text,fontSize:".9em"}}>{s.title}</span>
                  <span style={{marginLeft:12,fontFamily:"monospace",fontSize:".75em",color:C.muted}}>ISSN: {s.issn}</span>
                  <span style={{marginLeft:8,fontSize:".72em",color:freqColor(s.frequency),fontWeight:600}}>{s.frequency}</span>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {statusBadge(s.status)}
                  <span style={{fontSize:".72em",color:s.paid?C.success:C.danger,fontWeight:700}}>{s.paid?"✓ Paid":"⚠ Unpaid"}</span>
                </div>
              </div>
              <div style={{padding:"12px 18px",display:"flex",gap:8,flexWrap:"wrap"}}>
                {s.issues.map((iss,i)=>(
                  <div key={i} style={{padding:"6px 12px",borderRadius:7,background:iss.received?`${C.success}12`:`${C.danger}10`,border:`1px solid ${iss.received?C.success+"30":C.danger+"30"}`,textAlign:"center",minWidth:80}}>
                    <div style={{fontSize:".7em",fontWeight:700,color:iss.received?C.success:C.danger}}>Vol.{iss.vol} No.{iss.no}</div>
                    <div style={{fontSize:".65em",color:C.muted,marginTop:1}}>{iss.date}</div>
                    <div style={{fontSize:".62em",marginTop:1,color:iss.received?C.success:C.danger}}>{iss.received?"✓ Received":"✗ Missing"}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Issue History Modal */}
      {selected&&(
        <Modal title={selected.title} onClose={()=>setSelected(null)} width={560}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16,fontSize:".82em"}}>
            {[["ISSN",selected.issn],["Publisher",selected.publisher],["Frequency",selected.frequency],["Format",selected.format],["Current Vol.",selected.currentVol],["Annual Cost",`₦${selected.cost.toLocaleString()}`]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}><div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:2}}>{k}</div><div style={{color:C.text,fontWeight:500}}>{v}</div></div>
            ))}
          </div>
          <div style={{fontWeight:700,fontSize:".82em",color:C.text,marginBottom:10}}>Issue History</div>
          {selected.issues.map((iss,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<selected.issues.length-1?`1px solid ${C.border}`:""}}>
              <span style={{fontFamily:"monospace",fontSize:".85em"}}>Vol.{iss.vol} No.{iss.no}</span>
              <span style={{fontSize:".8em",color:C.muted}}>{iss.date}</span>
              {iss.received?<Badge color="green">Received</Badge>:<Badge color="red">Missing</Badge>}
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <Btn onClick={()=>receiveIssue(selected.id)}>Receive Next Issue</Btn>
            <Btn variant="secondary">Renew Subscription</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  INTERLIBRARY LOAN (ILL)
// ═══════════════════════════════════════════════════════════
const ILL_DATA = {
  borrowing: [
    {id:"ILL-B001",title:"Advances in Computational Linguistics",patron:"Fatima Al-Amin",requestDate:"2025-06-10",requestedFrom:"University of Ibadan Library",dueDate:"2025-07-10",status:"received",notes:"Arrived in good condition"},
    {id:"ILL-B002",title:"Nigerian Economic Policy Review 2024",patron:"Dr. Taiwo Oladele",requestDate:"2025-06-15",requestedFrom:"Central Bank Library",dueDate:"",status:"pending",notes:"Awaiting confirmation"},
    {id:"ILL-B003",title:"Bioinformatics Algorithms (3rd ed.)",patron:"Yusuf Musa Ibrahim",requestDate:"2025-06-18",requestedFrom:"Lagos State University Library",dueDate:"",status:"in_transit",notes:"Shipped 2025-06-22"},
  ],
  lending: [
    {id:"ILL-L001",title:"Introduction to Library and Information Science",requestingLib:"Covenant University Library",requestDate:"2025-06-12",dueDate:"2025-07-12",status:"sent",barcode:"ITM00312"},
    {id:"ILL-L002",title:"African History: A Very Short Introduction",requestingLib:"Babcock University Library",requestDate:"2025-06-20",dueDate:"",status:"pending",barcode:"ITM00701"},
  ],
  partners: [
    {name:"University of Ibadan Library",code:"UI-LIB",contact:"library@ui.edu.ng",type:"Academic",active:true},
    {name:"Lagos State University Library",code:"LASU-LIB",contact:"lib@lasu.edu.ng",type:"Academic",active:true},
    {name:"Covenant University Library",code:"CU-LIB",contact:"library@covenantuniversity.edu.ng",type:"Academic",active:true},
    {name:"National Library of Nigeria",code:"NLN",contact:"info@nationallibrary.gov.ng",type:"National",active:true},
    {name:"Babcock University Library",code:"BU-LIB",contact:"library@babcock.edu.ng",type:"Academic",active:false},
  ]
};

function ILLPage() {
  const [tab, setTab]         = useState("borrowing");
  const [borrowing, setBorrowing] = useState(ILL_DATA.borrowing);
  const [lending, setLending] = useState(ILL_DATA.lending);
  const [partners]            = useState(ILL_DATA.partners);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReq, setNewReq]   = useState({title:"",patron:"",requestedFrom:"",notes:""});
  const [selected, setSelected] = useState(null);

  const statusBadge = s=>({pending:<Badge color="yellow">Pending</Badge>,in_transit:<Badge color="blue">In Transit</Badge>,received:<Badge color="green">Received</Badge>,returned:<Badge color="gray">Returned</Badge>,sent:<Badge color="blue">Sent</Badge>,overdue:<Badge color="red">Overdue</Badge>})[s]||<Badge color="gray">{s}</Badge>;

  const submitRequest = () => {
    if (!newReq.title||!newReq.patron) return;
    const req = { id:`ILL-B00${borrowing.length+1}`, title:newReq.title, patron:newReq.patron, requestDate:new Date().toISOString().split("T")[0], requestedFrom:newReq.requestedFrom, dueDate:"", status:"pending", notes:newReq.notes };
    setBorrowing(b=>[req,...b]);
    setShowNewModal(false);
    setNewReq({title:"",patron:"",requestedFrom:"",notes:""});
  };

  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader title="🔁 Interlibrary Loan" subtitle="Request and fulfil ILL between partner libraries"
        action={<div style={{display:"flex",gap:8}}><Btn variant="secondary" icon="🏛️">Partner Directory</Btn><Btn onClick={()=>setShowNewModal(true)} icon="➕">New ILL Request</Btn></div>}/>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Active Borrowing",val:borrowing.filter(b=>["pending","in_transit","received"].includes(b.status)).length,color:C.primary},
          {label:"Active Lending",val:lending.filter(l=>["pending","sent"].includes(l.status)).length,color:"#7C3AED"},
          {label:"Partner Libraries",val:partners.filter(p=>p.active).length,color:C.info},
          {label:"Completed This Month",val:3,color:C.success}
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:"1.5em",fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:".75em",color:C.muted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"fit-content"}}>
        {[{id:"borrowing",label:"📥 Borrowing"},{id:"lending",label:"📤 Lending"},{id:"partners",label:"🏛️ Partners"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 20px",border:"none",borderBottom:`2px solid ${tab===t.id?C.primary:"transparent"}`,background:tab===t.id?`${C.primary}08`:"transparent",color:tab===t.id?C.primary:C.muted,fontWeight:tab===t.id?700:400,fontSize:".82em",cursor:"pointer",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Borrowing */}
      {tab==="borrowing"&&(
        <Card>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:".88em",color:C.text}}>Borrowing Requests (items requested from other libraries)</div>
          <Table cols={["Request ID","Title","Patron","Requested From","Request Date","Due Date","Status","Action"]}
            rows={borrowing.map(b=>({cells:[
              <span style={{fontFamily:"monospace",fontSize:".8em",color:C.primary}}>{b.id}</span>,
              <div style={{fontWeight:600,fontSize:".85em",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title}</div>,
              b.patron,
              <span style={{fontSize:".8em"}}>{b.requestedFrom}</span>,
              b.requestDate,
              b.dueDate||"—",
              statusBadge(b.status),
              <div style={{display:"flex",gap:4}}>
                <Btn size="sm" variant="secondary" onClick={()=>setSelected(b)}>View</Btn>
                {b.status==="in_transit"&&<Btn size="sm" onClick={()=>setBorrowing(bs=>bs.map(x=>x.id===b.id?{...x,status:"received",dueDate:new Date(Date.now()+30*86400000).toISOString().split("T")[0]}:x))}>Mark Received</Btn>}
                {b.status==="received"&&<Btn size="sm" variant="secondary" onClick={()=>setBorrowing(bs=>bs.map(x=>x.id===b.id?{...x,status:"returned"}:x))}>Return</Btn>}
              </div>
            ]}))}/>
        </Card>
      )}

      {/* Lending */}
      {tab==="lending"&&(
        <Card>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:".88em",color:C.text}}>Lending Requests (items requested from us by other libraries)</div>
          <Table cols={["Request ID","Title","Requesting Library","Request Date","Due Date","Item Barcode","Status","Action"]}
            rows={lending.map(l=>({cells:[
              <span style={{fontFamily:"monospace",fontSize:".8em",color:"#7C3AED"}}>{l.id}</span>,
              <div style={{fontWeight:600,fontSize:".85em"}}>{l.title}</div>,
              l.requestingLib,
              l.requestDate,
              l.dueDate||"—",
              <span style={{fontFamily:"monospace",fontSize:".78em"}}>{l.barcode}</span>,
              statusBadge(l.status),
              <div style={{display:"flex",gap:4}}>
                {l.status==="pending"&&<Btn size="sm" onClick={()=>setLending(ls=>ls.map(x=>x.id===l.id?{...x,status:"sent",dueDate:new Date(Date.now()+30*86400000).toISOString().split("T")[0]}:x))}>Approve & Send</Btn>}
                {l.status==="sent"&&<Btn size="sm" variant="secondary" onClick={()=>setLending(ls=>ls.map(x=>x.id===l.id?{...x,status:"returned"}:x))}>Mark Returned</Btn>}
                <Btn size="sm" variant="ghost">Details</Btn>
              </div>
            ]}))}/>
        </Card>
      )}

      {/* Partners */}
      {tab==="partners"&&(
        <Card>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>Partner Library Directory</div>
            <Btn size="sm" icon="➕">Add Partner</Btn>
          </div>
          <Table cols={["Library Name","Code","Contact Email","Type","Status","Action"]}
            rows={partners.map(p=>({cells:[
              <div style={{fontWeight:600,fontSize:".88em"}}>{p.name}</div>,
              <span style={{fontFamily:"monospace",fontSize:".8em",color:C.primary}}>{p.code}</span>,
              <span style={{fontSize:".8em"}}>{p.contact}</span>,
              <Badge color={p.type==="National"?"purple":"blue"}>{p.type}</Badge>,
              p.active?<Badge color="green">Active</Badge>:<Badge color="gray">Inactive</Badge>,
              <div style={{display:"flex",gap:4}}><Btn size="sm" variant="secondary">Edit</Btn><Btn size="sm" variant="ghost">{p.active?"Deactivate":"Activate"}</Btn></div>
            ]}))}/>
        </Card>
      )}

      {/* New ILL Request Modal */}
      {showNewModal&&(
        <Modal title="New ILL Borrowing Request" onClose={()=>setShowNewModal(false)} width={500}>
          <Input label="Title of Material" value={newReq.title} onChange={v=>setNewReq(r=>({...r,title:v}))} placeholder="Full title of the item needed" required/>
          <Input label="Requesting Patron" value={newReq.patron} onChange={v=>setNewReq(r=>({...r,patron:v}))} placeholder="Patron name or ID" required/>
          <Select label="Request From Library" value={newReq.requestedFrom} onChange={v=>setNewReq(r=>({...r,requestedFrom:v}))} options={[{value:"",label:"Select partner library…"},...partners.filter(p=>p.active).map(p=>({value:p.name,label:p.name}))]}/>
          <Input label="Notes / Edition / Year" value={newReq.notes} onChange={v=>setNewReq(r=>({...r,notes:v}))} placeholder="Any specific edition, format or notes…"/>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <Btn full onClick={submitRequest}>Submit ILL Request</Btn>
            <Btn full variant="secondary" onClick={()=>setShowNewModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {selected&&(
        <Modal title={`ILL Request: ${selected.id}`} onClose={()=>setSelected(null)} width={480}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,fontSize:".82em"}}>
            {[["Title",selected.title],["Patron",selected.patron],["Requested From",selected.requestedFrom],["Request Date",selected.requestDate],["Due Date",selected.dueDate||"Pending"],["Status",selected.status.replace("_"," ").toUpperCase()]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}><div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:2}}>{k}</div><div style={{color:C.text,fontWeight:500}}>{v}</div></div>
            ))}
          </div>
          {selected.notes&&<div style={{background:C.bg,borderRadius:7,padding:"10px 12px",marginBottom:14,fontSize:".82em"}}><div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:4}}>Notes</div><div>{selected.notes}</div></div>}
          <div style={{display:"flex",gap:8}}>
            {selected.status==="in_transit"&&<Btn onClick={()=>{setBorrowing(bs=>bs.map(x=>x.id===selected.id?{...x,status:"received"}:x));setSelected(null);}}>Mark Received</Btn>}
            <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ComingSoonPage({ icon, title, desc, features }) {
  return (
    <div style={{padding:"28px 24px",maxWidth:800}}>
      <div style={{textAlign:"center",padding:"60px 40px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16}}>
        <div style={{fontSize:56,marginBottom:16}}>{icon}</div>
        <h2 style={{fontSize:"1.5em",fontWeight:800,color:C.text,marginBottom:8}}>{title}</h2>
        <p style={{color:C.muted,fontSize:".9em",lineHeight:1.7,maxWidth:480,margin:"0 auto 28px"}}>{desc}</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,maxWidth:560,margin:"0 auto 28px",textAlign:"left"}}>
          {features.map((f,i)=>(
            <div key={i} style={{background:C.bg,borderRadius:8,padding:"10px 14px",fontSize:".82em",display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{color:C.primary}}>✓</span><span style={{color:C.text}}>{f}</span>
            </div>
          ))}
        </div>
        <Badge color="blue">Coming in Phase 2</Badge>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════
function ReportsPage() {
  const [tab, setTab]       = useState("circulation");
  const [dateRange, setDateRange] = useState("month");
  const [exportMsg, setExportMsg] = useState("");

  const doExport = (label) => { setExportMsg(`✅ ${label} exported`); setTimeout(()=>setExportMsg(""),3000); };

  // Chart helpers
  const Bar = ({val,max,color,label,sub})=>(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flex:1}}>
      <div style={{fontSize:".7em",color:C.text,fontWeight:600}}>{val}</div>
      <div style={{width:"100%",height:`${Math.max(4,(val/max)*110)}px`,background:color||C.primary,borderRadius:"4px 4px 0 0",transition:"height .3s",minHeight:4}}/>
      <div style={{fontSize:".65em",color:C.muted,textAlign:"center",lineHeight:1.2}}>{label}</div>
      {sub&&<div style={{fontSize:".6em",color:C.muted}}>{sub}</div>}
    </div>
  );

  const HBar = ({label,val,max,color,total})=>(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:".78em",marginBottom:4}}>
        <span style={{color:C.text,fontWeight:500,flex:1}}>{label}</span>
        <span style={{color:C.muted,marginLeft:8}}>{val}{total?" / "+total:""}</span>
      </div>
      <div style={{height:8,background:C.border,borderRadius:10,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(100,(val/max)*100)}%`,background:color||C.primary,borderRadius:10,transition:"width .5s"}}/>
      </div>
    </div>
  );

  // Data sets
  const weekData   = [{d:"Mon",v:42},{d:"Tue",v:58},{d:"Wed",v:71},{d:"Thu",v:49},{d:"Fri",v:63},{d:"Sat",v:28},{d:"Sun",v:11}];
  const monthData  = [{d:"Jan",v:312},{d:"Feb",v:287},{d:"Mar",v:334},{d:"Apr",v:298},{d:"May",v:356},{d:"Jun",v:289}];
  const topBooks   = [{t:"Database Systems",n:47},{t:"Things Fall Apart",n:43},{t:"Nigerian Const. Law",n:38},{t:"Petroleum Eng.",n:35},{t:"African History",n:29}];
  const patronTypes= [{l:"Undergraduate",v:1842,c:C.primary},{l:"Postgraduate",v:812,c:"#7C3AED"},{l:"Faculty",v:387,c:C.success},{l:"Staff",v:200,c:C.info}];
  const deptLoans  = [{l:"Computer Science",v:342},{l:"Law",v:287},{l:"Literature",v:241},{l:"Engineering",v:198},{l:"Medicine",v:176},{l:"Library Sci.",v:142}];
  const subjects   = [{l:"Technology",v:1247},{l:"Law",v:987},{l:"Science",v:876},{l:"Social Sciences",v:643},{l:"Arts",v:512}];
  const overdueLoans = LOANS.filter(l=>l.status==="overdue");

  const tabStyle = (id) => ({padding:"10px 18px",border:"none",borderBottom:`2px solid ${tab===id?C.primary:"transparent"}`,background:tab===id?`${C.primary}08`:"transparent",color:tab===id?C.primary:C.muted,fontWeight:tab===id?700:400,fontSize:".82em",cursor:"pointer",whiteSpace:"nowrap"});

  return (
    <div style={{padding:"28px 24px",maxWidth:1300}}>
      <PageHeader title="📊 Reports & Analytics" subtitle="Circulation trends, collection usage and patron activity"
        action={<div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={dateRange} onChange={e=>setDateRange(e.target.value)} style={{padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".82em",outline:"none"}}>
            <option value="week">This Week</option><option value="month">This Month</option><option value="quarter">This Quarter</option><option value="year">This Year</option>
          </select>
          <Btn variant="secondary" icon="🖨️" onClick={()=>{window.print();doExport("Report PDF");}}>Print Report</Btn>
          <Btn variant="secondary" icon="📊" onClick={()=>doExport("CSV Data")}>Export CSV</Btn>
        </div>}/>

      {exportMsg&&<div style={{marginBottom:14,padding:"9px 14px",background:`${C.success}10`,border:`1px solid ${C.success}30`,borderRadius:8,fontSize:".82em",color:C.success}}>{exportMsg}</div>}

      {/* KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Checkouts This Month" value="1,247" icon="🔄" color={C.primary} sub="+12% vs last month"/>
        <StatCard label="Active Loans" value={STATS.totalLoans} icon="📚" color="#7C3AED" sub="Across all patrons"/>
        <StatCard label="Overdue Rate" value="14.7%" icon="⚠️" color={C.warning} sub="-2.1% improvement"/>
        <StatCard label="New Items Added" value={STATS.newItemsMonth} icon="📦" color={C.success} sub="Books, serials & e-res."/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"fit-content"}}>
        {[{id:"circulation",l:"📈 Circulation"},{id:"collection",l:"📚 Collection"},{id:"patrons",l:"👥 Patrons"},{id:"overdue",l:"⚠️ Overdue"},{id:"staff",l:"👤 Staff"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={tabStyle(t.id)}>{t.l}</button>
        ))}
      </div>

      {/* CIRCULATION TAB */}
      {tab==="circulation"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:16}}>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:4}}>📈 Daily Checkouts — This Week</div>
              <div style={{fontSize:".72em",color:C.muted,marginBottom:14}}>Total: {weekData.reduce((a,b)=>a+b.v,0)} checkouts</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
                {weekData.map((b,i)=><Bar key={i} val={b.v} max={71} label={b.d} color={i===2?C.primary:`${C.primary}55`}/>)}
              </div>
            </Card>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>📅 Monthly Trend</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
                {monthData.map((b,i)=><Bar key={i} val={b.v} max={356} label={b.d} color={i===monthData.length-1?C.primary:`${C.primary}55`}/>)}
              </div>
            </Card>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>🏆 Top 5 Most Borrowed Titles</div>
              {topBooks.map((b,i)=><HBar key={i} label={b.t} val={b.n} max={topBooks[0].n} color={[C.primary,"#7C3AED",C.info,C.success,C.warning][i]}/>)}
            </Card>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>📊 Loans by Transaction Type</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[{l:"New Checkouts",v:847,total:1247,c:C.primary},{l:"Renewals",v:312,total:1247,c:"#7C3AED"},{l:"ILL Borrowed",v:18,total:1247,c:C.info},{l:"Returns",v:1180,total:1247,c:C.success}].map((r,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<3?`1px solid ${C.border}`:""}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:r.c,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:".82em",color:C.text}}>{r.l}</span>
                    <span style={{fontWeight:700,color:r.c}}>{r.v}</span>
                    <span style={{fontSize:".72em",color:C.muted,width:36,textAlign:"right"}}>{Math.round((r.v/r.total)*100)}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* COLLECTION TAB */}
      {tab==="collection"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>📚 Loans by Subject Area</div>
              {subjects.map((s,i)=><HBar key={i} label={s.l} val={s.v} max={subjects[0].v} color={[C.primary,"#7C3AED",C.info,C.success,C.warning][i]}/>)}
            </Card>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>📦 Collection by Format</div>
              {[{l:"Monographs",v:8432,c:C.primary},{l:"E-Resources",v:2847,c:"#7C3AED"},{l:"Serials",v:1247,c:C.info},{l:"Theses/Dissertations",v:312,c:C.success},{l:"AV Materials",v:9,c:C.warning}].map((r,i)=>(
                <HBar key={i} label={r.l} val={r.v} max={8432} color={r.c}/>
              ))}
            </Card>
          </div>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>🔍 Item Status Overview</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[{l:"Available",v:BOOKS.reduce((s,b)=>s+b.available,0),c:C.success},{l:"Checked Out",v:BOOKS.reduce((s,b)=>s+(b.copies-b.available),0),c:C.warning},{l:"Reference Only",v:BOOKS.filter(b=>b.status==="reference").reduce((s,b)=>s+b.copies,0),c:"#7C3AED"},{l:"Total Copies",v:BOOKS.reduce((s,b)=>s+b.copies,0),c:C.primary}].map((s,i)=>(
                <div key={i} style={{background:C.bg,borderRadius:9,padding:"14px",textAlign:"center",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:"1.8em",fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:".72em",color:C.muted,marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* PATRONS TAB */}
      {tab==="patrons"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>👥 Active Patrons by Type</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:12,height:120,marginBottom:8}}>
                {patronTypes.map((p,i)=><Bar key={i} val={p.v} max={1842} label={p.l.split(" ")[0]} color={p.c}/>)}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                {patronTypes.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:".72em"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:p.c}}/>
                    <span style={{color:C.muted}}>{p.l}: <strong style={{color:C.text}}>{p.v.toLocaleString()}</strong></span>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{padding:"20px"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>🏛️ Loans by Department</div>
              {deptLoans.map((d,i)=><HBar key={i} label={d.l} val={d.v} max={deptLoans[0].v} color={[C.primary,"#7C3AED",C.info,C.success,C.warning,C.danger][i]}/>)}
            </Card>
          </div>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>📋 Patron Registration Trend (Last 6 Months)</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,height:100}}>
              {[{d:"Jan",v:78},{d:"Feb",v:92},{d:"Mar",v:145},{d:"Apr",v:67},{d:"May",v:89},{d:"Jun",v:54}].map((b,i)=>(
                <Bar key={i} val={b.v} max={145} label={b.d} color={`${C.primary}${i===2?"":"88"}`}/>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* OVERDUE TAB */}
      {tab==="overdue"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:4}}>
            {[{l:"Total Overdue",v:STATS.overdueItems,c:C.danger},{l:"Total Fines Outstanding",v:"₦3,450",c:C.warning},{l:"Notices Sent Today",v:12,c:C.info}].map((s,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px"}}>
                <div style={{fontSize:"1.6em",fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:".75em",color:C.muted,marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          <Card>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>Overdue Loans Report</div>
              <div style={{display:"flex",gap:8}}>
                <Btn size="sm" variant="secondary" icon="📧">Send All Notices</Btn>
                <Btn size="sm" variant="secondary" icon="📊" onClick={()=>doExport("Overdue Report CSV")}>Export</Btn>
              </div>
            </div>
            <Table cols={["Patron","Dept","Item","Due Date","Days Overdue","Fine (₦)","Action"]}
              rows={overdueLoans.map(l=>{
                const days = Math.max(0,Math.floor((new Date()-new Date(l.dueDate))/(1000*60*60*24)));
                const patron = PATRONS.find(p=>p.id===l.patronId);
                return {cells:[
                  <div><div style={{fontWeight:600,fontSize:".85em"}}>{l.patronName}</div><div style={{fontSize:".7em",color:C.muted}}>{l.barcode}</div></div>,
                  <span style={{fontSize:".78em"}}>{patron?.dept||"—"}</span>,
                  <div style={{fontWeight:500,fontSize:".82em",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.bookTitle}</div>,
                  l.dueDate,
                  <Badge color="red">{days} days</Badge>,
                  <span style={{fontWeight:700,color:C.danger}}>₦{(days*50).toLocaleString()}</span>,
                  <Btn size="sm" variant="secondary" icon="📧">Send Notice</Btn>
                ]};
              })}/>
          </Card>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>📊 Overdue by Department</div>
            {[{l:"Computer Science",v:5},{l:"Law",v:4},{l:"Engineering",v:3},{l:"Medicine",v:2},{l:"Others",v:9}].map((d,i)=>(
              <HBar key={i} label={d.l} val={d.v} max={9} color={C.danger} total={STATS.overdueItems}/>
            ))}
          </Card>
        </div>
      )}

      {/* STAFF TAB */}
      {tab==="staff"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>👤 Staff Activity This Month</div>
            <Table cols={["Staff Member","Role","Checkouts","Returns","Catalogued","ILL Requests","Patrons Registered"]}
              rows={[
                {cells:["Adewale Okonkwo","Head Librarian","—","—",24,3,12]},
                {cells:["Dr. Taiwo Oladele","Staff Librarian",312,287,89,7,34]},
                {cells:["Ms. Amina Suleiman","Circulation Librarian",487,421,12,2,28]},
                {cells:["Mr. Tunde Bakare","Cataloguer","—","—",142,1,0]},
              ].map(r=>({cells:r.cells.map((c,i)=>i===0?<div style={{fontWeight:600,fontSize:".88em"}}>{c}</div>:i===1?<Badge color="gray">{c}</Badge>:<span style={{fontWeight:typeof c==="number"?600:400,color:typeof c==="number"&&c>100?C.primary:C.text}}>{c}</span>)}))}/>
          </Card>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:14}}>⏰ Peak Hours (Circulation Desk)</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>
              {[{h:"8am",v:12},{h:"9am",v:34},{h:"10am",v:67},{h:"11am",v:89},{h:"12pm",v:54},{h:"1pm",v:23},{h:"2pm",v:71},{h:"3pm",v:86},{h:"4pm",v:62},{h:"5pm",v:28}].map((b,i)=>(
                <Bar key={i} val={b.v} max={89} label={b.h} color={b.v>60?C.primary:`${C.primary}55`}/>
              ))}
            </div>
            <div style={{marginTop:8,fontSize:".72em",color:C.muted,textAlign:"center"}}>Busiest hours: 11am–12pm and 2pm–4pm</div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  JOURNAL & RESEARCH FINDER
// ═══════════════════════════════════════════════════════════
function JournalFinderPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("all"); // all | oa | journal | thesis | book
  const [discipline, setDiscipline] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [saveList, setSaveList] = useState([]);
  const resultRef = useRef(null);

  const DISCIPLINES = ["","Agriculture","Architecture","Biochemistry","Business & Management","Chemistry","Computer Science","Economics","Education","Engineering","Environmental Science","History","Law","Library & Information Science","Linguistics","Mathematics","Medicine & Public Health","Microbiology","Nursing","Petroleum Engineering","Philosophy","Physics","Political Science","Psychology","Sociology","Veterinary Science"];

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setResults(null); setError(""); setSelected(null);
    const typeLabel = {all:"open access articles, journals, and research papers",oa:"open access full-text articles only",journal:"peer-reviewed journal articles",thesis:"theses and dissertations",book:"academic books and book chapters"}[searchType]||"research resources";
    const systemPrompt = `You are LISAR Research Finder, an expert academic librarian assistant. When given a research query, you search for and return relevant academic resources.

Return ONLY a valid JSON object (no markdown, no backticks, no explanation) in this exact format:
{
  "query_summary": "Brief description of what was searched",
  "total_found": number,
  "resources": [
    {
      "id": 1,
      "title": "Full article/journal title",
      "authors": "Author names (Last, First; Last, First)",
      "year": "2023",
      "source": "Journal/Publisher name",
      "type": "journal_article|thesis|book|conference_paper|preprint|dataset",
      "access": "open_access|restricted|unknown",
      "doi": "10.xxxx/xxxxx or empty string",
      "url": "https://... (real URL if known, else empty string)",
      "abstract": "2-3 sentence summary of the resource",
      "keywords": ["keyword1","keyword2","keyword3"],
      "language": "English",
      "citations": number or null,
      "impact_factor": "number or N/A",
      "open_access_repository": "PubMed Central|DOAJ|arXiv|SSRN|BASE|OpenDOAR|AJOL|AfricArXiv|Google Scholar|Semantic Scholar|CORE|Unpaywall or empty",
      "full_text_available": true or false,
      "african_content": true or false
    }
  ],
  "databases_searched": ["DOAJ","PubMed Central","arXiv","SSRN","AJOL","AfricArXiv","Google Scholar","Semantic Scholar","CORE","BASE","OpenDOAR","Unpaywall"],
  "open_access_count": number,
  "suggestions": ["Related search term 1","Related search term 2","Related search term 3"]
}

Include 8-12 results. Prioritise:
1. Real, verifiable open access resources from DOAJ, PubMed Central, arXiv, SSRN, AJOL, AfricArXiv
2. African and Nigerian scholarship where relevant
3. Mix of resource types (articles, theses, books) unless filtered
4. Resources with full text available where possible

For African libraries, always include results from AJOL (African Journals Online) and AfricArXiv when relevant.`;

    const userMsg = `Search query: "${query}"
Resource type filter: ${typeLabel}
${discipline?`Discipline: ${discipline}`:""}
${yearFrom||yearTo?`Year range: ${yearFrom||"any"} – ${yearTo||"present"}`:""}

Find the most relevant and authoritative academic resources. Include open access full-text links where available.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system:systemPrompt,
          messages:[{role:"user",content:userMsg}],
          tools:[{type:"web_search_20250305",name:"web_search"}]
        })
      });
      const data = await res.json();
      const textBlock = data.content?.find(b=>b.type==="text");
      if (!textBlock) throw new Error("No response from AI");
      let txt = textBlock.text.trim();
      txt = txt.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const parsed = JSON.parse(txt);
      setResults(parsed);
      setHistory(h=>[{query,type:searchType,discipline,time:new Date().toLocaleTimeString()},...h.slice(0,4)]);
      setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    } catch(e) {
      setError("Search failed. Please try again. (" + e.message + ")");
    }
    setLoading(false);
  };

  const accessBadge = a => a==="open_access"?<Badge color="green">Open Access</Badge>:a==="restricted"?<Badge color="red">Restricted</Badge>:<Badge color="gray">Unknown</Badge>;
  const typeBadge = t => ({journal_article:<Badge color="blue">Journal Article</Badge>,thesis:<Badge color="purple">Thesis</Badge>,book:<Badge color="yellow">Book</Badge>,conference_paper:<Badge color="gray">Conference</Badge>,preprint:<Badge color="gray">Preprint</Badge>,dataset:<Badge color="gray">Dataset</Badge>})[t]||<Badge color="gray">{t}</Badge>;

  return (
    <div style={{padding:"28px 24px",maxWidth:1200}}>
      <PageHeader title="🔬 Journal & Research Finder" subtitle="Search open access journals, articles, theses and academic papers from global and African repositories"/>

      {/* Search Panel */}
      <Card style={{padding:"20px",marginBottom:20}}>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <div style={{flex:1,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,color:C.muted}}>🔍</span>
            <input
              value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doSearch()}
              placeholder="Enter title, keyword, author, DOI, or topic — e.g. 'climate change Nigeria agriculture 2020'"
              style={{width:"100%",padding:"11px 14px 11px 40px",border:`2px solid ${C.primary}`,borderRadius:9,fontSize:".92em",color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"Inter,system-ui,sans-serif"}}
            />
          </div>
          <Btn size="lg" onClick={doSearch} disabled={loading||!query.trim()} icon={loading?"":"🔍"}>
            {loading?<><div style={{width:15,height:15,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .8s linear infinite"}}/>Searching…</>:"Search"}
          </Btn>
        </div>

        {/* Filters row */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",gap:6}}>
            {[{id:"all",label:"All Resources"},{id:"oa",label:"Open Access Only"},{id:"journal",label:"Journal Articles"},{id:"thesis",label:"Theses"},{id:"book",label:"Books"}].map(t=>(
              <button key={t.id} onClick={()=>setSearchType(t.id)}
                style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${searchType===t.id?C.primary:C.border}`,background:searchType===t.id?`${C.primary}10`:C.bg,color:searchType===t.id?C.primary:C.muted,fontSize:".75em",fontWeight:searchType===t.id?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>
                {t.label}
              </button>
            ))}
          </div>
          <select value={discipline} onChange={e=>setDiscipline(e.target.value)}
            style={{padding:"5px 10px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".8em",color:discipline?C.text:C.muted,background:C.card,outline:"none"}}>
            {DISCIPLINES.map(d=><option key={d} value={d}>{d||"All Disciplines"}</option>)}
          </select>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <input value={yearFrom} onChange={e=>setYearFrom(e.target.value)} placeholder="From year" style={{width:80,padding:"5px 8px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".8em",outline:"none"}}/>
            <span style={{color:C.muted,fontSize:".8em"}}>–</span>
            <input value={yearTo} onChange={e=>setYearTo(e.target.value)} placeholder="To year" style={{width:80,padding:"5px 8px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:".8em",outline:"none"}}/>
          </div>
        </div>

        {/* Source badges */}
        <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:".7em",color:C.muted,fontWeight:600}}>Searches:</span>
          {["DOAJ","PubMed Central","arXiv","SSRN","AJOL","AfricArXiv","CORE","Semantic Scholar","Unpaywall","Google Scholar","OpenDOAR","BASE"].map(s=>(
            <span key={s} style={{fontSize:".67em",padding:"2px 8px",borderRadius:10,background:["AJOL","AfricArXiv"].includes(s)?`${C.success}15`:`${C.primary}10`,color:["AJOL","AfricArXiv"].includes(s)?C.success:C.primary,fontWeight:600,border:`1px solid ${["AJOL","AfricArXiv"].includes(s)?C.success+"30":C.primary+"25"}`}}>{s}</span>
          ))}
        </div>
      </Card>

      {/* History */}
      {history.length>0&&!results&&(
        <Card style={{padding:"14px 18px",marginBottom:16}}>
          <div style={{fontSize:".75em",color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Recent Searches</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {history.map((h,i)=>(
              <button key={i} onClick={()=>{setQuery(h.query);setSearchType(h.type);setDiscipline(h.discipline);}}
                style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bg,fontSize:".75em",color:C.muted,cursor:"pointer"}}>
                🕐 {h.query}
              </button>
            ))}
          </div>
        </Card>
      )}

      {error&&<div style={{padding:"12px 16px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:8,marginBottom:16,fontSize:".85em",color:"#92400E"}}>⚠️ {error}</div>}

      {/* Results */}
      {results&&(
        <div ref={resultRef}>
          {/* Summary bar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div>
              <span style={{fontWeight:700,color:C.text,fontSize:".95em"}}>{results.total_found} results</span>
              <span style={{color:C.muted,fontSize:".85em"}}> for "{query}"</span>
              {results.open_access_count>0&&<span style={{marginLeft:10,fontSize:".75em",background:"#DCFCE7",color:C.success,border:"1px solid rgba(22,163,74,.25)",borderRadius:10,padding:"2px 10px",fontWeight:700}}>🔓 {results.open_access_count} open access</span>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn size="sm" variant="secondary" onClick={()=>{setResults(null);setQuery("");}}>New Search</Btn>
              {saveList.length>0&&<Btn size="sm" variant="secondary" icon="📋">{saveList.length} saved</Btn>}
            </div>
          </div>

          {/* Databases searched */}
          {results.databases_searched&&(
            <div style={{fontSize:".72em",color:C.muted,marginBottom:14}}>
              Searched: {results.databases_searched.join(" · ")}
            </div>
          )}

          {/* Resource cards */}
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {results.resources?.map((r,i)=>(
              <Card key={i} style={{padding:"0",border:r.access==="open_access"?`1px solid ${C.success}30`:undefined}}>
                <div style={{padding:"16px 18px"}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:36,height:36,borderRadius:8,background:r.access==="open_access"?`${C.success}15`:`${C.primary}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                      {r.type==="thesis"?"🎓":r.type==="book"?"📕":r.type==="conference_paper"?"🏛️":"📄"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6,alignItems:"center"}}>
                        {accessBadge(r.access)}
                        {typeBadge(r.type)}
                        {r.african_content&&<Badge color="green">🌍 African Content</Badge>}
                        {r.full_text_available&&<span style={{fontSize:".67em",background:"#EFF6FF",color:C.primary,border:`1px solid ${C.primary}25`,borderRadius:10,padding:"2px 8px",fontWeight:600}}>Full Text</span>}
                        {r.open_access_repository&&<span style={{fontSize:".67em",background:C.bg,color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"2px 8px"}}>{r.open_access_repository}</span>}
                      </div>
                      <div style={{fontWeight:700,color:C.text,fontSize:".95em",marginBottom:4,lineHeight:1.35}}>{r.title}</div>
                      <div style={{fontSize:".8em",color:C.muted,marginBottom:6}}>{r.authors}{r.year?` · ${r.year}`:""}{r.source?` · ${r.source}`:""}</div>
                      {r.abstract&&<div style={{fontSize:".8em",color:C.text,lineHeight:1.6,marginBottom:8}}>{r.abstract}</div>}
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                        {r.doi&&<span style={{fontSize:".72em",fontFamily:"monospace",color:C.muted}}>DOI: {r.doi}</span>}
                        {r.citations!=null&&<span style={{fontSize:".72em",color:C.muted}}>📊 {r.citations} citations</span>}
                        {r.impact_factor&&r.impact_factor!=="N/A"&&<span style={{fontSize:".72em",color:C.muted}}>IF: {r.impact_factor}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                      {(r.url||r.doi)&&(
                        <Btn size="sm" icon="🔗" onClick={()=>window.open(r.url||(r.doi?`https://doi.org/${r.doi}`:""),r.url?"_blank":"")}>
                          {r.full_text_available?"Read Full Text":"View"}
                        </Btn>
                      )}
                      <Btn size="sm" variant="secondary" onClick={()=>setSelected(r)}>Details</Btn>
                      <Btn size="sm" variant="ghost" icon={saveList.find(s=>s.id===r.id)?"✓":"+"} onClick={()=>setSaveList(l=>l.find(s=>s.id===r.id)?l.filter(s=>s.id!==r.id):[...l,r])}>
                        {saveList.find(s=>s.id===r.id)?"Saved":"Save"}
                      </Btn>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Related searches */}
          {results.suggestions?.length>0&&(
            <Card style={{padding:"16px 18px"}}>
              <div style={{fontSize:".75em",color:C.muted,fontWeight:600,textTransform:"uppercase",marginBottom:10}}>Related Searches</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {results.suggestions.map((s,i)=>(
                  <button key={i} onClick={()=>{setQuery(s);setTimeout(doSearch,100);}}
                    style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${C.primary}30`,background:`${C.primary}08`,color:C.primary,fontSize:".78em",fontWeight:500,cursor:"pointer"}}>
                    🔍 {s}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected&&(
        <Modal title="Resource Details" onClose={()=>setSelected(null)} width={620}>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              {accessBadge(selected.access)}{typeBadge(selected.type)}
              {selected.african_content&&<Badge color="green">🌍 African Content</Badge>}
              {selected.full_text_available&&<span style={{fontSize:".72em",background:"#EFF6FF",color:C.primary,border:`1px solid ${C.primary}25`,borderRadius:10,padding:"2px 10px",fontWeight:600}}>Full Text Available</span>}
            </div>
            <h2 style={{fontSize:"1.05em",fontWeight:700,color:C.text,marginBottom:8,lineHeight:1.4}}>{selected.title}</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,fontSize:".82em"}}>
            {[["Authors",selected.authors],["Year",selected.year],["Source/Journal",selected.source],["Language",selected.language],["DOI",selected.doi||"—"],["Citations",selected.citations!=null?selected.citations:"—"],["Impact Factor",selected.impact_factor||"—"],["Repository",selected.open_access_repository||"—"]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:7,padding:"8px 12px"}}>
                <div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:2}}>{k}</div>
                <div style={{color:C.text,fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
          {selected.abstract&&(
            <div style={{background:C.bg,borderRadius:7,padding:"10px 12px",marginBottom:14,fontSize:".82em"}}>
              <div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:4}}>Abstract</div>
              <div style={{color:C.text,lineHeight:1.65}}>{selected.abstract}</div>
            </div>
          )}
          {selected.keywords?.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{color:C.muted,fontSize:".7em",textTransform:"uppercase",marginBottom:6}}>Keywords</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {selected.keywords.map((k,i)=><span key={i} style={{padding:"3px 10px",borderRadius:12,background:`${C.primary}10`,color:C.primary,fontSize:".75em",border:`1px solid ${C.primary}25`}}>{k}</span>)}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {(selected.url||selected.doi)&&<Btn icon="🔗" onClick={()=>window.open(selected.url||(selected.doi?`https://doi.org/${selected.doi}`:""),"_blank")}>{selected.full_text_available?"Read Full Text":"View Online"}</Btn>}
            <Btn variant="secondary" icon="📥" onClick={()=>window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(selected.title)}`,"_blank")}>Google Scholar</Btn>
            <Btn variant="secondary" icon={saveList.find(s=>s.id===selected.id)?"✓":"+"} onClick={()=>setSaveList(l=>l.find(s=>s.id===selected.id)?l.filter(s=>s.id!==selected.id):[...l,selected])}>
              {saveList.find(s=>s.id===selected.id)?"Saved to List":"Save to Reading List"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Empty state */}
      {!results&&!loading&&(
        <div style={{textAlign:"center",padding:"48px 32px",background:C.card,border:`1px solid ${C.border}`,borderRadius:14}}>
          <div style={{fontSize:52,marginBottom:16}}>🔬</div>
          <div style={{fontWeight:700,fontSize:"1.1em",color:C.text,marginBottom:8}}>Search Academic Resources Worldwide</div>
          <div style={{color:C.muted,fontSize:".88em",maxWidth:520,margin:"0 auto 24px",lineHeight:1.7}}>
            Enter a title, keyword, author name, or topic to search open access journals, articles, theses and books from DOAJ, PubMed Central, arXiv, AJOL, AfricArXiv, SSRN and more.
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {["climate change Nigeria","petroleum engineering Niger Delta","COVID-19 Africa health","machine learning agriculture","constitutional law Nigeria","LCSH library cataloguing"].map(s=>(
              <button key={s} onClick={()=>setQuery(s)} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bg,color:C.muted,fontSize:".78em",cursor:"pointer",fontFamily:"Inter,system-ui,sans-serif"}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SETTINGS  (fully interactive)
// ═══════════════════════════════════════════════════════════
function SettingsPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [savedMsg, setSavedMsg]   = useState("");
  const [loanRules, setLoanRules] = useState({undergrad:14,postgrad:21,faculty:30,staff:30,public:7,maxRenewals:2,finePerDay:50,maxFine:2500,suspendThreshold:1000,holdsPerPatron:3,gracePeriod:0});
  const [editingRule, setEditingRule] = useState(null);
  const [ruleVal, setRuleVal]         = useState("");
  const [libProfile, setLibProfile]   = useState({...DEMO.library});
  const [staff, setStaff]             = useState([
    {id:1,name:"Adewale Okonkwo",email:"a.okonkwo@unilag.edu.ng",role:"Head Librarian",access:"admin",lastLogin:"2025-06-26",status:"active"},
    {id:2,name:"Dr. Taiwo Oladele",email:"t.oladele@unilag.edu.ng",role:"Staff Librarian",access:"librarian",lastLogin:"2025-06-25",status:"active"},
    {id:3,name:"Ms. Amina Suleiman",email:"a.suleiman@unilag.edu.ng",role:"Circulation Librarian",access:"circulation",lastLogin:"2025-06-26",status:"active"},
    {id:4,name:"Mr. Tunde Bakare",email:"t.bakare@unilag.edu.ng",role:"Cataloguer",access:"catalogue",lastLogin:"2025-06-24",status:"active"},
  ]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff]             = useState({name:"",email:"",role:"",access:"librarian"});
  const [branches, setBranches]             = useState([
    {id:1,name:"Main Library",location:"Akoka Campus",items:10247,active:true,head:"Adewale Okonkwo"},
    {id:2,name:"Medical Branch",location:"College of Medicine",items:2600,active:true,head:"Dr. Adaeze Nwosu"},
  ]);
  const [notifTemplates, setNotifTemplates] = useState({
    overdue:`Dear {patron_name},\n\nThis is a reminder that the following item is overdue:\n\nTitle: {book_title}\nDue Date: {due_date}\nDays Overdue: {days_overdue}\nFine Accrued: ₦{fine_amount}\n\nPlease return or renew the item as soon as possible to avoid further fines.\n\nRegards,\n{library_name}`,
    holdReady:`Dear {patron_name},\n\nGood news! The item you placed on hold is now available for collection:\n\nTitle: {book_title}\nAvailable Until: {hold_expiry}\nPickup Location: {branch_name}\n\nPlease collect within 5 working days.\n\nRegards,\n{library_name}`,
    expiry:`Dear {patron_name},\n\nYour library membership is due to expire on {expiry_date}.\n\nTo continue enjoying library services, please renew your membership at the library help desk or online portal.\n\nRegards,\n{library_name}`,
  });
  const [selectedTemplate, setSelectedTemplate] = useState("overdue");

  const save = (label) => { setSavedMsg(`✅ ${label} saved`); setTimeout(()=>setSavedMsg(""),3000); };

  const saveRule = () => {
    if (!editingRule||!ruleVal) return;
    setLoanRules(r=>({...r,[editingRule]:parseInt(ruleVal)||parseFloat(ruleVal)||ruleVal}));
    setEditingRule(null); setRuleVal(""); save("Loan rule");
  };

  const addStaff = () => {
    if (!newStaff.name||!newStaff.email) return;
    setStaff(prev=>[...prev,{...newStaff,id:prev.length+1,lastLogin:"Never",status:"active"}]);
    setNewStaff({name:"",email:"",role:"",access:"librarian"});
    setShowStaffModal(false); save("Staff account");
  };

  const tabs = [
    {id:"library",icon:"🏛️",label:"Library"},
    {id:"staff",icon:"👤",label:"Staff"},
    {id:"loan_rules",icon:"📋",label:"Loan Rules"},
    {id:"notifications",icon:"📧",label:"Notifications"},
    {id:"branches",icon:"🏢",label:"Branches"},
    {id:"migration",icon:"🔁",label:"Migration"},
    {id:"z3950",icon:"🔗",label:"Z39.50"},
    {id:"plan",icon:"💳",label:"Plan"},
  ];

  return (
    <div style={{padding:"28px 24px",maxWidth:1100}}>
      <PageHeader title="⚙️ Settings" subtitle="Configure your library's LISAR LMS"/>
      {savedMsg&&<div style={{marginBottom:14,padding:"9px 14px",background:`${C.success}10`,border:`1px solid ${C.success}30`,borderRadius:8,fontSize:".82em",color:C.success}}>{savedMsg}</div>}

      {/* Tab bar */}
      <div style={{display:"flex",gap:0,marginBottom:20,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:"10px 6px",border:"none",borderBottom:`2px solid ${activeTab===t.id?C.primary:"transparent"}`,background:activeTab===t.id?`${C.primary}0A`:"transparent",color:activeTab===t.id?C.primary:C.muted,fontWeight:activeTab===t.id?700:400,fontSize:".72em",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,whiteSpace:"nowrap"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* LIBRARY PROFILE */}
      {activeTab==="library"&&(
        <Card style={{padding:"24px"}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:16,fontSize:".95em"}}>🏛️ Library Profile</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            <div style={{gridColumn:"1/-1"}}><Input label="Library Name" value={libProfile.name} onChange={v=>setLibProfile(p=>({...p,name:v}))}/></div>
            <div style={{paddingRight:8}}><Input label="Email" value={libProfile.email} onChange={v=>setLibProfile(p=>({...p,email:v}))}/></div>
            <div style={{paddingLeft:8}}><Input label="Phone" value={libProfile.phone} onChange={v=>setLibProfile(p=>({...p,phone:v}))}/></div>
            <div style={{gridColumn:"1/-1"}}><Input label="Address" value={libProfile.address} onChange={v=>setLibProfile(p=>({...p,address:v}))}/></div>
            <div style={{paddingRight:8}}><Select label="Library Type" value={libProfile.type.toLowerCase()} onChange={v=>setLibProfile(p=>({...p,type:v}))} options={["Academic","Public","School","Special","National"].map(v=>({value:v.toLowerCase(),label:v}))}/></div>
            <div style={{paddingLeft:8}}><Select label="Country" value="nigeria" onChange={()=>{}} options={[{value:"nigeria",label:"Nigeria"},{value:"ghana",label:"Ghana"},{value:"kenya",label:"Kenya"},{value:"south_africa",label:"South Africa"},{value:"other",label:"Other"}]}/></div>
            <div style={{paddingRight:8}}><Input label="Website" value="" onChange={()=>{}} placeholder="https://library.institution.edu"/></div>
            <div style={{paddingLeft:8}}><Input label="ISIL Code" value="" onChange={()=>{}} placeholder="e.g. NG-LO-UNI"/></div>
          </div>
          <div style={{marginTop:8}}><Btn onClick={()=>save("Library profile")}>Save Changes</Btn></div>
        </Card>
      )}

      {/* STAFF */}
      {activeTab==="staff"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>Staff Accounts ({staff.length})</div>
              <Btn size="sm" icon="➕" onClick={()=>setShowStaffModal(true)}>Add Staff</Btn>
            </div>
            <Table cols={["Name","Email","Role","Access Level","Last Login","Status","Action"]}
              rows={staff.map(s=>({cells:[
                <div style={{fontWeight:600,fontSize:".88em"}}>{s.name}</div>,
                <span style={{fontSize:".8em"}}>{s.email}</span>,
                <span style={{fontSize:".8em"}}>{s.role}</span>,
                <Badge color={s.access==="admin"?"purple":s.access==="librarian"?"blue":"gray"}>{s.access}</Badge>,
                <span style={{fontSize:".78em",color:C.muted}}>{s.lastLogin}</span>,
                s.status==="active"?<Badge color="green">Active</Badge>:<Badge color="gray">Inactive</Badge>,
                <div style={{display:"flex",gap:4}}>
                  <Btn size="sm" variant="secondary">Edit</Btn>
                  <Btn size="sm" variant="ghost" onClick={()=>setStaff(prev=>prev.map(x=>x.id===s.id?{...x,status:x.status==="active"?"inactive":"active"}:x))}>{s.status==="active"?"Deactivate":"Activate"}</Btn>
                </div>
              ]}))}/>
          </Card>
          <Card style={{padding:"18px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>🔒 Access Level Permissions</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:".78em"}}>
                <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                  {["Permission","Admin","Librarian","Circulation","Catalogue"].map((h,i)=><th key={i} style={{padding:"8px 12px",textAlign:i===0?"left":"center",color:C.muted,fontWeight:600}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[["Catalogue items","✅","✅","❌","✅"],["Manage patrons","✅","✅","✅","❌"],["Process loans","✅","✅","✅","❌"],["Manage staff","✅","❌","❌","❌"],["View reports","✅","✅","❌","❌"],["Edit settings","✅","❌","❌","❌"],["Manage acquisitions","✅","✅","❌","❌"]].map((r,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                      {r.map((c,j)=><td key={j} style={{padding:"8px 12px",textAlign:j===0?"left":"center",color:j===0?C.text:C.text}}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {showStaffModal&&(
            <Modal title="Add Staff Account" onClose={()=>setShowStaffModal(false)} width={460}>
              <Input label="Full Name" value={newStaff.name} onChange={v=>setNewStaff(s=>({...s,name:v}))} placeholder="Firstname Surname" required/>
              <Input label="Email" value={newStaff.email} onChange={v=>setNewStaff(s=>({...s,email:v}))} placeholder="email@institution.edu" required/>
              <Input label="Role / Title" value={newStaff.role} onChange={v=>setNewStaff(s=>({...s,role:v}))} placeholder="e.g. Circulation Librarian"/>
              <Select label="Access Level" value={newStaff.access} onChange={v=>setNewStaff(s=>({...s,access:v}))} options={[{value:"admin",label:"Admin — full access"},{value:"librarian",label:"Librarian — catalogue & patrons"},{value:"circulation",label:"Circulation — loans & returns"},{value:"catalogue",label:"Catalogue — items only"}]}/>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <Btn full onClick={addStaff} disabled={!newStaff.name||!newStaff.email}>Create Account</Btn>
                <Btn full variant="secondary" onClick={()=>setShowStaffModal(false)}>Cancel</Btn>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* LOAN RULES */}
      {activeTab==="loan_rules"&&(
        <Card style={{padding:"24px"}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:4,fontSize:".95em"}}>📋 Loan Rules & Fine Policy</div>
          <div style={{fontSize:".78em",color:C.muted,marginBottom:16}}>These rules apply globally across all branches. Click Edit to change a value.</div>
          {[
            {key:"undergrad",label:"Undergraduate Loan Period",unit:"days",desc:"Days before item is due for undergraduate patrons"},
            {key:"postgrad",label:"Postgraduate Loan Period",unit:"days",desc:"Days before item is due for postgraduate patrons"},
            {key:"faculty",label:"Faculty Loan Period",unit:"days",desc:"Days before item is due for faculty members"},
            {key:"staff",label:"Staff Loan Period",unit:"days",desc:"Days before item is due for staff"},
            {key:"public",label:"Public / Guest Loan Period",unit:"days",desc:"Days before item is due for public patrons"},
            {key:"maxRenewals",label:"Maximum Renewals",unit:"renewals",desc:"Maximum number of times a loan can be renewed"},
            {key:"finePerDay",label:"Fine Per Overdue Day",unit:"₦",desc:"Amount charged per day an item is overdue"},
            {key:"maxFine",label:"Maximum Fine",unit:"₦",desc:"The fine cap per loan before further accrual stops"},
            {key:"suspendThreshold",label:"Suspension Threshold",unit:"₦",desc:"Fine amount that triggers automatic patron suspension"},
            {key:"holdsPerPatron",label:"Holds Per Patron",unit:"holds",desc:"Maximum simultaneous holds a patron can place"},
            {key:"gracePeriod",label:"Grace Period",unit:"days",desc:"Days after due date before fines begin accruing"},
          ].map((r,i)=>(
            <div key={r.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<10?`1px solid ${C.border}`:""}}>
              <div>
                <div style={{fontSize:".85em",color:C.text,fontWeight:500}}>{r.label}</div>
                <div style={{fontSize:".72em",color:C.muted,marginTop:1}}>{r.desc}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {editingRule===r.key?(
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input value={ruleVal} onChange={e=>setRuleVal(e.target.value)} autoFocus
                      style={{width:70,padding:"5px 8px",border:`1px solid ${C.primary}`,borderRadius:6,fontSize:".85em",outline:"none",textAlign:"center"}}
                      onKeyDown={e=>e.key==="Enter"&&saveRule()}/>
                    <span style={{fontSize:".75em",color:C.muted}}>{r.unit}</span>
                    <Btn size="sm" onClick={saveRule}>Save</Btn>
                    <Btn size="sm" variant="ghost" onClick={()=>setEditingRule(null)}>✕</Btn>
                  </div>
                ):(
                  <>
                    <span style={{fontWeight:700,color:C.primary,fontSize:".9em"}}>{r.unit==="₦"?"₦":""}{loanRules[r.key]}{r.unit!=="₦"?" "+r.unit:""}</span>
                    <Btn size="sm" variant="ghost" onClick={()=>{setEditingRule(r.key);setRuleVal(String(loanRules[r.key]));}}>Edit</Btn>
                  </>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* NOTIFICATIONS */}
      {activeTab==="notifications"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>📧 Notification Settings</div>
            {[{label:"Send overdue notices",val:true},{label:"Send hold-ready alerts",val:true},{label:"Send membership expiry reminders",val:true},{label:"Send new item alerts (by subject)",val:false},{label:"Send weekly digest to head librarian",val:true}].map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<4?`1px solid ${C.border}`:""}}>
                <span style={{fontSize:".85em",color:C.text}}>{s.label}</span>
                <div style={{width:40,height:22,borderRadius:11,background:s.val?C.primary:C.border,position:"relative",cursor:"pointer",transition:"background .2s"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:s.val?20:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                </div>
              </div>
            ))}
          </Card>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:4}}>✏️ Email Templates</div>
            <div style={{fontSize:".72em",color:C.muted,marginBottom:12}}>Use {"{patron_name}"}, {"{book_title}"}, {"{due_date}"}, {"{days_overdue}"}, {"{fine_amount}"}, {"{library_name}"} as placeholders</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[{id:"overdue",l:"Overdue Notice"},{id:"holdReady",l:"Hold Ready"},{id:"expiry",l:"Membership Expiry"}].map(t=>(
                <button key={t.id} onClick={()=>setSelectedTemplate(t.id)} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${selectedTemplate===t.id?C.primary:C.border}`,background:selectedTemplate===t.id?`${C.primary}10`:"transparent",color:selectedTemplate===t.id?C.primary:C.muted,fontSize:".78em",fontWeight:selectedTemplate===t.id?700:400,cursor:"pointer"}}>
                  {t.l}
                </button>
              ))}
            </div>
            <textarea value={notifTemplates[selectedTemplate]} onChange={e=>setNotifTemplates(t=>({...t,[selectedTemplate]:e.target.value}))}
              style={{width:"100%",height:180,padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".82em",color:C.text,resize:"vertical",outline:"none",fontFamily:"monospace",boxSizing:"border-box",lineHeight:1.6}}/>
            <div style={{marginTop:10,display:"flex",gap:8}}>
              <Btn onClick={()=>save("Email template")}>Save Template</Btn>
              <Btn variant="secondary">Preview</Btn>
              <Btn variant="secondary">Send Test Email</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* BRANCHES */}
      {activeTab==="branches"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>Branch Libraries ({branches.length})</div>
              <Btn size="sm" icon="➕" onClick={()=>alert("Add branch coming soon")}>Add Branch</Btn>
            </div>
            <Table cols={["Branch Name","Location","Items","Branch Head","Status","Action"]}
              rows={branches.map(b=>({cells:[
                <div style={{fontWeight:600,fontSize:".88em"}}>{b.name}</div>,
                b.location,
                <span style={{fontWeight:700,color:C.primary}}>{b.items.toLocaleString()}</span>,
                b.head,
                b.active?<Badge color="green">Active</Badge>:<Badge color="gray">Inactive</Badge>,
                <div style={{display:"flex",gap:4}}><Btn size="sm" variant="secondary">Edit</Btn><Btn size="sm" variant="ghost">View Stats</Btn></div>
              ]}))}/>
          </Card>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:4}}>🔀 Inter-Branch Item Transfer</div>
            <div style={{fontSize:".78em",color:C.muted,marginBottom:12}}>Transfer items between branches with full audit trail</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <Select label="From Branch" value="" onChange={()=>{}} options={[{value:"",label:"Select branch…"},...branches.map(b=>({value:String(b.id),label:b.name}))]}/>
              <Select label="To Branch" value="" onChange={()=>{}} options={[{value:"",label:"Select branch…"},...branches.map(b=>({value:String(b.id),label:b.name}))]}/>
              <Input label="Item Barcode" value="" onChange={()=>{}} placeholder="Scan barcode…"/>
            </div>
            <Btn>Initiate Transfer</Btn>
          </Card>
        </div>
      )}

      {/* MIGRATION */}
      {activeTab==="migration"&&(
        <Card style={{padding:"20px"}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:4,fontSize:".95em"}}>🔁 Migrate From Another System</div>
          <div style={{fontSize:".82em",color:C.muted,marginBottom:16}}>Import your existing library catalogue and patron data into LISAR LMS</div>
          {[
            {icon:"📄",name:"MARC 21 (.mrc / .xml / .mrk)",desc:"Import from Koha, Millennium, Symphony, Virtua, WinISIS"},
            {icon:"📊",name:"CSV Spreadsheet",desc:"Patron data, item lists, loan history from any system"},
            {icon:"🗃️",name:"Librarika Export",desc:"Direct import from Librarika JSON/CSV backup files"},
            {icon:"📋",name:"Dublin Core XML",desc:"Import from DSpace, EPrints, Omeka, Greenstone"},
            {icon:"📚",name:"Koha Direct Export",desc:"Import Koha .sql or .csv catalogue and patron exports"},
            {icon:"🔗",name:"Z39.50 Harvest",desc:"Harvest records from remote library catalogues — see Z39.50 tab"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"12px",border:`1px solid ${C.border}`,borderRadius:9,marginBottom:8,alignItems:"center"}}>
              <span style={{fontSize:24}}>{s.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:".85em",color:C.text}}>{s.name}</div>
                <div style={{fontSize:".75em",color:C.muted}}>{s.desc}</div>
              </div>
              <Btn size="sm" variant="secondary">Import</Btn>
            </div>
          ))}
        </Card>
      )}

      {/* Z39.50 */}
      {activeTab==="z3950"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:4}}>🔗 Z39.50 Client</div>
            <div style={{fontSize:".78em",color:C.muted,marginBottom:14}}>Search and harvest records directly from remote library catalogues using the Z39.50 protocol</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <Select label="Target Server" value="" onChange={()=>{}} options={[
                {value:"",label:"Select Z39.50 server…"},
                {value:"loc",label:"Library of Congress (lx2.loc.gov:210)"},
                {value:"oclc",label:"OCLC WorldCat (zcat.oclc.org:210)"},
                {value:"bl",label:"British Library (z3950cat.bl.uk:9909)"},
                {value:"nlm",label:"NLM / PubMed (locatorplus.gov:210)"},
                {value:"custom",label:"Custom Server…"},
              ]}/>
              <Input label="Search Query" value="" onChange={()=>{}} placeholder="ISBN, title, or author…"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              <Select label="Search By" value="isbn" onChange={()=>{}} options={[{value:"isbn",label:"ISBN"},{value:"title",label:"Title"},{value:"author",label:"Author"},{value:"subject",label:"Subject"}]}/>
              <Input label="Max Records" value="10" onChange={()=>{}} type="number"/>
              <Select label="Record Syntax" value="marc21" onChange={()=>{}} options={[{value:"marc21",label:"MARC 21"},{value:"dc",label:"Dublin Core"},{value:"sutrs",label:"SUTRS"}]}/>
            </div>
            <Btn icon="🔍">Search Remote Catalogue</Btn>
            <div style={{marginTop:16,padding:"14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`,fontSize:".8em",color:C.muted,textAlign:"center"}}>
              Z39.50 results will appear here. Records can be imported directly into the LISAR catalogue.
            </div>
          </Card>
          <Card style={{padding:"20px"}}>
            <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>🌐 Configured Z39.50 Servers</div>
            <Table cols={["Server Name","Host","Port","Database","Status"]}
              rows={[
                {cells:["Library of Congress","lx2.loc.gov","210","Voyager",<Badge color="green">Connected</Badge>]},
                {cells:["OCLC WorldCat","zcat.oclc.org","210","WorldCat",<Badge color="yellow">Auth Required</Badge>]},
                {cells:["British Library","z3950cat.bl.uk","9909","BLPC",<Badge color="green">Connected</Badge>]},
              ]}/>
            <div style={{marginTop:12}}><Btn size="sm" variant="secondary" icon="➕">Add Server</Btn></div>
          </Card>
        </div>
      )}

      {/* PLAN */}
      {activeTab==="plan"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{padding:"24px"}}>
            <div style={{fontWeight:700,color:C.text,marginBottom:16,fontSize:".95em"}}>💳 Current Plan</div>
            <div style={{display:"flex",gap:16,alignItems:"center",padding:"16px",background:`${C.primary}0A`,border:`1px solid ${C.primary}25`,borderRadius:10,marginBottom:20}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,color:C.primary,fontSize:"1.1em"}}>Professional Plan</div>
                <div style={{fontSize:".8em",color:C.muted,marginTop:2}}>Unlimited items · 10 staff · All modules</div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:"1.3em",color:C.text}}>$35</div><div style={{fontSize:".72em",color:C.muted}}>/month</div></div>
            </div>
            {[["Items in Catalogue","8,432 / Unlimited","100%"],["Staff Accounts","4 / 10","40%"],["Storage Used","2.3 GB / 50 GB","5%"],["Branches","2 / 5","40%"],["API Calls (Month)","12,847 / Unlimited","—"]].map(([k,v,pct])=>(
              <div key={k} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:".84em",marginBottom:4}}>
                  <span style={{color:C.muted}}>{k}</span><span style={{fontWeight:600,color:C.text}}>{v}</span>
                </div>
                {pct!=="—"&&<div style={{height:4,background:C.border,borderRadius:10,overflow:"hidden"}}><div style={{height:"100%",width:pct,background:C.primary,borderRadius:10}}/></div>}
              </div>
            ))}
            <div style={{marginTop:16,display:"flex",gap:8}}>
              <Btn variant="secondary">Upgrade to Enterprise</Btn>
              <Btn variant="ghost">View Invoice History</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

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
    <div className="mobile-nav" style={{position:"fixed",bottom:0,left:0,right:0,background:"#0F172A",borderTop:"1px solid rgba(255,255,255,.1)",zIndex:100,justifyContent:"space-around",padding:"6px 0 10px"}}>
      {items.map(n=>(
        <button key={n.id} onClick={()=>setPage(n.id)}
          style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 8px",cursor:"pointer",color:page===n.id?"#60A5FA":"#64748B",minWidth:52}}>
          <span style={{fontSize:18}}>{n.icon}</span>
          <span style={{fontSize:".58em",fontWeight:page===n.id?700:400}}>{n.label}</span>
        </button>
      ))}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════
//  CHAT PAGE — Staff Chat, Patron Chat, AI Assistant,
//              Suggestions & Support
// ═══════════════════════════════════════════════════════════
function ChatPage() {
  const [tab, setTab] = useState("ai");

  const tabs = [
    { id:"ai",          icon:"🤖", label:"AI Assistant"  },
    { id:"staff",       icon:"👥", label:"Staff Chat"     },
    { id:"patron",      icon:"📚", label:"Patron Chat"    },
    { id:"suggestions", icon:"💡", label:"Suggestions"    },
    { id:"support",     icon:"🎫", label:"Support"        },
  ];

  return (
    <div style={{padding:"28px 24px",maxWidth:1100}}>
      <PageHeader title="💬 Chat & Support" subtitle="Staff messaging, patron collaboration, AI assistant, suggestions and help desk"/>

      {/* Tab bar */}
      <div style={{display:"flex",gap:0,marginBottom:20,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"12px 8px",border:"none",borderBottom:`2px solid ${tab===t.id?C.primary:"transparent"}`,
              background:tab===t.id?`${C.primary}0A`:"transparent",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:".7em",fontWeight:tab===t.id?700:400,color:tab===t.id?C.primary:C.muted,whiteSpace:"nowrap"}}>{t.label}</span>
          </button>
        ))}
      </div>

      {tab==="ai"          && <AIAssistantTab/>}
      {tab==="staff"       && <StaffChatTab/>}
      {tab==="patron"      && <PatronChatTab/>}
      {tab==="suggestions" && <SuggestionsTab/>}
      {tab==="support"     && <SupportTab/>}
    </div>
  );
}

// ── AI ASSISTANT ────────────────────────────────────────────
function AIAssistantTab() {
  const [messages, setMessages] = useState([
    { role:"assistant", text:"Hi! I'm the LISAR AI Assistant. I can help with cataloguing, classification, reference questions, research guidance, library policy, and more. What do you need help with?" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m=>[...m,{role:"user",text:userMsg}]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system:`You are the LISAR LMS AI Assistant — an expert library assistant built into the LISAR Library Management System. You help librarians and patrons with:
- Cataloguing and classification (DDC, LCC, LCSH, MARC 21, Dublin Core, RDA)
- Reference and research questions
- Library policy and best practices
- Book recommendations and subject guidance
- ILL and acquisitions advice
- Nigerian library context (NLA, academic libraries, university libraries)
Be concise, professional and helpful. Use bullet points where appropriate.`,
          messages: [
            ...messages.filter(m=>m.role!=="assistant"||messages.indexOf(m)>0).map(m=>({role:m.role,content:m.text})),
            {role:"user",content:userMsg}
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==="text")?.text || "Sorry, I couldn't generate a response.";
      setMessages(m=>[...m,{role:"assistant",text:reply}]);
    } catch {
      setMessages(m=>[...m,{role:"assistant",text:"⚠️ Connection error. Please check your internet and try again."}]);
    }
    setLoading(false);
  };

  return (
    <Card style={{display:"flex",flexDirection:"column",height:520}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:20}}>🤖</span>
        <div>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>LISAR AI Assistant</div>
          <div style={{fontSize:".7em",color:C.success}}>● Online</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:10,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            {m.role==="assistant"&&<div style={{width:32,height:32,borderRadius:"50%",background:`${C.primary}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🤖</div>}
            <div style={{maxWidth:"75%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
              background:m.role==="user"?C.primary:C.bg,color:m.role==="user"?"#fff":C.text,
              fontSize:".84em",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
              {m.text}
            </div>
            {m.role==="user"&&<div style={{width:32,height:32,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".72em",fontWeight:700,flexShrink:0}}>ME</div>}
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:`${C.primary}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
            <div style={{padding:"10px 14px",background:C.bg,borderRadius:"14px 14px 14px 4px",display:"flex",gap:4,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce 1s ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions */}
      <div style={{padding:"8px 16px",display:"flex",gap:6,flexWrap:"wrap",borderTop:`1px solid ${C.border}`}}>
        {["How do I catalogue a journal?","What is the DDC for Computer Science?","Explain MARC 21 fields","ILL request process"].map(s=>(
          <button key={s} onClick={()=>setInput(s)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bg,fontSize:".7em",cursor:"pointer",color:C.muted}}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask anything about library science, cataloguing, research…"
          style={{flex:1,padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:24,fontSize:".85em",outline:"none",color:C.text}}
          onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        <button onClick={send} disabled={!input.trim()||loading}
          style={{width:42,height:42,borderRadius:"50%",background:input.trim()&&!loading?C.primary:C.border,border:"none",cursor:input.trim()&&!loading?"pointer":"default",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
          ➤
        </button>
      </div>
    </Card>
  );
}

// ── STAFF CHAT ──────────────────────────────────────────────
function StaffChatTab() {
  const [channels] = useState([
    {id:"general",name:"# general",unread:0},
    {id:"cataloguing",name:"# cataloguing",unread:2},
    {id:"circulation",name:"# circulation",unread:0},
    {id:"acquisitions",name:"# acquisitions",unread:1},
    {id:"announcements",name:"📢 announcements",unread:0},
  ]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [allMessages, setAllMessages] = useState({
    general:[
      {id:1,user:"Adewale Okonkwo",avatar:"AO",time:"9:14 AM",text:"Good morning everyone! Reminder: cataloguing of the new batch begins today."},
      {id:2,user:"Dr. Taiwo Oladele",avatar:"TO",time:"9:22 AM",text:"Noted. I'll be at the desk from 10 AM."},
      {id:3,user:"Ms. Amina Suleiman",avatar:"AS",time:"9:45 AM",text:"The circulation desk is set up. Ready for patrons."},
    ],
    cataloguing:[
      {id:1,user:"Mr. Tunde Bakare",avatar:"TB",time:"8:30 AM",text:"I need the DDC schedules for the new Science titles."},
      {id:2,user:"Adewale Okonkwo",avatar:"AO",time:"8:45 AM",text:"Check the 500s section — I've left the schedule on the desk."},
    ],
    circulation:[
      {id:1,user:"Ms. Amina Suleiman",avatar:"AS",time:"10:02 AM",text:"PAT0002 has an overdue item. Should I send a notice?"},
    ],
    acquisitions:[
      {id:1,user:"Adewale Okonkwo",avatar:"AO",time:"Yesterday",text:"New order approved — 5 copies of Modern African Literature Anthology."},
    ],
    announcements:[
      {id:1,user:"Adewale Okonkwo",avatar:"AO",time:"Monday",text:"📢 Library will be closed on Saturday for maintenance. All staff should plan accordingly."},
    ],
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[activeChannel, allMessages]);

  const send = () => {
    if (!input.trim()) return;
    const msg = {id:Date.now(),user:"Adewale Okonkwo",avatar:"AO",time:new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"}),text:input.trim()};
    setAllMessages(m=>({...m,[activeChannel]:[...(m[activeChannel]||[]),msg]}));
    setInput("");
  };

  const messages = allMessages[activeChannel] || [];

  return (
    <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:0,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",height:520}}>
      {/* Sidebar */}
      <div style={{background:C.sidebar,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{fontWeight:700,fontSize:".8em",color:"#94A3B8",textTransform:"uppercase",letterSpacing:".05em"}}>Staff Channels</div>
        </div>
        {channels.map(ch=>(
          <button key={ch.id} onClick={()=>setActiveChannel(ch.id)}
            style={{padding:"10px 12px",border:"none",background:activeChannel===ch.id?"rgba(37,99,235,.25)":"transparent",
              cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:".82em",color:activeChannel===ch.id?"#fff":"#94A3B8",fontWeight:activeChannel===ch.id?600:400}}>{ch.name}</span>
            {ch.unread>0&&<span style={{background:C.danger,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:".65em",fontWeight:700}}>{ch.unread}</span>}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div style={{display:"flex",flexDirection:"column",background:C.card}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:".88em",color:C.text}}>
          {channels.find(c=>c.id===activeChannel)?.name}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          {messages.map(m=>(
            <div key={m.id} style={{display:"flex",gap:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".7em",fontWeight:700,flexShrink:0}}>{m.avatar}</div>
              <div>
                <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:2}}>
                  <span style={{fontWeight:700,fontSize:".84em",color:C.text}}>{m.user}</span>
                  <span style={{fontSize:".7em",color:C.muted}}>{m.time}</span>
                </div>
                <div style={{fontSize:".84em",color:C.text,lineHeight:1.5}}>{m.text}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder={`Message ${channels.find(c=>c.id===activeChannel)?.name}…`}
            style={{flex:1,padding:"9px 14px",border:`1px solid ${C.border}`,borderRadius:24,fontSize:".85em",outline:"none"}}
            onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          <button onClick={send} style={{width:38,height:38,borderRadius:"50%",background:C.primary,border:"none",cursor:"pointer",color:"#fff",fontSize:16}}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ── PATRON CHAT ─────────────────────────────────────────────
function PatronChatTab() {
  const [rooms] = useState([
    {id:"research",name:"📖 Research Corner",desc:"Collaborate on research topics",members:12},
    {id:"postgrad",name:"🎓 Postgraduate Hub",desc:"Postgraduate students discussion",members:8},
    {id:"law",name:"⚖️ Law Students",desc:"Law research and case discussions",members:15},
    {id:"science",name:"🔬 Science & Tech",desc:"STEM discussion and resources",members:21},
    {id:"literature",name:"✍️ Literature Circle",desc:"Books, authors and literary discussion",members:7},
  ]);
  const [activeRoom, setActiveRoom] = useState("research");
  const [allMessages, setAllMessages] = useState({
    research:[
      {id:1,user:"Fatima Al-Amin",avatar:"FA",time:"10:05 AM",text:"Has anyone found good resources on computational linguistics?"},
      {id:2,user:"Yusuf Ibrahim",avatar:"YI",time:"10:12 AM",text:"Check the Journal of Computational Linguistics — we have it in the e-resources section!"},
      {id:3,user:"Fatima Al-Amin",avatar:"FA",time:"10:15 AM",text:"Thank you! Also found Chomsky's Syntactic Structures in the stacks 📚"},
    ],
    postgrad:[
      {id:1,user:"Chukwuemeka Obi",avatar:"CO",time:"9:00 AM",text:"Anyone working on machine learning thesis? Looking to brainstorm."},
    ],
    law:[
      {id:1,user:"Prof. Ngozi Adeyemi",avatar:"NA",time:"Yesterday",text:"Nigerian Constitutional Law 2025 edition is now available at the reference desk."},
    ],
    science:[],
    literature:[
      {id:1,user:"Amaka Nwosu",avatar:"AN",time:"2 days ago",text:"Just finished Things Fall Apart again — what a masterpiece!"},
    ],
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[activeRoom,allMessages]);

  const send = () => {
    if (!input.trim()) return;
    const msg = {id:Date.now(),user:"Adewale Okonkwo",avatar:"AO",time:new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"}),text:input.trim()};
    setAllMessages(m=>({...m,[activeRoom]:[...(m[activeRoom]||[]),msg]}));
    setInput("");
  };

  const messages = allMessages[activeRoom]||[];
  const room = rooms.find(r=>r.id===activeRoom);

  return (
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:0,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",height:520}}>
      {/* Room list */}
      <div style={{background:C.sidebar,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{fontWeight:700,fontSize:".8em",color:"#94A3B8",textTransform:"uppercase",letterSpacing:".05em"}}>Study Rooms</div>
        </div>
        {rooms.map(r=>(
          <button key={r.id} onClick={()=>setActiveRoom(r.id)}
            style={{padding:"10px 12px",border:"none",background:activeRoom===r.id?"rgba(37,99,235,.25)":"transparent",cursor:"pointer",textAlign:"left"}}>
            <div style={{fontSize:".82em",color:activeRoom===r.id?"#fff":"#94A3B8",fontWeight:activeRoom===r.id?600:400}}>{r.name}</div>
            <div style={{fontSize:".65em",color:"#64748B",marginTop:1}}>{r.members} members</div>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div style={{display:"flex",flexDirection:"column",background:C.card}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text}}>{room?.name}</div>
          <div style={{fontSize:".72em",color:C.muted}}>{room?.desc} · {room?.members} members</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          {messages.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
              <div style={{fontSize:32,marginBottom:8}}>💬</div>
              <div style={{fontSize:".85em"}}>No messages yet. Start the conversation!</div>
            </div>
          )}
          {messages.map(m=>(
            <div key={m.id} style={{display:"flex",gap:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:`${C.primary}20`,display:"flex",alignItems:"center",justifyContent:"center",color:C.primary,fontSize:".7em",fontWeight:700,flexShrink:0}}>{m.avatar}</div>
              <div>
                <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:2}}>
                  <span style={{fontWeight:700,fontSize:".84em",color:C.text}}>{m.user}</span>
                  <span style={{fontSize:".7em",color:C.muted}}>{m.time}</span>
                </div>
                <div style={{fontSize:".84em",color:C.text,lineHeight:1.5}}>{m.text}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Share a thought or resource with the group…"
            style={{flex:1,padding:"9px 14px",border:`1px solid ${C.border}`,borderRadius:24,fontSize:".85em",outline:"none"}}
            onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          <button onClick={send} style={{width:38,height:38,borderRadius:"50%",background:C.primary,border:"none",cursor:"pointer",color:"#fff",fontSize:16}}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ── SUGGESTIONS ─────────────────────────────────────────────
function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState([
    {id:1,user:"Dr. Taiwo Oladele",type:"Feature",title:"Bulk MARC import tool",desc:"Allow batch import of MARC records from external sources like OCLC.",status:"under_review",votes:8,date:"2025-06-20"},
    {id:2,user:"Fatima Al-Amin",type:"UI",title:"Dark mode for OPAC",desc:"A dark mode option would be easier on the eyes for long research sessions.",status:"planned",votes:14,date:"2025-06-22"},
    {id:3,user:"Chukwuemeka Obi",type:"Feature",title:"Mobile barcode scanner",desc:"Integrate phone camera as barcode scanner for faster circulation.",status:"in_progress",votes:22,date:"2025-06-25"},
    {id:4,user:"Ms. Amina Suleiman",type:"Integration",title:"SMS notifications",desc:"Send overdue notices via SMS in addition to email.",status:"planned",votes:11,date:"2025-06-28"},
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newSug, setNewSug]     = useState({type:"Feature",title:"",desc:""});
  const [voted, setVoted]       = useState([]);

  const statusBadge = s=>({under_review:<Badge color="yellow">Under Review</Badge>,planned:<Badge color="blue">Planned</Badge>,in_progress:<Badge color="purple">In Progress</Badge>,done:<Badge color="green">Implemented</Badge>})[s]||<Badge color="gray">{s}</Badge>;

  const submit = () => {
    if (!newSug.title||!newSug.desc) return;
    setSuggestions(s=>[{id:Date.now(),user:"Adewale Okonkwo",type:newSug.type,title:newSug.title,desc:newSug.desc,status:"under_review",votes:1,date:new Date().toISOString().split("T")[0]},...s]);
    setNewSug({type:"Feature",title:"",desc:""});
    setShowForm(false);
  };

  const vote = (id) => {
    if (voted.includes(id)) return;
    setSuggestions(s=>s.map(x=>x.id===id?{...x,votes:x.votes+1}:x));
    setVoted(v=>[...v,id]);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:".82em",color:C.muted}}>Submit ideas for LISAR LMS improvements to the development team</div>
        <Btn onClick={()=>setShowForm(true)} icon="💡">New Suggestion</Btn>
      </div>

      {showForm&&(
        <Card style={{padding:"20px",marginBottom:16,border:`1px solid ${C.primary}25`}}>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>Submit a Suggestion</div>
          <Select label="Type" value={newSug.type} onChange={v=>setNewSug(s=>({...s,type:v}))} options={["Feature","UI","Integration","Performance","Bug Fix"].map(v=>({value:v,label:v}))}/>
          <Input label="Title" value={newSug.title} onChange={v=>setNewSug(s=>({...s,title:v}))} placeholder="Short, clear title for your suggestion" required/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:".78em",fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>Description <span style={{color:C.danger}}>*</span></label>
            <textarea value={newSug.desc} onChange={e=>setNewSug(s=>({...s,desc:e.target.value}))} placeholder="Describe your suggestion in detail…" rows={3}
              style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"Inter,system-ui,sans-serif"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={submit} disabled={!newSug.title||!newSug.desc}>Submit Suggestion</Btn>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {suggestions.sort((a,b)=>b.votes-a.votes).map(s=>(
          <Card key={s.id} style={{padding:"16px"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              {/* Vote */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
                <button onClick={()=>vote(s.id)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${voted.includes(s.id)?C.primary:C.border}`,background:voted.includes(s.id)?`${C.primary}10`:"transparent",cursor:voted.includes(s.id)?"default":"pointer",fontSize:16}}>▲</button>
                <span style={{fontWeight:700,color:voted.includes(s.id)?C.primary:C.text,fontSize:".88em"}}>{s.votes}</span>
              </div>
              {/* Content */}
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:".9em",color:C.text}}>{s.title}</span>
                  <Badge color="gray">{s.type}</Badge>
                  {statusBadge(s.status)}
                </div>
                <div style={{fontSize:".82em",color:C.muted,marginBottom:6,lineHeight:1.5}}>{s.desc}</div>
                <div style={{fontSize:".72em",color:C.muted}}>By {s.user} · {s.date}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── SUPPORT ─────────────────────────────────────────────────
function SupportTab() {
  const [tickets, setTickets] = useState([
    {id:"TKT-001",user:"Chukwuemeka Obi",title:"Cannot renew item — system shows max renewals but I've only renewed once",type:"Bug",priority:"High",status:"open",date:"2025-06-28",response:""},
    {id:"TKT-002",user:"Fatima Al-Amin",title:"OPAC search not returning results for ISSN queries",type:"Bug",priority:"Medium",status:"in_progress",date:"2025-06-27",response:"We are investigating this issue."},
    {id:"TKT-003",user:"Ms. Amina Suleiman",title:"Barcode printer labels are misaligned",type:"Technical",priority:"Low",status:"resolved",date:"2025-06-25",response:"Fixed — update label template to 50x25mm and reprint."},
  ]);
  const [showForm, setShowForm]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [newTicket, setNewTicket] = useState({title:"",type:"Bug",priority:"Medium",desc:""});

  const priorityColor = p=>p==="High"?C.danger:p==="Medium"?C.warning:C.muted;
  const statusBadge   = s=>({open:<Badge color="red">Open</Badge>,in_progress:<Badge color="blue">In Progress</Badge>,resolved:<Badge color="green">Resolved</Badge>,closed:<Badge color="gray">Closed</Badge>})[s]||<Badge color="gray">{s}</Badge>;

  const submit = () => {
    if (!newTicket.title||!newTicket.desc) return;
    const id = `TKT-${String(tickets.length+1).padStart(3,"0")}`;
    setTickets(t=>[{id,user:"Adewale Okonkwo",title:newTicket.title,type:newTicket.type,priority:newTicket.priority,status:"open",date:new Date().toISOString().split("T")[0],response:""},...t]);
    setNewTicket({title:"",type:"Bug",priority:"Medium",desc:""});
    setShowForm(false);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:".82em",color:C.muted}}>Report bugs or technical issues to the LISAR support team</div>
        <Btn onClick={()=>setShowForm(true)} icon="🎫">New Ticket</Btn>
      </div>

      {showForm&&(
        <Card style={{padding:"20px",marginBottom:16,border:`1px solid ${C.danger}20`}}>
          <div style={{fontWeight:700,fontSize:".88em",color:C.text,marginBottom:12}}>Open a Support Ticket</div>
          <Input label="Issue Title" value={newTicket.title} onChange={v=>setNewTicket(t=>({...t,title:v}))} placeholder="Brief description of the issue" required/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Select label="Type" value={newTicket.type} onChange={v=>setNewTicket(t=>({...t,type:v}))} options={["Bug","Technical","Account","Feature Request","Other"].map(v=>({value:v,label:v}))}/>
            <Select label="Priority" value={newTicket.priority} onChange={v=>setNewTicket(t=>({...t,priority:v}))} options={["Low","Medium","High","Critical"].map(v=>({value:v,label:v}))}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:".78em",fontWeight:600,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>Full Description <span style={{color:C.danger}}>*</span></label>
            <textarea value={newTicket.desc} onChange={e=>setNewTicket(t=>({...t,desc:e.target.value}))} placeholder="Describe the issue in detail — include steps to reproduce, what you expected, and what happened…" rows={4}
              style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:".9em",color:C.text,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"Inter,system-ui,sans-serif"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="danger" onClick={submit} disabled={!newTicket.title||!newTicket.desc}>Submit Ticket</Btn>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {tickets.map(t=>(
          <Card key={t.id} style={{padding:"16px",cursor:"pointer",border:selected?.id===t.id?`1px solid ${C.primary}`:undefined}} onClick={()=>setSelected(selected?.id===t.id?null:t)}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"monospace",fontSize:".78em",color:C.primary,fontWeight:700}}>{t.id}</span>
                  <Badge color="gray">{t.type}</Badge>
                  <span style={{fontSize:".72em",fontWeight:700,color:priorityColor(t.priority)}}>● {t.priority}</span>
                  {statusBadge(t.status)}
                </div>
                <div style={{fontWeight:600,fontSize:".88em",color:C.text,marginBottom:4}}>{t.title}</div>
                <div style={{fontSize:".72em",color:C.muted}}>By {t.user} · {t.date}</div>
                {selected?.id===t.id&&t.response&&(
                  <div style={{marginTop:10,padding:"10px 12px",background:`${C.success}10`,border:`1px solid ${C.success}25`,borderRadius:8}}>
                    <div style={{fontSize:".72em",fontWeight:700,color:C.success,marginBottom:4}}>SUPPORT RESPONSE</div>
                    <div style={{fontSize:".82em",color:C.text}}>{t.response}</div>
                  </div>
                )}
              </div>
              <div style={{fontSize:".72em",color:C.muted,flexShrink:0}}>{selected?.id===t.id?"▲":"▼"}</div>
            </div>
          </Card>
        ))}
      </div>
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
  const [patron,      setPatron]      = useState(null);
  const [patronLib,   setPatronLib]   = useState(null);
  
  // NEW: Theme State Management
  const [theme, setTheme] = useState(localStorage.getItem("lisar_theme") || "light");

  // NEW: Apply theme to document and save to local storage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("lisar_theme", theme);
  }, [theme]);

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

  // Patron session restore
  useEffect(()=>{
    const ptoken = localStorage.getItem("lisar_patron_token");
    if(!ptoken) return;
    // Restore patron session
    const savedPatron = localStorage.getItem("lisar_patron_data");
    const savedLib    = localStorage.getItem("lisar_patron_library");
    if(savedPatron){ setPatron(JSON.parse(savedPatron)); setPatronLib(JSON.parse(savedLib||"{}")); setScreen("patron"); }
  },[]);

  const handlePatronLogin = (p, lib) => {
    setPatron(p); setPatronLib(lib);
    localStorage.setItem("lisar_patron_data", JSON.stringify(p));
    localStorage.setItem("lisar_patron_library", JSON.stringify(lib||{}));
    setScreen("patron");
  };
  const handlePatronLogout = () => {
    localStorage.removeItem("lisar_patron_token");
    localStorage.removeItem("lisar_patron_data");
    localStorage.removeItem("lisar_patron_library");
    setPatron(null); setPatronLib(null); setScreen("landing");
  };

  // Session restore — only if token exists AND user hasn't explicitly logged out
  useEffect(()=>{
    const token = localStorage.getItem("lisar_token") || sessionStorage.getItem("lisar_token");
    if(!token) return;
    api.auth.me()
      .then(d=>{ setUser(d.user); setLibrary(d.library); setScreen("app"); setPage("dashboard"); })
      .catch(()=>{ localStorage.removeItem("lisar_token"); sessionStorage.removeItem("lisar_token"); });
  },[]);

  const login = (data) => {
    if(data==="patron"){ setScreen("patron_auth"); return; }
    if(data&&data.user){setUser(data.user);setLibrary(data.library);}
    setScreen("app"); setPage("dashboard");
  };
  const logout = () => {
    api.logout();
    localStorage.removeItem("lisar_token");
    sessionStorage.removeItem("lisar_token");
    setUser(null); setLibrary(null);
    setScreen("login"); // go to login, not landing — so user can sign in with different account
  };
  const activeUser    = user    || DEMO.user;
  const activeLibrary = library || DEMO.library;

  const GLOBAL_STYLE = <style>{`*{box-sizing:border-box;margin:0;padding:0;} @keyframes spin{to{transform:rotate(360deg)}} body{font-family:Inter,system-ui,sans-serif;}${MOBILE_CSS}`}</style>;

  if (screen==="landing") return <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>{GLOBAL_STYLE}<LandingPage onLogin={login}/></div>;

  if (screen==="patron_auth") return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>{GLOBAL_STYLE}
      <PatronAuthPage onPatronLogin={handlePatronLogin} goLanding={()=>setScreen("landing")}/>
    </div>
  );

  if (screen==="patron") return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>{GLOBAL_STYLE}
      <PatronDashboardPage patron={patron} library={patronLib} onLogout={handlePatronLogout}/>
    </div>
  );

  if (screen==="login") return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>{GLOBAL_STYLE}
      <LoginPage onLogin={login} goLanding={()=>setScreen("landing")}/>
    </div>
  );

  const renderPage = () => {
    if (page==="dashboard")   return <DashboardPage setPage={setPage}/>;
    if (page==="opac")        return <OPACPage/>;
    if (page==="catalogue")   return <CataloguingPage/>;
    if (page==="items")       return <ItemsPage/>;
    if (page==="patrons")     return <PatronsPage/>;
    if (page==="circulation") return <CirculationPage/>;
    if (page==="acquisitions")return <AcquisitionsPage/>;
    if (page==="journals")    return <JournalFinderPage setPage={setPage}/>;  
    if (page==="reports")     return <ReportsPage/>;
    if (page==="settings")    return <SettingsPage/>;
    if (page==="serials")     return <SerialsPage/>;
    if (page==="ill")         return <ILLPage/>;
    if (page==="chat")        return <ChatPage/>;
    return <DashboardPage setPage={setPage}/>;
  };

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"Inter,system-ui,sans-serif",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px;} @keyframes spin{to{transform:rotate(360deg)}}${MOBILE_CSS}`}</style>
      <Sidebar page={page} setPage={navigate} library={activeLibrary} collapsed={collapsed} setCollapsed={setCollapsed} className="sidebar-desktop"/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <Header page={page} user={activeUser} library={activeLibrary} setPage={navigate} onLogout={logout} goBack={goBack} canGoBack={canGoBack}/>
        <main style={{flex:1,overflowY:"auto",paddingBottom:60}}>{renderPage()}</main>
        <MobileNav page={page} setPage={navigate}/>
      </div>
    </div>
  );
}
