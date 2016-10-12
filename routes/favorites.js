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
  const { userId } = req.token;
  const { bookId } = req.query;

  if (Number.isNaN(Number.parseInt(bookId))) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', userId)
    .where('books.id', bookId)
    .first()
    .then((row) => {
      if (!row) {
        return res.send(false);
      }

      res.send(true);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/favorites/:id', authorize, (req, res, next) => {

  knex('favorites')
    .where('book_id', req.query.bookId)
    .then((favorites) => res.send(favorites.length > 0))
    .catch((err) => {
      next(err)
    });
});

router.post('/favorites/',  authorize, (req, res, next) => {
  const { userId } = req.token;
  const { bookId } = req.body;
  const favorite = { bookId, userId };

  if(Number.isNaN(Number.parseInt(bookId))) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  knex('books')
   .where('id', bookId)
   .first()
   .then((row) => {
     if (!row) return next(boom.create(404, 'Book not found'));

    return knex('favorites')
      .insert(decamelizeKeys(favorite), '*')
      .then((rows) => {
        const insertFav = camelizeKeys(rows[0]);

        res.send(favorite); // then give me what I just inserted into the DB
      })
      .catch((err) => {
        next(err);
      });
    })
    .catch((err) => {
      next(err);
    });
  });

router.delete('/favorites', authorize, (req, res, next) => {
  let favorite;
  const  { bookId }  = req.body;


  if(isNaN(Number.parseInt(bookId))) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  knex('favorites')
   .where('book_id', bookId)
   .first()
   .then((row) => {
     if (!row) return next(boom.create(404, 'Favorite not found'));


      favorite = row;

      return knex('favorites')
        .del()
        .where('book_id', bookId);
    })
    .then(() => {
      delete favorite.id;
      const jsonFavorite = camelizeKeys(favorite);

      res.clearCookie('favorites');
      res.send(jsonFavorite);
    })
      .catch((err) => {
        next(err);
      });
});

module.exports = router;
