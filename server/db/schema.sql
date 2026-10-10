-- Devbros inquiry database schema

PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT NOT NULL,
  interested_tier TEXT,
  project_details TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  email_status TEXT NOT NULL DEFAULT 'pending',
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_count INTEGER NOT NULL,
  features TEXT NOT NULL,        -- JSON array of feature keys
  cms_needs TEXT NOT NULL,       -- none | editable | migration
  timeline TEXT NOT NULL,        -- standard | rushed
  estimate_cents INTEGER NOT NULL,
  recommended_tier TEXT NOT NULL,
  delivery_days INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  client_type TEXT NOT NULL,
  category TEXT NOT NULL,        -- Healthcare | Retail | Food & Service
  summary TEXT NOT NULL,
  story TEXT NOT NULL,
  stack TEXT NOT NULL,           -- JSON array
  metrics TEXT NOT NULL,         -- JSON array of { label, value }
  services TEXT NOT NULL,        -- JSON array
  year INTEGER NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0
);
