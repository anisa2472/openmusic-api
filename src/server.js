require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

const ClientError = require('./exceptions/ClientError');

const albums = require('./apis/albums');
const { AlbumsService } = require('./services/postgres/albumsService');
const { AlbumsValidator } = require('./validator/albums');

const songs = require('./apis/songs');
const { SongsService } = require('./services/postgres/songsService');
const { SongsValidator } = require('./validator/songs');

const users = require('./apis/users');
const { UsersService } = require('./services/postgres/usersService');
const { UsersValidator } = require('./validator/users');

const authentications = require('./apis/authentications');
const { AuthenticationsService } = require('./services/postgres/authenticationsService');
const TokenManager = require('./tokenize/tokenManager');
const { AuthenticationsValidator } = require('./validator/authentications');

const playlist = require('./apis/playlists');
const { PlaylistsService } = require('./services/postgres/playlistsService');
const { PlaylistsValidator } = require('./validator/playlists');

const activities = require('./apis/activities');
const { ActivitiesService } = require('./services/postgres/activitiesService');
const { ActivitiesValidator } = require('./validator/activities');

const collaborations = require('./apis/collaborations');
const { CollaborationsService } = require('./services/postgres/collaborationsService');
const { CollaborationsValidator } = require('./validator/collaborations');

const _export = require('./apis/exports');
const ProducerService = require('./services/rabbitmq/producerService');
const { ExportPlaylistValidator } = require('./validator/exports');

const uploads = require('./apis/uploads');
const { StorageService } = require('./services/storage/storageService');
const { UploadsValidator } = require('./validator/uploads');

const CacheService = require('./services/redis/cacheService');

const init = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const activitiesService = new ActivitiesService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const storageService = new StorageService(path.resolve(__dirname, 'apis/uploads/file/images'));

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlist,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: activities,
      options: {
        service: activitiesService,
        validator: ActivitiesValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: _export,
      options: {
        service: ProducerService,
        playlistsService,
        validator: ExportPlaylistValidator,
      },
    },
    {
      plugin: uploads,
      options: {
        service: storageService,
        albumsService,
        validator: UploadsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'Terjadi kegagalan pada server kami.',
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
