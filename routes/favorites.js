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
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', userId)
    .orderBy('books.title', 'ASC')
    .then((rows) => {
      const favorites = camelizeKeys(rows);

      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/favorites/check', authorize, (req, res, next) => {
  const { bookId } = req.query;

  if (isNaN(req.query.bookId)) {
    throw next(boom.create(400, 'Book ID must be an integer'))
  }

  if (bookId > 1) {
    res.send(false);
  } else {
    res.send(true);
  }
});

router.post('/favorites/',  authorize, (req, res, next) => {
  const { userId } = req.token;
  const { bookId } = req.query;
  const { email, firstName, password, lastName } = req.body;
  let favoriteBook;

  if(isNaN(userId)) {
    return next(boom.create(404, 'Not Found'));
  }

  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', userId)
    .orderBy('books.title', 'DSC')
    .then((row) => {
      if (!row) {
        throw boom.create(400, 'Bad Requests');
      }

      favoriteBook = row;

      return knex('favorites')
        .del()
        .where('id', userId);
    })
    .then(() => {
      delete favoriteBook.id;
      const jsonFavorite = camelizeKeys(favoriteBook);
      console.log(jsonFavorite);
      res.send(jsonFavorite);
    })
      .catch((err) => {
        next(err);
      });
});

router.delete('/favorites', authorize, (req, res, next) => {
  let favorite;
  const { userId } = req.token;

  if(isNaN(userId)) {
    return next(boom.create(404, 'Not Found'));
  }

  knex('favorites')
    .where('id', userId)
    .first()
    .then((row) => {
      if (!row) throw boom.create(404, 'Not Found');

      favorite = row;

      return knex('favorites')
        .del()
        .where('id', userId);
    })
    .then(() => {
      delete favorite.id;
      const jsonFavorite = camelizeKeys(favorite);

      res.send(jsonFavorite);
    })
      .catch((err) => {
        next(err);
      });
});

module.exports = router;
