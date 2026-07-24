const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, (req, res) => {
  try {
    const items = db.prepare("SELECT * FROM lost_found WHERE library_id=? ORDER BY date_found DESC").all(req.library_id);
    res.json({ items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", authenticate, (req, res) => {
  try {
    const { description, category, location_found, date_found, notes } = req.body;
    if (!description) return res.status(400).json({ error: "Description required" });
    const r = db.prepare(
      "INSERT INTO lost_found (library_id,description,category,location_found,date_found,notes) VALUES (?,?,?,?,?,?)"
    ).run(req.library_id, description, category||"other", location_found||"", date_found||new Date().toISOString().split("T")[0], notes||"");
    res.status(201).json({ item: db.prepare("SELECT * FROM lost_found WHERE id=?").get(r.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", authenticate, (req, res) => {
  try {
    const item = db.prepare("SELECT * FROM lost_found WHERE id=? AND library_id=?").get(req.params.id, req.library_id);
    if (!item) return res.status(404).json({ error: "Not found" });
    const fields = ["status","claimed_by","claimed_date","description","category","location_found","notes"];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    if (updates.length === 0) return res.json({ item });
    params.push(req.params.id, req.library_id);
    db.prepare(`UPDATE lost_found SET ${updates.join(", ")} WHERE id = ? AND library_id = ?`).run(...params);
    res.json({ item: db.prepare("SELECT * FROM lost_found WHERE id=?").get(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", authenticate, (req, res) => {
  try {
    db.prepare("DELETE FROM lost_found WHERE id=? AND library_id=?").run(req.params.id, req.library_id);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
