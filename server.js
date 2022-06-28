require('dotenv').config({ path: '.env' });

const axios = require('axios');
const cors = require('cors');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const mongoose = require('mongoose');
const WebSocket = require('ws');
const path = require('path');

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

mongoose.connect(
  process.env.MONGODB_URI || console.log('failed to connect to db'),
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

app.use(express.json());

const chatRouter = require('./routes/router');
const wss = new WebSocket.Server({ server });

app.use(express.static(path.resolve(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client/build', 'index.html'));
});

app.use('/api', cors(corsOptions), chatRouter);

server.listen(process.env.PORT || 3000, () => console.log('Server Started'));

wss.on('connection', (ws) => {
  ws.on('message', (e) => {
    const newData = JSON.parse(`${e}`);
    if ('newPerson' in newData) {
      axios.post('/api/people', newData.newPerson, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    wss.clients.forEach((client) => {
      if ('instructions' in newData) {
        let id;
        let searchText;
        if (Array.isArray(newData.instructions)) {
          newData.instructions.forEach((element) => {
            if (element.id) id = element.id;
            if (element.searchText) searchText = element.searchText;
          });
          if (id) {
            axios.patch(
              `/api/people/${id}/${id}/${searchText}`,
              {
                isOnline: false,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
          }
          if (newData.instructions[0].isTypingTarget) {
            client.send(
              JSON.stringify({
                isTyping: newData.instructions[0].isTyping,
                isTypingTarget: newData.instructions[0].isTypingTarget,
              })
            );
          }
          if (newData.instructions[0].isSeenTarget) {
            client.send(
              JSON.stringify({
                isSeen: newData.instructions[0].isSeen,
                isSeenTarget: newData.instructions[0].isSeenTarget,
              })
            );
          }
        }
        if (newData.instructions.instruction) {
          if (newData.instructions.instruction.includes('refreshFriends')) {
            client.send(
              JSON.stringify({
                instruction: 'refreshFriends',
                me: newData.instructions.me,
              })
            );
          }
          if (newData.instructions.instruction.includes('refreshChat')) {
            client.send(
              JSON.stringify({
                instruction: 'refreshChat',
              })
            );
          }
          if (newData.instructions.instruction.includes('refreshPeople')) {
            client.send(
              JSON.stringify({
                instruction: 'refreshPeople',
                me: newData.instructions.me,
              })
            );
          }
          if (newData.instructions.instruction.includes('refreshRequests')) {
            client.send(
              JSON.stringify({
                instruction: 'refreshRequests',
                me: newData.instructions.me,
              })
            );
          }
          if (newData.instructions.instruction.includes('removeReceiver')) {
            client.send(
              JSON.stringify({
                instruction: 'removeReceiver',
                me: newData.instructions.me,
              })
            );
          }
        }
      }
    });
  });
});
