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

db.exec(`
  CREATE TABLE IF NOT EXISTS otc_asset_config (
    asset           TEXT PRIMARY KEY,
    base            REAL NOT NULL,
    vol             REAL NOT NULL,
    mean_reversion  REAL NOT NULL DEFAULT 0.0002,
    wick_intensity  REAL NOT NULL DEFAULT 1.2,
    decimals        INTEGER NOT NULL DEFAULT 5
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

export default db;
