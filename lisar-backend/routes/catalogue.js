const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

// GET all bibs
router.get("/", authenticate, (req, res) => {
  try {
    const { q, format, limit = 50, offset = 0 } = req.query;
    let sql = "SELECT * FROM bibs WHERE library_id = ?";
    const params = [req.library_id];
    if (q) { sql += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR subject LIKE ?)"; const s = `%${q}%`; params.push(s,s,s,s); }
    if (format) { sql += " AND format = ?"; params.push(format); }
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    const bibs  = db.prepare(sql).all(...params);
    const total = db.prepare("SELECT COUNT(*) as c FROM bibs WHERE library_id = ?").get(req.library_id).c;
    res.json({ bibs, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single bib
router.get("/:id", authenticate, (req, res) => {
  try {
    const bib = db.prepare("SELECT * FROM bibs WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!bib) return res.status(404).json({ error: "Not found" });
    const items = db.prepare("SELECT * FROM items WHERE bib_id = ? AND library_id = ?").all(bib.id, req.library_id);
    res.json({ bib, items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create bib
router.post("/", authenticate, (req, res) => {
  try {
    const { title, author, publisher, place, year, edition, isbn, issn, pages, language, format, ddc, lcc, subject, description, cover_url, dc_record, marc_record, source } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const result = db.prepare(
      `INSERT INTO bibs (library_id,title,author,publisher,place,year,edition,isbn,issn,pages,language,format,ddc,lcc,subject,description,cover_url,dc_record,marc_record,source,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(req.library_id,title,author,publisher,place,year,edition,isbn,issn,pages,language||"eng",format||"Book",ddc,lcc,subject,description,cover_url,JSON.stringify(dc_record||{}),JSON.stringify(marc_record||{}),source||"manual",req.user.id);
    const bib = db.prepare("SELECT * FROM bibs WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ bib });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update bib
router.put("/:id", authenticate, (req, res) => {
  try {
    const bib = db.prepare("SELECT * FROM bibs WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!bib) return res.status(404).json({ error: "Not found" });
    const fields = ["title","author","publisher","place","year","edition","isbn","issn","pages","language","format","ddc","lcc","subject","description","cover_url"];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    updates.push("updated_at = datetime('now')");
    params.push(req.params.id, req.library_id);
    db.prepare(`UPDATE bibs SET ${updates.join(", ")} WHERE id = ? AND library_id = ?`).run(...params);
    res.json({ bib: db.prepare("SELECT * FROM bibs WHERE id = ?").get(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE bib
router.delete("/:id", authenticate, (req, res) => {
  try {
    const bib = db.prepare("SELECT * FROM bibs WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!bib) return res.status(404).json({ error: "Not found" });
    db.prepare("DELETE FROM bibs WHERE id = ? AND library_id = ?").run(req.params.id, req.library_id);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST add item/copy to a bib
router.post("/:id/items", authenticate, (req, res) => {
  try {
    const { barcode, call_number, location, condition, notes } = req.body;
    if (!barcode) return res.status(400).json({ error: "Barcode is required" });
    const result = db.prepare(
      "INSERT INTO items (library_id,bib_id,barcode,call_number,location,condition,notes) VALUES (?,?,?,?,?,?,?)"
    ).run(req.library_id, req.params.id, barcode, call_number, location||"General Stacks", condition||"good", notes);
    res.status(201).json({ item: db.prepare("SELECT * FROM items WHERE id = ?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
