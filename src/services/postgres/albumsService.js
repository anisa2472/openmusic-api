/* eslint-disable camelcase */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapAlbumDBToModel } = require('../../utils');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
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

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id',
      values: [id],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan.');
    }
  }
}

module.exports = { AlbumsService };
