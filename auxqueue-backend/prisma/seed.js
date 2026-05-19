import { PrismaClient } from './generated/client/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { faker } from '@faker-js/faker';

// FIXED: Using the correct Prisma 7 adapter initialization
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Roles
  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
  const userRole = await prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } });

  // 2. Create Test Users
  const aron = await prisma.user.upsert({
    where: { email: 'aron@test.com' },
    update: {},
    create: { name: 'Aron', email: 'aron@test.com', password: 'Kecske123', roleId: adminRole.id }
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@test.com' },
    update: {},
    create: { name: 'Alice', email: 'alice@test.com', password: 'Kecske123', roleId: userRole.id }
  });

  // 3. Create Demo Parties
  const party1 = await prisma.party.upsert({
    where: { code: 'ABC123' },
    update: {},
    create: { name: 'Weekend Vibes', code: 'ABC123' }
  });

  const party2 = await prisma.party.upsert({
    where: { code: 'XYZ789' },
    update: {},
    create: { name: 'Study Session', code: 'XYZ789' }
  });

  // 4. Generate Fake Songs for Party 1
  const existingSongs = await prisma.song.count({ where: { partyCode: 'ABC123' } });
  if (existingSongs === 0) {
    const fakeSongs = Array.from({ length: 5 }).map(() => ({
      title: faker.music.songName(),
      artist: faker.music.artist(),
      album: faker.lorem.words({ min: 1, max: 3 }),
      genre: faker.music.genre(),
      duration: `${faker.number.int({ min: 2, max: 5 })}:${faker.number.int({ min: 10, max: 59 })}`,
      addedBy: aron.name,
      partyCode: party1.code,
      votes: faker.number.int({ min: 5, max: 50 }),
    }));
    await prisma.song.createMany({ data: fakeSongs });
  }

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });