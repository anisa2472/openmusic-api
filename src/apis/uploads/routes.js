const routes = (handler) => [
  {
    method: 'POST',
    path: '/albums/{id}/covers',
    handler: (request, h) => handler.postCoverAlbumByIdHandler(request, h),
    options: {
      payload: {
        maxBytes: 512000,
        parse: true,
        output: 'stream',
        allow: 'multipart/form-data',
        multipart: true,
      },
    },
  },
];

module.exports = routes;
