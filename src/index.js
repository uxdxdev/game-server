import express from 'express';
import { Server } from 'socket.io';
import { customEvents, socketIoEvents } from './constants.js';

const app = express();

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

const server = app.listen(process.env.PORT || 3001, () => {
  console.log(`Listening on port http://localhost:3001...`);
});

const ioServer = new Server(server);

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
