import { PrismaClient } from './generated/client/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting MASSIVE database seeding for Gold Challenge...');

  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
  const userRole = await prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } });

  const hashedPassword = await bcrypt.hash('Kecske123', 10);

  const aron = await prisma.user.upsert({
    where: { email: 'aron@test.com' },
    update: {},
    create: { name: 'Aron', email: 'aron@test.com', password: hashedPassword, roleId: adminRole.id }
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@test.com' },
    update: {},
    create: { name: 'Alice', email: 'alice@test.com', password: hashedPassword, roleId: userRole.id }
  });

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

  const currentSongs = await prisma.song.count({ where: { partyCode: 'ABC123' } });
  
  if (currentSongs < 10000) {
    console.log('🧹 Clearing old songs to ensure exactly 10,000 for the test...');
    await prisma.song.deleteMany({ where: { partyCode: 'ABC123' } });

    console.log('👥 Generating 50 completely unique users...');
    const fakeUsers = Array.from({ length: 50 }).map((_, idx) => ({
      name: `TestUser_${idx}_${faker.string.alphanumeric(4)}`, 
      email: `user${idx}_${faker.string.alphanumeric(4)}@test.com`, 
      password: hashedPassword,
      roleId: userRole.id
    }));
    await prisma.user.createMany({ data: fakeUsers });
    
    // Fetch all users to assign them to songs
    const allUsers = await prisma.user.findMany();

    console.log('💿 Generating exactly 10,000 songs in safe SQLite batches (20 batches of 500)...');
    
    const BATCH_SIZE = 500;
    for (let i = 0; i < 20; i++) {
      const fakeSongs = Array.from({ length: BATCH_SIZE }).map(() => ({
        title: faker.music.songName(),
        artist: faker.music.artist(),
        album: faker.lorem.words({ min: 1, max: 3 }),
        genre: faker.music.genre(),
        duration: `${faker.number.int({ min: 2, max: 5 })}:${faker.number.int({ min: 10, max: 59 })}`,
        addedBy: allUsers[Math.floor(Math.random() * allUsers.length)].name,
        partyCode: 'ABC123',
        votes: faker.number.int({ min: 0, max: 1000 }),
      }));
      
      await prisma.song.createMany({ data: fakeSongs });
      console.log(`⏳ Batch ${i + 1}/20 complete... (${(i + 1) * 500} songs)`);
    }
  }

  console.log('✅ Massive seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });