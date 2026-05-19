import { readFileSync } from 'fs';

const src = readFileSync('./node_modules/@prisma/adapter-better-sqlite3/dist/index.mjs', 'utf8');
const lines = src.split('\n');

// Print lines around 620
for (let i = 610; i < 635; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
