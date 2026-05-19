import Database from 'better-sqlite3';
const db = new Database('./dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in dev.db:', tables);
db.close();
