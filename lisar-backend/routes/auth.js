const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const { Resend } = require("resend");
const db      = require("../db");

const resend = new Resend(process.env.RESEND_API_KEY);
const ALLOWED_EMAILS = ["joshuabaoku@gmail.com", "okunolaglorious@gmail.com"];

// Creator/superadmin — hardcoded allowlist, not tied to any library
const CREATOR_EMAILS = ["baokujoshua@gmail.com", "okunolaglorious@gmail.com", "vaughansurprise@gmail.com"];
// bcrypt hash of your chosen password — generate with: bcrypt.hashSync("yourPasswordHere", 10)
const CREATOR_PASSWORD_HASH = "$2a$10$REPLACE_WITH_YOUR_OWN_HASH";

router.post("/register", async (req, res) => {
  try {
    const { name, libraryName, email, password, libraryType } = req.body;
    if (!name||!libraryName||!email||!password)
      return res.status(400).json({ error: "All fields required" });
    if (!ALLOWED_EMAILS.includes((email||"").trim().toLowerCase()))
      return res.status(403).json({ error: "Registration is invite-only. Contact the administrator." });

    const slug = libraryName.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")+"-"+Date.now();
    const lib  = db.prepare("INSERT INTO libraries (name,slug,type,email) VALUES (?,?,?,?)").run(libraryName,slug,libraryType||"academic",email);
    const hash = bcrypt.hashSync(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const user = db.prepare(
      "INSERT INTO users (library_id,name,email,password_hash,role,email_verified,verify_token) VALUES (?,?,?,?,?,0,?)"
    ).run(lib.lastInsertRowid,name,email,hash,"admin",verifyToken);

    const verifyUrl = `${process.env.FRONTEND_URL||""}/?verify=${verifyToken}`;
    try {
      await resend.emails.send({
        from: "LISAR LMS <onboarding@resend.dev>",
        to: email,
        subject: "Verify your LISAR LMS account",
        html: `<p>Hi ${name},</p><p>Click below to verify your email and activate your library account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
      });
    } catch (mailErr) { console.error("Email send failed:", mailErr.message); }

    res.status(201).json({ message: "Registered. Please check your email to verify your account before logging in." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) return res.status(400).json({ error: "Email and password required" });
    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
   if (!user||!bcrypt.compareSync(password,user.password_hash)) return res.status(401).json({ error: "Invalid email or password" });
    if (!user.active) return res.status(401).json({ error: "Account inactive" });
    if (!user.email_verified) return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox." });
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

router.get("/verify-email", (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Missing token" });
    const user = db.prepare("SELECT * FROM users WHERE verify_token=?").get(token);
    if (!user) return res.status(400).json({ error: "Invalid or expired verification link" });
    db.prepare("UPDATE users SET email_verified=1, verify_token=NULL WHERE id=?").run(user.id);
    res.json({ message: "Email verified! You can now log in." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/creator-login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    if (!CREATOR_EMAILS.includes(email.trim().toLowerCase()))
      return res.status(403).json({ error: "Not authorized" });
    if (!bcrypt.compareSync(password, Eebudola@098))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ email: email.trim().toLowerCase(), role: "creator" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { name: "Creator", email, role: "creator" } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
