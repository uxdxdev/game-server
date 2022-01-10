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

const multipleTrees = [
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 10,
    z: 18,
    rotation: 2.2877994332820304,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -1,
    z: -44,
    rotation: 1.1710819415102538,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -45,
    z: -43,
    rotation: 2.4509400560824135,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 5,
    z: -12,
    rotation: 2.3501323438484394,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 38,
    z: 28,
    rotation: 2.122005731671518,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -35,
    z: 40,
    rotation: 0.7210891195907829,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -11,
    z: -5,
    rotation: 0.33514948174229187,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 23,
    z: -3,
    rotation: 0.021704156372019837,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 2,
    z: -37,
    rotation: 0.07255237416921666,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 32,
    z: -20,
    rotation: 2.7789401250019785,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 19,
    z: -41,
    rotation: 1.065988415418212,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 24,
    z: 25,
    rotation: 3.026271079656134,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -7,
    z: -40,
    rotation: 0.5215170365083107,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -5,
    z: 5,
    rotation: 1.5584772864158605,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 15,
    z: 48,
    rotation: 2.516774685898536,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -23,
    z: 45,
    rotation: 2.180290409313535,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 8,
    z: 49,
    rotation: 2.4113514173818134,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 6,
    z: -36,
    rotation: 2.248144885675486,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 26,
    z: -11,
    rotation: 0.4206530715249706,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 43,
    z: -10,
    rotation: 2.2015094356442666,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -22,
    z: 21,
    rotation: 0.0831329416487083,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 5,
    z: -12,
    rotation: 0.8044805423557037,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -47,
    z: 23,
    rotation: 0.8088879703555721,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 4,
    z: 15,
    rotation: 2.515836004211794,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -35,
    z: 46,
    rotation: 1.0766071191686488,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 8,
    z: 31,
    rotation: 2.4626110033392283,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -4,
    z: -14,
    rotation: 0.23821009449184166,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 14,
    z: -27,
    rotation: 2.4381921765247734,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 20,
    z: 11,
    rotation: 1.3051786738401518,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 13,
    z: 33,
    rotation: 2.582674912557875,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 3,
    z: -14,
    rotation: 1.664545491759111,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 3,
    z: -34,
    rotation: 0.05498910141646792,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 17,
    z: -34,
    rotation: 1.0341483068112407,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 31,
    z: 8,
    rotation: 2.648219145843404,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 30,
    z: -9,
    rotation: 2.5114814368884755,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -30,
    z: -43,
    rotation: 2.7907100149480275,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 25,
    z: 32,
    rotation: 3.0910733444006135,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 31,
    z: 2,
    rotation: 2.1010185118022275,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 27,
    z: 31,
    rotation: 0.09205736550157151,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 3,
    z: 33,
    rotation: 0.29017598018054963,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 4,
    z: -24,
    rotation: 0.9942192348204996,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 19,
    z: -18,
    rotation: 3.1186551626953656,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -29,
    z: 8,
    rotation: 0.11058662987299647,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 38,
    z: 30,
    rotation: 0.4418120626856891,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -16,
    z: -28,
    rotation: 0.27916951703262355,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 2,
    z: 12,
    rotation: 1.6741034425626715,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 33,
    z: -17,
    rotation: 1.7793213811772306,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: 36,
    z: -6,
    rotation: 0.07419963147662335,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -23,
    z: 29,
    rotation: 1.556578929636454,
  },
  {
    name: 'tree',
    bbox: {
      bl: {
        x: 0.5,
        z: -0.5,
      },
      br: {
        x: -0.5,
        z: -0.5,
      },
      fl: {
        x: -0.5,
        z: 0.5,
      },
      fr: {
        x: 0.5,
        z: 0.5,
      },
    },
    x: -18,
    z: 7,
    rotation: 1.307940564316852,
  },
];

const trees = [...multipleTrees];

