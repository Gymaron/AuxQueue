import 'dotenv/config';
import { buildSchema } from 'graphql';
import { PrismaClient } from '../prisma/generated/client/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'dev.db');

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });

export const schema = buildSchema(`
  type Role { id: ID!, name: String! }
  type User { id: ID!, name: String!, email: String!, role: Role }
  type Party { id: ID!, name: String!, code: String! }
  type Song { id: ID!, title: String!, artist: String!, album: String, genre: String, duration: String, addedBy: String, votes: Int, addedAt: String, partyCode: String }
  type PaginatedSongs { data: [Song], total: Int, page: Int, totalPages: Int }
  
  type Log { id: ID!, userId: String!, groupId: String!, action: String!, timestamp: String! }
  type SuspiciousUser { id: ID!, userName: String!, reason: String!, flaggedAt: String! }

  type Query {
    getParty(code: String!): Party
    getSongs(page: Int, limit: Int, partyCode: String, addedBy: String): PaginatedSongs
    getSongById(id: ID!): Song
    getParties: [Party]
    getLogs: [Log]
    getSuspiciousUsers: [SuspiciousUser]
  }
  type Mutation {
    register(name: String!, email: String!, password: String!): User
    login(email: String!, password: String!): User
    createParty(name: String!): Party
    addSong(title: String!, artist: String!, album: String, genre: String, duration: String, addedBy: String!, partyCode: String): Song
    updateSong(id: ID!, title: String, artist: String): Song
    deleteSong(id: ID!): Boolean
    voteSong(id: ID!, delta: Int!): Song
    startGeneration(code: String!): Boolean
    stopGeneration(code: String!): Boolean
  }
`);

const ensureRoles = async () => {
  let userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  if (!userRole) userRole = await prisma.role.create({ data: { name: 'USER' } });
  
  let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) adminRole = await prisma.role.create({ data: { name: 'ADMIN' } });
  
  return { userRole, adminRole };
};

const stealthLogger = async (userName, actionInfo) => {
  if (!userName || userName === 'Anonymous') return;
  try {
    const user = await prisma.user.findUnique({ where: { name: userName }, include: { role: true } });
    if (!user) return;

    const groupId = user.role?.name || 'USER';

    await prisma.log.create({
      data: { userId: user.id, groupId: groupId, action: actionInfo }
    });

    if (actionInfo.includes('Added song')) {
      const recentLogs = await prisma.log.count({
        where: {
          userId: user.id,
          action: { contains: 'Added song' },
          timestamp: { gte: new Date(Date.now() - 30000) }
        }
      });

      if (recentLogs > 3) {
        await prisma.suspiciousUser.upsert({
          where: { userName: user.name },
          update: { reason: 'SPAM DETECTED: Added >3 songs in 30 seconds', flaggedAt: new Date() },
          create: { userName: user.name, reason: 'SPAM DETECTED: Added >3 songs in 30 seconds' }
        });
      }
    }
  } catch (err) {
    console.error("Stealth Logger Error:", err);
  }
};

let genIntervals = {};

export const rootValue = {
  register: async ({ name, email, password }) => {
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { name }] } });
    if (existing) throw new Error('Name or email already exists');
    const { userRole } = await ensureRoles();
    return await prisma.user.create({ data: { name, email, password, roleId: userRole.id }, include: { role: true } });
  },
  login: async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user || user.password !== password) throw new Error('Invalid credentials');
    return user;
  },
  createParty: async ({ name }) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return await prisma.party.create({ data: { name, code } });
  },
  getParty: async ({ code }) => await prisma.party.findUnique({ where: { code } }),
  getParties: async () => await prisma.party.findMany({ take: 5, orderBy: { id: 'desc' } }),
  getSongs: async ({ page = 1, limit = 10, partyCode, addedBy }) => {
    const where = {};
    if (partyCode) where.partyCode = partyCode;
    if (addedBy) where.addedBy = addedBy;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.song.findMany({ where, skip, take: limit, orderBy: { votes: 'desc' } }),
      prisma.song.count({ where })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) || 1 };
  },
  getSongById: async ({ id }) => await prisma.song.findUnique({ where: { id } }),
  getLogs: async () => await prisma.log.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }),
  getSuspiciousUsers: async () => await prisma.suspiciousUser.findMany({ orderBy: { flaggedAt: 'desc' } }),
  addSong: async (args) => {
    const song = await prisma.song.create({ data: { ...args, votes: 0 } });
    await stealthLogger(args.addedBy, `Added song: ${args.title}`);
    return song;
  },
  updateSong: async ({ id, title, artist }) => await prisma.song.update({ where: { id }, data: { title, artist } }),
  deleteSong: async ({ id }) => {
    await prisma.song.delete({ where: { id } });
    return true;
  },
  voteSong: async ({ id, delta }) => {
    const song = await prisma.song.findUnique({ where: { id } });
    if (!song) return null;
    return await prisma.song.update({
      where: { id },
      data: { votes: Math.max(0, song.votes + delta) }
    });
  },
  startGeneration: ({ code }) => {
    if (!genIntervals[code]) {
      genIntervals[code] = setInterval(async () => {
        try {
          const party = await prisma.party.findUnique({ where: { code } });
          if (!party) await prisma.party.create({ data: { name: 'Live Party', code } });

          let user = await prisma.user.findUnique({ where: { name: 'Aron' } });
          if (!user) {
            const { adminRole } = await ensureRoles();
            user = await prisma.user.create({ data: { name: 'Aron', email: `aron@test.com`, password: '123', roleId: adminRole.id } });
          }

          const newSongsData = Array.from({ length: 3 }).map(() => ({
            title: faker.music.songName(),
            artist: faker.music.artist(),
            album: faker.lorem.words({ min: 1, max: 3 }),
            genre: faker.music.genre(),
            duration: `${faker.number.int({ min: 2, max: 5 })}:${faker.number.int({ min: 10, max: 59 })}`,
            addedBy: 'Aron',
            partyCode: code,
            votes: faker.number.int({ min: 5, max: 100 }),
          }));

          await prisma.song.createMany({ data: newSongsData });
          const createdSongs = await prisma.song.findMany({ take: 3, orderBy: { addedAt: 'desc' }});
          
          const { broadcast } = await import('./server.js');
          broadcast({ type: 'NEW_SONGS', partyCode: code, songs: createdSongs });
        } catch (error) {
          console.error("Generation Error:", error);
        }
      }, 4000);
    }
    return true;
  },
  stopGeneration: ({ code }) => {
    clearInterval(genIntervals[code]);
    delete genIntervals[code];
    return true;
  }
};