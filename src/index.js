import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { Vector3 } from 'three';

// constants
const SPEED = 0.5;

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
};

// API
const app = express();

// Cross-origin resource sharing settings
app.use(function (req, res, next) {
  // only allow requests from the client URL
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
});

// server homepage
app.get('/', (req, res) => {
  res.send(`<div>${getNumberOfConnectedClients()} clients connected</div><a href="${process.env.CLIENT_URL}">Go to client</a>`);
});

// health check API
app.get('/ping', (req, res) => {
  res.sendStatus(200);
});

const trees = [
  { name: 'tree', bbox: 0.5, x: 10, z: 18, rotation: 2.2877994332820304 },
  { name: 'tree', bbox: 0.5, x: -1, z: -44, rotation: 1.1710819415102538 },
  { name: 'tree', bbox: 0.5, x: -45, z: -43, rotation: 2.4509400560824135 },
  { name: 'tree', bbox: 0.5, x: 5, z: -12, rotation: 2.3501323438484394 },
  { name: 'tree', bbox: 0.5, x: 38, z: 28, rotation: 2.122005731671518 },
  { name: 'tree', bbox: 0.5, x: -35, z: 40, rotation: 0.7210891195907829 },
  { name: 'tree', bbox: 0.5, x: -11, z: -5, rotation: 0.33514948174229187 },
  { name: 'tree', bbox: 0.5, x: 23, z: -3, rotation: 0.021704156372019837 },
  { name: 'tree', bbox: 0.5, x: 2, z: -37, rotation: 0.07255237416921666 },
  { name: 'tree', bbox: 0.5, x: 32, z: -20, rotation: 2.7789401250019785 },
  { name: 'tree', bbox: 0.5, x: 19, z: -41, rotation: 1.065988415418212 },
  { name: 'tree', bbox: 0.5, x: 24, z: 25, rotation: 3.026271079656134 },
  { name: 'tree', bbox: 0.5, x: -7, z: -40, rotation: 0.5215170365083107 },
  { name: 'tree', bbox: 0.5, x: -5, z: 5, rotation: 1.5584772864158605 },
  { name: 'tree', bbox: 0.5, x: 15, z: 48, rotation: 2.516774685898536 },
  { name: 'tree', bbox: 0.5, x: -23, z: 45, rotation: 2.180290409313535 },
  { name: 'tree', bbox: 0.5, x: 8, z: 49, rotation: 2.4113514173818134 },
  { name: 'tree', bbox: 0.5, x: 6, z: -36, rotation: 2.248144885675486 },
  { name: 'tree', bbox: 0.5, x: 26, z: -11, rotation: 0.4206530715249706 },
  { name: 'tree', bbox: 0.5, x: 43, z: -10, rotation: 2.2015094356442666 },
  { name: 'tree', bbox: 0.5, x: -22, z: 21, rotation: 0.0831329416487083 },
  { name: 'tree', bbox: 0.5, x: 5, z: -12, rotation: 0.8044805423557037 },
  { name: 'tree', bbox: 0.5, x: -47, z: 23, rotation: 0.8088879703555721 },
  { name: 'tree', bbox: 0.5, x: 4, z: 15, rotation: 2.515836004211794 },
  { name: 'tree', bbox: 0.5, x: -35, z: 46, rotation: 1.0766071191686488 },
  { name: 'tree', bbox: 0.5, x: 8, z: 31, rotation: 2.4626110033392283 },
  { name: 'tree', bbox: 0.5, x: -4, z: -14, rotation: 0.23821009449184166 },
  { name: 'tree', bbox: 0.5, x: 14, z: -27, rotation: 2.4381921765247734 },
  { name: 'tree', bbox: 0.5, x: 20, z: 11, rotation: 1.3051786738401518 },
  { name: 'tree', bbox: 0.5, x: 13, z: 33, rotation: 2.582674912557875 },
  { name: 'tree', bbox: 0.5, x: 3, z: -14, rotation: 1.664545491759111 },
  { name: 'tree', bbox: 0.5, x: 3, z: -34, rotation: 0.05498910141646792 },
  { name: 'tree', bbox: 0.5, x: 17, z: -34, rotation: 1.0341483068112407 },
  { name: 'tree', bbox: 0.5, x: 31, z: 8, rotation: 2.648219145843404 },
  { name: 'tree', bbox: 0.5, x: 30, z: -9, rotation: 2.5114814368884755 },
  { name: 'tree', bbox: 0.5, x: -30, z: -43, rotation: 2.7907100149480275 },
  { name: 'tree', bbox: 0.5, x: 25, z: 32, rotation: 3.0910733444006135 },
  { name: 'tree', bbox: 0.5, x: 31, z: 2, rotation: 2.1010185118022275 },
  { name: 'tree', bbox: 0.5, x: 27, z: 31, rotation: 0.09205736550157151 },
  { name: 'tree', bbox: 0.5, x: 3, z: 33, rotation: 0.29017598018054963 },
  { name: 'tree', bbox: 0.5, x: 4, z: -24, rotation: 0.9942192348204996 },
  { name: 'tree', bbox: 0.5, x: 19, z: -18, rotation: 3.1186551626953656 },
  { name: 'tree', bbox: 0.5, x: -29, z: 8, rotation: 0.11058662987299647 },
  { name: 'tree', bbox: 0.5, x: 38, z: 30, rotation: 0.4418120626856891 },
  { name: 'tree', bbox: 0.5, x: -16, z: -28, rotation: 0.27916951703262355 },
  { name: 'tree', bbox: 0.5, x: 2, z: 12, rotation: 1.6741034425626715 },
  { name: 'tree', bbox: 0.5, x: 33, z: -17, rotation: 1.7793213811772306 },
  { name: 'tree', bbox: 0.5, x: 36, z: -6, rotation: 0.07419963147662335 },
  { name: 'tree', bbox: 0.5, x: -23, z: 29, rotation: 1.556578929636454 },
  { name: 'tree', bbox: 0.5, x: -18, z: 7, rotation: 1.307940564316852 },
];

