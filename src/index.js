import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const auth = admin.auth();

const events = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECTED: 'connected',
  DRAW: 'draw',
  INIT_CANVAS: 'init_canvas',
};

const currentCanvas = [];

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

// server homepage
app.get('/', (req, res) => {
  res.send(
    `<div>${getNumberOfConnectedClients()} clients connected</div><a href="${
      process.env.CLIENT_URL
    }">Go to client</a>`
  );
});

// health check API
app.get('/ping', (req, res) => {
  res.sendStatus(200);
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
  // so no need for SSL certs
  server = http.createServer(app);
}

// create socket.io server from node http(s) server
const io = new Server(server, {
  cors: {
    // only allow client URL origin to make requests
    origin: process.env.CLIENT_URL,
    // only allow GET requests
    methods: ['GET'],
  },
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running...`);
});

// token authentication when clients connect
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const isAuthenticated = await auth
    .verifyIdToken(token)
    .then(() => true)
    .catch(() => false);
  if (token && isAuthenticated) {
    next();
  } else {
    next(
      new Error('You are not authorised to make a connection to this server')
    );
  }
});

const getNumberOfConnectedClients = () => {
  return io.engine.clientsCount;
};

io.on(events.CONNECTION, (client) => {
  console.log(
    `User ${client.handshake.auth.userId} connected on socket ${
      client.id
    }, there are currently ${getNumberOfConnectedClients()} users connected`
  );

  // when a client connects send them a notification
  client.emit(events.CONNECTED, client.id);

  // send the current state of the canvas
  client.emit(events.INIT_CANVAS, currentCanvas);

  // when the server receives a 'draw' event from a client
  // broadcast the data to all connected clients
  client.on(events.DRAW, (data) => {
    // save any update to the canvas state
    currentCanvas.push(data);

    // broadcast to connected clients
    io.sockets.emit(events.DRAW, data);
  });

  client.once(events.DISCONNECT, () => {
    console.log(`User ${client.handshake.auth.userId} disconnected`);
  });
});
