import path from 'node:path';
import { defineConfig } from '@prisma/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: 'file:./dev.db',
  },
  migrate: {
    adapter: () => {
      const db = new Database(path.join(process.cwd(), 'dev.db'));
      return new PrismaBetterSqlite3(db);
    },
  },
  migrations: {
    seed: 'node prisma/seed.js',
  },
});