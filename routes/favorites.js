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
  const userId = req.token.userId;

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

router.get('/favorites/:id', authorize, (req, res, next) => {
  const { bookId } = req.query;

  knex('favorites')
  where('book_id', bookId)
    .then((favorites) => res.send(favorites.length > 0));
});

//   if (isNaN(req.query.bookId)) {
//     throw next(boom.create(400, 'Book ID must be an integer'))
//   }
//
//   knex('books')
//     .innerJoin('favorites', 'books.id', 'favorites.book_id')
//     .where('favorites.user_id', userId)
//     .first()
//     .then((rows) => {
//       const favorites = camelizeKeys(rows);
//
//       res.send(favorites);
//     })
//     .catch((err) => {
//       next(err);
//     });
//
// });

router.post('/favorites/',  authorize, (req, res, next) => {
  // const { userId } = req.token;
  const { bookId } = req.query;
  // const { id } = req.body.bookId; // id:2
  // const insertFavorite = { userId, bookId, id }
  const favorite = { bookId, userId: req.token.userId };


  // console.log(insertFavorite);
  // favorites.id , favorites.user_id, favorites.book_id

  // console.log(insertFavorite);

  if(!bookId) {
    return next(boom.create(400, 'Book id must not be blank'));
  }

  // knex('favorites')
  //   .innerJoin('books', 'books.id', 'favorites.book_id')
  //   .where('favorites.user_id', userId)
  //   .orderBy('books.title', 'DSC')
  //   .then((row) => {
  //     if (!row) {
  //       throw boom.create(400, 'Bad Requests');
  //     }
  //
  //     favoriteBook = row;
  //
  //     return knex('favorites')
  //       .del()
  //       .where('id', userId);
  //   })
  //   .then(() => {
  //     delete favoriteBook.id;
  //     const jsonFavorite = camelizeKeys(favoriteBook);
  //     console.log(jsonFavorite);
  //     res.send(jsonFavorite);
  //   })
  //     .catch((err) => {
  //       next(err);
  //     });
  knex('favorites')
    .insert(decamelizeKeys(favorite), '*')
    .then((rows) => {
      favorite.id = rows[0].id;

      res.send(favorite); // then give me what I just inserted into the DB
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/favorites', authorize, (req, res, next) => {
  let favorite;
  const  userId  = req.token.userId;
  const  bookId  = req.token.bookId;


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
