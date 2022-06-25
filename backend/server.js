require('dotenv').config();

const axios = require('axios');
const cors = require('cors');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const mongoose = require('mongoose');
const WebSocket = require('ws');

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

app.use(express.json());

const chatRouter = require('./routes/router');
const wss = new WebSocket.Server({ server });

app.use('/', cors(corsOptions), chatRouter);

server.listen(3000, () => console.log('Server Started'));

wss.on('connection', (ws) => {
  ws.on('message', (e) => {
    const newData = JSON.parse(`${e}`);
    if ('newPerson' in newData) {
      axios.post('http://localhost:3000/people', newData.newPerson, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    wss.clients.forEach((client) => {
      if ('instructions' in newData) {
        if (newData.instructions.includes('refreshFriends')) {
          client.send('refreshFriends');
        }
        if (newData.instructions.includes('refreshChat')) {
          client.send('refreshChat');
        }
        if (newData.instructions.includes('refreshPeople')) {
          client.send('refreshPeople');
        }
        if (newData.instructions.includes('refreshRequests')) {
          client.send('refreshRequests');
        }
      }
    });
  });
});
