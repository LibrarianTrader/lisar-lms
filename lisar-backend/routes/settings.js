const express  = require("express");
const router   = express.Router();
const db       = require("../db");
const bcrypt   = require("bcryptjs");
const { authenticate, requireRole } = require("../middleware/auth");

// GET library profile
router.get("/library", authenticate, (req, res) => {
  try {
    const library = db.prepare("SELECT * FROM libraries WHERE id = ?").get(req.library_id);
    res.json({ library });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update library profile
router.put("/library", authenticate, requireRole("admin"), (req, res) => {
  try {
    const { name, email, phone, address, type, logo_url, settings } = req.body;
    db.prepare(
      `UPDATE libraries SET name=?,email=?,phone=?,address=?,type=?,logo_url=?,settings=? WHERE id=?`
    ).run(name,email,phone,address,type,logo_url,JSON.stringify(settings||{}),req.library_id);
    res.json({ library: db.prepare("SELECT * FROM libraries WHERE id=?").get(req.library_id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all staff
router.get("/staff", authenticate, requireRole("admin"), (req, res) => {
  try {
    const staff = db.prepare("SELECT id,name,email,role,active,last_login,created_at FROM users WHERE library_id=? ORDER BY name ASC").all(req.library_id);
    res.json({ staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST add staff
router.post("/staff", authenticate, requireRole("admin"), (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name||!email||!password) return res.status(400).json({ error: "Name, email and password required" });
    const exists = db.prepare("SELECT id FROM users WHERE email=? AND library_id=?").get(email, req.library_id);
    if (exists) return res.status(400).json({ error: "Email already exists" });
    const hash   = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      "INSERT INTO users (library_id,name,email,password_hash,role) VALUES (?,?,?,?,?)"
    ).run(req.library_id,name,email,hash,role||"librarian");
    res.status(201).json({ user: db.prepare("SELECT id,name,email,role,active FROM users WHERE id=?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update staff
router.put("/staff/:id", authenticate, requireRole("admin"), (req, res) => {
  try {
    const { name, role, active } = req.body;
    db.prepare("UPDATE users SET name=?,role=?,active=? WHERE id=? AND library_id=?").run(name,role,active,req.params.id,req.library_id);
    res.json({ user: db.prepare("SELECT id,name,email,role,active FROM users WHERE id=?").get(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET loan rules
router.get("/loan-rules", authenticate, (req, res) => {
  try {
    const rules = db.prepare("SELECT * FROM loan_rules WHERE library_id=? ORDER BY patron_type ASC").all(req.library_id);
    res.json({ rules });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST upsert loan rule
router.post("/loan-rules", authenticate, requireRole("admin"), (req, res) => {
  try {
    const { patron_type, loan_days, max_renewals, max_items, fine_per_day, max_fine } = req.body;
    if (!patron_type) return res.status(400).json({ error: "Patron type required" });
    db.prepare(
      `INSERT INTO loan_rules (library_id,patron_type,loan_days,max_renewals,max_items,fine_per_day,max_fine)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(library_id,patron_type) DO UPDATE SET
       loan_days=excluded.loan_days, max_renewals=excluded.max_renewals,
       max_items=excluded.max_items, fine_per_day=excluded.fine_per_day, max_fine=excluded.max_fine`
    ).run(req.library_id,patron_type,loan_days||14,max_renewals||2,max_items||5,fine_per_day||50,max_fine||2500);
    res.json({ message: "Loan rule saved" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT change password
router.put("/password", authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    if (!bcrypt.compareSync(current_password, user.password_hash))
      return res.status(400).json({ error: "Current password is incorrect" });
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash, req.user.id);
    res.json({ message: "Password updated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
