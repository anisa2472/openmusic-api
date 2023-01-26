/* eslint-disable camelcase */
const mapAlbumDBToModel = ({
  album_id,
  name,
  year,
}) => ({
  id: album_id,
  name,
  year,
});

const mapSongsDBToModel = ({
  song_id,
  title,
  year,
  genre,
  performer,
  duration,
  album_id,
}) => ({
  id: song_id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId: album_id,
});

module.exports = { mapAlbumDBToModel, mapSongsDBToModel };
