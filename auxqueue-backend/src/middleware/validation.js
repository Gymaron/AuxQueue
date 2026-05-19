export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  next();
};

export const validateParty = (req, res, next) => {
  if (!req.body.name || req.body.name.trim() === '') {
    return res.status(400).json({ error: 'Party name is required' });
  }
  next();
};

export const validateSong = (req, res, next) => {
  const { title, artist, album, genre, addedBy, duration } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  if (!artist || !artist.trim()) return res.status(400).json({ error: 'Artist required' });
  if (!album || !album.trim()) return res.status(400).json({ error: 'Album required' });
  if (!genre || !genre.trim()) return res.status(400).json({ error: 'Genre required' });
  if (!addedBy || !addedBy.trim()) return res.status(400).json({ error: 'Added by required' });
  if (duration && !/^[0-5]?[0-9]:[0-5][0-9]$/.test(duration)) {
    return res.status(400).json({ error: 'Invalid duration format' });
  }
  next();
};