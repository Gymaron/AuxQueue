import { faker } from '@faker-js/faker';

const generateSeedSongs = (count, partyCode, specificUser = null) => {
  const artistsPool = Array.from({ length: faker.number.int({ min: 3, max: 6 }) }).map(() => faker.music.artist());
  const contributorsPool = Array.from({ length: faker.number.int({ min: 3, max: 6 }) }).map(() => faker.person.firstName());

  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    title: faker.music.songName(),
    artist: faker.helpers.arrayElement(artistsPool),
    album: faker.lorem.words({ min: 1, max: 3 }),
    genre: faker.music.genre(),
    duration: `${faker.number.int({ min: 2, max: 5 })}:${faker.number.int({ min: 10, max: 59 })}`,
    addedBy: specificUser ? specificUser : faker.helpers.arrayElement(contributorsPool),
    votes: faker.number.int({ min: 5, max: 100 }),
    addedAt: faker.date.recent().toISOString(),
    partyCode: partyCode
  }));
};

const initialSongs = [
  ...generateSeedSongs(10, 'ABC123', 'Aron'),
  ...generateSeedSongs(5, 'ABC123'),
  ...generateSeedSongs(10, 'XYZ789', 'Aron'),
  ...generateSeedSongs(5, 'XYZ789')
];

export const store = {
  users: [
    { id: 'admin1', name: 'Admin', email: 'admin@auxqueue.com', password: 'password123' },
    { id: 'user-aron', name: 'Aron', email: 'gymaron2@gmail.com', password: 'Kecske123' }
  ],
  parties: [
    { id: 'party1', name: 'Demo Party 1', code: 'ABC123' },
    { id: 'party2', name: 'Demo Party 2', code: 'XYZ789' }
  ],
  songs: initialSongs
};

export const resetStore = () => {
  store.users = [];
  store.parties = [];
  store.songs = [];
};