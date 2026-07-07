const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const db      = require("../db");

router.post("/register", (req, res) => {
  try {
    const { name, libraryName, email, password, libraryType } = req.body;
    if (!name||!libraryName||!email||!password)
      return res.status(400).json({ error: "All fields required" });
    const slug = libraryName.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")+"-"+Date.now();
    const lib  = db.prepare("INSERT INTO libraries (name,slug,type,email) VALUES (?,?,?,?)").run(libraryName,slug,libraryType||"academic",email);
    const hash = bcrypt.hashSync(password, 10);
    const user = db.prepare("INSERT INTO users (library_id,name,email,password_hash,role) VALUES (?,?,?,?,?)").run(lib.lastInsertRowid,name,email,hash,"admin");
    const token = jwt.sign({ id: user.lastInsertRowid, library_id: lib.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: db.prepare("SELECT id,name,email,role FROM users WHERE id=?").get(user.lastInsertRowid), library: db.prepare("SELECT * FROM libraries WHERE id=?").get(lib.lastInsertRowid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) return res.status(400).json({ error: "Email and password required" });
    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    if (!user||!bcrypt.compareSync(password,user.password_hash)) return res.status(401).json({ error: "Invalid email or password" });
    if (!user.active) return res.status(401).json({ error: "Account inactive" });
    db.prepare("UPDATE users SET last_login=datetime('now') WHERE id=?").run(user.id);
    const token = jwt.sign({ id: user.id, library_id: user.library_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id:user.id, name:user.name, email:user.email, role:user.role }, library: db.prepare("SELECT * FROM libraries WHERE id=?").get(user.library_id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/me", (req, res) => {
  try {
    const token = (req.headers.authorization||"").replace("Bearer ","");
    if (!token) return res.status(401).json({ error: "No token" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: db.prepare("SELECT id,name,email,role FROM users WHERE id=?").get(payload.id), library: db.prepare("SELECT * FROM libraries WHERE id=?").get(payload.library_id) });
  } catch (e) { res.status(401).json({ error: "Invalid token" }); }
});

module.exports = router;
