// middleware/auth.js — JWT verification + role guards + audit logger
const jwt = require("jsonwebtoken");
const db  = require("../db");

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare(
      "SELECT id, library_id, name, email, role, active FROM users WHERE id = ?"
    ).get(payload.id);
    if (!user || !user.active) return res.status(401).json({ error: "Invalid or inactive account" });
    req.user = user; req.library_id = user.library_id;
    next();
  } catch { return res.status(401).json({ error: "Token expired or invalid" }); }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: `Requires role: ${roles.join(" or ")}` });
  next();
};

const audit = (action, entity) => (req, res, next) => {
  const orig = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400 && req.user) {
      try {
        db.prepare(`INSERT INTO audit_log (library_id,user_id,action,entity,entity_id,detail,ip)
          VALUES (?,?,?,?,?,?,?)`).run(
          req.user.library_id, req.user.id, action, entity,
          body?.id || body?.data?.id || null,
          JSON.stringify({ method: req.method, path: req.path }), req.ip
        );
      } catch(_) {}
    }
    return orig(body);
  };
  next();
};

module.exports = { authenticate, requireRole, audit };

