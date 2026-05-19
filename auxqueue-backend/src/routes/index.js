import { Router } from 'express';
import { register, login } from '../controllers/auth.js';
import { createParty, getParty, generateSongs } from '../controllers/parties.js';
import { getSongs, addSong, getSongById, updateSong, deleteSong, voteSong } from '../controllers/songs.js';
import { validateRegister, validateLogin, validateParty, validateSong } from '../middleware/validation.js';

const router = Router();

router.post('/auth/register', validateRegister, register);
router.post('/auth/login', validateLogin, login);

router.post('/parties', validateParty, createParty);
router.get('/parties/:code', getParty);
router.post('/parties/:code/generate', generateSongs);

router.get('/songs', getSongs);
router.post('/songs', validateSong, addSong);
router.get('/songs/:id', getSongById);
router.put('/songs/:id', validateSong, updateSong);
router.delete('/songs/:id', deleteSong);
router.post('/songs/:id/vote', voteSong);

export default router;