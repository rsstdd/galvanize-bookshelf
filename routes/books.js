'use strict';

const express = require('express');
const boom = require('boom');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

const ev = require('express-validation');
const validations = require('../validations/users');

// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/books', (_req, res, next) => {
  knex('books')
    .orderBy('title')
    .then((rows) => {
      const books = camelizeKeys(rows);

      res.send(books);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/books/:id', (req, res, next) => {
  const id = Number.parseInt(req.params.id);

  if (Number.isNaN(id)) {
    return next(); // say next and it will go down to the catch
  }

  knex('books')
    .where('id', req.params.id)
    .first() // gives the first row; not an array of rows
    .then((row) => {
      if(!row) {
        throw boom.create(404, 'Not Found'); // throw it not next because you want to keep goint; When you throw in a then block, the promise will catch that and send it to the .catch error handler
      }

      const book = camelizeKeys(row);

      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/books', (req, res, next) => {
  const { title, author, genre, description, coverUrl } = req.body;

  if (!title || !title.trim()) {
    return next(boom.create(400, 'Title must not be blank'));
  }
  if (!author || !author.trim()) {
    return next(boom.create(400, 'Author must not be blank'));
  }
  if (!genre || !genre.trim()) {
    return next(boom.create(400, 'Genre must not be blank'));
  }
  if (!description || !description.trim()) {
    return next(boom.create(400, 'Description must not be blank'));
  }
  if (!coverUrl || !coverUrl.trim()) {
    return next(boom.create(400, 'Cover URL must not be blank'));
  }

  const insertBook = { title, author, genre, description, coverUrl };

  knex('books')
    .insert(decamelizeKeys(insertBook), '*') // all cols: title, author, genre, description, coverUrl
    .then((rows) => {
      const book = camelizeKeys(rows[0]);

      res.send(book); // then give me what I just inserted into the DB
    })
    .catch((err) => {
      next(err);
    });
});

router.patch('/books/:id', (req, res, next) => {
  const id = Number.parseInt(req.params.id);

  if (Number.isNaN(id)) {
    return next();
  }

  knex('books')
    .where('id', id) // since you already assigned it a variable, you should use it
    .first()
    .then((book) => {
      if(!book) {
        throw boom.create(404, 'Not Found');
      }

      const { title, author, genre, description, coverUrl } = req.body;
      const updateBook = {};

      if (title || title.trim()) { // says the trim is better
        updateBook.title = title;
      }

      if (author) {
        updateBook.author = author;
      }

      if (genre) {
        updateBook.genre = genre;
      }

      if (description) {
        updateBook.description = description;
      }

      if (coverUrl) {
        updateBook.coverUrl = coverUrl;
      }

      return knex('books')
        .update(decamelizeKeys(updateBook), '*') // return the items that were updated
        .where('id', req.params.id);
    })
    .then((rows) => {
      const book = camelizeKeys(rows[0]);

      res.send(book); // send that book back to the user
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/books/:id', (req, res, next) => {
  let book;
  const id = Number.parseInt(req.params.id);

  if (Number.isNaN(Number.parseInt(id))) {
    return next();
  }


  knex('books')
    .where('id', id)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(404, 'Not Found');
      }

      book = camelizeKeys(row);

      return knex('books')
        .del()
        .where('id', id)
    })
    .then(() => {
      delete book.id;

      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
