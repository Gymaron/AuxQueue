import { rootValue, prisma } from '../src/graphql.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Database CRUD Operations & Coverage', () => {
  let testSongId;
  let testEmail;

  beforeAll(() => {
    // Suppress console.error for expected errors (like our intentional edge cases)
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

afterAll(async () => {
    await prisma.party.deleteMany({
      where: { OR: [{ name: 'Jest Test Party' }, { code: 'TESTGEN' }] }
    });

    await prisma.user.deleteMany({
      where: { OR: [{ name: { startsWith: 'TestUser_' } }, { name: { startsWith: 'Duplicate_' } }] }
    });

    await prisma.song.deleteMany({ where: { title: 'Bohemian Rhapsody' } });
    await prisma.log.deleteMany({ where: { action: { contains: 'Bohemian Rhapsody' } } });

    console.error.mockRestore();

    await prisma.$disconnect();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect(); 
    }
  });

  describe('User & Party Operations (Happy Path)', () => {
    test('CREATE & READ: User registration and login', async () => {
      testEmail = `testuser_${Date.now()}@test.com`;
      const password = 'password123';
      
      const user = await rootValue.register({ name: `TestUser_${Date.now()}`, email: testEmail, password });
      expect(user).toBeDefined();

      const loggedIn = await rootValue.login({ email: testEmail, password });
      expect(loggedIn.email).toBe(testEmail);
    });

    test('CREATE & READ: Party operations', async () => {
      const party = await rootValue.createParty({ name: 'Jest Test Party' });
      expect(party).toBeDefined();

      const fetched = await rootValue.getParty({ code: 'ABC123' });
      expect(fetched).toBeDefined();
    });

    // COVERAGE FIX: Line 82
    test('READ: Fetch all recent parties', async () => {
      const parties = await rootValue.getParties();
      expect(parties.length).toBeGreaterThan(0);
    });
  });

  describe('Song CRUD Operations (Happy Path)', () => {
    test('CREATE: Add a new song to queue', async () => {
      await rootValue.addSong({
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        addedBy: 'Alice',
        partyCode: 'ABC123'
      });

      const song = await prisma.song.findFirst({
        where: { title: 'Bohemian Rhapsody' },
        orderBy: { addedAt: 'desc' }
      });

      expect(song).not.toBeNull();
      testSongId = song.id; 
    });

    test('READ: Fetch song by ID', async () => {
      const song = await rootValue.getSongById({ id: testSongId });
      expect(song).toBeDefined();
    });

    test('READ: Fetch paginated songs for a party', async () => {
      const result = await rootValue.getSongs({ page: 1, limit: 10, partyCode: 'ABC123' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    // COVERAGE FIX: Test the addedBy filter parameter
    test('READ: Fetch songs filtered by addedBy', async () => {
      const result = await rootValue.getSongs({ page: 1, limit: 10, addedBy: 'Alice' });
      expect(result.data).toBeDefined();
    });

    test('UPDATE: Vote on a song', async () => {
      await rootValue.voteSong({ id: testSongId, delta: 1 });
      const updated = await prisma.song.findUnique({ where: { id: testSongId } });
      expect(updated.votes).toBe(1);
    });

    test('UPDATE: Edit song title and artist', async () => {
      await rootValue.updateSong({
        id: testSongId,
        title: 'Under Pressure',
        artist: 'Queen & David Bowie'
      });
      const updated = await prisma.song.findUnique({ where: { id: testSongId } });
      expect(updated.title).toBe('Under Pressure');
    });

    test('DELETE: Remove song from queue', async () => {
      await rootValue.deleteSong({ id: testSongId });
      const checkSong = await prisma.song.findUnique({ where: { id: testSongId } });
      expect(checkSong).toBeNull();
    });
  });

  describe('Error Handling & Edge Cases (Unhappy Path)', () => {
    // COVERAGE FIX: Duplicate Registration Error
    test('ERROR: Registration fails if email already exists', async () => {
      await expect(rootValue.register({ name: `Duplicate_${Date.now()}`, email: testEmail, password: '123' }))
        .rejects.toThrow('Name or email already exists');
    });

    test('ERROR: Login fails with invalid password', async () => {
      await expect(rootValue.login({ email: testEmail, password: 'WRONGPASSWORD' }))
        .rejects.toThrow('Invalid credentials');
    });

    test('ERROR: Login fails with non-existent email', async () => {
      await expect(rootValue.login({ email: 'doesnotexist@test.com', password: '123' }))
        .rejects.toThrow('Invalid credentials');
    });

    test('EDGE: Fetch party that does not exist returns null', async () => {
      const party = await rootValue.getParty({ code: 'INVALID_CODE' });
      expect(party).toBeNull();
    });

    test('EDGE: Fetch song that does not exist returns null', async () => {
      const song = await rootValue.getSongById({ id: 'invalid-uuid-1234' });
      expect(song).toBeNull();
    });

    // COVERAGE FIX: Voting on a song that doesn't exist returns null
    test('EDGE: Vote on non-existent song returns null', async () => {
      const result = await rootValue.voteSong({ id: 'invalid-uuid-1234', delta: 1 });
      expect(result).toBeNull();
    });

    test('EDGE: Fetch empty page of songs', async () => {
      const result = await rootValue.getSongs({ page: 999, limit: 10, partyCode: 'ABC123' });
      expect(result.data.length).toBe(0);
    });
  });

  // COVERAGE FIX: Lines 110-148 (Generation Logic)
  describe('WebSockets & Generation Features', () => {
    test('FEATURE: startGeneration and stopGeneration intervals', async () => {
      // 1. Tell Jest to hijack standard JavaScript timers
      jest.useFakeTimers();
      
      // 2. Start the generator
      const started = await rootValue.startGeneration({ code: 'TESTGEN' });
      expect(started).toBe(true);

      // 3. Fast-forward time by 4.5 seconds to trigger the 4000ms setInterval callback
      await jest.advanceTimersByTimeAsync(4500);

      // 4. Stop the generator
      const stopped = await rootValue.stopGeneration({ code: 'TESTGEN' });
      expect(stopped).toBe(true);

      // 5. Restore normal timers
      jest.useRealTimers();
      
      // 6. Verify that the interval actually ran and created the party/user
      const party = await prisma.party.findUnique({ where: { code: 'TESTGEN' } });
      expect(party).not.toBeNull();
    });
  });
});