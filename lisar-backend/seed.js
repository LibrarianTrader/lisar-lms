require("dotenv").config();
const bcrypt = require("bcryptjs");
const db     = require("./db");

console.log("🌱 Seeding LISAR LMS database...");

try {
  // ── Library ──────────────────────────────────────────
  const lib = db.prepare(
    `INSERT OR IGNORE INTO libraries (name,slug,type,plan,email,phone,address)
     VALUES (?,?,?,?,?,?,?)`
  ).run("University of Lagos Main Library","unilag","academic","professional",
        "library@unilag.edu.ng","+234 812 345 6789","Akoka, Yaba, Lagos");

  const library_id = lib.lastInsertRowid ||
    db.prepare("SELECT id FROM libraries WHERE slug=?").get("unilag").id;

  // ── Admin user ───────────────────────────────────────
  db.prepare(
    `INSERT OR IGNORE INTO users (library_id,name,email,password_hash,role)
     VALUES (?,?,?,?,?)`
  ).run(library_id,"Adewale Okonkwo","demo@lisar.app",bcrypt.hashSync("demo123",10),"admin");

  // ── Loan rules ───────────────────────────────────────
  const rules = [
    ["undergraduate",14,2,5,50,2500],
    ["postgraduate", 21,2,7,50,2500],
    ["faculty",      30,3,10,50,2500],
    ["staff",        21,2,7,50,2500],
  ];
  const ruleStmt = db.prepare(
    `INSERT OR IGNORE INTO loan_rules (library_id,patron_type,loan_days,max_renewals,max_items,fine_per_day,max_fine)
     VALUES (?,?,?,?,?,?,?)`
  );
  rules.forEach(r => ruleStmt.run(library_id, ...r));

  // ── Bibliographic records ────────────────────────────
  const bibs = [
    ["Things Fall Apart","Achebe, Chinua","Heinemann","London","1958","1st","9780385474542","","224 pages","eng","Book","823.914","PR9387.9.A24","Nigerian fiction; Igbo people"],
    ["Purple Hibiscus","Adichie, Chimamanda Ngozi","Algonquin Books","Chapel Hill","2003","1st","9781616202415","","307 pages","eng","Book","823.92","PR9387.9.A3235","Nigerian fiction; Family life"],
    ["Introduction to Library and Information Science","Okoye, Michael E.","Spectrum Books","Ibadan","2018","2nd","9789782461234","","412 pages","eng","Book","020","Z665","Library science; Information science"],
    ["Nigerian Constitutional Law","Nwabueze, B.O.","Nwamife Publishers","Enugu","2019","3rd","9789780234567","","580 pages","eng","Book","342.669","KTQ3942","Constitutional law -- Nigeria"],
    ["Petroleum Engineering Fundamentals","Ikoku, Chi U.","PennWell Publishing","Tulsa","2020","2nd","9780878143412","","620 pages","eng","Book","622.3382","TN870","Petroleum engineering; Niger Delta"],
    ["Database Systems: A Practical Approach","Connolly, Thomas","Pearson","London","2022","6th","9780321523068","","1440 pages","eng","Book","005.74","QA76.9.D3","Database management; SQL"],
    ["African History: A Very Short Introduction","Parker, John","Oxford University Press","Oxford","2007","1st","9780192802484","","152 pages","eng","Book","960","DT20","Africa -- History"],
    ["Half of a Yellow Sun","Adichie, Chimamanda Ngozi","Knopf","New York","2006","1st","9781400044160","","433 pages","eng","Book","823.92","PR9387.9.A3235","Nigeria -- History -- Civil War, 1967-1970 -- Fiction"],
  ];

  const bibStmt = db.prepare(
    `INSERT OR IGNORE INTO bibs (library_id,title,author,publisher,place,year,edition,isbn,issn,pages,language,format,ddc,lcc,subject)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  bibs.forEach(b => bibStmt.run(library_id, ...b));

  // ── Items (copies) ───────────────────────────────────
  const allBibs = db.prepare("SELECT id,title FROM bibs WHERE library_id=?").all(library_id);
  const itemStmt = db.prepare(
    "INSERT OR IGNORE INTO items (library_id,bib_id,barcode,call_number,location) VALUES (?,?,?,?,?)"
  );
  const locations = ["General Stacks","General Stacks","Reserve","General Stacks"];
  allBibs.forEach((bib, bi) => {
    for (let c = 1; c <= 4; c++) {
      const barcode  = `ITM${String(bi+1).padStart(3,"0")}${String(c).padStart(2,"0")}`;
      const location = locations[c-1] || "General Stacks";
      itemStmt.run(library_id, bib.id, barcode, `${bib.id} ${bib.title.slice(0,3).toUpperCase()}`, location);
    }
  });

  // ── Patrons ──────────────────────────────────────────
  const patrons = [
    ["Fatima Al-Amin","f.alamin@unilag.edu.ng","+234 801 234 5678","PAT0001","postgraduate","Library & Information Science"],
    ["Chukwuemeka Obi","c.obi@unilag.edu.ng","+234 802 345 6789","PAT0002","undergraduate","Computer Science"],
    ["Prof. Ngozi Adeyemi","n.adeyemi@unilag.edu.ng","+234 803 456 7890","FAC0015","faculty","Law"],
    ["Yusuf Musa Ibrahim","y.ibrahim@unilag.edu.ng","+234 804 567 8901","PAT0004","postgraduate","Petroleum Engineering"],
    ["Dr. Taiwo Oladele","t.oladele@unilag.edu.ng","+234 806 789 0123","STF0003","staff","Library"],
  ];
  const patronStmt = db.prepare(
    `INSERT OR IGNORE INTO patrons (library_id,name,email,phone,barcode,patron_type,department,expiry_date)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  patrons.forEach(p => patronStmt.run(library_id,...p,"2026-08-31"));

  console.log("✅ Database seeded successfully!");
  console.log("📧 Login: demo@lisar.app");
  console.log("🔑 Password: demo123");

} catch (e) {
  console.error("❌ Seed error:", e.message);
  process.exit(1);
}
