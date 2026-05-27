import 'dotenv/config';
import { buildSchema } from 'graphql';
import { PrismaClient } from '../prisma/generated/client/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'dev.db');

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });

export const schema = buildSchema(`
  type Role { id: ID!, name: String! }
  type User { id: ID!, name: String!, email: String!, role: Role, token: String }
  type Party { id: ID!, name: String!, code: String! }
  type Song { id: ID!, title: String!, artist: String!, album: String, genre: String, duration: String, addedBy: String, votes: Int, addedAt: String, partyCode: String }
  type PaginatedSongs { data: [Song], total: Int, page: Int, totalPages: Int }
  type PartyVibeAnalytics { partyCode: String!, totalSongs: Int!, uniqueArtists: Int!, dominantGenre: String!, averageVotes: Float!, topContributor: String!, synergyScore: Float! }
  
  type Log { id: ID!, userId: String!, groupId: String!, action: String!, timestamp: String! }
  type SuspiciousUser { id: ID!, userName: String!, reason: String!, flaggedAt: String! }

  type Query {
    getParty(code: String!): Party
    getSongs(page: Int, limit: Int, partyCode: String, addedBy: String): PaginatedSongs
    getSongById(id: ID!): Song
    getParties: [Party]
    getLogs: [Log]
    getSuspiciousUsers: [SuspiciousUser]
    getHeavyPartyAnalytics(partyCode: String!): PartyVibeAnalytics
  }
  type Mutation {
    register(name: String!, email: String!, password: String!): User
    login(email: String!, password: String!): User
    verify2FA(email: String!, pin: String!): User
    requestPasswordRecovery(email: String!): Boolean
    resetPassword(email: String!, token: String!, newPassword: String!): Boolean
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

const analyzeWithAI = async (userName, actionInfo, recentCount) => {
  try {
    console.log(`\n🧠 [AI Sentinel] Analyzing ${userName}... (Velocity: ${recentCount} actions/30s)`);
    
    const aiResponse = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', 
        prompt: `You are a strict security AI protecting a server. User '${userName}' performed action: '${actionInfo}'. They have done this ${recentCount} times in the last 30 seconds. If they have done it more than 3 times, it is a bot attack and you must reply ONLY with the exact word "MALICIOUS". Otherwise reply "SAFE". Output only one word.`,
        stream: false
      })
    });
    
    const aiData = await aiResponse.json();
    const decision = aiData.response.trim();
    console.log(`🤖 [AI Sentinel] Decision for ${userName}: ${decision}\n`);

    if (decision.includes('MALICIOUS')) {
       await prisma.suspiciousUser.upsert({
          where: { userName },
          update: { reason: 'AI SENTINEL DETECTED BOT BEHAVIOR', flaggedAt: new Date() },
          create: { userName, reason: 'AI SENTINEL DETECTED BOT BEHAVIOR' }
       });
    }
  } catch (e) {
    console.log(`⚠️ [AI Sentinel Error] Could not connect to local Ollama! Is 'ollama run llama3' running in a separate terminal? Error: ${e.message}`);
  }
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
    
    let recentLogs = 1;

    if (actionInfo.includes('Added song')) {
      recentLogs = await prisma.log.count({
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

    analyzeWithAI(userName, actionInfo, recentLogs);

  } catch (err) {}
};

const checkAuth = (req, requiredRole = null) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Not authenticated');
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (requiredRole && decoded.role !== requiredRole && decoded.role !== 'ADMIN') {
      throw new Error('Unauthorized role level');
    }
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
};

let genIntervals = {};
const analyticsCache = new Map();
const CACHE_TTL = 10000; 

export const rootValue = {
  register: async ({ name, email, password }) => {
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { name }] } });
    if (existing) throw new Error('Name or email already exists');
    const { userRole } = await ensureRoles();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashedPassword, roleId: userRole.id }, include: { role: true } });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { ...user, token };
  },
  login: async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');
    
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n🔒 [3-WAY AUTH] 2FA PIN for ${email}: ${pin}\n`);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorPin: pin, twoFactorExpires: new Date(Date.now() + 10 * 60000) }
    });
    
    return { ...user, token: "PENDING_2FA" };
  },
  verify2FA: async ({ email, pin }) => {
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user || user.twoFactorPin !== pin || new Date() > user.twoFactorExpires) {
      throw new Error('Invalid or expired PIN');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorPin: null, twoFactorExpires: null }
    });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { ...user, token };
  },
  requestPasswordRecovery: async ({ email }) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      console.log(`\n🔑 [RECOVERY] Password Reset Token for ${email}: ${token}\n`);
      await prisma.user.update({
        where: { id: user.id },
        data: { recoveryToken: token, recoveryExpires: new Date(Date.now() + 15 * 60000) }
      });
    }
    return true;
  },
  resetPassword: async ({ email, token, newPassword }) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.recoveryToken !== token || new Date() > user.recoveryExpires) {
      throw new Error('Invalid or expired recovery token');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, recoveryToken: null, recoveryExpires: null }
    });
    return true;
  },
  createParty: async ({ name }, context) => {
    checkAuth(context.req);
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
  getLogs: async (args, context) => {
    checkAuth(context.req, 'ADMIN');
    return await prisma.log.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
  },
  getSuspiciousUsers: async (args, context) => {
    checkAuth(context.req, 'ADMIN');
    return await prisma.suspiciousUser.findMany({ orderBy: { flaggedAt: 'desc' } });
  },
  getHeavyPartyAnalytics: async ({ partyCode }, context) => {
    checkAuth(context.req);

    const cached = analyticsCache.get(partyCode);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`⚡ [DDOS DEFENSE] Serving ${partyCode} analytics from Cache`);
      return cached.data;
    }

    const allSongs = await prisma.song.findMany({ where: { partyCode } });

    let totalVotes = 0;
    const artists = new Set();
    const genres = {};
    const contributors = {};

    for (const song of allSongs) {
      totalVotes += song.votes;
      artists.add(song.artist);
      genres[song.genre] = (genres[song.genre] || 0) + 1;
      contributors[song.addedBy] = (contributors[song.addedBy] || 0) + song.votes;
    }

    const dominantGenre = Object.keys(genres).length ? Object.keys(genres).reduce((a, b) => genres[a] > genres[b] ? a : b) : "Unknown";
    const topContributor = Object.keys(contributors).length ? Object.keys(contributors).reduce((a, b) => contributors[a] > contributors[b] ? a : b) : "Unknown";

    let synergyScore = 0;
    for (const count of Object.values(genres)) {
      if (count > 1) {
         synergyScore += (count * (count - 1)) * 0.001;
      }
    }

    const result = {
      partyCode,
      totalSongs: allSongs.length,
      uniqueArtists: artists.size,
      dominantGenre,
      averageVotes: allSongs.length > 0 ? totalVotes / allSongs.length : 0,
      topContributor,
      synergyScore
    };

    analyticsCache.set(partyCode, { timestamp: Date.now(), data: result });
    return result;
  },
  addSong: async (args, context) => {
    checkAuth(context.req);
    const song = await prisma.song.create({ data: { ...args, votes: 0 } });
    await stealthLogger(args.addedBy, `Added song: ${args.title}`);
    return song;
  },
  updateSong: async ({ id, title, artist }, context) => {
    checkAuth(context.req);
    return await prisma.song.update({ where: { id }, data: { title, artist } });
  },
  deleteSong: async ({ id }, context) => {
    checkAuth(context.req, 'ADMIN'); 
    await prisma.song.delete({ where: { id } });
    return true;
  },
  voteSong: async ({ id, delta }, context) => {
    checkAuth(context.req);
    const song = await prisma.song.findUnique({ where: { id } });
    if (!song) return null;
    return await prisma.song.update({
      where: { id },
      data: { votes: Math.max(0, song.votes + delta) }
    });
  },
  startGeneration: ({ code }, context) => {
    checkAuth(context.req, 'ADMIN');
    if (!genIntervals[code]) {
      genIntervals[code] = setInterval(async () => {
        try {
          const party = await prisma.party.findUnique({ where: { code } });
          if (!party) await prisma.party.create({ data: { name: 'Live Party', code } });
          let user = await prisma.user.findUnique({ where: { name: 'Aron' } });
          if (!user) {
            const { adminRole } = await ensureRoles();
            const hp = await bcrypt.hash('123', 10);
            user = await prisma.user.create({ data: { name: 'Aron', email: `aron@test.com`, password: hp, roleId: adminRole.id } });
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
        } catch (error) {}
      }, 4000);
    }
    return true;
  },
  stopGeneration: ({ code }, context) => {
    checkAuth(context.req, 'ADMIN');
    clearInterval(genIntervals[code]);
    delete genIntervals[code];
    return true;
  }
};