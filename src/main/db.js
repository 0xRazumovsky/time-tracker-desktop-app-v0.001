import path from "node:path";
import { randomUUID } from "node:crypto";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { app } from "electron";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function initDatabase() {
  const userData = app.getPath("userData");
  const dbPath = path.join(userData, "flowtime.sqlite");

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;
    PRAGMA mmap_size = 268435456;
    PRAGMA auto_vacuum = INCREMENTAL;
    PRAGMA page_size = 4096;
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tag TEXT,
      color TEXT,
      status TEXT,
      seconds INTEGER DEFAULT 0,
      started_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      task_id TEXT NOT NULL,
      day INTEGER NOT NULL,
      seconds INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (task_id, day),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_day ON sessions(day);
    CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
  `);

  return db;
}

export async function loadState(db) {
  const tasks = await db.all(`SELECT * FROM tasks ORDER BY created_at ASC`);
  const sessions = await db.all(`SELECT task_id as taskId, day, seconds FROM sessions`);
  return { tasks, sessions };
}

export async function saveTask(db, task) {
  const now = Date.now();
  const id = task.id || randomUUID();
  await db.run(
    `
      INSERT INTO tasks (id, title, tag, color, status, seconds, started_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        tag = excluded.tag,
        color = excluded.color,
        status = excluded.status,
        seconds = excluded.seconds,
        started_at = excluded.started_at,
        updated_at = excluded.updated_at;
    `,
    [
      id,
      task.title,
      task.tag || null,
      task.color || null,
      task.status || null,
      task.seconds || 0,
      task.startedAt || null,
      task.createdAt || now,
      now,
    ],
  );
  return { ...task, id };
}

export async function updateTask(db, id, updates) {
  const now = Date.now();
  const fields = [];
  const values = [];

  const addField = (column, value) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (updates.title !== undefined) addField("title", updates.title);
  if (updates.tag !== undefined) addField("tag", updates.tag);
  if (updates.color !== undefined) addField("color", updates.color);
  if (updates.status !== undefined) addField("status", updates.status);
  if (updates.seconds !== undefined) addField("seconds", updates.seconds);
  if (updates.startedAt !== undefined) addField("started_at", updates.startedAt);

  addField("updated_at", now);
  values.push(id);

  await db.run(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function logSession(db, taskId, seconds, timestamp = Date.now()) {
  if (!taskId || !seconds || seconds <= 0) return;
  const day = new Date(timestamp).setHours(0, 0, 0, 0);

  await db.run(
    `
      INSERT INTO sessions (task_id, day, seconds, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(task_id, day) DO UPDATE SET
        seconds = sessions.seconds + excluded.seconds,
        updated_at = excluded.updated_at;
    `,
    [taskId, day, seconds, timestamp],
  );

  await db.run(
    `
      UPDATE tasks
      SET seconds = COALESCE(seconds, 0) + ?, updated_at = ?
      WHERE id = ?;
    `,
    [seconds, timestamp, taskId],
  );
}

export async function resetTaskSeconds(db, taskId) {
  const now = Date.now();
  await db.run(`UPDATE tasks SET seconds = 0, updated_at = ? WHERE id = ?`, [now, taskId]);
  await db.run(`DELETE FROM sessions WHERE task_id = ?`, [taskId]);
}

export async function deleteTask(db, taskId) {
  await db.run(`DELETE FROM sessions WHERE task_id = ?`, [taskId]);
  await db.run(`DELETE FROM tasks WHERE id = ?`, [taskId]);
}
