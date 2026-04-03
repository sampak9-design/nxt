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
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
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

export default db;
