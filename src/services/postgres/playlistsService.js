const { nanoid } = require('nanoid');
const { Pool } = require('pg');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING playlist_id',
      values: [id, name, owner],
    };
    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan.');
    }

    return rows[0].playlist_id;
  }

  async addPlaylistSongById(playlistId, songId) {
    const id = `playlist-song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return rows[0].id;
  }

  async getAllPlaylists(userId) {
    const query = {
      text: 'SELECT p.playlist_id as id, name, u.username FROM playlists p LEFT JOIN users u ON p.owner = u.user_id WHERE p.owner = $1 AND u.user_id = $1',
      values: [userId],
    };
    const { rows } = await this._pool.query(query);

    return rows;
  }

  async getPlaylistSongsById(userId, playlistId) {
    const queryPlaylist = {
      text: 'SELECT p.playlist_id as id, name, u.username FROM playlists p LEFT JOIN users u ON p.owner = u.user_id WHERE p.owner = $1 AND u.user_id = $1 AND p.playlist_id = $2',
      values: [userId, playlistId],
    };
    const { rows, rowCount } = await this._pool.query(queryPlaylist);

    if (!rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan.');
    }

    // check if there are songs in the playlist
    const querySongs = {
      text: 'SELECT s.song_id as id, s.title, s.performer FROM songs s LEFT JOIN playlist_songs ps ON s.song_id = ps.song_id WHERE playlist_id = $1;',
      values: [playlistId],
    };
    const resultSongsInPlaylist = await this._pool.query(querySongs);

    // there are no songs in the playlist
    if (!resultSongsInPlaylist.rows.length) {
      return { rows, songs: [] };
    }

    // there are songs in the playlist
    return { ...rows[0], songs: resultSongsInPlaylist.rows };
  }

  async deletePlaylist(playlistId) {
    const query = {
      text: 'DELETE FROM playlists WHERE playlist_id = $1 RETURNING playlist_id',
      values: [playlistId],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan.');
    }
  }

  async deletePlaylistSongById(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };
    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan.');
    }
  }

  async checkSongId(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE song_id = $1',
      values: [songId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal ditambahkan. Id lagu tidak ditemukan.');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE playlist_id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini.');
    }
  }
}

module.exports = { PlaylistsService };
