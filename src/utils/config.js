const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  jwt: {
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    accessTokenAge: process.env.ACCESS_TOKEN_AGE,
  },
  rabbitmq: {
    service: process.env.RABBITMQ_SERVICE,
  },
  redis: {
    server: process.env.REDIS_SERVER,
  },
};

module.exports = config;
