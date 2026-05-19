import { prisma } from '../graphql.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { name }] }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    const user = await prisma.user.create({
      data: { name, email, password }
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};