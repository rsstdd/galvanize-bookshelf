'use strict';

const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.token = decoded;

    next();
  });
};

router.get('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;

  knex('favorites')
    .innerJoin('favorites', 'favorites.id', 'favorites.track_id')
    .where('favorites.user_id', userId)
    .orderBy('favorites.title', 'ASC')
    .then((rows) => {
      const favorites = camelizeKeys(rows);

      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/favorites/:id', authorize, (req, res, next) => {
  const { userId } = req.token;

    knex('favorites')
    .innerJoin('favorites', 'favorites.id', 'favorites.track_id')
    .where('favorites.user_id', userId)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(404, 'Not Found');
      }

      const track = camelizeKeys(row);

      res.send(track);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/favorites/:id',  authorize, (req, res, next) => {
  const { userId } = req.token;
  const { title, artist, likes } = req.body;

  if (!title || !title.trim()) {
    return next(boom.create(400, 'Title must not be blank'));
  }

  if (!artist || !artist.trim()) {
    return next(boom.create(400, 'Artist must not be blank'));
  }

  if (!Number.isInteger(likes)) {
    return next(boom.create(400, 'Likes must be an integer'));
  }

  const insertTrack = { title, artist, likes };

  knex('favorites')
    .insert(decamelizeKeys(insertTrack), '*')
    .then((rows) => {
      const track = camelizeKeys(rows[0]);

      res.send(track);
    })
    .catch((err) => {
      next(err);
    });
});
//
// router.patch('/favorites/:id',  authorize, (req, res, next) => {
//   knex('favorites')
//     .where('id', req.params.id)
//     .first()
//     .then((track) => {
//       if (!track) {
//         throw boom.create(404, 'Not Found');
//       }
//
//       const { title, artist } = req.body;
//       const updateTrack = {};
//
//       if (title) {
//         updateTrack.title = title;
//       }
//
//       if (artist) {
//         updateTrack.artist = artist;
//       }
//
//       return knex('favorites')
//         .update(decamelizeKeys(updateTrack), '*')
//         .where('id', req.params.id);
//     })
//     .then((rows) => {
//       const track = camelizeKeys(rows[0]);
//
//       res.send(track);
//     })
//     .catch((err) => {
//       next(err);
//     });
// });
//
// router.delete('/favorites/:id',  authorize, (req, res, next) => {
//   let track;
//
//   knex('favorites')
//     .where('id', req.params.id)
//     .first()
//     .then((row) => {
//       if (!row) {
//         throw boom.create(404, 'Not Found');
//       }
//
//       track = camelizeKeys(row);
//
//       return knex('favorites')
//         .del()
//         .where('id', req.params.id);
//     })
//     .then(() => {
//       delete track.id;
//
//       res.send(track);
//     })
//     .catch((err) => {
//       next(err);
//     });
// });

module.exports = router;
