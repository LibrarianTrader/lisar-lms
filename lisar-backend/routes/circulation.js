const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");
const { calcDueDate, calcFine, checkPatronEligibility, getLoanRule } = require("../helpers/circulation");

// GET active loans
router.get("/loans", authenticate, (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT l.*, i.barcode as item_barcode, b.title, b.author,
               p.name as patron_name, p.barcode as patron_barcode, p.patron_type
               FROM loans l
               JOIN items i ON l.item_id = i.id
               JOIN bibs b ON i.bib_id = b.id
               JOIN patrons p ON l.patron_id = p.id
               WHERE l.library_id = ?`;
    const params = [req.library_id];
    if (status) { sql += " AND l.status = ?"; params.push(status); }
    sql += " ORDER BY l.checkout_date DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    const loans = db.prepare(sql).all(...params);
    const total = db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id = ?").get(req.library_id).c;
    res.json({ loans, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST checkout
router.post("/checkout", authenticate, (req, res) => {
  try {
    const { item_barcode, patron_barcode, notes } = req.body;
    if (!item_barcode || !patron_barcode) return res.status(400).json({ error: "Item and patron barcodes required" });
    const item = db.prepare("SELECT * FROM items WHERE barcode = ? AND library_id = ?").get(item_barcode, req.library_id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.status !== "available") return res.status(400).json({ error: `Item is ${item.status}` });
    const patron = db.prepare("SELECT * FROM patrons WHERE barcode = ? AND library_id = ?").get(patron_barcode, req.library_id);
    if (!patron) return res.status(404).json({ error: "Patron not found" });
    const check = checkPatronEligibility(req.library_id, patron.id);
    if (!check.ok) return res.status(400).json({ error: check.reason });
    const rule     = getLoanRule(req.library_id, patron.patron_type);
    const due_date = calcDueDate(rule.loan_days);
    const result   = db.prepare(
      `INSERT INTO loans (library_id,item_id,patron_id,checked_out_by,checkout_date,due_date,status,notes)
       VALUES (?,?,?,?,date('now'),?,?,?)`
    ).run(req.library_id, item.id, patron.id, req.user.id, due_date, "active", notes||"");
    db.prepare("UPDATE items SET status = 'checked_out' WHERE id = ?").run(item.id);
    const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ loan, due_date, message: `Checked out to ${patron.name}. Due: ${due_date}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST checkin
router.post("/checkin", authenticate, (req, res) => {
  try {
    const { item_barcode } = req.body;
    if (!item_barcode) return res.status(400).json({ error: "Item barcode required" });
    const item = db.prepare("SELECT * FROM items WHERE barcode = ? AND library_id = ?").get(item_barcode, req.library_id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    const loan = db.prepare("SELECT * FROM loans WHERE item_id = ? AND status = 'active'").get(item.id);
    if (!loan) return res.status(400).json({ error: "No active loan for this item" });
    const patron = db.prepare("SELECT * FROM patrons WHERE id = ?").get(loan.patron_id);
    const rule   = getLoanRule(req.library_id, patron.patron_type);
    const { days_overdue, fine_amount } = calcFine(loan.due_date, rule.fine_per_day, rule.max_fine);
    db.prepare("UPDATE loans SET status='returned', return_date=date('now'), fine_amount=? WHERE id=?").run(fine_amount, loan.id);
    db.prepare("UPDATE items SET status='available' WHERE id=?").run(item.id);
    if (fine_amount > 0) {
      db.prepare("INSERT INTO fines (library_id,loan_id,patron_id,amount) VALUES (?,?,?,?)").run(req.library_id, loan.id, loan.patron_id, fine_amount);
    }
    res.json({ message: "Item returned successfully", days_overdue, fine: fine_amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST renew
router.post("/renew", authenticate, (req, res) => {
  try {
    const { item_barcode } = req.body;
    const item = db.prepare("SELECT * FROM items WHERE barcode = ? AND library_id = ?").get(item_barcode, req.library_id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    const loan = db.prepare("SELECT * FROM loans WHERE item_id = ? AND status = 'active'").get(item.id);
    if (!loan) return res.status(400).json({ error: "No active loan found" });
    const patron = db.prepare("SELECT * FROM patrons WHERE id = ?").get(loan.patron_id);
    const rule   = getLoanRule(req.library_id, patron.patron_type);
    if (loan.renewed_count >= rule.max_renewals) return res.status(400).json({ error: `Maximum renewals (${rule.max_renewals}) reached` });
    const new_due_date = calcDueDate(rule.loan_days);
    db.prepare("UPDATE loans SET due_date=?, renewed_count=renewed_count+1 WHERE id=?").run(new_due_date, loan.id);
    res.json({ message: "Renewed successfully", new_due_date, renewals_remaining: rule.max_renewals - (loan.renewed_count + 1) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET today stats
router.get("/stats", authenticate, (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    res.json({
      today_checkouts: db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND checkout_date=?").get(req.library_id, today).c,
      today_returns:   db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND return_date=?").get(req.library_id, today).c,
      active_loans:    db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND status='active'").get(req.library_id).c,
      overdue:         db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND status='active' AND due_date < date('now')").get(req.library_id).c,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET holds
router.get("/holds", authenticate, (req, res) => {
  try {
    const holds = db.prepare(`SELECT h.*, b.title, p.name as patron_name, p.barcode as patron_barcode
      FROM holds h JOIN bibs b ON h.bib_id=b.id JOIN patrons p ON h.patron_id=p.id
      WHERE h.library_id=? AND h.status='pending' ORDER BY h.request_date ASC`).all(req.library_id);
    res.json({ holds });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST place hold
router.post("/holds", authenticate, (req, res) => {
  try {
    const { bib_id, patron_barcode } = req.body;
    const patron = db.prepare("SELECT * FROM patrons WHERE barcode=? AND library_id=?").get(patron_barcode, req.library_id);
    if (!patron) return res.status(404).json({ error: "Patron not found" });
    const result = db.prepare("INSERT INTO holds (library_id,bib_id,patron_id) VALUES (?,?,?)").run(req.library_id, bib_id, patron.id);
    res.status(201).json({ hold: db.prepare("SELECT * FROM holds WHERE id=?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET fines
router.get("/fines", authenticate, (req, res) => {
  try {
    const fines = db.prepare(`SELECT f.*, p.name as patron_name, p.barcode as patron_barcode, b.title
      FROM fines f JOIN patrons p ON f.patron_id=p.id JOIN loans l ON f.loan_id=l.id
      JOIN items i ON l.item_id=i.id JOIN bibs b ON i.bib_id=b.id
      WHERE f.library_id=? ORDER BY f.created_at DESC`).all(req.library_id);
    res.json({ fines });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST collect fine
router.post("/fines/:id/collect", authenticate, (req, res) => {
  try {
    db.prepare("UPDATE fines SET paid=1, paid_date=date('now'), paid_by=? WHERE id=? AND library_id=?").run(req.user.id, req.params.id, req.library_id);
    res.json({ message: "Fine collected" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
