-- Referans şema: uygulama açılışında IF NOT EXISTS ile oluşturulur.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ticks(seq INTEGER PRIMARY KEY AUTOINCREMENT,symbol TEXT,price REAL,at TEXT);
 CREATE TABLE IF NOT EXISTS watch(owner TEXT REFERENCES users(id),symbol TEXT,PRIMARY KEY(owner,symbol));
 CREATE TABLE IF NOT EXISTS alerts(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),symbol TEXT,threshold REAL,armed INTEGER DEFAULT 1,triggered_at TEXT);
