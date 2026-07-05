const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

// GET all ILL requests
router.get("/", authenticate, (req, res) => {
  try {
    const { status, request_type, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT i.*, p.name as patron_name, p.barcode as patron_barcode
               FROM ill_requests i LEFT JOIN patrons p ON i.patron_id = p.id
               WHERE i.library_id = ?`;
    const params = [req.library_id];
    if (status) { sql += " AND i.status = ?"; params.push(status); }
    if (request_type) { sql += " AND i.request_type = ?"; params.push(request_type); }
    sql += " ORDER BY i.request_date DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    const requests = db.prepare(sql).all(...params);
    const total    = db.prepare("SELECT COUNT(*) as c FROM ill_requests WHERE library_id = ?").get(req.library_id).c;
    res.json({ requests, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single ILL request
router.get("/:id", authenticate, (req, res) => {
  try {
    const request = db.prepare("SELECT * FROM ill_requests WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!request) return res.status(404).json({ error: "Not found" });
    res.json({ request });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create ILL request
router.post("/", authenticate, (req, res) => {
  try {
    const { request_type, title, author, isbn, patron_barcode, partner_library, partner_email, due_date, notes } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    let patron_id = null;
    if (patron_barcode) {
      const patron = db.prepare("SELECT id FROM patrons WHERE barcode = ? AND library_id = ?").get(patron_barcode, req.library_id);
      if (patron) patron_id = patron.id;
    }
    const result = db.prepare(
      `INSERT INTO ill_requests (library_id,request_type,title,author,isbn,patron_id,partner_library,partner_email,due_date,notes,requested_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(req.library_id,request_type||"borrow",title,author,isbn,patron_id,partner_library,partner_email,due_date,notes,req.user.id);
    res.status(201).json({ request: db.prepare("SELECT * FROM ill_requests WHERE id = ?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update ILL request status
router.put("/:id", authenticate, (req, res) => {
  try {
    const request = db.prepare("SELECT * FROM ill_requests WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!request) return res.status(404).json({ error: "Not found" });
    const fields = ["status","partner_library","partner_email","due_date","return_date","notes"];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    params.push(req.params.id, req.library_id);
    db.prepare(`UPDATE ill_requests SET ${updates.join(", ")} WHERE id = ? AND library_id = ?`).run(...params);
    res.json({ request: db.prepare("SELECT * FROM ill_requests WHERE id = ?").get(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE ILL request
router.delete("/:id", authenticate, (req, res) => {
  try {
    db.prepare("DELETE FROM ill_requests WHERE id = ? AND library_id = ?").run(req.params.id, req.library_id);
    res.json({ message: "Request deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
