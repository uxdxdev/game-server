# Start

- create self signed certificate by installing [mkcert](https://github.com/FiloSottile/mkcert)

```
mkcert -install // create local Certificate Authority
mkcert localhost // create localhost.pem and localhost-key.pem files
```

- update `.env` file

```
NODE_ENV=development
CLIENT_URL=https://localhost:3000
KEY=localhost-key.pem
CERT=localhost.pem
PORT=3001
```

- start dev server

```
npm start
```