const worldData = { width: 100, height: 100, objects: [...trees] };

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
    if (data.id && data.controls && players[data.id]) {
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

const main = () => {
  // for each player, update player position based on world, objects, and collision data
  Object.keys(players).forEach((key) => {
    const playerData = players[key];

    // apply rotation to player based on controls
    frontVector.set(0, 0, Number(playerData.controls.backward) - Number(playerData.controls.forward));
    sideVector.set(Number(playerData.controls.left) - Number(playerData.controls.right), 0, 0);
    direction.subVectors(frontVector, sideVector);
    const rotation = Math.atan2(direction.z, direction.x);

    // update position
    const newPosition = updatePlayerPosition(playerData, worldData);

    // collision detection based on new position
    const updatedPlayerData = { rotation, position: newPosition };
    const isPlayerColliding = runCollisionDetection(updatedPlayerData, worldData);

    // if collision use previous position instead of new position
    players[key].position = isPlayerColliding ? playerData.position : newPosition;

    // only update the rotation if the player is moving, this keeps the player orientated correctly when they stop moving
    const moving = playerData.controls.left || playerData.controls.right || playerData.controls.forward || playerData.controls.backward;
    players[key].rotation = moving ? rotation : players[key].rotation;
  });
  // send all clients all player data
  io.sockets.emit('players', players);
};

const p0 = new Vector3();
const p1 = new Vector3();

const runCollisionDetection = (playerData, world) => {
  const playerBBoxRotated = getRotatedRectangle(playerData.rotation, playerData.position, playerBoundingBox);

  // world boundary collisions
  if (
    // check player bbox and world dimensions
    playerBBoxRotated[0].x >= world.width / 2 ||
    playerBBoxRotated[0].x <= -world.width / 2 ||
    playerBBoxRotated[0].z >= world.height / 2 ||
    playerBBoxRotated[0].z <= -world.height / 2 ||
    playerBBoxRotated[1].x >= world.width / 2 ||
    playerBBoxRotated[1].x <= -world.width / 2 ||
    playerBBoxRotated[1].z >= world.height / 2 ||
    playerBBoxRotated[1].z <= -world.height / 2 ||
    playerBBoxRotated[2].x >= world.width / 2 ||
    playerBBoxRotated[2].x <= -world.width / 2 ||
    playerBBoxRotated[2].z >= world.height / 2 ||
    playerBBoxRotated[2].z <= -world.height / 2 ||
    playerBBoxRotated[3].x >= world.width / 2 ||
    playerBBoxRotated[3].x <= -world.width / 2 ||
    playerBBoxRotated[3].z >= world.height / 2 ||
    playerBBoxRotated[3].z <= -world.height / 2
  ) {
    return true;
  }

  // world object collisions
  const worldObjects = world.objects;
  // only check for collision when objects are within range
  const collisionCullingDistance = 4;
  for (const worldObject of worldObjects) {
    p0.set(playerData.position.x, 0, playerData.position.z);
    p1.set(worldObject.x, 0, worldObject.z);
    const distanceBetweenPlayerAndObject = p0.distanceTo(p1);
    if (distanceBetweenPlayerAndObject >= collisionCullingDistance) {
      // player is not close to this object skip to next object
      continue;
    }

    const objectBBoxRotated = getRotatedRectangle(worldObject.rotation, { x: worldObject.x, z: worldObject.z }, worldObject.bbox);
    if (doPolygonsIntersect(playerBBoxRotated, objectBBoxRotated)) {
      // end the loop and signal a collision
      return true;
    }
  }

  return false;
};

const frontVector = new Vector3();
const sideVector = new Vector3();
const direction = new Vector3();

// when player facing downwards, i.e. rotation is 0
// bounding box coordinates relative to player center position
const playerBoundingBox = {
  bl: {
    x: -0.5,
    z: -0.5,
  },
  br: {
    x: -0.5,
    z: 0.5,
  },
  fl: {
    x: 2,
    z: -0.5,
  },
  fr: {
    x: 2,
    z: 0.5,
  },
};

const updatePlayerPosition = (player, world) => {
  const newPosition = { ...player.position };
  if (player.controls.left) newPosition.x -= SPEED;
  if (player.controls.right) newPosition.x += SPEED;
  if (player.controls.forward) newPosition.z -= SPEED;
  if (player.controls.backward) newPosition.z += SPEED;

  return newPosition;
};

const rotatePoint = (angle, cx, cz, px, pz) => {
  let x = px;
  let z = pz;
  x -= cx;
  z -= cz;
  let newX = x * Math.cos(angle) - z * Math.sin(angle);
  let newZ = x * Math.sin(angle) + z * Math.cos(angle);
  x = newX + cx;
  z = newZ + cz;
  return {
    x,
    z,
  };
};

// rotate bounding box points around the objects center at an angle
const getRotatedRectangle = (angle, objCenter, bbox) => {
  let bl = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.bl.x, objCenter.z + bbox.bl.z);
  let br = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.br.x, objCenter.z + bbox.br.z);
  let fr = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.fr.x, objCenter.z + bbox.fr.z);
  let fl = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.fl.x, objCenter.z + bbox.fl.z);
  return [bl, br, fr, fl];
};

const isUndefined = (value) => {
  return value === undefined;
};

//  Separating Axis Theorem
const doPolygonsIntersect = (a, b) => {
  var polygons = [a, b];
  var minA, maxA, projected, i, i1, j, minB, maxB;

  for (i = 0; i < polygons.length; i++) {
    // for each polygon, look at each edge of the polygon, and determine if it separates
    // the two shapes
    var polygon = polygons[i];
    for (i1 = 0; i1 < polygon.length; i1++) {
      // grab 2 vertices to create an edge
      var i2 = (i1 + 1) % polygon.length;
      var p1 = polygon[i1];
      var p2 = polygon[i2];

      // find the line perpendicular to this edge
      var normal = { x: p2.z - p1.z, z: p1.x - p2.x };

      minA = maxA = undefined;
      // for each vertex in the first shape, project it onto the line perpendicular to the edge
      // and keep track of the min and max of these values
      for (j = 0; j < a.length; j++) {
        projected = normal.x * a[j].x + normal.z * a[j].z;
        if (isUndefined(minA) || projected < minA) {
          minA = projected;
        }
        if (isUndefined(maxA) || projected > maxA) {
          maxA = projected;
        }
      }

      // for each vertex in the second shape, project it onto the line perpendicular to the edge
      // and keep track of the min and max of these values
      minB = maxB = undefined;
      for (j = 0; j < b.length; j++) {
        projected = normal.x * b[j].x + normal.z * b[j].z;
        if (isUndefined(minB) || projected < minB) {
          minB = projected;
        }
        if (isUndefined(maxB) || projected > maxB) {
          maxB = projected;
        }
      }

      // if there is no overlap between the projects, the edge we are looking at separates the two
      // polygons, and we know there is no overlap
      if (maxA < minB || maxB < minA) {
        return false;
      }
    }
  }
  return true;
};

const pick = ['left', 'right', 'forward', 'backward'];
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomPlayers = () => {
  // randomly move the players around
  for (let p = 0; p < 10; p++) {
    players['player' + p].controls = {
      left: false,
      right: false,
      forward: false,
      backward: false,
    };
    const index = getRandomInt(0, 3);
    const direction = pick[index];
    players['player' + p].controls[direction] = true;
  }
};

const initRandomPlayers = () => {
  // setup some players
  for (let p = 0; p < 10; p++) {
    players['player' + p] = {
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
  }
};
// initRandomPlayers();
setInterval(() => {
  // generateRandomPlayers();
}, 33);
