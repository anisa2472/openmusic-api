/* eslint-disable camelcase */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapAlbumDBToModel } = require('../../utils');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year, coverAlbum = null }) {
    const id = `album-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4) RETURNING album_id',
      values: [id, name, year, coverAlbum],
    };

    const { rows } = await this._pool.query(query);

    if (!rows[0].album_id) {
      throw new InvariantError('Album gagal ditambahkan.');
    }

    return rows[0].album_id;
  }

  async getAlbumById(albumId) {
    const queryAlbum = {
      text: 'SELECT * FROM albums WHERE album_id = $1;',
      values: [albumId],
    };
    const { rows, rowCount } = await this._pool.query(queryAlbum);

    if (!rowCount) {
      throw new NotFoundError('Album tidak ditemukan.');
    }

    // check coverAlbum
    if (rows[0].cover !== null) {
      rows[0].cover = `http://${process.env.HOST}:${process.env.PORT}/albums/cover/${rows[0].cover}`;
    }

    // check if there are songs in the album
    const querySongs = {
      text: 'SELECT s.song_id as id, s.title, s.performer FROM songs s LEFT JOIN albums a ON s.album_id = a.album_id WHERE s.album_id = $1;',
      values: [albumId],
    };
    const resultSongsInAlbum = await this._pool.query(querySongs);

    // there are no songs in the album
    if (!resultSongsInAlbum.rows.length) {
      return { ...rows.map(mapAlbumDBToModel)[0], songs: [] };
    }

    // there are songs in the album
    return { ...rows.map(mapAlbumDBToModel)[0], songs: resultSongsInAlbum.rows };
  }

  async editAlbumById(id, { name, year, coverAlbum = null }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, cover = $3 WHERE album_id = $4 RETURNING album_id',
      values: [name, year, coverAlbum, id],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan.');
    }
  }

  async editCoverAlbumById(id, coverAlbum) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE album_id = $2 RETURNING album_id',
      values: [coverAlbum, id],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan.');
    }
  }

  async deleteAlbumById(albumId) {
    const query = {
      text: 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id',
      values: [albumId],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan.');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async addAlbumLike(albumId, userId) {
    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };
    const { rows } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Gagal menyukai album.');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async deleteAlbumLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };
    const { rows } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Gagal batal menyukai album.');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      return ({
        isCache: true,
        likeCount: JSON.parse((result)),
      });
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(album_id) FROM album_likes WHERE album_id = $1 GROUP BY album_id',
        values: [albumId],
      };
      const { rows } = await this._pool.query(query);

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(parseInt(rows[0].count, 10)));
      return ({
        isCache: false,
        likeCount: parseInt(rows[0].count, 10),
      });
    }
  }

  async searchAlbumById(albumId) {
    const query = {
      text: 'SELECT album_id FROM albums WHERE album_id = $1',
      values: [albumId],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Id tidak ditemukan.');
    }
  }

  async searchAlbumLikeById(albumId, userId) {
    const query = {
      text: 'SELECT id FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const { rowCount } = await this._pool.query(query);

    return rowCount;
  }
}

module.exports = { AlbumsService };
