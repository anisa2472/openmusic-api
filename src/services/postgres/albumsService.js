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

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING album_id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].album_id) {
      throw new InvariantError('Album gagal ditambahkan.');
    }

    return result.rows[0].album_id;
  }

  async getAlbumById(id) {
    // check if there are songs in the album
    const querySongs = {
      text: 'SELECT song_id FROM songs WHERE album_id = $1;',
      values: [id],
    };
    const resultSongsInAlbum = await this._pool.query(querySongs);

    // there are no songs in the album
    if (!resultSongsInAlbum.rows.length) {
      const query = {
        text: 'SELECT * FROM albums WHERE album_id = $1;',
        values: [id],
      };
      const { rows, rowCount } = await this._pool.query(query);

      if (!rowCount) {
        throw new NotFoundError('Album tidak ditemukan.');
      }

      return { ...rows.map(mapAlbumDBToModel)[0], songs: [] };
    }

    // there are songs in the album
    const query = {
      text: 'SELECT a.*, b.song_id, b.title, b.performer FROM songs b LEFT JOIN albums a ON a.album_id = b.album_id WHERE a.album_id = $1 AND b.album_id = $1;',
      values: [id],
    };
    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album tidak ditemukan.');
    }

    const listOfSongs = rows.map(
      ({ song_id, title, performer }) => ({ id: song_id, title, performer }),
    );

    return { ...rows.map(mapAlbumDBToModel)[0], songs: listOfSongs };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE album_id = $3 RETURNING album_id',
      values: [name, year, id],
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
