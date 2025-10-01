import Database from 'better-sqlite3';
import { config } from './config';
import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string; // ISO date YYYY-MM-DD (no time)
  timezone: string; // IANA timezone, e.g., America/New_York
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface DeliveryRecord {
  id: string;
  userId: string;
  deliveryDate: string; // YYYY-MM-DD in user local date
  deliveredAt: string | null; // ISO time when actually delivered
  dedupeKey: string; // unique per user+date
}

// Ensure database directory exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.databasePath);

db.pragma('journal_mode = WAL');

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      timezone TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      delivered_at TEXT,
      dedupe_key TEXT NOT NULL UNIQUE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_deliveries_user_date ON deliveries(user_id, delivery_date);
  `);
}

// Ensure schema exists before preparing statements
migrate();

export const statements = {
  insertUser: db.prepare(`INSERT INTO users (id, first_name, last_name, birthday, timezone, created_at, updated_at) VALUES (@id, @firstName, @lastName, @birthday, @timezone, @createdAt, @updatedAt)`),
  updateUser: db.prepare(`UPDATE users SET first_name=@firstName, last_name=@lastName, birthday=@birthday, timezone=@timezone, updated_at=@updatedAt WHERE id=@id`),
  deleteUser: db.prepare(`DELETE FROM users WHERE id=?`),
  getUser: db.prepare(`SELECT id, first_name as firstName, last_name as lastName, birthday, timezone, created_at as createdAt, updated_at as updatedAt FROM users WHERE id=?`),
  listUsers: db.prepare(`SELECT id, first_name as firstName, last_name as lastName, birthday, timezone, created_at as createdAt, updated_at as updatedAt FROM users`),

  upsertDelivery: db.prepare(`INSERT INTO deliveries (id, user_id, delivery_date, delivered_at, dedupe_key) VALUES (@id, @userId, @deliveryDate, @deliveredAt, @dedupeKey) ON CONFLICT(dedupe_key) DO NOTHING`),
  markDelivered: db.prepare(`UPDATE deliveries SET delivered_at=@deliveredAt WHERE id=@id AND delivered_at IS NULL`),
  getPendingDeliveries: db.prepare(`SELECT id, user_id as userId, delivery_date as deliveryDate, delivered_at as deliveredAt, dedupe_key as dedupeKey FROM deliveries WHERE delivered_at IS NULL`),
  findDeliveryByKey: db.prepare(`SELECT id, user_id as userId, delivery_date as deliveryDate, delivered_at as deliveredAt, dedupe_key as dedupeKey FROM deliveries WHERE dedupe_key=?`),
  getPendingDeliveriesWithUsers: db.prepare(`
    SELECT d.id as id, d.user_id as userId, d.delivery_date as deliveryDate, d.delivered_at as deliveredAt, d.dedupe_key as dedupeKey,
           u.first_name as firstName, u.last_name as lastName, u.timezone as timezone
    FROM deliveries d INNER JOIN users u ON u.id = d.user_id
    WHERE d.delivered_at IS NULL
  `),
};

