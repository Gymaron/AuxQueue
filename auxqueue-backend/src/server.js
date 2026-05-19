import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import { schema, rootValue } from './graphql.js';

const SERVER_IP = process.env.SERVER_IP || 'localhost';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/auxqueue_chat')
  .then(() => console.log('✅ Connected to MongoDB (Chat Database)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const chatSchema = new mongoose.Schema({
  partyCode: String,
  user: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const ChatMessage = mongoose.model('ChatMessage', chatSchema);

app.get('/api/chat/:partyCode', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ partyCode: req.params.partyCode }).sort({ timestamp: 1 }).limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { partyCode, user, message } = req.body;
    const newChat = new ChatMessage({ partyCode, user, message });
    await newChat.save();
    broadcast({ type: 'CHAT_MESSAGE', chat: newChat });
    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue,
  graphiql: true,
}));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GraphQL & WS Server running on http://${SERVER_IP}:${PORT}`);
});

const wss = new WebSocketServer({ server });
export const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify(data));
  });
};