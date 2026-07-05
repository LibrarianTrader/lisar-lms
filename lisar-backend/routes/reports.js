const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

// GET dashboard summary
router.get("/dashboard", authenticate, (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const month = today.slice(0, 7);
    res.json({
      total_items:      db.prepare("SELECT COUNT(*) as c FROM items WHERE library_id=?").get(req.library_id).c,
      total_bibs:       db.prepare("SELECT COUNT(*) as c FROM bibs WHERE library_id=?").get(req.library_id).c,
      active_patrons:   db.prepare("SELECT COUNT(*) as c FROM patrons WHERE library_id=? AND status='active'").get(req.library_id).c,
      today_checkouts:  db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND checkout_date=?").get(req.library_id,today).c,
      today_returns:    db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND return_date=?").get(req.library_id,today).c,
      active_loans:     db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND status='active'").get(req.library_id).c,
      overdue_count:    db.prepare("SELECT COUNT(*) as c FROM loans WHERE library_id=? AND status='active' AND due_date < date('now')").get(req.library_id).c,
      new_items_month:  db.prepare("SELECT COUNT(*) as c FROM items WHERE library_id=? AND created_at LIKE ?").get(req.library_id,`${month}%`).c,
      pending_holds:    db.prepare("SELECT COUNT(*) as c FROM holds WHERE library_id=? AND status='pending'").get(req.library_id).c,
      unpaid_fines:     db.prepare("SELECT SUM(amount) as s FROM fines WHERE library_id=? AND paid=0").get(req.library_id).s || 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET circulation report
router.get("/circulation", authenticate, (req, res) => {
  try {
    const daily = db.prepare(
      `SELECT checkout_date as date, COUNT(*) as checkouts
       FROM loans WHERE library_id=? AND checkout_date >= date('now','-7 days')
       GROUP BY checkout_date ORDER BY checkout_date ASC`
    ).all(req.library_id);
    const top_subjects = db.prepare(
      `SELECT b.subject, COUNT(*) as loans
       FROM loans l JOIN items i ON l.item_id=i.id JOIN bibs b ON i.bib_id=b.id
       WHERE l.library_id=? AND b.subject IS NOT NULL
       GROUP BY b.subject ORDER BY loans DESC LIMIT 5`
    ).all(req.library_id);
    const top_books = db.prepare(
      `SELECT b.title, b.author, COUNT(*) as loans
       FROM loans l JOIN items i ON l.item_id=i.id JOIN bibs b ON i.bib_id=b.id
       WHERE l.library_id=? GROUP BY b.id ORDER BY loans DESC LIMIT 5`
    ).all(req.library_id);
    res.json({ daily_checkouts: daily, top_subjects, top_books });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET overdue report
router.get("/overdue", authenticate, (req, res) => {
  try {
    const items = db.prepare(
      `SELECT l.*, i.barcode as item_barcode, b.title, b.author,
       p.name as patron_name, p.email as patron_email, p.barcode as patron_barcode,
       CAST((julianday('now') - julianday(l.due_date)) AS INTEGER) as days_overdue
       FROM loans l JOIN items i ON l.item_id=i.id JOIN bibs b ON i.bib_id=b.id
       JOIN patrons p ON l.patron_id=p.id
       WHERE l.library_id=? AND l.status='active' AND l.due_date < date('now')
       ORDER BY days_overdue DESC`
    ).all(req.library_id);
    res.json({ items, total: items.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET collection report
router.get("/collection", authenticate, (req, res) => {
  try {
    const by_format = db.prepare(
      "SELECT format, COUNT(*) as count FROM bibs WHERE library_id=? GROUP BY format ORDER BY count DESC"
    ).all(req.library_id);
    const by_language = db.prepare(
      "SELECT language, COUNT(*) as count FROM bibs WHERE library_id=? GROUP BY language ORDER BY count DESC"
    ).all(req.library_id);
    const by_year = db.prepare(
      "SELECT year, COUNT(*) as count FROM bibs WHERE library_id=? AND year IS NOT NULL GROUP BY year ORDER BY year DESC LIMIT 10"
    ).all(req.library_id);
    res.json({ by_format, by_language, by_year });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET patron report
router.get("/patrons", authenticate, (req, res) => {
  try {
    const by_type = db.prepare(
      "SELECT patron_type, COUNT(*) as count FROM patrons WHERE library_id=? GROUP BY patron_type ORDER BY count DESC"
    ).all(req.library_id);
    const top_borrowers = db.prepare(
      `SELECT p.name, p.barcode, p.patron_type, COUNT(*) as loans
       FROM loans l JOIN patrons p ON l.patron_id=p.id
       WHERE l.library_id=? GROUP BY p.id ORDER BY loans DESC LIMIT 5`
    ).all(req.library_id);
    res.json({ by_type, top_borrowers });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
