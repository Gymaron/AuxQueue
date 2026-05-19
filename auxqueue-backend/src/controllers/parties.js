import { prisma } from '../graphql.js';
import { faker } from '@faker-js/faker';

export const createParty = async (req, res) => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const party = await prisma.party.create({
      data: { name: req.body.name, code }
    });
    res.status(201).json(party);
  } catch (err) {
    console.error('createParty error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getParty = async (req, res) => {
  try {
    const party = await prisma.party.findUnique({ where: { code: req.params.code } });
    if (!party) return res.status(404).json({ error: 'Party not found' });
    res.status(200).json(party);
  } catch (err) {
    console.error('getParty error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateSongs = async (req, res) => {
  try {
    const partyCode = req.params.code;

    // Delete existing songs for this party
    await prisma.song.deleteMany({ where: { partyCode } });

    const artistsPool = Array.from({ length: faker.number.int({ min: 3, max: 6 }) }).map(() => faker.music.artist());
    const contributorsPool = Array.from({ length: faker.number.int({ min: 3, max: 6 }) }).map(() => faker.person.firstName());

    const newSongs = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        prisma.song.create({
          data: {
            title: faker.music.songName(),
            artist: faker.helpers.arrayElement(artistsPool),
            album: faker.lorem.words({ min: 1, max: 3 }),
            genre: faker.music.genre(),
            duration: `${faker.number.int({ min: 2, max: 5 })}:${faker.number.int({ min: 10, max: 59 })}`,
            addedBy: faker.helpers.arrayElement(contributorsPool),
            votes: faker.number.int({ min: 5, max: 100 }),
            partyCode
          }
        })
      )
    );

    res.status(200).json(newSongs);
  } catch (err) {
    console.error('generateSongs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};