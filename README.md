# 🎵 OPENMUSIC API

## 📄 Description

This project was created to complete a Dicoding course, 'Belajar Fundamental Aplikasi Back-End'.

## 🔧 Tech
![Javascript](https://img.shields.io/badge/JAVASCRIPT-323330?style=flat&logo=javascript&logoColor=F7DF1E) ![NodeJs](https://img.shields.io/badge/NODE.JS-339933?style=flat&logo=nodedotjs&logoColor=white)
<a href="https://hapi.dev/"><img src="https://img.shields.io/badge/HAPI-orange"></a> <a href="https://joi.dev/"> <img src="https://img.shields.io/badge/JOI-blue"></a> <a href="https://jwt.io"><img src="https://img.shields.io/badge/JWT-black"></a>
![Postgres](https://img.shields.io/badge/POSTGRES-%23316192.svg?style=flat&logo=postgresql&logoColor=white)
![Eslint](https://img.shields.io/badge/ESLINT-3A33D1?style=flat&logo=eslint&logoColor=white)

## 🛠 Setup
### Prerequisites
You need to create a **`.env`** file on the root of the project. Also, you can generate `access token key` and `refresh token key` using <a href="https://jwt.io">JWT</a> to make it more secure.
```
# server configuration
HOST=yourhosthere
PORT=yourporthere

# node-postgres configuration
PGUSER=youruserpostgreshere
PGHOST=yourhostpostgreshere
PGPASSWORD=yourpasswordpostgreshere
PGDATABASE=yourdatabasenamehere
PGPORT=yourportdatabasehere

# JWT token
ACCESS_TOKEN_KEY=youraccesstokenkeyhere
REFRESH_TOKEN_KEY=yourrefreshtokenkeyhere
ACCESS_TOKEN_AGE=youraccesstokenagehere
```

### Install
```
npm install
```
```
npm run migrate up
```

### Use
#### development
```
npm run start-dev
```
#### production
```
npm run start-prod
```