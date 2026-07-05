const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

// GET all serials
router.get("/", authenticate, (req, res) => {
  try {
    const serials = db.prepare("SELECT * FROM serials WHERE library_id = ? ORDER BY title ASC").all(req.library_id);
    res.json({ serials });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single serial + issues
router.get("/:id", authenticate, (req, res) => {
  try {
    const serial = db.prepare("SELECT * FROM serials WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!serial) return res.status(404).json({ error: "Not found" });
    const issues = db.prepare("SELECT * FROM serial_issues WHERE serial_id = ? AND library_id = ? ORDER BY pub_date DESC").all(serial.id, req.library_id);
    res.json({ serial, issues });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create serial
router.post("/", authenticate, (req, res) => {
  try {
    const { title, issn, publisher, frequency, start_date, end_date, annual_cost, vendor, location, notes } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const result = db.prepare(
      `INSERT INTO serials (library_id,title,issn,publisher,frequency,start_date,end_date,annual_cost,vendor,location,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(req.library_id,title,issn,publisher,frequency,start_date,end_date,Number(annual_cost)||0,vendor,location,notes);
    res.status(201).json({ serial: db.prepare("SELECT * FROM serials WHERE id = ?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update serial
router.put("/:id", authenticate, (req, res) => {
  try {
    const serial = db.prepare("SELECT * FROM serials WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!serial) return res.status(404).json({ error: "Not found" });
    const fields = ["title","issn","publisher","frequency","start_date","end_date","annual_cost","vendor","location","status","notes"];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    params.push(req.params.id, req.library_id);
    db.prepare(`UPDATE serials SET ${updates.join(", ")} WHERE id = ? AND library_id = ?`).run(...params);
    res.json({ serial: db.prepare("SELECT * FROM serials WHERE id = ?").get(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST check in an issue
router.post("/:id/issues", authenticate, (req, res) => {
  try {
    const { volume, issue_number, pub_date, received_date, notes } = req.body;
    const result = db.prepare(
      `INSERT INTO serial_issues (library_id,serial_id,volume,issue_number,pub_date,received_date,status,notes)
       VALUES (?,?,?,?,?,?,?,?)`
    ).run(req.library_id,req.params.id,volume,issue_number,pub_date,received_date||new Date().toISOString().split("T")[0],"received",notes);
    res.status(201).json({ issue: db.prepare("SELECT * FROM serial_issues WHERE id = ?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE serial
router.delete("/:id", authenticate, (req, res) => {
  try {
    db.prepare("DELETE FROM serial_issues WHERE serial_id = ? AND library_id = ?").run(req.params.id, req.library_id);
    db.prepare("DELETE FROM serials WHERE id = ? AND library_id = ?").run(req.params.id, req.library_id);
    res.json({ message: "Serial deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
