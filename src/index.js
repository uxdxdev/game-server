import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { Server } from 'socket.io';
import { customEvents, socketIoEvents } from './constants.js';
import dotenv from 'dotenv';

dotenv.config();

// API
const app = express();

// Cross-origin resource sharing settings
app.use(function (req, res, next) {
  // only allow requests from the client URL
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
});

app.get('/', (req, res) => {
  res.send(`<a href="${process.env.CLIENT_URL}">Go to client</a>`);
});

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// WEB SOCKET
let server = null;
if (process.env.NODE_ENV === 'development') {
  // during development setup HTTPS using self signed certificate
  const options = {
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
  };
  server = https.createServer(options, app);
} else {
  // in production auto redirects will redirect all http traffic to https
  server = http.createServer(app);
}

console.log('PORT', process.env.PORT);

server.listen(process.env.PORT, () => {
  console.log(`Server listening on process.env.PORT`);
});

const ioServer = new Server(server, {
  // only allow client URL origin to make requests
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET'],
  },
});

const getNumberOfConnectedClients = () => {
  return ioServer.engine.clientsCount;
};

const sendEventDataToAllClients = (eventName, data) => {
  ioServer.sockets.emit(eventName, data);
};

ioServer.on('connection', (client) => {
  console.log(
    `User ${
      client.id
    } connected, there are currently ${getNumberOfConnectedClients()} users connected`
  );

  // when a client connects send them their client.id
  client.emit(socketIoEvents.CONNECTED, client.id);

  // send the number of connected clients to all clients
  sendEventDataToAllClients(
    customEvents.NUMBER_OF_CONNECTED_CLIENTS,
    getNumberOfConnectedClients()
  );

  client.on('disconnect', () => {
    console.log(
      `User ${
        client.id
      } disconnected, there are currently ${getNumberOfConnectedClients()} users connected`
    );

    sendEventDataToAllClients(
      customEvents.NUMBER_OF_CONNECTED_CLIENTS,
      getNumberOfConnectedClients()
    );
  });
});
