import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { schema, rootValue } from './graphql.js';

const SERVER_IP = process.env.SERVER_IP || '172.30.243.204';
const PORT = process.env.PORT || 3443;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auxqueue_chat';

const app = express();

app.use(cors({
  origin: [
    'https://aux-queue-frontend.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

mongoose.connect(MONGO_URI).catch(err => console.error(err));

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
    res.status(500).json({ error: 'Failed' });
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
    res.status(500).json({ error: 'Failed' });
  }
});

app.use('/graphql', graphqlHTTP((req) => ({
  schema,
  rootValue,
  context: { req },
  graphiql: true,
})));

let server;

if (process.env.SERVER_IP === '0.0.0.0') {
  server = http.createServer(app);
} else {
  try {
    server = https.createServer({
      key: fs.readFileSync(`${SERVER_IP}-key.pem`),
      cert: fs.readFileSync(`${SERVER_IP}.pem`)
    }, app);
  } catch (error) {
    server = http.createServer(app);
  }
}

server.listen(PORT, '0.0.0.0', () => {});

const wss = new WebSocketServer({ server });
export const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify(data));
  });
};