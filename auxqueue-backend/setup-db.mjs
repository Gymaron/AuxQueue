import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'dev.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS "User" (
    "id"       TEXT NOT NULL PRIMARY KEY,
    "name"     TEXT NOT NULL UNIQUE,
    "email"    TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "Party" (
    "id"   TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS "Song" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "title"     TEXT NOT NULL,
    "artist"    TEXT NOT NULL,
    "album"     TEXT,
    "genre"     TEXT,
    "duration"  TEXT,
    "votes"     INTEGER NOT NULL DEFAULT 0,
    "addedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partyCode" TEXT,
    "addedBy"   TEXT,
    CONSTRAINT "Song_partyCode_fkey" FOREIGN KEY ("partyCode") REFERENCES "Party" ("code") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Song_addedBy_fkey"   FOREIGN KEY ("addedBy")   REFERENCES "User"  ("name") ON DELETE CASCADE ON UPDATE CASCADE
  );
`);

console.log('✅ Database tables created successfully in dev.db');
db.close();
