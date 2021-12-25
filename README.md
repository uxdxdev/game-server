# Start

- create self signed certificate

### MacOS

```
openssl req -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt
```

### Windows

```
// todo
```

- update `.env` file

```
NODE_ENV=development
CLIENT_URL=https://localhost:3000
KEY=key.pem
CERT=server.crt
PORT=3001
```

- start dev server

```
npm start
```
