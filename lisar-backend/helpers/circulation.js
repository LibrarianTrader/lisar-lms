// helpers/circulation.js — Fine calculator + due date + eligibility check
const db = require("../db");

const getLoanRule = (library_id, patron_type) =>
  db.prepare("SELECT * FROM loan_rules WHERE library_id=? AND patron_type=?").get(library_id, patron_type)
  || { loan_days:14, max_renewals:2, max_items:5, fine_per_day:50, max_fine:2500 };

const calcDueDate = (loan_days) => {
  const d = new Date(); d.setDate(d.getDate() + loan_days);
  return d.toISOString().split("T")[0];
};

const calcFine = (due_date, fine_per_day=50, max_fine=2500) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(due_date); due.setHours(0,0,0,0);
  const days  = Math.max(0, Math.floor((today - due) / 86400000));
  return { days_overdue: days, fine_amount: Math.min(days * fine_per_day, max_fine) };
};

const checkPatronEligibility = (library_id, patron_id) => {
  const patron = db.prepare("SELECT * FROM patrons WHERE id=? AND library_id=?").get(patron_id, library_id);
  if (!patron)                       return { ok:false, reason:"Patron not found" };
  if (patron.status === "suspended") return { ok:false, reason:"Patron account is suspended" };
  if (patron.status !== "active")    return { ok:false, reason:"Patron account is not active" };
  const rule    = getLoanRule(library_id, patron.patron_type);
  const active  = db.prepare("SELECT COUNT(*) as c FROM loans WHERE patron_id=? AND library_id=? AND status='active'").get(patron_id, library_id);
  if (active.c >= rule.max_items)    return { ok:false, reason:`Maximum ${rule.max_items} items allowed` };
  return { ok:true, patron, rule };
};

module.exports = { getLoanRule, calcDueDate, calcFine, checkPatronEligibility };