const worldData = { width: 50, height: 50, objects: [...trees] };

app.get('/world', (req, res) => {
  res.send({ worldData });
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
    next(new Error('You are not authorised to make a connection to this server'));
  }
});

const getNumberOfConnectedClients = () => {
  return io.engine.clientsCount;
};

/*
players: {
  [userId]: {
    position: {
      x,
      y,
      z
    },
    controls: {
      left,
      right,
      forward,
      backward
    }
  }
}
*/
const players = {};

io.on(events.CONNECTION, (client) => {
  console.log(`User ${client.handshake.auth.userId} connected on socket ${client.id}, there are currently ${getNumberOfConnectedClients()} users connected`);

  players[client.handshake.auth.userId] = {
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    rotation: 0,
    controls: {
      left: false,
      right: false,
      forward: false,
      backward: false,
    },
  };

  // send client id to signal server authentication
  client.emit(events.CONNECTED, client.id);

  // get updates from the client
  client.on('player_update', (data) => {
    if (data.id && data.controls) {
      players[data.id].controls.left = data.controls.left;
      players[data.id].controls.right = data.controls.right;
      players[data.id].controls.forward = data.controls.forward;
      players[data.id].controls.backward = data.controls.backward;
    }
  });

  client.once(events.DISCONNECT, () => {
    console.log(`User ${client.handshake.auth.userId} disconnected`);

    delete players[client.handshake.auth.userId];
    io.sockets.emit('players', players);
  });
});

const tickRateMilliseconds = 33; // update times per second
setInterval(() => {
  main();
}, tickRateMilliseconds);

const checkPlayerCollisions = (playerPos, world) => {
  // world boundary collisions
  if (playerPos.x >= world.width / 2 || playerPos.x <= -world.width / 2 || playerPos.z >= world.height / 2 || playerPos.z <= -world.height / 2) return true;
  // world object collisions
  const { objects } = world;
  for (let o = 0; o < objects.length; o++) {
    const obj = objects[o];
    if (Math.abs(playerPos.x - obj.x) <= obj.bbox && Math.abs(playerPos.z - obj.z) <= obj.bbox) return true;
  }
  return false;
};

const frontVector = new Vector3();
const sideVector = new Vector3();
const direction = new Vector3();

const updatePlayerPosition = (player, world) => {
  // rotation
  frontVector.set(0, 0, Number(player.controls.backward) - Number(player.controls.forward));
  sideVector.set(Number(player.controls.left) - Number(player.controls.right), 0, 0);
  direction.subVectors(frontVector, sideVector);

  const rotation = Math.atan2(direction.x, direction.z);

  // AABB

  // position
  const newPosition = { ...player.position };
  if (player.controls.left) newPosition.x -= SPEED;
  if (player.controls.right) newPosition.x += SPEED;
  if (player.controls.forward) newPosition.z -= SPEED;
  if (player.controls.backward) newPosition.z += SPEED;
  const isPlayerColliding = checkPlayerCollisions(newPosition, world);

  // if any collisions return player position before move
  const position = isPlayerColliding ? player.position : newPosition;

  return { position, rotation };
};

const main = () => {
  // for each player
  // update player position based on world, objects, and collision data
  Object.keys(players).forEach((key) => {
    const playerData = players[key];
    const result = updatePlayerPosition(playerData, worldData);
    players[key].position = result.position;
    players[key].rotation = result.rotation;
  });
  // send all clients all player data
  io.sockets.emit('players', players);
};

// todo: add fake remote players and update there positions to test how the client handles the updates
const rotatePoint = (angle, px, pz) => {
  let x = px * Math.cos(angle) - pz * Math.sin(angle);
  let z = pz * Math.cos(angle) + px * Math.sin(angle);
  // let s = Math.Sin(angle);
  // let c = Math.Cos(angle);
  // // translate point back to origin:
  // p.X -= cx;
  // p.Y -= cy;
  // // rotate point
  // let Xnew = p.X * c - p.Y * s;
  // let Ynew = p.X * s + p.Y * c;
  // // translate point back:
  // p.X = Xnew + cx;
  // p.Y = Ynew + cy;
  return { x, z };
};
