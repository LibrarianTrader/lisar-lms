const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

// GET all orders
router.get("/orders", authenticate, (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let sql = "SELECT * FROM acq_orders WHERE library_id = ?";
    const params = [req.library_id];
    if (status) { sql += " AND status = ?"; params.push(status); }
    sql += " ORDER BY order_date DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    const orders = db.prepare(sql).all(...params);
    const total  = db.prepare("SELECT COUNT(*) as c FROM acq_orders WHERE library_id = ?").get(req.library_id).c;
    const budget = db.prepare("SELECT SUM(total_cost) as spent FROM acq_orders WHERE library_id = ? AND status != 'cancelled'").get(req.library_id);
    res.json({ orders, total, spent: budget.spent || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create order
router.post("/orders", authenticate, (req, res) => {
  try {
    const { title, author, isbn, publisher, vendor, quantity, unit_cost, fund_code, notes } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const qty   = Number(quantity) || 1;
    const cost  = Number(unit_cost) || 0;
    const total = qty * cost;
    const result = db.prepare(
      `INSERT INTO acq_orders (library_id,title,author,isbn,publisher,vendor,quantity,unit_cost,total_cost,fund_code,notes,ordered_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(req.library_id,title,author,isbn,publisher,vendor,qty,cost,total,fund_code,notes,req.user.id);
    res.status(201).json({ order: db.prepare("SELECT * FROM acq_orders WHERE id = ?").get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update order
router.put("/orders/:id", authenticate, (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM acq_orders WHERE id = ? AND library_id = ?").get(req.params.id, req.library_id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const fields = ["title","author","isbn","publisher","vendor","quantity","unit_cost","fund_code","status","notes","received_date"];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    if (req.body.quantity || req.body.unit_cost) {
      const qty  = req.body.quantity  || order.quantity;
      const cost = req.body.unit_cost || order.unit_cost;
      updates.push("total_cost = ?"); params.push(qty * cost);
    }
    params.push(req.params.id, req.library_id);
    db.prepare(`UPDATE acq_orders SET ${updates.join(", ")} WHERE id = ? AND library_id = ?`).run(...params);
    res.json({ order: db.prepare("SELECT * FROM acq_orders WHERE id = ?").get(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE order
router.delete("/orders/:id", authenticate, (req, res) => {
  try {
    db.prepare("DELETE FROM acq_orders WHERE id = ? AND library_id = ?").run(req.params.id, req.library_id);
    res.json({ message: "Order deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
