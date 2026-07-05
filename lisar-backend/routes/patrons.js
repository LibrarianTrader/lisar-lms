const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

// GET all patrons
router.get("/", authenticate, (req, res) => {
  try {
    const { q, patron_type, status, limit = 50, offset = 0 } = req.query;
    let sql = "SELECT * FROM patrons WHERE library_id = ?";
    const params = [req.library_id];
    if (q) { sql += " AND (name LIKE ? OR email LIKE ? OR barcode LIKE ? OR department LIKE ?)"; const s = `%${q}%`; params.push(s,s,s,s); }
    if (patron_type) { sql += " AND patron_type = ?"; params.push(patron_type); }
    if (status) { sql += " AND status = ?"; params.push(status); }
    sql += " ORDER BY name ASC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    const patrons = db.prepare(sql).all(...params);
    const total   = db.prepare("SELECT COUNT(*) as c FROM patrons WHERE library_id = ?").get(req.library_id).c;
    res.json({ patrons, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single patron
router.get("/:id", authenticate, (req, res) => {
  try {
    const patron = db.prepare("SELECT * FROM patrons WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!patron) return res.status(404).json({ error: "Patron not found" });
    const loans = db.prepare("SELECT l.*, i.barcode, b.title FROM loans l JOIN items i ON l.item_id=i.id JOIN bibs b ON i.bib_id=b.id WHERE l.patron_id = ? AND l.library_id = ? ORDER BY l.checkout_date DESC LIMIT 20").all(patron.id, req.library_id);
    const fines = db.prepare("SELECT * FROM fines WHERE patron_id = ? AND library_id = ? AND paid = 0").all(patron.id, req.library_id);
    res.json({ patron, loans, fines });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create patron
router.post("/", authenticate, (req, res) => {
  try {
    const { name, email, phone, barcode, patron_type, department, reg_date, expiry_date, notes } = req.body;
    if (!name || !barcode) return res.status(400).json({ error: "Name and barcode are required" });
    const exists = db.prepare("SELECT id FROM patrons WHERE barcode = ? AND library_id = ?").get(barcode, req.library_id);
    if (exists) return res.status(400).json({ error: "Barcode already exists" });
    const result = db.prepare(
      `INSERT INTO patrons (library_id,name,email,phone,barcode,patron_type,department,reg_date,expiry_date,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(req.library_id,name,email,phone,barcode,patron_type||"undergraduate",department,reg_date||new Date().toISOString().split("T")[0],expiry_date,notes);
    res.status(201).json({ patron: db.prepare("SELECT * FROM patrons WHERE id = ?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update patron
router.put("/:id", authenticate, (req, res) => {
  try {
    const patron = db.prepare("SELECT * FROM patrons WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!patron) return res.status(404).json({ error: "Not found" });
    const fields = ["name","email","phone","patron_type","department","expiry_date","status","notes"];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    params.push(req.params.id, req.library_id);
    db.prepare(`UPDATE patrons SET ${updates.join(", ")} WHERE id = ? AND library_id = ?`).run(...params);
    res.json({ patron: db.prepare("SELECT * FROM patrons WHERE id = ?").get(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE patron
router.delete("/:id", authenticate, (req, res) => {
  try {
    const activeLoans = db.prepare("SELECT COUNT(*) as c FROM loans WHERE patron_id = ? AND status = 'active'").get(req.params.id);
    if (activeLoans.c > 0) return res.status(400).json({ error: "Cannot delete patron with active loans" });
    db.prepare("DELETE FROM patrons WHERE id = ? AND library_id = ?").run(req.params.id, req.library_id);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
