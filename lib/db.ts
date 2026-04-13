import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = process.env.DB_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "zyro.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT    NOT NULL,
    last_name     TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    phone         TEXT,
    password_hash TEXT    NOT NULL,
    demo_balance  REAL    NOT NULL DEFAULT 10000,
    real_balance  REAL    NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    avatar_url    TEXT
  );

  CREATE TABLE IF NOT EXISTS trades (
    id            TEXT    PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    account_type  TEXT    NOT NULL CHECK(account_type IN ('practice','real')),
    asset_id      TEXT    NOT NULL,
    asset_name    TEXT    NOT NULL,
    direction     TEXT    NOT NULL CHECK(direction IN ('up','down')),
    amount        REAL    NOT NULL,
    payout        REAL    NOT NULL,
    entry_price   REAL    NOT NULL,
    exit_price    REAL,
    result        TEXT    CHECK(result IN ('win','lose')),
    net_profit    REAL,
    started_at    INTEGER NOT NULL,
    resolved_at   INTEGER,
    expires_at    INTEGER NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Market candles cache — server-side proxy for ALL assets (Deriv + Binance)
db.exec(`
  CREATE TABLE IF NOT EXISTS market_candles (
    asset TEXT NOT NULL,
    time  INTEGER NOT NULL,
    open  REAL NOT NULL,
    high  REAL NOT NULL,
    low   REAL NOT NULL,
    close REAL NOT NULL,
    PRIMARY KEY (asset, time)
  );
`);
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_market_at ON market_candles (asset, time DESC)`); } catch {}

// Market latest price cache
db.exec(`
  CREATE TABLE IF NOT EXISTS market_prices (
    asset TEXT PRIMARY KEY,
    price REAL NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// OTC base candles — pure Deriv data, no manipulation
db.exec(`
  CREATE TABLE IF NOT EXISTS otc_base (
    asset TEXT NOT NULL,
    time  INTEGER NOT NULL,
    open  REAL NOT NULL,
    high  REAL NOT NULL,
    low   REAL NOT NULL,
    close REAL NOT NULL,
    PRIMARY KEY (asset, time)
  );
`);
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_otc_base_at ON otc_base (asset, time DESC)`); } catch {}

// OTC final — already-composed candles (base + manipulation), tick-accurate
db.exec(`
  CREATE TABLE IF NOT EXISTS otc_final (
    asset TEXT NOT NULL,
    time  INTEGER NOT NULL,
    open  REAL NOT NULL,
    high  REAL NOT NULL,
    low   REAL NOT NULL,
    close REAL NOT NULL,
    PRIMARY KEY (asset, time)
  );
`);
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_otc_final_at ON otc_final (asset, time DESC)`); } catch {}

// Deposits table
db.exec(`
  CREATE TABLE IF NOT EXISTS deposits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    amount      REAL NOT NULL,
    method      TEXT NOT NULL DEFAULT 'pix',
    status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    pix_txid    TEXT,
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    reviewed_at INTEGER
  );
`);

// Withdrawals table
db.exec(`
  CREATE TABLE IF NOT EXISTS withdrawals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    amount      REAL NOT NULL,
    method      TEXT NOT NULL DEFAULT 'pix',
    pix_key     TEXT,
    name        TEXT,
    cpf         TEXT,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    reviewed_at INTEGER
  );
`);

// Support tickets
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    subject     TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open','answered','closed')),
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    updated_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ticket_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id   INTEGER NOT NULL REFERENCES tickets(id),
    sender      TEXT    NOT NULL CHECK(sender IN ('user','admin')),
    message     TEXT    NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
`);

// Migrations — safe to run multiple times
try { db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_marketing INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN kyc_status TEXT NOT NULL DEFAULT 'none'`); } catch {}
try { db.exec(`
  CREATE TABLE IF NOT EXISTS kyc_documents (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id),
    full_name      TEXT NOT NULL,
    cpf            TEXT NOT NULL,
    doc_front_path TEXT NOT NULL,
    doc_back_path  TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    rejection_note TEXT,
    submitted_at   INTEGER NOT NULL,
    reviewed_at    INTEGER
  )
`); } catch {}

try { db.exec(`ALTER TABLE tickets ADD COLUMN user_read_at INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE trades ADD COLUMN is_copy INTEGER NOT NULL DEFAULT 0`); } catch {}

// Copy Trading
db.exec(`
  CREATE TABLE IF NOT EXISTS copy_rooms (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    description  TEXT,
    trader_id    INTEGER NOT NULL REFERENCES users(id),
    price        REAL    NOT NULL DEFAULT 0,
    max_pct      REAL    NOT NULL DEFAULT 10,
    is_active    INTEGER NOT NULL DEFAULT 1,
    created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS copy_followers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id      INTEGER NOT NULL REFERENCES copy_rooms(id),
    user_id      INTEGER NOT NULL REFERENCES users(id),
    status       TEXT    NOT NULL DEFAULT 'pending',
    followed_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    UNIQUE(room_id, user_id)
  );
`);

// Seed admin user
import bcryptjs from "bcryptjs";
(() => {
  const email = "vitormohamedvendas@gmail.com";
  const hash = bcryptjs.hashSync("Ja!@0992", 10);
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (!exists) {
    db.prepare(
      "INSERT INTO users (first_name, last_name, email, phone, password_hash, is_admin) VALUES (?, ?, ?, ?, ?, 1)"
    ).run("Admin", "ZyroOption", email, "", hash);
  } else {
    db.prepare("UPDATE users SET is_admin = 1, password_hash = ? WHERE email = ?").run(hash, email);
  }
})();

export default db;
