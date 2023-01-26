class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const {
      title, year, genre, performer, duration, albumId,
    } = request.payload;

    const songId = await this._service.addSong({
      title, year, genre, performer, duration, albumId,
    });
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
    if (request.query.title && request.query.performer) {
      const { title, performer } = request.query;
      const songs = await this._service.getSongsByTitleAndPerformer(title, performer);
      return {
        status: 'success',
        data: {
          songs,
        },
      };
    }

    if (request.query.title) {
      const { title } = request.query;
      const songs = await this._service.getSongsByTitle(title);
      return {
        status: 'success',
        data: {
          songs,
        },
      };
    }

    if (request.query.performer) {
      const { performer } = request.query;
      const songs = await this._service.getSongsByPerformer(performer);
      return {
        status: 'success',
        data: {
          songs,
        },
      };
    }

    const songs = await this._service.getSongs();
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async getSongsByTitleHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async editSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);
    const {
      title, year, genre, performer, duration, albumId,
    } = request.payload;
    const { id } = request.params;
    await this._service.editSongById(id, {
      title, year, genre, performer, duration, albumId,
    });
    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui.',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteSongById(id);
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus.',
    };
  }
}

module.exports = SongsHandler;
