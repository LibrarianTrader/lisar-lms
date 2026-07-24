// ═══════════════════════════════════════════════════════════
//  db.js — SQLite database schema & connection
//  Uses better-sqlite3 (synchronous, no async needed)
// ═══════════════════════════════════════════════════════════
const Database = require("better-sqlite3");
const path     = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "lisar.db");
const db      = new Database(DB_PATH);

// Performance pragmas
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Add password_hash column if it doesn't exist (migration)
try { db.exec("ALTER TABLE patrons ADD COLUMN password_hash TEXT"); } catch(_) {}

// ─── SCHEMA ──────────────────────────────────────────────────
db.exec(`

-- ── Libraries (tenants) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS libraries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  type        TEXT    NOT NULL DEFAULT 'academic',
  plan        TEXT    NOT NULL DEFAULT 'starter',
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  logo_url    TEXT,
  settings    TEXT    DEFAULT '{}',
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ── Staff users ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id    INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'librarian',
  active        INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  verify_token   TEXT,
  last_login    TEXT,
  created_at    TEXT    DEFAULT (datetime('now')),
  UNIQUE(email, library_id)
);

-- ── Bibliographic records ────────────────────────────────
CREATE TABLE IF NOT EXISTS bibs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id    INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  title         TEXT    NOT NULL,
  subtitle      TEXT,
  author        TEXT,
  publisher     TEXT,
  place         TEXT,
  year          TEXT,
  edition       TEXT,
  isbn          TEXT,
  issn          TEXT,
  pages         TEXT,
  language      TEXT    DEFAULT 'eng',
  format        TEXT    DEFAULT 'Book',
  ddc           TEXT,
  lcc           TEXT,
  subject       TEXT,
  description   TEXT,
  cover_url     TEXT,
  dc_record     TEXT    DEFAULT '{}',
  marc_record   TEXT    DEFAULT '{}',
  source        TEXT    DEFAULT 'manual',
  created_by    INTEGER REFERENCES users(id),
  created_at    TEXT    DEFAULT (datetime('now')),
  updated_at    TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bibs_library   ON bibs(library_id);
CREATE INDEX IF NOT EXISTS idx_bibs_isbn      ON bibs(isbn);
CREATE VIRTUAL TABLE IF NOT EXISTS bibs_fts USING fts5(
  title, author, subject, isbn, content='bibs', content_rowid='id'
);

-- ── Physical items (copies) ──────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id  INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  bib_id      INTEGER NOT NULL REFERENCES bibs(id) ON DELETE CASCADE,
  barcode     TEXT    NOT NULL,
  call_number TEXT,
  location    TEXT    DEFAULT 'General Stacks',
  status      TEXT    NOT NULL DEFAULT 'available',
  condition   TEXT    DEFAULT 'good',
  notes       TEXT,
  created_at  TEXT    DEFAULT (datetime('now')),
  UNIQUE(barcode, library_id)
);

CREATE INDEX IF NOT EXISTS idx_items_library ON items(library_id);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_bib     ON items(bib_id);

-- ── Patrons (library members) ────────────────────────────
CREATE TABLE IF NOT EXISTS patrons (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id   INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  email        TEXT,
  phone        TEXT,
  barcode      TEXT    NOT NULL,
  patron_type  TEXT    NOT NULL DEFAULT 'undergraduate',
  department   TEXT,
  photo_url    TEXT,
  reg_date     TEXT    DEFAULT (date('now')),
  expiry_date  TEXT,
  status       TEXT    NOT NULL DEFAULT 'active',
  notes        TEXT,
  password_hash TEXT,
  created_at   TEXT    DEFAULT (datetime('now')),
  UNIQUE(barcode, library_id)
);

CREATE INDEX IF NOT EXISTS idx_patrons_library ON patrons(library_id);
CREATE INDEX IF NOT EXISTS idx_patrons_barcode ON patrons(barcode);

-- ── Loans ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id    INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  item_id       INTEGER NOT NULL REFERENCES items(id),
  patron_id     INTEGER NOT NULL REFERENCES patrons(id),
  checked_out_by INTEGER REFERENCES users(id),
  checkout_date TEXT    NOT NULL DEFAULT (date('now')),
  due_date      TEXT    NOT NULL,
  return_date   TEXT,
  renewed_count INTEGER DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'active',
  fine_amount   REAL    DEFAULT 0,
  fine_paid     INTEGER DEFAULT 0,
  notes         TEXT,
  created_at    TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_loans_library ON loans(library_id);
CREATE INDEX IF NOT EXISTS idx_loans_patron  ON loans(patron_id);
CREATE INDEX IF NOT EXISTS idx_loans_item    ON loans(item_id);
CREATE INDEX IF NOT EXISTS idx_loans_status  ON loans(status);

-- ── Holds / Reservations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS holds (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id   INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  bib_id       INTEGER NOT NULL REFERENCES bibs(id),
  patron_id    INTEGER NOT NULL REFERENCES patrons(id),
  request_date TEXT    DEFAULT (datetime('now')),
  expiry_date  TEXT,
  status       TEXT    NOT NULL DEFAULT 'pending',
  notified     INTEGER DEFAULT 0,
  queue_pos    INTEGER DEFAULT 1
);

-- ── Fines ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fines (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id   INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  loan_id      INTEGER NOT NULL REFERENCES loans(id),
  patron_id    INTEGER NOT NULL REFERENCES patrons(id),
  amount       REAL    NOT NULL,
  reason       TEXT    DEFAULT 'overdue',
  paid         INTEGER DEFAULT 0,
  paid_date    TEXT,
  paid_by      INTEGER REFERENCES users(id),
  created_at   TEXT    DEFAULT (datetime('now'))
);

-- ── Acquisitions orders ──────────────────────────────────
CREATE TABLE IF NOT EXISTS acq_orders (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id   INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  author       TEXT,
  isbn         TEXT,
  publisher    TEXT,
  vendor       TEXT,
  quantity     INTEGER DEFAULT 1,
  unit_cost    REAL    DEFAULT 0,
  total_cost   REAL    DEFAULT 0,
  fund_code    TEXT,
  order_date   TEXT    DEFAULT (date('now')),
  received_date TEXT,
  status       TEXT    DEFAULT 'pending',
  notes        TEXT,
  ordered_by   INTEGER REFERENCES users(id),
  created_at   TEXT    DEFAULT (datetime('now'))
);

-- ── Serials subscriptions ────────────────────────────────
CREATE TABLE IF NOT EXISTS serials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id    INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  title         TEXT    NOT NULL,
  issn          TEXT,
  publisher     TEXT,
  frequency     TEXT,
  start_date    TEXT,
  end_date      TEXT,
  annual_cost   REAL    DEFAULT 0,
  vendor        TEXT,
  location      TEXT,
  status        TEXT    DEFAULT 'active',
  notes         TEXT,
  created_at    TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS serial_issues (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id   INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  serial_id    INTEGER NOT NULL REFERENCES serials(id) ON DELETE CASCADE,
  volume       TEXT,
  issue_number TEXT,
  pub_date     TEXT,
  received_date TEXT,
  status       TEXT    DEFAULT 'expected',
  binding_status TEXT  DEFAULT 'unbound',
  notes        TEXT
);

CREATE TABLE IF NOT EXISTS lost_found (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id     INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  description    TEXT    NOT NULL,
  category       TEXT    NOT NULL DEFAULT 'other',
  location_found TEXT,
  date_found     TEXT    NOT NULL DEFAULT (date('now')),
  status         TEXT    NOT NULL DEFAULT 'unclaimed',
  claimed_by     TEXT,
  claimed_date   TEXT,
  notes          TEXT,
  created_at     TEXT    DEFAULT (datetime('now'))
);

-- ── Interlibrary Loan ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ill_requests (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id     INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  request_type   TEXT    NOT NULL DEFAULT 'borrow',
  title          TEXT    NOT NULL,
  author         TEXT,
  isbn           TEXT,
  patron_id      INTEGER REFERENCES patrons(id),
  partner_library TEXT,
  partner_email  TEXT,
  request_date   TEXT    DEFAULT (date('now')),
  due_date       TEXT,
  return_date    TEXT,
  status         TEXT    DEFAULT 'pending',
  notes          TEXT,
  requested_by   INTEGER REFERENCES users(id),
  created_at     TEXT    DEFAULT (datetime('now'))
);

-- ── Loan rules ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_rules (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id    INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  patron_type   TEXT    NOT NULL,
  loan_days     INTEGER NOT NULL DEFAULT 14,
  max_renewals  INTEGER NOT NULL DEFAULT 2,
  max_items     INTEGER NOT NULL DEFAULT 5,
  fine_per_day  REAL    NOT NULL DEFAULT 50,
  max_fine      REAL    NOT NULL DEFAULT 2500,
  UNIQUE(library_id, patron_type)
);

-- ── Audit log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id  INTEGER REFERENCES libraries(id),
  user_id     INTEGER REFERENCES users(id),
  action      TEXT    NOT NULL,
  entity      TEXT,
  entity_id   INTEGER,
  detail      TEXT,
  ip          TEXT,
  created_at  TEXT    DEFAULT (datetime('now'))
);

`);

module.exports = db;
