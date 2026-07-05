import { useState, useRef, useEffect, useCallback } from "react";
import api, { setToken, getToken } from "./api";

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
//  SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════
const C = { primary:"#2563EB", bg:"#F8FAFC", card:"#FFFFFF", border:"#E2E8F0", text:"#1E293B", muted:"#64748B", success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#0891B2", sidebar:"#0F172A", sidebarHover:"rgba(255,255,255,.06)", sidebarActive:"rgba(37,99,235,.25)" };

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
          <Btn variant="secondary" onClick={onLogin}>Sign In</Btn>
          <Btn onClick={onLogin} icon="✨">Start Free Trial</Btn>
        </div>
      </nav>
      {/* Hero */}
      <div style={{background:`linear-gradient(135deg,${C.sidebar} 0%,#1E3A5F 100%)`,color:"#fff",padding:"80px 40px",textAlign:"center"}}>
        <div style={{display:"inline-block",background:"rgba(37,99,235,.3)",border:"1px solid rgba(37,99,235,.5)",borderRadius:20,padding:"4px 14px",fontSize:".78em",fontWeight:600,color:"#93C5FD",marginBottom:18}}>✨ AI-Powered Library Management</div>
        <h1 style={{fontSize:"3em",fontWeight:800,margin:"0 0 16px",lineHeight:1.1,letterSpacing:"-.02em"}}>The Modern Library<br/><span style={{color:"#60A5FA"}}>Management System</span></h1>
        <p style={{fontSize:"1.1em",color:"#94A3B8",maxWidth:560,margin:"0 auto 32px",lineHeight:1.7}}>LISAR LMS brings AI-assisted cataloguing, circulation, patron management and OPAC into one beautiful platform any library can adopt in minutes.</p>
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
          <div style={{fontSize:".84em",color:C.muted}}>Koha · Librarika · Millennium · Alexandria · MARC .mrc files · Excel spreadsheets — we import them all. Your data moves in minutes, not months.</div>
        </div>
        <Btn onClick={onLogin}>Learn about Migration →</Btn>
      </div>
      {/* Pricing */}
      <div style={{padding:"60px 40px",maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{textAlign:"center",fontSize:"1.8em",fontWeight:800,color:C.text,marginBottom:8}}>Simple, transparent pricing</h2>
        <p style={{textAlign:"center",color:C.muted,marginBottom:40}}>Start free. Upgrade as your library grows.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
          {plans.map((p,i)=>(
         
