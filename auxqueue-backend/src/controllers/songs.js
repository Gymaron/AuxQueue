import { prisma } from '../graphql.js';

export const getSongs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const partyCode = req.query.partyCode;
    const addedBy = req.query.addedBy;

    const where = {};
    if (partyCode) where.partyCode = partyCode;
    if (addedBy) where.addedBy = addedBy;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.song.findMany({ where, skip, take: limit, orderBy: { votes: 'desc' } }),
      prisma.song.count({ where })
    ]);

    res.status(200).json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    console.error('getSongs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addSong = async (req, res) => {
  try {
    const song = await prisma.song.create({
      data: { ...req.body, votes: 0 }
    });
    res.status(201).json(song);
  } catch (err) {
    console.error('addSong error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSongById = async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.status(200).json(song);
  } catch (err) {
    console.error('getSongById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSong = async (req, res) => {
  try {
    const song = await prisma.song.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.status(200).json(song);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Song not found' });
    console.error('updateSong error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSong = async (req, res) => {
  try {
    await prisma.song.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Song not found' });
    console.error('deleteSong error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const voteSong = async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) return res.status(404).json({ error: 'Song not found' });
    const delta = req.body.delta || 0;
    const updated = await prisma.song.update({
      where: { id: req.params.id },
      data: { votes: Math.max(0, song.votes + delta) }
    });
    res.status(200).json(updated);
  } catch (err) {
    console.error('voteSong error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};