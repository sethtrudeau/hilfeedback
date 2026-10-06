import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SEED_BRIEF, SEED_RUBRIC } from "./seed-data";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner','evaluator')),
  evaluator_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  learner_id INTEGER NOT NULL REFERENCES users(id),
  evaluator_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  brief_text TEXT NOT NULL,
  brief_file TEXT,
  rubric_json TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Submitted','Evaluated')),
  feedback_summary TEXT,
  summary_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS artifacts (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artifact_versions (
  id INTEGER PRIMARY KEY,
  artifact_id INTEGER NOT NULL REFERENCES artifacts(id),
  parent_version_id INTEGER REFERENCES artifact_versions(id),
  version_number INTEGER NOT NULL,
  file_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  text_content TEXT,
  link_url TEXT,
  learner_note TEXT,
  audio_mode TEXT CHECK (audio_mode IN ('transcribe','listen')),
  transcript TEXT,
  ai_reviewable INTEGER NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS routing_decisions (
  id INTEGER PRIMARY KEY,
  artifact_version_id INTEGER NOT NULL REFERENCES artifact_versions(id),
  layer TEXT NOT NULL CHECK (layer IN ('rule','manual')),
  reason TEXT NOT NULL,
  requested_by INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS feedback_logs (
  id INTEGER PRIMARY KEY,
  artifact_version_id INTEGER NOT NULL REFERENCES artifact_versions(id),
  source TEXT NOT NULL CHECK (source IN ('ai','human')),
  author_id INTEGER REFERENCES users(id),
  messages_json TEXT NOT NULL DEFAULT '[]',
  audio_file TEXT,
  transcript TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL UNIQUE REFERENCES projects(id),
  evaluator_id INTEGER NOT NULL REFERENCES users(id),
  rubric_scores_json TEXT NOT NULL,
  comments TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function seed(db: Database.Database) {
  const insertUser = db.prepare(
    "INSERT INTO users (email, name, role, evaluator_id) VALUES (?, ?, ?, ?)",
  );
  const evaluatorId = Number(
    insertUser.run("evaluator@labschool.test", "Dr. Morgan Lee", "evaluator", null).lastInsertRowid,
  );
  const avaId = Number(
    insertUser.run("ava@labschool.test", "Ava Chen", "learner", evaluatorId).lastInsertRowid,
  );
  insertUser.run("marcus@labschool.test", "Marcus Johnson", "learner", evaluatorId);
  insertUser.run("priya@labschool.test", "Priya Patel", "learner", evaluatorId);

  db.prepare(
    "INSERT INTO projects (learner_id, evaluator_id, title, brief_text, rubric_json) VALUES (?, ?, ?, ?, ?)",
  ).run(avaId, evaluatorId, "Community Skatepark Design", SEED_BRIEF, JSON.stringify(SEED_RUBRIC));
}

function open(): Database.Database {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  db.transaction(() => {
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    if (n === 0) seed(db);
  }).immediate();
  return db;
}

// Opened lazily (not at import) so parallel build workers don't contend for the file.
// Reuses one connection across dev hot reloads.
const g = globalThis as unknown as { __db?: Database.Database };
export function db(): Database.Database {
  return (g.__db ??= open());
}
